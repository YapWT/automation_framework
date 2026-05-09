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

        code += `\nconst logTask = (status, id, msg) => console.log(\`TASK:\${status}:\${id}:\${msg || ''}\`);\n`;
        code += `\n/** Generated Task: ${workflow.name} */\n`;

        const val = (str: string) => {
            if (!str) return '';
            const sanitized = str.replace(/\\/g, '/');
            if (needsExcel) {
                return sanitized.replace(/{{(.*?)}}/g, (_: any, g: any) => `\${rowData['${g.trim()}'] || ''}`);
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
                default: base = `page.locator('${matchValue}')`;
            }
            return `${base}.nth(${index})`;
        };

        const getStepLogic = (indent: string) => {
            return steps.map((step: any, index: number) => {
                const p = step.params;
                const options = `{ force: ${p.force || false}, timeout: ${p.timeout || 30000} }`;
                const stepId = `${step.action.toUpperCase()}_${index + 1}`;
                const logDesc = `${step.action.toUpperCase()}: ${val(p.selector || p.url || p.key || 'action')}`.replace(/"/g, '\\"');

                let logic = `${indent}logTask('START', '${stepId}', \`${logDesc}\`);\n`;

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

        code += `async function run() {\n`;
        code += `  let browser = null;\n`; // Keep browser reference for cleanup

        code += `  try {\n`;
        if (needsWeb) {
            code += `    logTask('START', 'BROWSER', 'Initializing Browser...');\n`;
            code += `    browser = await chromium.launch({\n`;
            code += `      headless: ${workflow.config.headless},\n`;
            code += `      handleSIGINT: true,\n`;  // CRITICAL: Die if parent dies
            code += `      handleSIGTERM: true,\n`; // CRITICAL: Die if parent dies
            code += `      handleSIGHUP: true\n`;   // CRITICAL: Die if parent dies
            code += `    });\n`;
            code += `    const page = await browser.newPage();\n`;
            code += `    logTask('DONE', 'BROWSER');\n`;
        }

        if (needsExcel) {
            const p = workflow.config.excelPath.replace(/\\/g, '/');
            const isCsv = p.toLowerCase().endsWith('.csv');
            code += `
    logTask('START', 'EXCEL', 'Loading Data Source...');
    const workbook = new ExcelJS.Workbook();
    ${isCsv ? `await workbook.csv.readFile('${p}');` : `await workbook.xlsx.readFile('${p}');`}
    const sheet = workbook.getWorksheet(1) || workbook.worksheets[0];
    const headers: string[] = [];
    sheet.getRow(1).eachCell((c, n) => { headers[n] = c.value?.toString().trim() || ''; });
    logTask('DONE', 'EXCEL');

    for (let i = 2; i <= sheet.rowCount; i++) {
      const rowId = \`ROW_\${i-1}\`;
      const row = sheet.getRow(i); const rowData: any = {};
      headers.forEach((h, idx) => { if(h) rowData[h] = row.getCell(idx).value?.toString() || ''; });
      
      try {
        logTask('START', rowId, \`Processing Data Row \${i-1}\`);
  ${getStepLogic('        ')}
        logTask('DONE', rowId);
      } catch (e: any) {
        logTask('FAIL', rowId, e?.message || e);
      }
    }\n`;
        } else {
            code += `    ${getStepLogic('    ')}\n`;
            code += `    logTask('DONE', 'FINISH', 'Automation finished successfully.');\n`;
        }

        code += `  } catch (e: any) {\n`;
        code += `    logTask('FAIL', 'ERROR', e.message);\n`;
        code += `  } finally {\n`;
        if (needsWeb) {
            code += `    if (browser) {\n`;
            code += `      logTask('START', 'CLEANUP', 'Closing Browser...');\n`;
            code += `      await browser.close();\n`;
            code += `      logTask('DONE', 'CLEANUP');\n`;
            code += `    }\n`;
        }
        code += `  }\n`;
        code += `}\n\nrun().catch(err => console.log("TASK:FAIL:FATAL:" + err.message));`;

        return code;
    }
}
