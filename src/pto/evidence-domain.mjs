// PTO evidence references: not Russian statutory sign-off or certificate verification.
export const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;
export const EVIDENCE_KINDS = Object.freeze({
  passport:'Паспорт материала', certificate:'Сертификат/декларация',
  scheme:'Исполнительная схема', journal:'ОЖР / приложение',
  ks2:'Документ КС-2', photo:'Фотофиксация', other:'Иной документ',
});
const TYPES = new Set(['pdf','png','jpg','jpeg','docx','xlsx','xls','xml','ifc','dwg','dxf','odt']);
export function safeEvidenceName(name) {
  const result=String(name||'').split(/[\\/]/).pop().replace(/[\u0000-\u001f<>:"|?*]/g,'_').trim().slice(0,170);
  if(!result || result==='.' || result==='..')throw Error('Недопустимое имя файла.');
  return result;
}
export function checkEvidenceBytes(name,bytes) {
  const filename=safeEvidenceName(name),ext=filename.split('.').pop().toLowerCase();
  if(!TYPES.has(ext))throw Error('Тип файла не поддерживается для локальных вложений.');
  if(!bytes?.byteLength || bytes.byteLength>MAX_EVIDENCE_BYTES)throw Error('Файл пуст или превышает 20 МБ.');
  const b=new Uint8Array(bytes),starts=(...x)=>x.every((v,i)=>b[i]===v);
  const zip=starts(0x50,0x4b),ole=starts(0xd0,0xcf,0x11,0xe0),pdf=starts(0x25,0x50,0x44,0x46);
  const text=new TextDecoder('utf-8',{fatal:false}).decode(b.slice(0,128)).trimStart();
  const valid=({pdf, png:starts(0x89,0x50,0x4e,0x47),jpg:starts(0xff,0xd8),
    jpeg:starts(0xff,0xd8),docx:zip,xlsx:zip,odt:zip,xls:ole,
    xml:text.startsWith('<?xml')||text.startsWith('<'),ifc:text.startsWith('ISO-10303-21'),
    dwg:text.startsWith('AC'),dxf:text.includes('SECTION')})[ext];
  if(!valid)throw Error('Формат содержимого не соответствует расширению файла.');
  return filename;
}
export async function sha256Hex(bytes) {
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function cleanEvidence(rows) {
  if(!Array.isArray(rows))return [];
  return rows.slice(0,300).filter(x=>x&&typeof x==='object').map(x=>({
    id:String(x.id||'').slice(0,80),actNo:String(x.actNo||'').slice(0,90),
    kind:EVIDENCE_KINDS[x.kind]?x.kind:'other',
    filename:String(x.filename||'').slice(0,170),
    sha256:/^[a-f0-9]{64}$/.test(x.sha256||'')?x.sha256:'',
    size:Number.isSafeInteger(x.size)&&x.size>0&&x.size<=MAX_EVIDENCE_BYTES?x.size:0,
    revision:Number.isSafeInteger(x.revision)&&x.revision>0?Math.min(x.revision,999):1,
    importedAt:String(x.importedAt||'').slice(0,32),
    note:String(x.note||'').slice(0,350),
  })).filter(x=>/^[0-9a-f-]{36}$/.test(x.id)&&x.sha256);
}
export function nextRevision(entries,actNo,kind,filename) {
  return 1+Math.max(0,...entries.filter(x=>x.actNo===actNo&&x.kind===kind&&x.filename===filename).map(x=>x.revision||1));
}
export function newEvidenceMeta({id,actNo,kind,filename,bytes,sha256,previous=[]}) {
  if(!EVIDENCE_KINDS[kind])throw Error('Неизвестный тип приложения.');
  if(!actNo)throw Error('Сначала выберите акт.');
  const safe=checkEvidenceBytes(filename,bytes);
  return {id,actNo:String(actNo).slice(0,90),kind,filename:safe,sha256,
    size:bytes.byteLength,revision:nextRevision(previous,actNo,kind,safe),
    importedAt:new Date().toISOString(),note:'Файл сохранён локально; подлинность не проверена'};
}
