// Excel I/O is deliberately isolated from validation and the UI.
// ExcelJS is imported lazily by UI so BIM/inspection startup stays fast.
import ExcelJS from 'exceljs';
import { safeWorkspace, validateWorkspace, toMicro, isFilled, suggestedSchemeNumber } from './domain.mjs';
import { appendOriginalLayout } from './source-layout.mjs';
import { loadAosrStyleTemplate } from './styled-template.mjs';

const clean = v => {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if (v.text !== undefined) return String(v.text);
    if (v.result !== undefined) return clean(v.result);
    if (v.richText) return v.richText.map(x => x.text).join('');
    if (v.hyperlink) return String(v.text || v.hyperlink);
    return '';
  }
  return String(v).trim();
};
const normalize = s => clean(s).toLowerCase().replace(/[\s\u00a0.()№_\/\-]/g, '').replace(/ё/g,'е');
const variants = {
  id: ['позиция','номерпопорядку','пп','nn','nпп','id','код','position','поз'],
  description: ['наименованиеработизатрат','наименованиеработ','наименование','видработ','работызатраты','description','work'],
  qty: ['количество','колвовсего','колво','объем','объём','quantity','qty','всего'],
  unit: ['единицаизмерения','едизм','единица','unit','изм'],
};
function cellText(ws,r,c){ return clean(ws.getRow(r).getCell(c).value); }
export function describeWorkbook(book) {
  return book.worksheets.map(ws=>({
    name:ws.name,
    rowCount:ws.rowCount,
    colCount:Math.min(ws.columnCount || 0, 50),
    sample:Array.from({length:Math.min(ws.rowCount,12)},(_,i)=>Array.from({length:Math.min(ws.columnCount || 12, 16)},(_,c)=>cellText(ws,i+1,c+1))),
  }));
}
export async function readWorkbook(input) {
  const workbook=new ExcelJS.Workbook();
  const data = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  await workbook.xlsx.load(data);
  if (!workbook.worksheets.length) throw Error('Книга Excel не содержит листов.');
  return workbook;
}
export function suggestMapping(ws) {
  let winner=null,score=-1;
  for(let row=1;row<=Math.min(ws.rowCount,35);row++){
    const result={row, id:0,description:0,qty:0,unit:0};
    for(let c=1;c<=Math.min(ws.columnCount,40);c++){
      const text=normalize(cellText(ws,row,c));
      for(const [key,names] of Object.entries(variants)){
        if(names.some(n=>text===normalize(n)||text.startsWith(normalize(n)))){
          if(!result[key]) result[key]=c;
        }
      }
    }
    const matches=['id','description','qty','unit'].filter(k=>result[k]).length;
    if(matches>score){score=matches;winner=result;}
    if(score===4)break;
  }
  return winner || {row:1,id:1,description:2,qty:3,unit:4};
}
export function extractKs2(ws, mapping) {
  const opts=Object.fromEntries(['row','id','description','qty','unit'].map(k=>[k,Number(mapping[k])]));
  if (Object.values(opts).some(x=>!Number.isInteger(x)||x<1||x>10000)) throw Error('Необходимо указать номера всех колонок и строки заголовка.');
  if (new Set([opts.id,opts.description,opts.qty,opts.unit]).size !== 4) throw Error('Для номера, названия, объёма и единицы нужны разные колонки.');
  const items=[], rejected=[], seen=new Set();
  for(let r=opts.row+1;r<=Math.min(ws.rowCount,opts.row+4000);r++){
    const id=cellText(ws,r,opts.id), description=cellText(ws,r,opts.description);
    const qty=cellText(ws,r,opts.qty), unit=cellText(ws,r,opts.unit);
    if(!id&&!description&&!qty&&!unit)continue;
    if(!id||!description){rejected.push(`Строка ${r}: нет номера или описания; пропущена.`);continue;}
    if(toMicro(qty)===null||!unit){rejected.push(`Строка ${r} (${id}): нет корректного количества или единицы; пропущена.`);continue;}
    if(seen.has(id)) { rejected.push(`Строка ${r}: повтор номера ${id}; пропущена.`); continue; }
    seen.add(id);items.push({id,description,qty,unit});
  }
  if (!items.length) throw Error('При выбранном сопоставлении не найдено ни одной корректной позиции.');
  return {items,rejected};
}
const INK='17324D', LIGHT='DCEAF5', WHITE='FFFFFF', YELLOW='FFF2CC', GREEN='E7F3ED';
function header(ws,row,labels){
  ws.getRow(row).values=labels;ws.getRow(row).height=27;
  ws.getRow(row).eachCell(cell=>{
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+INK}};
    cell.font={bold:true,color:{argb:'FF'+WHITE},size:11};
    cell.alignment={vertical:'middle',wrapText:true};
  });
}
function title(ws, text, last='H'){
  ws.mergeCells(`A1:${last}1`);
  const c=ws.getCell('A1');c.value=text;c.font={size:16,bold:true,color:{argb:'FF'+WHITE}};
  c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+INK}};c.alignment={vertical:'middle'};
  ws.getRow(1).height=33;
}
const fill=(cell,color)=>{cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+color}};cell.alignment={wrapText:true,vertical:'middle'};};
const widths=(ws,values)=>values.forEach((w,i)=>{ws.getColumn(i+1).width=w;});
const printable=ws=>{ws.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};ws.pageMargins={left:.3,right:.3,top:.4,bottom:.4,header:.2,footer:.2};};
const formula=(formula,result)=>({formula,result});
function writeDetails(wb,data,project){
 const ws=wb.addWorksheet('Реквизиты');title(ws,'АОСР — общие реквизиты проекта','E');
 const entries=[['Объект',project.name],['Номер проекта',project.number],['Адрес',project.address],['Заказчик',project.client],
  ['Подрядчик',data.header.contractor],['Проектировщик',data.header.designer],['Шифр проекта',data.header.projectCode],
  ['Стройконтроль / инженер ПТО',data.header.inspector],['Представитель заказчика',data.header.customerRepresentative],['Город',project.city]];
 entries.forEach(([label,value],i)=>{const r=i+3;ws.getCell(`A${r}`).value=label;ws.mergeCells(`B${r}:E${r}`);const c=ws.getCell(`B${r}`);c.value=value||'';fill(c,YELLOW);ws.getRow(r).height=25;});
 ws.getCell('A14').value='СТАТУС: ЧЕРНОВИК. Не утверждённая форма АОСР. Требуется ручной контроль.';
 ws.mergeCells('A14:E14');ws.getCell('A14').font={bold:true,color:{argb:'FF9A3412'}};
 widths(ws,[33,34,24,24,20]);printable(ws);return ws;
}
const actCols=[['actNo','№ акта'],['work','Вид работ'],['start','Начало'],['end','Окончание'],['actDate','Дата акта'],
 ['schemeNo','№ схемы'],['schemeTitle','Наименование схемы'],['qualityDocs','Материалы и документы качества'],
 ['measuredQty','Объём по схеме'],['unit','Ед.'],['ks2Id','Позиция КС-2'],['notes','Примечание']];
