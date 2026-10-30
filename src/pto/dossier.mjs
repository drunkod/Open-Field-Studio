// One-click Russian PTO handover DRAFT. Not legally accepted executive documentation.
import {safeWorkspace,isFilled,validateWorkspace} from './domain.mjs';
import {recordDiagnostics} from './records.mjs';
import {checkEvidenceBytes,sha256Hex} from './evidence-domain.mjs';
import {getEvidence} from './evidence-store.mjs';
import {writePrintPackXlsx} from './xlsx.mjs';

const LIMIT_BYTES=40*1024*1024;
const text=value=>String(value??'');
export function csvPto(rows) {
  const escape=value=>{
    let s=text(value);
    if(/^[\s]*[=+@-]/.test(s))s="'"+s;
    return '"'+s.replaceAll('"','""')+'"';
  };
  return '\ufeff'+rows.map(row=>row.map(escape).join(';')).join('\r\n')+'\r\n';
}
export function dossierPlan(raw) {
  const data=safeWorkspace(raw);
  const active=data.acts.map((act,index)=>({...act,index})).filter(act=>isFilled(act.work));
  if(!active.length)throw Error('Нет заполненных АОСР для комплекта ИД.');
  const actIds=new Set(active.map(act=>act.actNo));
  const attachments=data.evidence.filter(item=>actIds.has(item.actNo));
  const diagnostic=recordDiagnostics(data);
  const issues=validateWorkspace(data).issues;
  const actRegister=active.map(act=>({
    actNo:act.actNo,work:act.work,start:act.start,end:act.end,
    actDate:act.actDate,schemeNo:act.schemeNo,ks2Id:act.ks2Id,
    attachments:attachments.filter(x=>x.actNo===act.actNo).length,
    warnings:diagnostic.results.find(x=>x.actIndex===act.index)?.flags.length||0,
  }));
  const warnings=[
    ...issues.map(item=>({actNo:item.actIndex==null?'':data.acts[item.actIndex]?.actNo||'',message:item.message})),
    ...diagnostic.issues.map(item=>({actNo:item.actNo||'',message:item.message})),
    ...active.filter(act=>!attachments.some(item=>item.actNo===act.actNo))
      .map(act=>({actNo:act.actNo,message:'Не добавлены файлы приложений к акту.'})),
  ];
  return {data,active,attachments,actRegister,warnings};
}


export async function buildPtoDossier(raw,project={},options={}) {
  const {data,active,attachments,actRegister,warnings}=dossierPlan(raw);
  const {getBytes=getEvidence,printXlsx=writePrintPackXlsx}=options;
  const {default:JSZip}=await import('jszip');
  const zip=new JSZip();
  const bytesBySha=new Map(), files=[],links=[];
  let total=0;
  // Preflight ALL referenced files before writing the archive.
  for(const record of attachments){
    const bytes=await getBytes(record.id,record.sha256);
    const filename=checkEvidenceBytes(record.filename,bytes);
    const actual=await sha256Hex(bytes);
    if(actual!==record.sha256)
      throw Error('Файл '+filename+': SHA-256 не совпадает. Проверьте локальный архив.');
    if(bytes.byteLength!==record.size)
      throw Error('Файл '+filename+': размер отличается от реестра.');
    if(!bytesBySha.has(actual)){
      total+=bytes.byteLength;
      if(total>LIMIT_BYTES)throw Error('Объём приложений превышает 40 МБ.');
      const relative='Приложения/'+actual.slice(0,20)+'_'+filename;
      bytesBySha.set(actual,{relative,bytes:new Uint8Array(bytes)});
      files.push({path:relative,sha256:actual,size:bytes.byteLength});
    }
    links.push({actNo:record.actNo,kind:record.kind,filename,
      revision:record.revision,sha256:actual,path:bytesBySha.get(actual).relative});
  }
  const xlsx=await printXlsx(data,project);
  const packBytes=new Uint8Array(xlsx);
  const workbookHash=await sha256Hex(packBytes);
  zip.file('АОСР_черновики.xlsx',packBytes);
  for(const item of bytesBySha.values())zip.file(item.relative,item.bytes);
  const actRows=[['№ акта','Работа','Начало','Окончание','Дата акта','№ схемы',
    'Позиция КС-2','Файлов','Замечаний']];
  for(const act of actRegister)
    actRows.push([act.actNo,act.work,act.start,act.end,act.actDate,
      act.schemeNo,act.ks2Id,act.attachments,act.warnings]);
  zip.file('Реестр_ИД.csv',csvPto(actRows));
  const filesRows=[['№ акта','Вид','Оригинальное имя файла','Редакция',
    'Путь в ZIP','Размер, байт','SHA-256']];
  links.forEach(item=>filesRows.push([item.actNo,item.kind,item.filename,
    item.revision,item.path,files.find(x=>x.sha256===item.sha256)?.size,item.sha256]));
  zip.file('Опись_приложений.csv',csvPto(filesRows));
  zip.file('Замечания.csv',csvPto([['№ акта','Замечание'],
    ...warnings.map(item=>[item.actNo,item.message])]));

  const manifest={
    format:'ofs-pto-dossier',version:1,
    status:'ЧЕРНОВИК — НЕ ПОДПИСАНО И НЕ ПРОВЕРЕНО',
    projectName:text(project?.name).slice(0,250),
    generatedAt:new Date().toISOString(),
    acts:actRegister,attachmentLinks:links,
    contentFiles:[{path:'АОСР_черновики.xlsx',sha256:workbookHash,
      size:packBytes.byteLength},...files],warnings,
  };
  zip.file('Манифест.json',JSON.stringify(manifest,null,2));
  zip.file('ПРОЧТИТЕ_ЧЕРНОВИК.txt',[
    'ЧЕРНОВИК комплекта исполнительной документации (ИД)',
    'Акты, опись и приложения подготовлены автоматически из локальной формы ПТО.',
    'Наличие файла, хеш SHA-256 и совпадение количества не доказывают подлинность,',
    'соответствие приказу Минстроя, согласование заказчиком или юридическую подпись.',
    'Перед передачей инженер обязан проверить содержание, версии, ОЖР, КС-2,',
    'полномочия подписантов, состав приложений и форму, принятую заказчиком.',
    'При наличии замечаний см. Замечания.csv.',
    'Контрольные суммы перечислены в Манифест.json.',
  ].join('\r\n'));
  return {bytes:await zip.generateAsync({
    type:'uint8array',compression:'DEFLATE',compressionOptions:{level:5}}),
    manifest};
}
