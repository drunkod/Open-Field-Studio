import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {newWorkspace,validateWorkspace} from '../src/pto/domain.mjs';
import {writeDraftXlsx,importDraftXlsx,readWorkbook,suggestMapping,extractKs2} from '../src/pto/xlsx.mjs';

function dataFixture(){
 const d=newWorkspace();d.header.contractor='Учебный подрядчик';
 d.ks2=[{id:'КС-1',description:'Кровля',qty:'12,5',unit:'м²'}];
 Object.assign(d.acts[0],{work:'Работа А',start:'2026-10-01',end:'2026-10-03',actDate:'2026-10-03',schemeNo:'ИС-01',qualityDocs:'DEMO',measuredQty:'5',unit:'м²',ks2Id:'КС-1'});
 Object.assign(d.acts[1],{work:'Работа Б',start:'2026-10-04',end:'2026-10-05',actDate:'2026-10-05',schemeNo:'ИС-02',qualityDocs:'DEMO',measuredQty:'7,5',unit:'м²',ks2Id:'КС-1'});
 return d;
}
test('exports a complete editable workbook with 15 formula-linked act sheets',async()=>{
 const bytes=await writeDraftXlsx(dataFixture(),{name:'Вымышленный объект',client:'Заказчик DEMO'});
 assert.ok(bytes.byteLength>10000);
 const wb=await readWorkbook(bytes);
 assert.equal(wb.worksheets.length,20); // project + inputs + KS2 + review + 15 acts + instructions
 assert.equal(wb.getWorksheet('Ввод_работ').getCell('B5').value,'Работа А');
 assert.equal(wb.getWorksheet('Ввод_работ').getCell('I6').value,7.5);
 assert.equal(wb.getWorksheet('Акт_01').getCell('D10').value.formula,'Ввод_работ!E5');
 assert.ok(wb.getWorksheet('Акт_15').getCell('D11').value.formula);
 const ks2=wb.getWorksheet('КС-2');
 assert.equal(ks2.getCell('E5').value.formula,'SUMIF(Ввод_работ!$K$5:$K$19,A5,Ввод_работ!$I$5:$I$19)');
});
test('exports and reimports without losing act links or KS2 positions',async()=>{
 const project={name:'Объект DEMO',number:'2026-1',address:'Demo street',client:'Demo client'};
 const original=dataFixture();const bytes=await writeDraftXlsx(original,project);
 const restored=await importDraftXlsx(bytes);
 assert.equal(restored.data.acts[0].work,'Работа А');
 assert.equal(restored.data.acts[1].measuredQty,'7.5');
 assert.equal(restored.data.ks2[0].id,'КС-1');
 assert.equal(restored.project.name,project.name);
 assert.equal(validateWorkspace(restored.data).groups[0].status,'quantity_correlates');
});
test('detects realistic KS2 column headings and extracts rows',async()=>{
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('КС-2_2026');
 ws.getRow(2).values=['№ п/п','Наименование работ и затрат','Ед. изм.','Кол-во'];
 ws.getRow(3).values=['01','Гидроизоляция кровли','м²',12.5];
 ws.getRow(4).values=['02','Устройство уклона','м²',3];
 const loaded=await readWorkbook(await wb.xlsx.writeBuffer());
 const src=loaded.worksheets[0];const map=suggestMapping(src);
 assert.deepEqual([map.row,map.id,map.description,map.unit,map.qty],[2,1,2,3,4]);
 const {items,rejected}=extractKs2(src,map);
 assert.equal(items.length,2);assert.equal(rejected.length,0);
 assert.equal(items[0].id,'01');assert.equal(items[0].qty,'12.5');
});
test('imports imperfect KS2 sheet with transparent skipped-row reasons',()=>{
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Данные');
 ws.getRow(1).values=['ID','Работа','Объём','Ед.'];
 ws.getRow(2).values=['1','Кровля',5,'м²'];
 ws.getRow(3).values=['2','Утеплитель',null,'м²'];
 ws.getRow(4).values=['ИТОГО',null,5,'м²'];
 const r=extractKs2(ws,{row:1,id:1,description:2,qty:3,unit:4});
 assert.equal(r.items.length,1);assert.equal(r.rejected.length,2);
});
