export class ScriptGenerator {
    public static generate(workflow: any): string {
        const steps = workflow.steps;

        // 1. Analyze requirements for modular imports
        const needsWeb = steps.some((s: any) => ['navigate', 'click', 'fill', 'download'].includes(s.action));
        const needsExcel = workflow.config.useExcel && workflow.config.excelPath;
        const needsFS = steps.some((s: any) => ['move', 'mkdir'].includes(s.action));

        let code = `import path from 'path';\n`;
        if (needsWeb) code += `import { chromium } from 'playwright';\n`;
        if (needsExcel) code += `import ExcelJS from 'exceljs';\n`;
        if (needsFS) code += `import fs from 'fs-extra';\n`;

        code += `\n/** Generated Task: ${workflow.name} */\n`;

        // Helper to sanitize strings and handle Excel variables
        const val = (str: string) => {
            if (!str) return '';
            // Replace single backslashes with forward slashes to avoid JS escape errors
            const sanitized = str.replace(/\\/g, '/');
            return needsExcel
                ? sanitized.replace(/{{(.*?)}}/g, (_: any, g: any) => `\${rowData['${g}']}`)
                : sanitized;
        };

        const getStepLogic = (indent: string) => {
            return steps.map((step: any) => {
                const p = step.params;

                switch (step.action) {
                    case 'navigate': return `${indent}await page.goto('${val(p.url)}', { waitUntil: 'networkidle' });`;
                    case 'fill': return `${indent}await page.fill('${p.selector}', \`${val(p.value)}\`);`;
                    case 'click': return `${indent}await page.click('${p.selector}');`;
                    case 'download': return `${indent}const [download] = await Promise.all([page.waitForEvent('download'), page.click('${p.selector}')]);\n${indent}await download.saveAs(path.join('${val(p.path) || './'}', download.suggestedFilename()));`;
                    case 'mkdir': return `${indent}await fs.ensureDir(\`${val(p.path)}\`);`;
                    case 'move': return `${indent}await fs.move(\`${val(p.from)}\`, \`${val(p.to)}\`, { overwrite: true });`;
                    default: return `${indent}// Action ${step.action} not recognized`;
                }
            }).join('\n');
        };

        code += `async function run() {\n`;

        if (needsWeb) {
            code += `  const browser = await chromium.launch({ headless: ${workflow.config.headless} });\n`;
            code += `  const page = await browser.newPage();\n`;
        }

        if (needsExcel) {
            // Sanitize the Excel path itself
            const cleanExcelPath = workflow.config.excelPath.replace(/\\/g, '/');
            code += `
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('${cleanExcelPath}');
  const sheet = workbook.getWorksheet(1);
  if (!sheet) throw new Error("Worksheet not found");

  const headers: string[] = [];
  sheet.getRow(1).eachCell(c => headers.push(c.value?.toString() || ''));

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const rowData: any = {};
    headers.forEach((h, idx) => rowData[h] = row.getCell(idx + 1).value);
    try {
      console.log(\`[LOG] Row \${i-1} started\`);
${getStepLogic('      ')}
    } catch (e: any) {
      console.error(\`[ERROR] Row \${i-1} failed: \`, e?.message || e);
    }
  }\n`;
        } else {
            code += `  try {\n${getStepLogic('    ')}\n    console.log("[LOG] Task completed.");\n  } catch (e: any) {\n    console.error("[ERROR] Task failed: ", e?.message || e);\n  }\n`;
        }

        if (needsWeb) code += `  await browser.close();\n`;
        code += `}\n\nrun().catch(err => console.error("[FATAL]", err));`;

        return code;
    }
}
