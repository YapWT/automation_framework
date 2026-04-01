import { chromium } from 'playwright';
import ExcelJS from 'exceljs';
import fs from 'fs-extra';

async function runAutomation(excelPath: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const worksheet = workbook.getWorksheet(1);

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Iterate rows (Skip header)
    for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const userData = row.getCell(1).value?.toString(); // Example: Column A

        console.log(`Processing: ${userData}`);

        // Web Automation Logic
        await page.goto('https://example-form.com');
        await page.fill('#input-field', userData || '');
        await page.click('#submit-btn');

        // Local File Logic
        await fs.ensureDir('./downloads');
        // Add download handling logic here...
    }

    await browser.close();
    console.log("SUCCESS: Automation Complete");
}

const pathArg = process.argv[2];
runAutomation(pathArg);
