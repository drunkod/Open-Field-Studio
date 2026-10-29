import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorkspace,safeWorkspace} from '../src/pto/domain.mjs';
import {recordDiagnostics} from '../src/pto/records.mjs';
import {writeDraftXlsx,readWorkbook,importDraftXlsx} from '../src/pto/xlsx.mjs';
const sample=()=>{
 const data=newWorkspace();
 Object.assign(data.acts[0],{actNo:'1.0',work:'Учебная кровля',start:'2026-10-10',end:'2026-10-13',actDate:'2026-10-14',schemeNo:'ИС-01'});
 data.journal=[{date:'2026-10-11',actNo:'1.0',description:'Кровельные работы',reference:'ОЖР, стр. 9'}];
 data.documents=[{actNo:'1.0',type:'Паспорт',number:'DEMO-5',material:'Мембрана',validUntil:'2027-12-01',fileName:'demo.pdf'}];
 data.schemes=[{actNo:'1.0',number:'ИС-01',title:'Схема кровли',revision:'1',fileName:'scheme.pdf'}];
 return data;
};
test('project registers are optional, no false readiness assertions',()=>{
 const data=newWorkspace();
 assert.equal(recordDiagnostics(data).results.length,0);
 Object.assign(data.acts[0],{work:'Демо работа'});
 const check=recordDiagnostics(data);
 assert.equal(check.results[0].flags.length,3);
 assert.match(check.results[0].status,/Требует проверки/);
});
test('linked work journal, quality documents and schemes yield evidence references, not approval',()=>{
 const check=recordDiagnostics(sample());
 assert.equal(check.issues.length,0);
 assert.equal(check.results[0].status,'Связи заполнены — сверить оригиналы');
});
test('mismatched and invalid dates, expired documents and scheme conflicts are visible',()=>{
 const data=sample();
 data.journal[0].date='2026-10-20';
 data.documents[0].validUntil='2026-10-01';
 data.schemes[0].number='ИС-99';
 data.journal.push({date:'2026-10-10',actNo:'1.99',description:'Ошибка ссылки',reference:'1'});
 const problems=recordDiagnostics(data).issues.map(item=>item.message);
 assert.ok(problems.some(x=>x.includes('вне периода')));
 assert.ok(problems.some(x=>x.includes('срока действия')));
 assert.ok(problems.some(x=>x.includes('не совпадает')));
 assert.ok(problems.some(x=>x.includes('неизвестный')));
});
test('registers are bounded and persist in JSON and Excel roundtrip',async()=>{
 const original=sample();
 original.documents[0].number='=HYPERLINK("bad")';
 const safe=safeWorkspace(original);
 assert.equal(safe.journal.length,1);
 assert.equal(safe.schemes.length,1);
 const buffer=await writeDraftXlsx(safe,{name:'Вымышленный объект'});
 const wb=await readWorkbook(buffer);
 assert.ok(wb.getWorksheet('ОЖР'));
 assert.ok(wb.getWorksheet('Документы_качества'));
 assert.ok(wb.getWorksheet('Реестр_схем'));
 assert.equal(wb.getWorksheet('Документы_качества').getCell('C2').value,'\u0027=HYPERLINK("bad")');
 const imported=await importDraftXlsx(buffer);
 assert.equal(imported.data.journal[0].reference,'ОЖР, стр. 9');
 assert.equal(imported.data.documents[0].number,'=HYPERLINK("bad")');
 assert.equal(imported.data.schemes[0].fileName,'scheme.pdf');
 assert.equal(recordDiagnostics(imported.data).results[0].counts.documents,1);
});
