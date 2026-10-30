// Local-only import of dated ОЖР *references*. Not a statutory ОЖР or approval.
import {validDate,isFilled} from './domain.mjs';
const norm = value => String(value??'').toLowerCase().replace(/ё/g,'е').replace(/[\s\u00a0№.():_/-]/g,'');
const hints={
  actNo:['номеракта','акта','акт','актаоср','кодработы','код','идработы','номерработы','actno','workcode'],
  date:['датавыполнения','датаработ','датазаписи','дата','date','workdate'],
  description:['описаниеработ','выполненныеработы','наименованиеработ','видработ','описание','работа','description'],
  reference:['номерзаписи','страницажурнала','номерстраницы','строжр','страница','ссылка','reference'],
};
export function suggestOjrMapping(rows){
  let best={headerRow:1,actNo:0,date:0,description:0,reference:0},score=-1;
  rows.slice(0,25).forEach((row,index)=>{
    const proposal={headerRow:index+1,actNo:0,date:0,description:0,reference:0};
    row.slice(0,50).forEach((text,column)=>{
      const value=norm(text);
      for(const [field,words] of Object.entries(hints))
        if(!proposal[field]&&words.some(word=>value===word||value.startsWith(word)))
          proposal[field]=column+1;
    });
    const count=['actNo','date','description','reference'].filter(field=>proposal[field]).length;
    if(count>score){best=proposal;score=count;}
  });
  return best;
}
export function normalizeOjrDate(value){
  if(value instanceof Date && !Number.isNaN(value.getTime()))return value.toISOString().slice(0,10);
  if(typeof value==='number'&&Number.isInteger(value)&&value>30000&&value<85000){
    const date=new Date(Date.UTC(1899,11,30)+value*86400000);
    const text=date.toISOString().slice(0,10);
    return validDate(text)?text:'';
  }
  const raw=String(value??'').trim();
  if(validDate(raw))return raw;
  const parts=/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(raw);
  if(!parts)return '';
  const iso=parts[3]+'-'+parts[2].padStart(2,'0')+'-'+parts[1].padStart(2,'0');
  return validDate(iso)?iso:'';
}
export function parseOjrCsv(source){
  const text=String(source||'').replace(/^\ufeff/,'');
  if(text.length>10*1024*1024)throw Error('Файл ОЖР превышает лимит 10 МБ.');
  const first=text.split(/\r?\n/,1)[0]||'';
  const counts={';':0,',':0,'\t':0};let quoted=false;
  for(let i=0;i<first.length;i++){
    if(first[i]==='"')quoted=!quoted;
    else if(!quoted&&Object.hasOwn(counts,first[i]))counts[first[i]]++;
  }
  const delim=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[],row=[];let cell='',inQuote=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){
      if(inQuote&&text[i+1]==='"'){cell+='"';i++;}
      else inQuote=!inQuote;
    }else if(c===delim&&!inQuote){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!inQuote){
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(cell);cell='';
      if(row.some(x=>String(x).trim()))rows.push(row.slice(0,50));
      row.length=0;
      if(rows.length>2001)throw Error('В файле больше 2000 строк ОЖР.');
    }else cell+=c;
  }
  if(inQuote)throw Error('Незакрытая кавычка в CSV.');
  row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row.slice(0,50));
  return rows;
}

