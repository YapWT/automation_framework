export class ScriptGenerator {
    public static generate(workflow: any): string {
        const steps = workflow.steps || [];
        const webActions = ['navigate', 'click', 'fill', 'download', 'upload', 'wait_for', 'keyboard_press'];
        const needsWeb = steps.some((s: any) => webActions.includes(s.action));
        const needsExcel = workflow.config.useExcel && workflow.config.excelPath;
        const needsFS = steps.some((s: any) => ['move', 'mkdir'].includes(s.action));

        // Metadata embedding for auto-recovery and load mapping
        const metadata = btoa(JSON.stringify({
            name: workflow.name,
            config: workflow.config,
            steps: workflow.steps,
            version: "1.0"
        }));

        let code = `/**\n * @generated-by AutomationApp\n * @metadata ${metadata}\n */\n\n`;
        code += `import path from 'path';\nimport { chromium } from 'playwright';\n`;
        if (needsExcel) code += `import * as XLSX from 'xlsx';\n`;
        if (needsFS) code += `import fs from 'fs-extra';\n`;

        code += `\nconst logTask = (status, id, msg) => console.log(\`TASK:\${status}:\${id}:\${msg || ''}\`);\n`;

        // Helper to inject rowData variables during execution
        const val = (str: string) => {
            if (!str) return '';
            let sanitized = str.replace(/\\/g, '/');
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
                case 'css': base = `page.locator('${matchValue}')`; break;
                default: base = `page.locator('${matchValue}')`;
            }
            return `${base}.nth(${index})`;
        };

        // Core logic generator supporting slicing and ID offsets
        const generateStepsCode = (targetSteps: any[], indent: string, isLoop: boolean, idOffset: number = 0) => {
            return targetSteps.map((step: any, idx: number) => {
                const p = step.params;
                const options = `{ force: ${p.force || false}, timeout: ${p.timeout || 30000} }`;
                const actualStepNumber = idOffset + idx + 1;
                
                // Dynamic ID: Rows append, setup steps overwrite cleanly
                const stepId = isLoop 
                    ? `\${rowId}_${step.action.toUpperCase()}_${actualStepNumber}` 
                    : `${step.action.toUpperCase()}_${actualStepNumber}`;
                
                const actionDesc = (() => {
                    const act = step.action.toUpperCase();
                    switch (step.action) {
                        case 'navigate': return `${act} to ${val(p.url)}`;
                        case 'fill':     return `${act} "${p.selector}" with value: "${val(p.value)}"`;
                        case 'click':    return `${act} on element: "${p.selector}"`;
                        case 'wait_for': return `WAIT for "${p.selector}" to be visible`;
                        case 'keyboard_press': return `PRESS KEY: ${p.key}`;
                        case 'upload':   return `UPLOAD file to "${p.selector}" from: ${val(p.path)}`;
                        case 'download': return `DOWNLOAD from "${p.selector}" to: ${val(p.path)}`;
                        case 'mkdir':    return `CREATE DIRECTORY at: ${val(p.path)}`;
                        case 'move':     return `MOVE from ${val(p.from)} to ${val(p.to)}`;
                        default:         return `${act}: ${p.selector || 'Action'}`;
                    }
                })();

                let logic = `${indent}logTask('START', \`${stepId}\`, \`${actionDesc}\`);\n`;

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
                return logic + `\n${indent}logTask('DONE', \`${stepId}\`);`;
            }).join('\n');
        };

        code += `\nasync function run() {\n  let browser = null;\n  try {\n`;

        if (needsWeb) {
            code += `    logTask('START', 'BROWSER', 'Initializing Browser...');\n`;
            code += `    browser = await chromium.launch({ headless: ${workflow.config.headless}, handleSIGINT: true, handleSIGTERM: true });\n`;
            code += `    const context = await browser.newContext();\n`;
            code += `    const page = await context.newPage();\n`;
            code += `    logTask('DONE', 'BROWSER');\n`;
        }

        if (needsExcel) {
            const excelPath = workflow.config.excelPath.replace(/\\/g, '/');
            
            // --- SMART LOOP SPLIT LOGIC ---
            // Find the first step that uses an Excel variable {{...}}
            const firstExcelIdx = steps.findIndex((s: any) => JSON.stringify(s).includes('{{'));
            
            let preLoopSteps: any[] = [];
            let loopSteps: any[] = [];

            if (firstExcelIdx !== -1) {
                // Split steps at the exact moment Excel data is needed
                preLoopSteps = steps.slice(0, firstExcelIdx);
                loopSteps = steps.slice(firstExcelIdx);
            } else {
                // Fallback: If Excel is linked but no {{var}} found, loop all steps
                loopSteps = steps;
            }

            // 1. Run Setup Steps (Login/Navigation) ONCE outside the loop
            if (preLoopSteps.length > 0) {
                code += `    // --- SETUP PHASE (Runs Once) ---\n`;
                code += generateStepsCode(preLoopSteps, '    ', false, 0) + '\n';
            }

            // 2. Load Excel Data
            code += `
    logTask('START', 'DATA_LOAD', 'Parsing Spreadsheet Data...');
    let jsonData = [];
    try {
        const sheetLib = (XLSX as any).readFile ? XLSX : (XLSX as any).default;
        const workbook = sheetLib.readFile('${excelPath}');
        jsonData = sheetLib.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
        logTask('DONE', 'DATA_LOAD');
    } catch (e) {
        logTask('FAIL', 'DATA_LOAD', e.message);
        throw e;
    }

    // --- EXECUTION LOOP PHASE ---
    for (let i = 0; i < jsonData.length; i++) {
        const rowData = jsonData[i];
        const rowId = 'ROW_' + (i + 1);
        try {
            logTask('START', rowId, 'Processing Row ' + (i + 1) + ' | Data: ' + JSON.stringify(rowData));
${generateStepsCode(loopSteps, '            ', true, preLoopSteps.length)}
            logTask('DONE', rowId);
        } catch (e) {
            logTask('FAIL', rowId, e.message);
        }
    }\n`;
        } else {
            // Standard execution without Excel
            code += `    try {\n${generateStepsCode(steps, '      ', false, 0)}\n      logTask('DONE', 'FINISH', 'Complete');\n    } catch(e) { logTask('FAIL', 'EXECUTION', e.message); }\n`;
        }

        code += `  } catch (e) {\n    logTask('FAIL', 'EXECUTION', e.message);\n  } finally {\n`;
        if (needsWeb) {
            code += `    if (browser) { \n      logTask('START', 'CLEANUP', 'Closing...');\n      await browser.close(); \n      logTask('DONE', 'CLEANUP'); \n    }\n`;
        }
        code += `  }\n}\nrun();`;

        return code;
    }
}