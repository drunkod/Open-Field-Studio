import test from 'node:test';
import assert from 'node:assert/strict';
import { newWorkspace, safeWorkspace, toMicro, unitKey, validDate, validateWorkspace, parseKs2Csv, generateDraftHtml, htmlEscape } from '../src/pto/domain.mjs';

const fixture = () => {
  const data = newWorkspace();
  data.ks2 = [{ id:'A', description:'Гидроизоляция, две зоны', qty:'12,5', unit:'м²' }];
  Object.assign(data.acts[0], {work:'Гидроизоляция, зона А', start:'2026-10-01',end:'2026-10-02',actDate:'2026-10-03',schemeNo:'ИС-01',qualityDocs:'Паспорт условный',measuredQty:'5',unit:'м2',ks2Id:'A'});
  Object.assign(data.acts[1], {work:'Гидроизоляция, зона Б', start:'2026-10-02',end:'2026-10-03',actDate:'2026-10-03',schemeNo:'ИС-02',qualityDocs:'Паспорт условный',measuredQty:'7,5',unit:'м²',ks2Id:'A'});
  return data;
};
test('15 blank act slots do not generate false errors', () => {
  const data = newWorkspace();
  assert.equal(data.acts.length, 15);
  assert.equal(validateWorkspace(data).count, 0);
  assert.equal(validateWorkspace(data).errors, 0);
});
test('aggregates multiple AOSR against one KS-2 line with normalized units', () => {
  const check = validateWorkspace(fixture());
  assert.equal(check.count, 2);
  assert.equal(check.errors, 0);
  assert.equal(check.warnings, 0);
  assert.equal(check.groups[0].status,'quantity_correlates');
  assert.equal(check.groups[0].actual, '12,5');
});
test('detects mismatched quantities without claiming legal failure', () => {
  const d = fixture(); d.acts[1].measuredQty = '8';
  const check = validateWorkspace(d);
  assert.equal(check.groups[0].status,'difference');
  assert.ok(check.issues.some(x => x.code === 'qty_difference' && x.severity === 'warning'));
});
test('detects mismatch of measurement units, cannot pretend equal', () => {
  const d = fixture(); d.acts[1].unit = 'м³';
  const check = validateWorkspace(d);
  assert.equal(check.groups[0].status, 'unit_mismatch');
  assert.ok(check.issues.some(x => x.code === 'unit_mismatch' && x.severity === 'error'));
});
test('duplicate act number, reversed dates, missing scheme and bad act date', () => {
  const d = fixture();
  d.acts[1].actNo = d.acts[0].actNo;
  d.acts[1].start = '2026-10-08'; d.acts[1].end = '2026-10-02';
  d.acts[1].schemeNo = ''; d.acts[1].actDate = '';
  const codes = validateWorkspace(d).issues.map(x => x.code);
  for(const code of ['duplicate_act','reversed_dates','missing_scheme','missing_act_date']) assert.ok(codes.includes(code),code);
});
test('unknown KS2 position is an error; absent quantity remains unverified', () => {
  const d = fixture();
  d.acts[0].ks2Id = 'not-found'; d.acts[1].measuredQty = '';
  const codes = validateWorkspace(d).issues.map(x => x.code);
  assert.ok(codes.includes('unknown_ks2_link'));
  assert.ok(codes.includes('incomplete_group'));
  assert.equal(validateWorkspace(d).groups.find(x=>x.id==='A').status,'unverified');
});
test('CSV supports Russian headers, semicolon, quoted delimiters and comma decimals', () => {
  const lines = 'позиция;наименование;количество;ед.изм.\n"КС-1";"Устройство; кровли";"12,5";м²\n';
  const items = parseKs2Csv(lines);
  assert.equal(items.length,1);
  assert.equal(items[0].id,'КС-1'); assert.equal(items[0].description,'Устройство; кровли');
  assert.equal(toMicro(items[0].qty),12500000n);
  assert.throws(()=>parseKs2Csv('позиция;наименование;количество;ед.изм.\nA;Тест;1;м²\nA;Тест;2;м²'),'повторный');
});
test('bad decimal or date formats are not silently interpreted', () => {
  assert.equal(toMicro('1,5'),1500000n);
  assert.equal(toMicro('10,0000001'),null);
  assert.equal(toMicro('-1'),null);
  assert.equal(toMicro('1,2,3'),null);
  assert.equal(validDate('2026-02-30'),false);
  assert.equal(unitKey('м²'),unitKey('м2'));
});
test('printed draft escapes injected text and includes explicit disclaimer', () => {
  const d = fixture();d.acts[0].work = '<script>alert(1)</script>';
  const report = generateDraftHtml(d,{name:'<img src=x onerror=alert(1)>',client:'Заказчик'});
  assert.ok(!report.includes('<script>'));
  assert.ok(!report.includes('<img src=x'));
  assert.ok(report.includes('&lt;script&gt;'));
  assert.ok(report.includes('ЧЕРНОВИК'));
  assert.equal(htmlEscape('"&<>'), '&quot;&amp;&lt;&gt;');
});
test('safeWorkspace clamps count and removes non-whitelisted fields',()=>{
  const bad = { version:1, header: {contractor:'P',secret:'x'}, acts:Array.from({length:25},()=>({work:'work',malicious:'oops'})), ks2:[] };
  const d = safeWorkspace(bad);
  assert.equal(d.acts.length,15);
  assert.ok(!Object.hasOwn(d.acts[0],'malicious'));
  assert.ok(!Object.hasOwn(d.header,'secret'));
});