export async function readOjrXlsx(input){
  const {readWorkbook}=await import('./xlsx.mjs');
  const wb=await readWorkbook(input);
  if(wb.worksheets.length>60)throw Error('Слишком много листов ОЖР.');
  return wb.worksheets.map(ws=>{
    if(ws.rowCount>2001)throw Error('В листе ОЖР больше 2000 строк.');
    const rows=[];
    for(let r=1;r<=ws.rowCount;r++){
      const vals=[];
      for(let c=1;c<=Math.min(50,ws.columnCount);c++){
        const v=ws.getRow(r).getCell(c).value;
        // Formula results may be stale. Never silently use them as journal evidence.
        vals.push(v&&typeof v==='object'&&'formula' in v?'':v&&typeof v==='object'&&'richText' in v?
          v.richText.map(item=>item.text).join(''):v&&typeof v==='object'&&'text' in v?v.text:v??'');
      }
      rows.push(vals);
    }
    return {name:ws.name,rows};
  });
}
export function previewOjrImport(rows,mapping,workspace){
  const m=Object.fromEntries(['headerRow','actNo','date','description','reference']
    .map(k=>[k,Number(mapping[k]||0)]));
  if(!Number.isInteger(m.headerRow)||m.headerRow<1||m.headerRow>1000)
    throw Error('Неверная строка заголовков ОЖР.');
  if(['actNo','date','description'].some(k=>!Number.isInteger(m[k])||m[k]<1||m[k]>50))
    throw Error('Укажите номера обязательных столбцов: акт, дата и работы.');
  if(!Number.isInteger(m.reference)||m.reference<0||m.reference>50)
    throw Error('Неверный столбец ссылки.');
  if(new Set([m.actNo,m.date,m.description,m.reference].filter(Boolean)).size!==
    [m.actNo,m.date,m.description,m.reference].filter(Boolean).length)
    throw Error('Для полей ОЖР нужны разные колонки.');
  const active=new Set(workspace.acts.filter(a=>isFilled(a.work)).map(a=>a.actNo));
  const existing=new Set((workspace.journal||[]).map(x=>[x.actNo,x.date,x.description,x.reference].join('\u0001')));
  const seen=new Set(existing),items=[],rejected=[];
  const slice=rows.slice(m.headerRow);
  if(slice.length>2000)throw Error('Не более 2000 исходных строк.');
  slice.forEach((row,index)=>{
    if(!row.some(x=>String(x??'').trim()))return;
    const no=String(row[m.actNo-1]??'').trim(),date=normalizeOjrDate(row[m.date-1]);
    const description=String(row[m.description-1]??'').trim().slice(0,1500);
    const ref=m.reference?String(row[m.reference-1]??'').trim().slice(0,1500):'';
    const entry={date,actNo:no,description,reference:ref};
    const label='Строка '+(m.headerRow+index+1);
    if(!active.has(no)){rejected.push(label+': нет заполненного акта с кодом «'+no+'».');return;}
    if(!date){rejected.push(label+': дата отсутствует или некорректна.');return;}
    if(!description){rejected.push(label+': отсутствует описание работ.');return;}
    const key=[no,date,description,ref].join('\u0001');
    if(seen.has(key)){rejected.push(label+': повтор записи.');return;}
    seen.add(key);items.push(entry);
  });
  const capacity=300-(workspace.journal||[]).length;
  if(items.length>capacity)throw Error('Превышен лимит 300 записей журнала.');
  return {items,rejected,scanned:slice.length};
}

export function dateSuggestions(workspace,records){
  const byAct=new Map();
  const active=new Set(workspace.acts.filter(a=>isFilled(a.work)).map(a=>a.actNo));
  records.forEach(entry=>{
    if(!active.has(entry.actNo)||!validDate(entry.date))return;
    const dates=byAct.get(entry.actNo)||[];
    dates.push(entry.date);byAct.set(entry.actNo,dates);
  });
  return [...byAct].map(([actNo,dates])=>{
    dates.sort();const act=workspace.acts.find(x=>x.actNo===actNo);
    return {actNo,first:dates[0],last:dates[dates.length-1],
      fillStart:!isFilled(act.start),fillEnd:!isFilled(act.end),count:dates.length};
  });
}
export function fillMissingActDates(workspace,records){
  const suggestions=dateSuggestions(workspace,records),changed=[];
  suggestions.forEach(proposal=>{
    const act=workspace.acts.find(x=>x.actNo===proposal.actNo);
    if(proposal.fillStart){act.start=proposal.first;changed.push(proposal.actNo+' начало');}
    if(proposal.fillEnd){act.end=proposal.last;changed.push(proposal.actNo+' окончание');}
  });
  return changed;
}