function writeInput(wb,data){
 const ws=wb.addWorksheet('Ввод_работ');title(ws,'Акты скрытых работ — редактируемая таблица','M');
 ws.mergeCells('A2:M2');ws.getCell('A2').value='Жёлтые ячейки редактируются. Изменения отражаются в листах Акт_01…Акт_15 после пересчёта Excel.';
 header(ws,4,[...actCols.map(x=>x[1]),'Предлагаемый № схемы (не подтверждён)']);
 data.acts.forEach((act,i)=>{
   const r=i+5;actCols.forEach(([key],j)=>{
     const c=ws.getCell(r,j+1);
     const value=act[key]||'';
     if(key==='measuredQty'){const v=toMicro(value);c.value=v===null?'':Number(v)/1000000;c.numFmt='#,##0.######';}
     else if(key==='schemeTitle' && !isFilled(value))c.value=formula(`IF(B${r}="","",B${r})`,act.work||'');
     else c.value=value;
     fill(c,key==='schemeTitle' && !isFilled(value)?GREEN:YELLOW);
   });
   const suggested=ws.getCell(`M${r}`);suggested.value=formula(`IF(B${r}="","","ИС-"&TEXT(ROW()-4,"00"))`,isFilled(act.work)?suggestedSchemeNumber(i):'');
   fill(suggested,GREEN);ws.getRow(r).height=43;
 });
 ws.autoFilter={from:'A4',to:'M19'};ws.views=[{state:'frozen',xSplit:2,ySplit:4}];
 widths(ws,[12,45,14,14,14,18,36,65,19,10,17,32,25]);printable(ws);return ws;
}
function writeKs2(wb,data){
 const ws=wb.addWorksheet('КС-2');title(ws,'Позиции КС-2 — сопоставление по количеству','G');
 ws.mergeCells('A2:G2');ws.getCell('A2').value='Укажите ID позиции на листе Ввод_работ. КС-2 и АОСР — разные документы; числовая сверка не является приёмкой.';
 header(ws,4,['ID позиции','Наименование','Количество КС-2','Ед.','Сумма объёмов АОСР','Ед. сопоставления','Разница (КС-2 – АОСР)']);
 data.ks2.forEach((line,i)=>{
   const r=i+5;
   ws.getCell(`A${r}`).value=line.id;ws.getCell(`B${r}`).value=line.description;
   ws.getCell(`C${r}`).value=toMicro(line.qty)===null?'':Number(toMicro(line.qty))/1000000;
   ws.getCell(`C${r}`).numFmt='#,##0.######';ws.getCell(`D${r}`).value=line.unit;
   const linked=data.acts.filter(x=>x.ks2Id===line.id&&isFilled(x.work));
   const sum=linked.reduce((acc,x)=>acc+(toMicro(x.measuredQty)||0n),0n);
   ws.getCell(`E${r}`).value=formula(`SUMIF(Ввод_работ!$K$5:$K$19,A${r},Ввод_работ!$I$5:$I$19)`,Number(sum)/1000000);
   ws.getCell(`F${r}`).value=line.unit;
   ws.getCell(`G${r}`).value=formula(`C${r}-E${r}`,Number((toMicro(line.qty)||0n)-sum)/1000000);
   ws.getRow(r).height=27;
 });
 ws.views=[{state:'frozen',ySplit:4}];widths(ws,[18,57,20,12,23,22,24]);printable(ws);
}
function writeReview(wb,data){
 const check=validateWorkspace(data),ws=wb.addWorksheet('Сверка');title(ws,'Протокол технической проверки — моментальный снимок','F');
 ws.mergeCells('A2:F2');ws.getCell('A2').value=`Заполнено актов: ${check.count} · ошибок: ${check.errors} · предупреждений: ${check.warnings}. Для повторной проверки после правок импортируйте XLSX в приложение.`;
 header(ws,4,['Позиция','Описание','Объём АОСР','Объём КС-2','Ед.','Статус']);
 check.groups.forEach((g,i)=>{const r=i+5;ws.getRow(r).values=[g.id,g.description,g.actual,g.expected,g.unit,g.status];ws.getRow(r).height=27;});
 const at=Math.max(8,check.groups.length+7);header(ws,at,['Тип','Номер акта','Код','Замечание']);
 check.issues.forEach((x,i)=>{ws.getRow(at+1+i).values=[x.severity,x.actIndex===null?'':data.acts[x.actIndex].actNo,x.code,x.message];ws.getRow(at+1+i).height=27;});
 widths(ws,[18,45,22,24,17,53]);printable(ws);
}
function writeAct(wb,data,i,project){
 const ws=wb.addWorksheet(`Акт_${String(i+1).padStart(2,'0')}`),a=data.acts[i],r=i+5;
 title(ws,'ЧЕРНОВИК — Акт освидетельствования скрытых работ','H');
 ws.mergeCells('A2:H2');ws.getCell('A2').value='Экспериментальная форма; для подписания необходим утверждённый шаблон и проверка инженера.';
 const entries=[
  ['Номер акта',`Ввод_работ!A${r}`,a.actNo],['Объект','Реквизиты!B3',null],
  ['Адрес','Реквизиты!B5',null],['Заказчик','Реквизиты!B6',null],
  ['Подрядчик','Реквизиты!B7',null],['Проектировщик','Реквизиты!B8',null],
  ['Дата акта',`Ввод_работ!E${r}`,a.actDate],['Предъявленные скрытые работы',`Ввод_работ!B${r}`,a.work],
  ['Начало работ',`Ввод_работ!C${r}`,a.start],['Окончание работ',`Ввод_работ!D${r}`,a.end],
  ['Исполнительная схема',`Ввод_работ!F${r}`,a.schemeNo],['Описание схемы',`Ввод_работ!G${r}`,a.schemeTitle],
  ['Материалы и документы качества',`Ввод_работ!H${r}`,a.qualityDocs],
  ['Фактический объём',`Ввод_работ!I${r}`,toMicro(a.measuredQty)===null?'':Number(toMicro(a.measuredQty))/1000000],
  ['Единица',`Ввод_работ!J${r}`,a.unit],['Код позиции КС-2',`Ввод_работ!K${r}`,a.ks2Id],
  ['Примечания',`Ввод_работ!L${r}`,a.notes]];
 entries.forEach(([label,ref,value],i)=>{
   const nr=i+4;ws.mergeCells(`A${nr}:C${nr}`);ws.mergeCells(`D${nr}:H${nr}`);
   const l=ws.getCell(`A${nr}`);l.value=label;fill(l,LIGHT);l.font={bold:true};
   const target=ws.getCell(`D${nr}`);
   // Cache source values for previews even before Excel recalculates.
   const cached=value===null?{'Реквизиты!B3':project.name||'', 'Реквизиты!B5':[project.address,project.city].filter(Boolean).join(', '), 'Реквизиты!B6':project.client||'', 'Реквизиты!B7':data.header.contractor,'Реквизиты!B8':data.header.designer}[ref]||'':value;
   target.value=formula(ref,cached);fill(target,GREEN);
   ws.getRow(nr).height=label.includes('Материалы')?82:label.includes('работы')?62:34;
 });
 ws.mergeCells('A23:H23');ws.getCell('A23').value='Подписи ставятся участниками после фактического освидетельствования и проверки приложений.';
 ws.mergeCells('A25:D25');ws.getCell('A25').value='Заказчик ______________________';
 ws.mergeCells('E25:H25');ws.getCell('E25').value='Исполнитель ______________________';
 widths(ws,[17,17,17,17,17,17,17,17]);ws.views=[{showGridLines:false}];
 ws.pageSetup={paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1};
 ws.pageMargins={left:.4,right:.4,top:.5,bottom:.5,header:.2,footer:.2};ws.printArea='A1:H26';
}
export async function createDraftWorkbook(raw,project={}) {
 const data=safeWorkspace(raw),wb=new ExcelJS.Workbook();
 wb.creator='Open Field Studio / PTO prototype';wb.subject='Черновики АОСР и техническая сверка КС-2';
 wb.created=new Date();wb.calcProperties.fullCalcOnLoad=true;
 writeDetails(wb,data,project);writeInput(wb,data);writeKs2(wb,data);writeReview(wb,data);
 if(!data.legacyLayout)for(let i=0;i<data.acts.length;i++)writeAct(wb,data,i,project);
 else appendOriginalLayout(wb,data,project,await loadAosrStyleTemplate());
 const instr=wb.addWorksheet('Инструкция');title(instr,'Инструкция / ограничения','F');
 ['Редактируйте лист «Реквизиты» и «Ввод_работ».','Листы Акт_01…Акт_15 ссылаются на общие данные и таблицу работ.','Лист «КС-2» содержит числовую сверку; проверяйте единицы измерения.','Лист «Сверка» — моментальный снимок, после правок экспортируйте из приложения заново.','Файл — ЧЕРНОВИК, не является утверждённым документом и не подтверждает соблюдение законодательства.'].forEach((x,i)=>{
   instr.mergeCells(`A${i+3}:F${i+3}`);instr.getCell(`A${i+3}`).value=x;instr.getRow(i+3).height=35;
 });widths(instr,[24,24,24,24,24,24]);
 return wb;
}
export async function writeDraftXlsx(raw,project={}) {
 const workbook=await createDraftWorkbook(raw,project);
 return workbook.xlsx.writeBuffer();
}
// Import only workbooks generated by this prototype. Other AОСР layouts
// must first be mapped explicitly, never guessed from sensitive project data.
export async function importDraftXlsx(input) {
 const wb=await readWorkbook(input);
 const details=wb.getWorksheet('Реквизиты'),entries=wb.getWorksheet('Ввод_работ'),estimate=wb.getWorksheet('КС-2');
 if(!details||!entries||!estimate)throw Error('Это не книга АОСР нашего прототипа: отсутствуют листы Реквизиты, Ввод_работ или КС-2.');
 const data=safeWorkspace({version:1}),project={
   name:cellText(details,3,2),number:cellText(details,4,2),
   address:cellText(details,5,2),city:cellText(details,12,2),client:cellText(details,6,2),
 };
 Object.assign(data.header,{
   contractor:cellText(details,7,2),designer:cellText(details,8,2),
   projectCode:cellText(details,9,2),inspector:cellText(details,10,2),
   customerRepresentative:cellText(details,11,2),
 });
 for(let i=0;i<15;i++){
   const row=i+5;
   actCols.forEach(([key],j)=>{
     let value=cellText(entries,row,j+1);
     if(value.startsWith('=') && key==='measuredQty')value='';
     if(key==='schemeTitle' && typeof entries.getRow(row).getCell(j+1).value === 'object' && entries.getRow(row).getCell(j+1).value?.formula)value='';
     data.acts[i][key]=value;
   });
 }
 for(let row=5;row<=Math.min(estimate.rowCount,2004);row++){
   const id=cellText(estimate,row,1),description=cellText(estimate,row,2);
   if(!id&&!description)continue;
   data.ks2.push({id,description,qty:cellText(estimate,row,3),unit:cellText(estimate,row,4)});
 }
 const original=wb.getWorksheet('Постоянные_поля');
 if(original){
   const grid=wb.getWorksheet('Исходная_сетка');
   const count=grid?Math.min(grid.rowCount,140):109;
   data.legacyLayout={rows:Array.from({length:count},(_,i)=>{
     const row=Array.from({length:43},(_,j)=>grid?cellText(grid,i+1,j+1):'');
     if(i!==3&&i!==60)row[0]=cellText(original,i+3,2);
     return row;
   })};
 }
 return {data:safeWorkspace(data),project};
}

