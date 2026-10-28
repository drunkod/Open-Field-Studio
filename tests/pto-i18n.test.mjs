import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=new URL('../src/locales/',import.meta.url);
const read=async locale=>JSON.parse(await fs.readFile(new URL(`${locale}.json`,base),'utf8'));
test('Russian catalogue includes every original user-facing translation key',async()=>{
 const en=await read('en'),ru=await read('ru');
 assert.deepEqual(Object.keys(ru).sort(),Object.keys(en).sort());
 const permitted=['upload_hint','nen_label','nav_ifc'];
 const fallback=Object.keys(en).filter(k=>ru[k]===en[k]&&!permitted.includes(k));
 assert.deepEqual(fallback,[],'No untranslated English fallbacks');
 assert.equal(ru.nav_pto,'АОСР / КС-2');
 assert.ok(ru.manual_html.includes('АОСР'));
});
test('Russian interpolation tokens exactly match English originals',async()=>{
 const en=await read('en'),ru=await read('ru');
 const tokens=s=>[...s.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();
 for(const key of Object.keys(en)) assert.deepEqual(tokens(ru[key]),tokens(en[key]),key);
});
