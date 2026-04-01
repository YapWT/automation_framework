import { chromium, Page } from 'playwright';
import { ExcelHandler } from './excelHandler';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface TaskConfig {
    excelPath: string;
    url: string;
    downloadDir: string;
    mapping: Record<string, string>; // Maps Excel Column -> Web Selector
}

async function runTask(config: TaskConfig) {
    const data = await ExcelHandler.readData(config.excelPath);
    const browser = await chromium.launch({ headless: false }); // Visible for user confidence
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`[START] Processing ${data.length} rows.`);

    for (const row of data) {
        try {
            await page.goto(config.url);

            // Dynamic Form Filling based on Mapping
            for (const [columnName, selector] of Object.entries(config.mapping)) {
                const value = row[columnName]?.toString() || "";
                await page.fill(selector, value);
            }

            await page.click('#submit-button'); // Assumption: standard submit ID

            // Handle Download logic if exists
            page.on('download', async (download) => {
                const fileName = `${row['ID'] || Date.now()}.pdf`;
                const savePath = path.join(config.downloadDir, fileName);
                await download.saveAs(savePath);
                console.log(`[FILE] Saved: ${fileName}`);
            });

        } catch (err) {
            console.error(`[ERROR] Row failed: ${JSON.stringify(row)}`, err);
        }
    }

    await browser.close();
    console.log("[FINISH] Workflow complete.");
}

// Get args from Tauri
const args = JSON.parse(process.argv[2]);
runTask(args);
