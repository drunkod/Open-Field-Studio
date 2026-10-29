import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {newWorkspace,safeWorkspace} from '../src/pto/domain.mjs';
import {checkEvidenceBytes,safeEvidenceName,sha256Hex,newEvidenceMeta,
  nextRevision,cleanEvidence} from '../src/pto/evidence-domain.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const pdf=new TextEncoder().encode('%PDF-1.4\nfake synthetic test evidence only');
const sha='a'.repeat(64), id='550e8400-e29b-41d4-a716-446655440000';
test('Russian filenames and PDF magic are accepted; executables and spoofed formats refused',()=>{
 assert.equal(checkEvidenceBytes('паспорт_демо.pdf',pdf),'паспорт_демо.pdf');
 assert.throws(()=>checkEvidenceBytes('malicious.exe',pdf),/не поддерживается/);
 assert.throws(()=>checkEvidenceBytes('fake.png',pdf),/не соответствует/);
 assert.equal(safeEvidenceName('../сертификат.pdf'),'сертификат.pdf');
 assert.throws(()=>checkEvidenceBytes('empty.pdf',new Uint8Array()),/пуст/);
});
test('SHA-256 fingerprints exact content; revisions distinguish same-name updated evidence',async()=>{
 const hash=await sha256Hex(pdf);
 assert.match(hash,/^[a-f0-9]{64}$/);
 const first=newEvidenceMeta({id,actNo:'1.0',kind:'passport',filename:'паспорт_демо.pdf',bytes:pdf,sha256:hash});
 assert.equal(first.revision,1);
 const second=newEvidenceMeta({id:'550e8400-e29b-41d4-a716-446655440001',actNo:'1.0',
   kind:'passport',filename:'паспорт_демо.pdf',bytes:pdf,sha256:hash,previous:[first]});
 assert.equal(second.revision,2);
 assert.equal(nextRevision([first,second],'1.1','passport','паспорт_демо.pdf'),1);
});
test('existing version-1 PTO workspace remains backward-compatible with evidence metadata',()=>{
 const original=newWorkspace();assert.deepEqual(original.evidence,[]);
 const metadata={id,actNo:'1.0',kind:'passport',filename:'паспорт_демо.pdf',sha256:sha,
   size:pdf.length,revision:2,importedAt:'2026-10-29T11:00:00Z'};
 original.evidence=[metadata];
 const loaded=safeWorkspace(JSON.parse(JSON.stringify(original)));
 assert.equal(loaded.evidence[0].filename,metadata.filename);
 assert.equal(loaded.evidence[0].revision,2);
 assert.deepEqual(safeWorkspace({version:1,acts:[],documents:[]}).evidence,[]);
 assert.deepEqual(cleanEvidence([{id:'bad',sha256:sha}]),[]);
});
