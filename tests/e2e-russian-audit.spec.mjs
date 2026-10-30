import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';
test('fresh app defaults to Russian and exports Russian-language reports',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3042/');
 await expect(page.locator('html')).toHaveAttribute('lang','ru');
 await expect(page.locator('#tb-lang-current')).toHaveText('RU');
 const reports=await page.evaluate(()=>{
   const a=window.app;
   a.project={...a.project,name:'Учебный объект',number:'TEST',address:'Учебная улица',client:'Учебный заказчик'};
   a.floorPlans=[];a.tickets=[];
   a.handovers=[{id:'test-ho',type:'final',date:'2026-10-29',participants:[],items:[],verdict:'approved',signatures:[],notes:''}];
   return {full:a.generateFullReport(),handover:a.generateHandoverReport('test-ho')};
 });
 for(const output of [reports.full,reports.handover]){
   expect(output).toContain('<html lang="ru">');
   expect(output).not.toMatch(/Gegenereerd|Handtekeningen|Projectgegevens|GOEDGEKEURD|Opdrachtgever|Projectnummer|Proces-Verbaal/);
 }
 expect(reports.full).toContain('Учебный объект');
 expect(reports.full).toContain('Сформировано');
 expect(reports.handover).toContain('Акт сдачи объекта');
 expect(reports.handover).toContain('Подписи');
 expect(reports.handover).toContain('ПРИНЯТО');
 expect(errors).toEqual([]);
});
test('print-only AOSR package contains populated acts and a document register',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('http://127.0.0.1:3042/');
 await page.locator('[data-tab="pto"]').click();
 await page.locator('#pto-sample').click();
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#pto-print-xlsx').click()]);
 const dest=path.join('test-results','ru-print-drafts.xlsx');
 await fs.mkdir('test-results',{recursive:true});await download.saveAs(dest);
 const wb=new ExcelJS.Workbook();await wb.xlsx.load(await fs.readFile(dest));
 expect(wb.worksheets.filter(s=>/^Акт_/.test(s.name))).toHaveLength(3);
 expect(wb.getWorksheet('Реестр_качества')).toBeTruthy();
 expect(wb.getWorksheet('Акт_01')).toBeTruthy();
});

test('main application tabs have no residual Dutch action labels in Russian mode',async({page})=>{
 await page.goto('http://127.0.0.1:3042/');
 const tabs=['project','plattegrond','opname','inspectie','oplevering','dashboard','export','handleiding','pto'];
 const found=[];
 for(const tab of tabs){
   await page.locator('[data-tab="'+tab+'"]').click();
   const text=await page.locator('#'+tab+'-tab').innerText();
   const dutch=text.match(/\b(?:Annuleren|Opslaan|Verwijderen|Toevoegen|Geen tickets|Geen inspecties|Opleverpunten|Projectgegevens|Opdrachtgever|Voorbeeld payload|Nieuwe inspectie|Naam inspectie|Aanmaken|Volgende stap)\b/gi)||[];
   if(dutch.length)found.push({tab,dutch:[...new Set(dutch)]});
 }
 expect(found).toEqual([]);
});