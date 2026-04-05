export class ScriptGenerator {
    public static generate(workflow: any): string {
        const steps = workflow.steps;
        const webActions = ['navigate', 'click', 'fill', 'download', 'upload', 'wait_for', 'keyboard_press'];
        const needsWeb = steps.some((s: any) => webActions.includes(s.action));
        const needsExcel = workflow.config.useExcel && workflow.config.excelPath;
        const needsFS = steps.some((s: any) => ['move', 'mkdir'].includes(s.action));

        let code = `import path from 'path';\n`;
        if (needsWeb) code += `import { chromium } from 'playwright';\n`;
        if (needsExcel) code += `import ExcelJS from 'exceljs';\n`;
        if (needsFS) code += `import fs from 'fs-extra';\n`;

        code += `\n/** Generated Task: ${workflow.name} */\n`;

        const val = (str: string) => {
            if (!str) return '';
            const sanitized = str.replace(/\\/g, '/');
            return needsExcel ? sanitized.replace(/{{(.*?)}}/g, (_: any, g: any) => `\${rowData['${g}']}`) : sanitized;
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
                default: base = `page.locator('${matchValue}')`;
            }
            return `${base}.nth(${index})`;
        };

        const getStepLogic = (indent: string) => {
            return steps.map((step: any) => {
                const p = step.params;
                const options = `{ force: ${p.force || false}, timeout: ${p.timeout || 30000} }`;
                const logDesc = `${step.action.toUpperCase()}: ${val(p.selector || p.url || p.key || 'action')}`.replace(/"/g, '\\"');

                let logic = `${indent}console.log("STARTING: ${logDesc}");\n`;
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
                return logic + `\n${indent}console.log("FINISHED: ${step.action.toUpperCase()}");`;
            }).join('\n');
        };

        code += `async function run() {\n`;
        if (needsWeb) code += `  const browser = await chromium.launch({ headless: ${workflow.config.headless} });\n  const page = await browser.newPage();\n`;
        if (needsExcel) {
            code += `\n  const workbook = new ExcelJS.Workbook();\n  await workbook.xlsx.readFile('${val(workflow.config.excelPath)}');\n  const sheet = workbook.getWorksheet(1);\n  const headers: string[] = [];\n  sheet.getRow(1).eachCell(c => headers.push(c.value?.toString() || ''));\n\n  for (let i = 2; i <= sheet.rowCount; i++) {\n    const row = sheet.getRow(i); const rowData: any = {};\n    headers.forEach((h, idx) => rowData[h] = row.getCell(idx + 1).value);\n    try {\n      console.log(\`[PROCESS] Row \${i-1} started\`);\n${getStepLogic('      ')}\n    } catch (e: any) {\n      console.error(\`[ERROR] Row \${i-1} failed: \`, e?.message || e);\n    }\n  }\n`;
        } else {
            code += `  try {\n${getStepLogic('    ')}\n    console.log("[SUCCESS] All steps done.");\n  } catch (e: any) {\n    console.error("[ERROR] Task failed: ", e?.message || e);\n  }\n`;
        }
        if (needsWeb) code += `  await browser.close();\n`;
        code += `}\n\nrun().catch(err => console.error("[FATAL]", err));`;
        return code;
    }
}
