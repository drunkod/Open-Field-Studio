import {test,expect} from '@playwright/test';
test('Russian ОЖР CSV imports with preview and fills only missing АОСР dates',async({page})=>{
 const runtime=[];page.on('pageerror',e=>runtime.push(e.message));
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('http://127.0.0.1:3042/');
 await page.locator('[data-tab="pto"]').click();
 await page.locator('#pto-sample').click();
 const first=page.locator('#pto-act-rows tr').first();
 const start=first.locator('input[data-col="start"]');
 const end=first.locator('input[data-col="end"]');
 await expect(start).toHaveValue('2026-10-01');
 await expect(end).toHaveValue('2026-10-02');
 const originalStart=await start.inputValue(),originalEnd=await end.inputValue();
 expect(originalStart).toMatch(/^20/);
 expect(originalEnd).toMatch(/^20/);
 await start.fill('');
 const russianDay=date=>date.slice(8,10)+'.'+date.slice(5,7)+'.'+date.slice(0,4);
 const csv='№ акта;Дата выполнения;Описание работ;Страница журнала\r\n'+
   '1.0;'+russianDay(originalStart)+';Учебная кровля;ОЖР стр. 9\r\n'+
   '1.0;'+russianDay(originalEnd)+';Учебная кровля;ОЖР стр. 10\r\n'+
   '1.99;'+russianDay(originalStart)+';Чужая работа;стр. 11\r\n'+
   '1.0;31.02.2026;Неверная дата;стр. 12\r\n';
 await page.locator('#pto-ojr-import summary').click();
 await page.locator('#pto-ojr-file').setInputFiles({
   name:'учебный_ОЖР.csv',mimeType:'text/csv',buffer:Buffer.from(csv,'utf8')
 });
 await expect(page.locator('#pto-ojr-map-panel')).toBeVisible();
 await expect(page.locator('[data-ojr-map="actNo"]')).toHaveValue('1');
 await expect(page.locator('[data-ojr-map="date"]')).toHaveValue('2');

 await page.locator('#pto-ojr-preview-btn').click();
 await expect(page.locator('#pto-ojr-preview-summary')).toContainText('К импорту: 2');
 await expect(page.locator('#pto-ojr-preview-summary')).toContainText('отклонено: 2');
 await page.locator('#pto-ojr-fill-blanks').check();
 await page.locator('#pto-ojr-confirm').click();
 await expect(start).toHaveValue(originalStart);
 await expect(end).toHaveValue(originalEnd);
 const journal=page.locator('.pto-record-area').first().locator('tbody tr');
 await expect(journal).toHaveCount(2);
 await expect(journal.first().locator('input[type="text"]').last()).toHaveValue('ОЖР стр. 9');
 await page.reload();await page.locator('[data-tab="pto"]').click();
 await expect(page.locator('.pto-record-area').first().locator('tbody tr')).toHaveCount(2);
 await page.locator('#pto-ojr-import summary').click();
 await page.locator('#pto-ojr-file').setInputFiles({
   name:'учебный_ОЖР.csv',mimeType:'text/csv',buffer:Buffer.from(csv,'utf8')
 });
 await page.locator('#pto-ojr-preview-btn').click();
 await expect(page.locator('#pto-ojr-preview-summary')).toContainText('К импорту: 0');
 await expect(page.locator('#pto-ojr-confirm')).toBeDisabled();
 expect(runtime).toEqual([]);
});
