import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {newWorkspace} from '../src/pto/domain.mjs';
import {parseOjrCsv,readOjrXlsx,suggestOjrMapping,normalizeOjrDate,
  previewOjrImport,dateSuggestions,fillMissingActDates} from '../src/pto/ojr-import.mjs';
const workspace=()=>{
 const data=newWorkspace();
 data.acts[0].work='Устройство кровли';
 data.acts[1].work='Монтаж кровельной мембраны';
 return data;
};
test('Russian CSV with BOM, semicolon, quoted newlines is parsed and mapped',()=>{
 const rows=parseOjrCsv('\ufeff№ акта;Дата выполнения;Описание работ;Страница журнала\r\n'+
   '1.0;12.10.2026;"Укладка; слоя\nпо оси А";ОЖР стр. 3\r\n');
 const map=suggestOjrMapping(rows),result=previewOjrImport(rows,map,workspace());
 assert.deepEqual([map.headerRow,map.actNo,map.date,map.description,map.reference],[1,1,2,3,4]);
 assert.equal(result.items[0].date,'2026-10-12');
 assert.equal(result.items[0].description,'Укладка; слоя\nпо оси А');
 assert.equal(result.items[0].reference,'ОЖР стр. 3');
});
test('strict dates including Excel serials and invalid calendar values',()=>{
 assert.equal(normalizeOjrDate('31.02.2026'),'');
 assert.equal(normalizeOjrDate('2026-10-12'),'2026-10-12');
 assert.equal(normalizeOjrDate(new Date('2026-10-12T00:00:00Z')),'2026-10-12');
 const serial=(Date.UTC(2026,9,12)-Date.UTC(1899,11,30))/86400000;
 assert.equal(normalizeOjrDate(serial),'2026-10-12');
 assert.equal(normalizeOjrDate('12/10/2026'),'2026-10-12');
 assert.equal(normalizeOjrDate('12.10.26'),'');
});
test('rejects duplicate, unmatched, bad-date and empty-description rows',()=>{
 const rows=parseOjrCsv('№ акта;Дата;Описание работ;№ записи\n'+
 '1.0;12.10.2026;Кровля;5\n1.0;12.10.2026;Кровля;5\n'+
 '99;13.10.2026;Неверный акт;6\n1.1;31.02.2026;Ошибка календаря;7\n'+
 '1.1;13.10.2026;;8\n');
 const data=workspace(),map=suggestOjrMapping(rows),check=previewOjrImport(rows,map,data);
 assert.equal(check.items.length,1);
 assert.equal(check.rejected.length,4);
 data.journal.push(check.items[0]);
 assert.equal(previewOjrImport(rows,map,data).items.length,0);
 assert.throws(()=>parseOjrCsv('№;Дата\n1;"unclosed'),/Незакрытая/);
 assert.throws(()=>previewOjrImport(rows,{...map,actNo:2},data),/разные колонки/);
});
test('date proposals never overwrite existing dates or signature date',()=>{
 const data=workspace();
 data.acts[0].end='2026-10-17';data.acts[0].actDate='2026-10-19';
 const records=[{actNo:'1.0',date:'2026-10-15',description:'A',reference:'1'},
 {actNo:'1.0',date:'2026-10-12',description:'B',reference:'2'}];
 const suggested=dateSuggestions(data,records);
 assert.deepEqual([suggested[0].first,suggested[0].last],['2026-10-12','2026-10-15']);
 assert.deepEqual(fillMissingActDates(data,records),['1.0 начало']);
 assert.equal(data.acts[0].start,'2026-10-12');
 assert.equal(data.acts[0].end,'2026-10-17');
 assert.equal(data.acts[0].actDate,'2026-10-19');
 assert.deepEqual(fillMissingActDates(data,records),[]);
});
test('XLSX dates read; formula-cached dates refused as evidence',async()=>{
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Раздел 3 ОЖР');
 ws.addRow(['№ акта','Дата выполнения','Описание работ','Страница журнала']);
 ws.addRow(['1.0',new Date('2026-10-12T00:00:00Z'),'Учебная кровля','ОЖР стр. 1']);
 ws.addRow(['1.1',{formula:'TODAY()',result:new Date('2026-10-13T00:00:00Z')},
   'Не использовать формулу','ОЖР стр. 2']);
 const sheets=await readOjrXlsx(await wb.xlsx.writeBuffer());
 assert.equal(sheets[0].name,'Раздел 3 ОЖР');
 const preview=previewOjrImport(sheets[0].rows,suggestOjrMapping(sheets[0].rows),workspace());
 assert.equal(preview.items[0].date,'2026-10-12');
 assert.equal(preview.items.length,1);
 assert.ok(preview.rejected.some(x=>x.includes('дата')));
});
