export class ScriptGenerator {
    public static generate(workflow: any): string {
        const steps = workflow.steps;
        const webActions = ['navigate', 'click', 'fill', 'download', 'upload', 'wait_for', 'keyboard_press'];
        const needsWeb = steps.some((s: any) => webActions.includes(s.action));
        const needsExcel = workflow.config.useExcel && workflow.config.excelPath;
        const needsFS = steps.some((s: any) => ['move', 'mkdir'].includes(s.action));

        const metadata = { name: workflow.name, config: workflow.config, steps: workflow.steps, version: "1.0" };
        const encodedMetadata = btoa(JSON.stringify(metadata));

        let code = `/**\n * @generated-by AutomationApp\n * @metadata ${encodedMetadata}\n */\n\n`;
        code += `import path from 'path';\n`;
        if (needsWeb) code += `import { chromium } from 'playwright';\n`;

        // FIX: Import full XLSX object
        if (needsExcel) code += `import * as XLSX from 'xlsx';\n`;

        if (needsFS) code += `import fs from 'fs-extra';\n`;

        code += `\nconst logTask = (status, id, msg) => console.log(\`TASK:\${status}:\${id}:\${msg || ''}\`);\n`;

        const val = (str: string) => {
            if (!str) return '';
            let sanitized = str.replace(/\\/g, '/');
            if (needsExcel) {
                return sanitized.replace(/{{(.*?)}}/g, (_: any, g: any) => {
                    return `\${rowData['${g.trim()}'] || ''}`;
                });
            }
            return sanitized;
        };

        const getLocator = (p: any) => {
            const matchValue = val(p.selector).replace(/'/g, "\\'");
            const isExact = p.exact || false;
            const index = p.index || 0;
            let base = "";
            switch (p.matchBy) {
                case 'textbox': base = `page.getByRole('textbox', { name: '${matchValue}', exact: ${isExact} })`; break;
                case 'button': base = `page.getByRole('button', { name: '${matchValue}', exact: ${isExact} })`; break;
                case 'link': base = `page.getByRole('link', { name: '${matchValue}', exact: ${isExact} })`; break;
                case 'checkbox': base = `page.getByRole('checkbox', { name: '${matchValue}', exact: ${isExact} })`; break;
                case 'radio': base = `page.getByRole('radio', { name: '${matchValue}', exact: ${isExact} })`; break;
                case 'text': base = `page.getByText('${matchValue}', { exact: ${isExact} })`; break;
                case 'placeholder': base = `page.getByPlaceholder('${matchValue}', { exact: ${isExact} })`; break;
                case 'label': base = `page.getByLabel('${matchValue}', { exact: ${isExact} })`; break;
                case 'css': base = `page.locator('${matchValue}')`; break;
                default: base = `page.locator('${matchValue}')`;
            }
            return `${base}.nth(${index})`;
        };

        const getStepLogic = (indent: string) => {
            return steps.map((step: any, index: number) => {
                const p = step.params;
                const options = `{ force: ${p.force || false}, timeout: ${p.timeout || 30000} }`;
                const stepId = `${step.action.toUpperCase()}_${index + 1}`;
                const actionDesc = `${step.action.toUpperCase()}: ${p.selector || p.url || p.key || 'Action'}`;
                let logic = `${indent}logTask('START', '${stepId}', \`${actionDesc}\`);\n`;

                switch (step.action) {
                    case 'navigate': logic += `${indent}await page.goto('${val(p.url)}', { waitUntil: 'networkidle', timeout: 60000 });`; break;
                    case 'fill': logic += `${indent}await ${getLocator(p)}.fill(\`${val(p.value)}\`, ${options});`; break;
                    case 'click': logic += `${indent}await ${getLocator(p)}.click(${options});`; break;
                    case 'wait_for': logic += `${indent}await ${getLocator(p)}.waitFor({ state: 'visible', timeout: 30000 });`; break;
                    case 'keyboard_press': logic += `${indent}await page.keyboard.press('${p.key}');`; break;
                    case 'upload': logic += `${indent}await ${getLocator(p)}.setInputFiles('${val(p.path)}');`; break;
                    case 'download': logic += `${indent}const [download] = await Promise.all([page.waitForEvent('download'), ${getLocator(p)}.click(${options})]);\n${indent}await download.saveAs(path.join('${val(p.path) || './'}', download.suggestedFilename()));`; break;
                    case 'mkdir': logic += `${indent}await fs.ensureDir(\`${val(p.path)}\`);`; break;
                    case 'move': logic += `${indent}await fs.move(\`${val(p.from)}\`, \`${val(p.to)}\`, { overwrite: true });`; break;
                }
                return logic + `\n${indent}logTask('DONE', '${stepId}');`;
            }).join('\n');
        };

        code += `\nasync function run() {\n  let browser = null;\n  try {\n`;

        if (needsWeb) {
            code += `    logTask('START', 'BROWSER', 'Launching Browser...');\n`;
            code += `    browser = await chromium.launch({ headless: ${workflow.config.headless}, handleSIGINT: true, handleSIGTERM: true, handleSIGHUP: true });\n`;
            code += `    const context = await browser.newContext();\n`;
            code += `    const page = await context.newPage();\n`;
            code += `    logTask('DONE', 'BROWSER');\n`;
        }

        if (needsExcel) {
            const excelPath = workflow.config.excelPath.replace(/\\/g, '/');
            code += `
    logTask('START', 'DATA_LOAD', 'Parsing Spreadsheet Data...');
    let jsonData = [];
    try {
        // FIX: Logic to handle both standard and ESM-wrapped exports
        const sheetLib = (XLSX as any).readFile ? XLSX : (XLSX as any).default;
        if (!sheetLib || !sheetLib.readFile) throw new Error("Could not initialize XLSX library");

        const workbook = sheetLib.readFile('${excelPath}');
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = sheetLib.utils.sheet_to_json(worksheet, { defval: "" });
        logTask('DONE', 'DATA_LOAD');
    } catch (excelErr: any) {
        logTask('FAIL', 'DATA_LOAD', excelErr.message);
        throw excelErr;
    }

    for (let i = 0; i < jsonData.length; i++) {
      const rowData: any = jsonData[i];
      const rowId = 'ROW_' + (i + 1);
      try {
        logTask('START', rowId, \`Processing Row \${i+1} | Data: \${JSON.stringify(rowData)}\`);
${getStepLogic('        ')}
        logTask('DONE', rowId);
      } catch (e: any) {
        logTask('FAIL', rowId, e.message);
      }
    }\n`;
        } else {
            code += `    try {\n${getStepLogic('      ')}\n      logTask('DONE', 'FINISH', 'Complete');\n    } catch(e: any) { logTask('FAIL', 'EXECUTION', e.message); }\n`;
        }

        code += `  } catch (e: any) {\n    logTask('FAIL', 'EXECUTION', e.message);\n  } finally {\n`;
        if (needsWeb) {
            code += `    if (browser) { \n      logTask('START', 'CLEANUP', 'Closing...');\n      await browser.close(); \n      logTask('DONE', 'CLEANUP'); \n    }\n`;
        }
        code += `  }\n}\n\nrun().catch(err => console.log("TASK:FAIL:FATAL:" + err.message));`;

        return code;
    }
}
