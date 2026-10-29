// Offline PTO registers inspired by daily-log and project-record patterns.
// Entries reference documents; they do not certify documents or signatures.
import {isFilled, validDate} from './domain.mjs';
export const RECORD_SCHEMAS = {
  journal: {
    title:'ОЖР · журнал общих работ',
    columns:[['date','Дата','date'],['actNo','№ акта / связь','text'],['description','Запись о выполненных работах','textarea'],['reference','Страница / номер ОЖР','text']],
  },
  documents: {
    title:'Паспорта, сертификаты и декларации',
    columns:[['actNo','№ акта / связь','text'],['type','Тип документа','text'],['number','Номер документа','text'],['material','Материал / изделие','textarea'],['validUntil','Действует до (если применимо)','date'],['fileName','Локальное имя файла','text']],
  },
  schemes: {
    title:'Реестр исполнительных схем',
    columns:[['actNo','№ акта / связь','text'],['number','Подтверждённый номер','text'],['title','Наименование / работы','textarea'],['revision','Версия / изменение','text'],['fileName','Имя файла схемы','text']],
  },
};
export const emptyRecord = kind => Object.fromEntries(RECORD_SCHEMAS[kind].columns.map(([key])=>[key,'']));
export function cleanRecords(kind,rows) {
  if(!Array.isArray(rows))return [];
  return rows.slice(0,300).map(row=>Object.fromEntries(
    RECORD_SCHEMAS[kind].columns.map(([key])=>[key,String(row?.[key]??'').slice(0,1500)])
  ));
}
export function recordDiagnostics(workspace) {
  const active=workspace.acts.map((act,index)=>({act,index})).filter(x=>isFilled(x.act.work));
  const results=[],issues=[];
  for(const {act,index} of active){
    const no=act.actNo,found={};
    for(const kind of Object.keys(RECORD_SCHEMAS))found[kind]=(workspace[kind]||[]).filter(row=>row.actNo===no);
    const flags=[];
    if(!found.journal.length)flags.push('Нет связанной записи ОЖР');
    if(!found.documents.length)flags.push('Нет документов качества в реестре');
    if(!found.schemes.length)flags.push('Нет исполнительной схемы в реестре');
    for(const row of found.journal){
      if(!validDate(row.date))flags.push('ОЖР: неверная дата');
      else if(validDate(act.start)&&validDate(act.end)&&(row.date<act.start||row.date>act.end))
        flags.push('Дата записи ОЖР вне периода работ');
      if(!isFilled(row.reference))flags.push('Не указан номер или страница ОЖР');
    }
    for(const doc of found.documents){
      if(!isFilled(doc.number)||!isFilled(doc.type))flags.push('Не заполнен тип/номер документа качества');
      if(doc.validUntil&&!validDate(doc.validUntil))flags.push('Неверная дата действия документа');
      else if(validDate(doc.validUntil)&&validDate(act.actDate)&&doc.validUntil<act.actDate)
        flags.push('Документ качества требует проверки срока действия');
      if(!isFilled(doc.fileName))flags.push('Не указан файл подтверждающего документа');
    }
    for(const scheme of found.schemes){
      if(!isFilled(scheme.number))flags.push('Нет номера исполнительной схемы');
      if(isFilled(act.schemeNo)&&isFilled(scheme.number)&&scheme.number!==act.schemeNo)
        flags.push('Номер схемы в акте не совпадает с реестром');
      if(!isFilled(scheme.fileName))flags.push('Нет файла исполнительной схемы');
    }
    for(const message of flags)issues.push({actIndex:index,actNo:no,message});
    results.push({actIndex:index,actNo:no,work:act.work,counts:Object.fromEntries(
      Object.entries(found).map(([kind,rows])=>[kind,rows.length])),flags,
      status:flags.length?'Требует проверки':'Связи заполнены — сверить оригиналы'});
  }
  const known=new Set(active.map(x=>x.act.actNo));
  for(const kind of Object.keys(RECORD_SCHEMAS)){
    (workspace[kind]||[]).forEach((row,i)=>{
      if(isFilled(row.actNo)&&!known.has(row.actNo))
        issues.push({actIndex:null,actNo:row.actNo,message:RECORD_SCHEMAS[kind].title+': строка '+(i+1)+' ссылается на неизвестный или пустой акт'});
    });
  }
  return {results,issues};
}
