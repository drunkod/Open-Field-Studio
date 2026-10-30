import test from 'node:test';
import assert from 'node:assert/strict';
import {extractLegacyAosr} from '../src/pto/legacy-xls.mjs';
import {validateWorkspace} from '../src/pto/domain.mjs';
const sample=()=>[
 {name:'Шапка',rows:Array.from({length:62},()=>[null])},
 {name:'Табл',rows:[
   ['Акт','Даты','','','Работы','','Материалы'],
   ['1.0','02','марта','2026','Укладка кровли в осях','1-3/А-Б','Паспорт материала'],
   ['', '04','марта','2026',null,'Сертификат № 1','Дополнительный сертификат'],
   ['1.1','05','мая','2026','Устройство крепления в осях','1-3/А-Б',null],
   ['', '05','мая','2026',null,null,'Паспорт крепежа'],
 ]}
];
test('maps legacy header, 2 works, axes and separate document rows',()=>{
 const sheets=sample();
 sheets[0].rows[1][0]='Вымышленный объект';sheets[0].rows[13][0]='Демо подрядчик';
 sheets[0].rows[18][0]='Демо проектировщик';sheets[0].rows[60][0]='Шифр проекта: TEST-01';
 const parsed=extractLegacyAosr(sheets);
 assert.equal(parsed.count,2);assert.equal(parsed.project.name,'Вымышленный объект');
 assert.equal(parsed.data.header.projectCode,'TEST-01');
 assert.equal(parsed.data.acts[0].work,'Укладка кровли в осях 1-3/А-Б');
 assert.equal(parsed.data.acts[0].start,'2026-03-02');
 assert.equal(parsed.data.acts[0].end,'2026-03-04');
 assert.match(parsed.data.acts[0].qualityDocs,/Дополнительный сертификат/);
 assert.match(parsed.data.acts[0].qualityDocs,/Сертификат № 1/);
 assert.equal(parsed.data.acts[0].schemeNo,'');
 assert.equal(parsed.data.acts[0].measuredQty,'');
 assert.equal(parsed.data.acts[0].actDate,'');
 assert.equal(parsed.data.ks2.length,0);
 assert.equal(parsed.data.acts.length,15);
 assert.ok(validateWorkspace(parsed.data).warnings>0);
});
test('rejects missing source structure and more than fifteen act numbers',()=>{
 assert.throws(()=>extractLegacyAosr([{name:'КС-2',rows:[]}]),/Шапка/);
 const s=sample();s[1].rows=Array.from({length:16},(_,i)=>[`${i+1}.0`,'01','марта','2026','Работа','1/А']);
 assert.throws(()=>extractLegacyAosr(s),/более 15/);
});
test('rejects nonexistent calendar dates without guessing',()=>{
 const s=sample();s[1].rows[1][1]='31';s[1].rows[1][2]='февраля';
 const parsed=extractLegacyAosr(s);
 assert.equal(parsed.data.acts[0].start,'');
 assert.ok(parsed.warnings.some(w=>w.includes('даты')));
});