// Print-only copy: freezes cached display values (no links to input sheets),
// retains original cell styles, exact merges and manual two-page AOSR breaks.
function copyPrintableSheet(out,src) {
 const target=out.addWorksheet(src.name);
 target.pageSetup={...src.pageSetup};
 target.headerFooter={...src.headerFooter};
 target.views=[{showGridLines:false}];
 for(let c=1;c<=Math.min(src.columnCount,43);c++){
   target.getColumn(c).width=src.getColumn(c).width;
   target.getColumn(c).hidden=src.getColumn(c).hidden;
 }
 for(let r=1;r<=src.rowCount;r++){
   const from=src.getRow(r),to=target.getRow(r);
   if(from.height!==undefined)to.height=from.height;
   for(let c=1;c<=Math.min(src.columnCount,43);c++){
     const cell=from.getCell(c);
     if(cell.isMerged && cell.master?.address!==cell.address)continue;
     if(cell.value==null && !Object.keys(cell.style||{}).length)continue;
     const dest=to.getCell(c);
     if(Object.keys(cell.style||{}).length)dest.style=JSON.parse(JSON.stringify(cell.style));
     const sourceValue=cell.value;
     dest.value=sourceValue && typeof sourceValue==='object' && 'formula' in sourceValue ? (sourceValue.result??'') : sourceValue;
   }
 }
 for(const merge of Object.values(src._merges)) {
   const v=merge.model;
   if(v.right<=43)target.mergeCells(v.top,v.left,v.bottom,v.right);
 }
 for(const br of src.rowBreaks||[])target.getRow(br.id).addPageBreak();
 return target;
}
export async function writePrintPackXlsx(raw,project={}) {
 const data=safeWorkspace(raw);
 if(!data.acts.some(a=>isFilled(a.work)))throw Error('Нет заполненных актов для печати.');
 const source=await createDraftWorkbook(data,project);
 const out=new ExcelJS.Workbook();
 out.creator='Open Field Studio — printed draft package';
 out.subject='ЧЕРНОВИК — печатные формы АОСР. Проверить перед подписанием.';
 for(let i=0;i<data.acts.length;i++){
   if(!isFilled(data.acts[i].work))continue;
   copyPrintableSheet(out,source.getWorksheet(`Акт_${String(i+1).padStart(2,'0')}`));
 }
 if(data.acts.some(a=>isFilled(a.qualityDocs))){
   const registry=source.getWorksheet('Реестр_качества');
   if(registry)copyPrintableSheet(out,registry);
   else {
     const annex=out.addWorksheet('Реестр_качества');
     annex.columns=[{header:'№ акта',width:16},{header:'Документы качества и паспорта (проверить)',width:110}];
     annex.getRow(1).font={bold:true};
     for(let i=0;i<data.acts.length;i++)if(isFilled(data.acts[i].work)&&isFilled(data.acts[i].qualityDocs)){
       const row=annex.addRow([data.acts[i].actNo,data.acts[i].qualityDocs]);
       row.getCell(2).alignment={wrapText:true,vertical:'middle'};
       row.height=Math.min(260,Math.max(28,Math.ceil(data.acts[i].qualityDocs.length/95)*17));
     }
     annex.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};
   }
 }
 return out.xlsx.writeBuffer();
}
