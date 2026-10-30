import {test,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
test('Russian PTO local vault keeps PDF bytes, SHA, revisions and backup across reload',async({page})=>{
 const runtimeErrors=[];page.on('pageerror',error=>runtimeErrors.push(error.message));
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('http://127.0.0.1:3042/');
 await page.locator('[data-tab="pto"]').click();
 await page.locator('#pto-sample').click();
 const original=Buffer.from('%PDF-1.4\nTest synthetic passport for local PTO vault\n');
 await page.locator('#pto-evidence-kind').selectOption('passport');
 await page.locator('#pto-evidence-file').setInputFiles({
   name:'паспорт_демо.pdf',mimeType:'application/pdf',buffer:original,
 });
 const row=page.locator('#pto-evidence-rows tr');
 await expect(row).toHaveCount(1);
 await expect(row).toContainText('паспорт_демо.pdf');
 await expect(row).toContainText('ред. 1');
 const [fileDownload]=await Promise.all([page.waitForEvent('download'),row.getByRole('button',{name:'Скачать'}).click()]);
 await mkdir('test-results',{recursive:true});
 const filePath=path.join('test-results','evidence-dl.pdf');
 await fileDownload.saveAs(filePath);
 expect(await readFile(filePath)).toEqual(original);
 await page.reload();await page.locator('[data-tab="pto"]').click();
 await expect(page.locator('#pto-evidence-rows tr')).toHaveCount(1);
 const [backup]=await Promise.all([page.waitForEvent('download'),page.locator('#pto-evidence-backup').click()]);
 const backupPath=path.join('test-results','pto-evidence-backup.json');
 await backup.saveAs(backupPath);
 const data=JSON.parse(await readFile(backupPath,'utf8'));
 expect(data.format).toBe('ofs-pto-evidence-backup');
 expect(data.entries).toHaveLength(1);
 expect(Buffer.from(data.entries[0].base64,'base64')).toEqual(original);
 await page.locator('#pto-evidence-rows tr button').last().click();
 await expect(page.locator('#pto-evidence-rows tr')).toHaveCount(0);
 await page.locator('#pto-evidence-restore').setInputFiles({
   name:'archive.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))
 });
 await expect(page.locator('#pto-evidence-rows tr')).toHaveCount(1);
 expect(runtimeErrors).toEqual([]);
});


test('one local certificate file can be linked to two acts without duplicate upload',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('http://127.0.0.1:3042/');
 await page.locator('[data-tab="pto"]').click();
 await page.locator('#pto-sample').click();
 await page.locator('#pto-evidence-file').setInputFiles({
   name:'сертификат.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nsynthetic certificate')
 });
 await expect(page.locator('#pto-evidence-rows tr')).toHaveCount(1);
 await page.locator('#pto-evidence-act').selectOption('1.1');
 await page.locator('#pto-evidence-rows tr button').getByText('Привязать к акту').click();
 await expect(page.locator('#pto-evidence-rows tr')).toHaveCount(2);
 await expect(page.locator('#pto-evidence-rows tr').nth(1)).toContainText('1.1');
 await page.locator('#pto-evidence-rows tr').first().getByRole('button',{name:'Удалить'}).click();
 await expect(page.locator('#pto-evidence-rows tr')).toHaveCount(1);
 const [download]=await Promise.all([
   page.waitForEvent('download'),
   page.locator('#pto-evidence-rows tr').first().getByRole('button',{name:'Скачать'}).click()
 ]);
 expect(download.suggestedFilename()).toBe('сертификат.pdf');
});
