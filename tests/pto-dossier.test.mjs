import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import JSZip from 'jszip';
import {newWorkspace} from '../src/pto/domain.mjs';
import {sha256Hex} from '../src/pto/evidence-domain.mjs';
import {buildPtoDossier,dossierPlan,csvPto} from '../src/pto/dossier.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const file=new TextEncoder().encode('%PDF-1.4\nВымышленный паспорт, НЕ настоящий документ');
const meta=async()=>{
 const sha256=await sha256Hex(file);
 return {id:'550e8400-e29b-41d4-a716-446655440000',actNo:'1.0',
   kind:'passport',filename:'паспорт_демо.pdf',sha256,size:file.byteLength,
   revision:1,importedAt:'2026-10-30T00:00:00Z'};
};
const fixture=async()=>{
 const data=newWorkspace();
 Object.assign(data.acts[0],{work:'Кровля: тестовый участок',start:'2026-10-01',end:'2026-10-02'});
 Object.assign(data.acts[1],{work:'Кровля: другой участок'});
 const item=await meta();
 data.evidence=[item,{...item,actNo:'1.1'}];
 return data;
};
test('empty dossiers are rejected, CSV fields escaped including formula injection',()=>{
 assert.throws(()=>dossierPlan(newWorkspace()),/Нет заполненных/);
 const csv=csvPto([['Работа','Формула'],['«Кровля»; проверка','=HYPERLINK("a")']]);
 assert.ok(csv.startsWith('\ufeff'));
 assert.ok(csv.includes('"\u0027=HYPERLINK(""a"")"'));
 assert.ok(csv.includes('"«Кровля»; проверка"'));
});
test('one physical attachment reused by two acts, with SHA and traceable Russian inventory',async()=>{
 const data=await fixture();
 const result=await buildPtoDossier(data,{name:'Учебный объект'},{
   getBytes:async()=>file,
   printXlsx:async()=>new Uint8Array([80,75,3,4,0,0]),
 });
 const zip=await JSZip.loadAsync(result.bytes);
 const names=Object.keys(zip.files).filter(x=>!zip.files[x].dir);
 assert.equal(names.filter(x=>x.startsWith('Приложения/')).length,1);
 for(const name of ['АОСР_черновики.xlsx','Реестр_ИД.csv','Опись_приложений.csv',
  'Замечания.csv','Манифест.json','ПРОЧТИТЕ_ЧЕРНОВИК.txt'])assert.ok(names.includes(name),name);
 const manifest=JSON.parse(await zip.file('Манифест.json').async('string'));
 assert.equal(manifest.acts.length,2);
 assert.equal(manifest.attachmentLinks.length,2);
 assert.equal(manifest.attachmentLinks[0].path,manifest.attachmentLinks[1].path);
 assert.equal(manifest.status,'ЧЕРНОВИК — НЕ ПОДПИСАНО И НЕ ПРОВЕРЕНО');
 assert.deepEqual(new Uint8Array(await zip.file(manifest.attachmentLinks[0].path).async('uint8array')),file);
 const inventory=await zip.file('Опись_приложений.csv').async('string');
 assert.match(inventory,/паспорт_демо.pdf/);
 assert.match(inventory,/1\.1/);
});

test('dossier aborts before output for missing or corrupted local evidence',async()=>{
 const data=await fixture();
 const opts={printXlsx:async()=>new Uint8Array([80,75,3,4])};
 await assert.rejects(buildPtoDossier(data,{},{
   ...opts,getBytes:async()=>{throw Error('Локальный файл не найден');}
 }),/не найден/);
 await assert.rejects(buildPtoDossier(data,{},{
   ...opts,getBytes:async()=>new TextEncoder().encode('%PDF-1.4\nИзменённый файл')
 }),/SHA-256 не совпадает/);
});
