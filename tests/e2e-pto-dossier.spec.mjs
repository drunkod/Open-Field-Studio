import {test,expect} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';

test('one-click Russian ID dossier contains three printed acts, linked original PDF and inventories',async({page})=>{
 const failures=[];page.on('pageerror',error=>failures.push(error.message));
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('http://127.0.0.1:3042/');
 await page.locator('[data-tab="pto"]').click();
 await page.locator('#pto-sample').click();
 const attachment=Buffer.from('%PDF-1.4\nВымышленный паспорт только для тестирования\n');
 await page.locator('#pto-evidence-kind').selectOption('passport');
 await page.locator('#pto-evidence-file').setInputFiles({
   name:'паспорт_мембраны.pdf',mimeType:'application/pdf',buffer:attachment,
 });
 await expect(page.locator('#pto-evidence-rows tr')).toHaveCount(1);
 const [download]=await Promise.all([
   page.waitForEvent('download', {timeout:60000}),
   page.locator('#pto-dossier-zip').click(),
 ]);
 expect(download.suggestedFilename()).toMatch(/komplekt_ID_CHERNOVIK\.zip/);
 await mkdir('test-results',{recursive:true});
 const location=path.join('test-results','aosr-zip-demo.zip');
 await download.saveAs(location);
 const zip=await JSZip.loadAsync(await readFile(location));
 const manifest=JSON.parse(await zip.file('Манифест.json').async('string'));
 expect(manifest.format).toBe('ofs-pto-dossier');
 expect(manifest.acts).toHaveLength(3);
 expect(manifest.attachmentLinks).toHaveLength(1);
 expect(manifest.warnings.length).toBeGreaterThan(0);
 const inner=await zip.file('АОСР_черновики.xlsx').async('nodebuffer');
 const workbook=new ExcelJS.Workbook();
 await workbook.xlsx.load(inner);
 expect(workbook.worksheets.filter(ws=>/^Акт_/.test(ws.name))).toHaveLength(3);
 const evidenceFile=manifest.attachmentLinks[0].path;
 expect(Buffer.from(await zip.file(evidenceFile).async('uint8array'))).toEqual(attachment);
 expect(await zip.file('Опись_приложений.csv').async('string')).toContain('паспорт_мембраны.pdf');
 expect(await zip.file('ПРОЧТИТЕ_ЧЕРНОВИК.txt').async('string')).toContain('ЧЕРНОВИК');
 expect(failures).toEqual([]);
});
