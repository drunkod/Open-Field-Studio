import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorkspace} from '../src/pto/domain.mjs';
import {writeDraftXlsx,readWorkbook,importDraftXlsx} from '../src/pto/xlsx.mjs';
function specimen(){
 const data=newWorkspace(),rows=Array.from({length:109},()=>Array(43).fill(''));
 rows[0][23]='Ссылка на форму';rows[26][0]='АКТ';rows[27][0]='освидетельствования скрытых работ';
 rows[2][0]='Объект капитального строительства';rows[3][0]='Вымышленный объект';
 rows[29][1]='№';rows[29][2]='1.0';rows[56][0]='1. К освидетельствованию предъявлены следующие работы';
 rows[57][0]='Работа в исходном файле';rows[62][0]='3. При выполнении работ применены';
 rows[67][0]='4. Предъявлены документы';rows[70][0]='Исполнительная схема №1.0';
 rows[73][0]='5. Даты:';rows[74][3]='окончания работ';rows[92][0]='Представитель заказчика';
 rows[94][0]='Вымышленный подписант';rows[95][27]='(подпись)';
 data.legacyLayout={rows};data.header.projectCode='DEMO-2026';
 Object.assign(data.acts[0],{actNo:'1.0',work:'Монтаж кровли',start:'2026-10-01',end:'2026-10-02',qualityDocs:'Сертификат DEMO'});
 return data;
}
test('original structure becomes 15 formula-linked 43-column act worksheets',async()=>{
 const wb=await readWorkbook(await writeDraftXlsx(specimen(),{name:'Учебный объект'}));
 assert.equal(wb.worksheets.length,22);
 assert.equal(wb.getWorksheet('Акт_01').columnCount,43);
 assert.equal(wb.getWorksheet('Акт_15').columnCount,43);
 assert.equal(wb.getWorksheet('Исходная_сетка').state,'veryHidden');
 assert.equal(wb.getWorksheet('Акт_01').getCell('A58').value.formula,'Ввод_работ!B5');
 assert.match(wb.getWorksheet('Акт_01').getCell('A71').value.formula,/Ввод_работ!G5/);
 assert.equal(wb.getWorksheet('Акт_01').getCell('A95').value.formula,"'Постоянные_поля'!B97");
 assert.equal(wb.getWorksheet('Ввод_работ').getCell('G5').value.formula,'IF(B5="","",B5)');
});
test('reimport keeps signatory labels, source columns and dynamic descriptions',async()=>{
 const loaded=await importDraftXlsx(await writeDraftXlsx(specimen(),{name:'Объект DEMO'}));
 assert.equal(loaded.data.legacyLayout.rows[95][27],'(подпись)');
 assert.equal(loaded.data.legacyLayout.rows[94][0],'Вымышленный подписант');
 assert.equal(loaded.data.acts[0].schemeTitle,'');
 assert.equal(loaded.data.acts[0].work,'Монтаж кровли');
 const out=await readWorkbook(await writeDraftXlsx(loaded.data,loaded.project));
 assert.equal(out.getWorksheet('Исходная_сетка').getCell('AB96').value,'(подпись)');
});
