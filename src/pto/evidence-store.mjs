// Private browser-origin storage. Not a certified archive or remote backup.
import {sha256Hex,checkEvidenceBytes,MAX_EVIDENCE_BYTES} from './evidence-domain.mjs';
const DB_NAME='ofs-pto-evidence-v1',STORE='binary';
export function openEvidenceDb(){
  if(!globalThis.indexedDB)throw Error('Локальное файловое хранилище недоступно.');
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||Error('Ошибка открытия локального архива.'));
    request.onblocked=()=>reject(Error('Закройте другие окна приложения и повторите.'));
  });
}
async function withStore(mode,action){
  const db=await openEvidenceDb();
  try{return await new Promise((resolve,reject)=>{
    let result;
    const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
    tx.oncomplete=()=>resolve(result);
    tx.onerror=()=>reject(tx.error||Error('Ошибка локального хранилища.'));
    tx.onabort=()=>reject(tx.error||Error('Сохранение вложения прервано.'));
    const req=action(store);
    if(req)req.onsuccess=()=>{result=req.result;};
  });}finally{db.close();}
}
export async function putEvidence(id,bytes){
  if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Некорректный ID вложения.');
  await withStore('readwrite',store=>store.put(new Blob([bytes],{type:'application/octet-stream'}),id));
}
export async function getEvidence(id,expectedSha=''){
  const blob=await withStore('readonly',store=>store.get(id));
  if(!blob)throw Error('Локальный файл не найден. Восстановите его из резервной копии.');
  const bytes=await blob.arrayBuffer();
  if(expectedSha&&await sha256Hex(bytes)!==expectedSha)throw Error('Контрольная сумма файла не совпадает.');
  return bytes;
}
export async function deleteEvidence(id){
  await withStore('readwrite',store=>store.delete(id));
}
export async function evidenceBackup(records){
  const entries=[];let total=0;
  for(const item of records){
    const bytes=await getEvidence(item.id,item.sha256);
    total+=bytes.byteLength;
    if(total>40*1024*1024)throw Error('Резервная копия больше 40 МБ: разбейте комплект на части.');
    const b=new Uint8Array(bytes),chunks=[];
    for(let i=0;i<b.length;i+=0x8000)chunks.push(String.fromCharCode(...b.subarray(i,i+0x8000)));
    entries.push({meta:item,base64:btoa(chunks.join(''))});
  }
  return {format:'ofs-pto-evidence-backup',version:1,createdAt:new Date().toISOString(),entries};
}
export async function restoreEvidenceBackup(bundle,existing=[]){
  if(bundle?.format!=='ofs-pto-evidence-backup'||bundle.version!==1||!Array.isArray(bundle.entries))
    throw Error('Неизвестный формат резервной копии приложений.');
  if(bundle.entries.length>300)throw Error('Слишком много файлов в архиве.');
  const staged=[];let total=0;
  const known=new Map(existing.map(x=>[x.id,x.sha256]));
  const seen=new Map();
  for(const item of bundle.entries){
    const meta=item.meta||{},s=String(item.base64||'');
    if(!/^[0-9a-f-]{36}$/.test(meta.id||'')||!/^[0-9a-f]{64}$/.test(meta.sha256||'')||!s||s.length>28*1024*1024)
      throw Error('Повреждена запись резервной копии.');
    const binary=atob(s),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    total+=bytes.byteLength;
    if(bytes.byteLength>MAX_EVIDENCE_BYTES||meta.size!==bytes.byteLength)
      throw Error('Некорректный размер вложения в архиве.');
    checkEvidenceBytes(meta.filename,bytes);
    if(total>40*1024*1024||await sha256Hex(bytes)!==meta.sha256)
      throw Error('Неверная контрольная сумма или превышен лимит архива.');
    if((known.has(meta.id)&&known.get(meta.id)!==meta.sha256)||
       (seen.has(meta.id)&&seen.get(meta.id)!==meta.sha256))
      throw Error('Конфликт ID вложения: контрольные суммы различаются.');
    seen.set(meta.id,meta.sha256);
    staged.push({meta,bytes});
  }
  // Check every digest before writing any file.
  for(const item of staged)await putEvidence(item.meta.id,item.bytes);
  return staged.map(x=>x.meta);
}
