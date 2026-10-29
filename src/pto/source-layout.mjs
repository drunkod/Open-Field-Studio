// Reconstruct the user's own original-format AOSR *structure* from a private .xls
// imported locally. No source project/company data are bundled in this repository.
// BIFF8 reader exposes cell positions and text but NOT original merge/style records:
// spacing/merged regions are recreated for editing and printing, not asserted identical.
import {suggestedSchemeNumber,isFilled,safeWorkspace} from './domain.mjs';
import {applyStyledLayout} from './styled-template.mjs';
const srcValue = (r,c=0) => String(r?.[c]??'');
const byRow = (ws,r)=>ws.getCell(`B${r+2}`);
const scalar = (value) => value || '';
const blankSafe=ref=>`IF(${ref}="","",${ref})`;
const compactHeight=(value,chars=95)=>Math.max(12,Math.min(42,Math.ceil(String(value||'').length/chars)*14));
const MONTHS=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const dateParts=value=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');return m?{day:m[3],month:MONTHS[Number(m[2])-1],year:m[1]}:{day:'',month:'',year:''};};
export function appendOriginalLayout(wb,raw,project={},styleTemplate=null) {
 const data=safeWorkspace(raw), source=data.legacyLayout?.rows;
 if(!source?.length)return false;
 const fixed=wb.addWorksheet('Постоянные_поля');
 fixed.columns=[{header:'Исходная строка',key:'row',width:19},{header:'Общий реквизит / текст исходного образца (редактируется один раз)',key:'value',width:110}];
 fixed.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
 fixed.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF264461'}};
 const mutable=new Set([3,29,57,60,64,65,70,73,74,82]); // 0-based original positions
 source.forEach((r,i)=>{
   const original=srcValue(r);
   const row=i+3;
   fixed.getCell(row,1).value=`Строка ${i+1}`;
   const target=fixed.getCell(row,2);
   let value=original;
   if(i===3){value=project.name||value;target.value={formula:'Реквизиты!B3',result:value};}
   else if(i===60){value=`Шифр проекта: ${data.header.projectCode||''}`;target.value={formula:'"Шифр проекта: "&Реквизиты!B9',result:value};}
   else target.value=value;
   target.alignment={wrapText:true,vertical:'middle'};
   if(value)target.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2CC'}};
   fixed.getRow(row).height=Math.max(19,Math.min(84,Math.ceil(String(value).length/115)*16));
 });
 fixed.views=[{state:'frozen',ySplit:2}];
 const grid=wb.addWorksheet('Исходная_сетка');grid.state='veryHidden';
 source.forEach((r,i)=>r.forEach((value,j)=>{if(value)grid.getCell(i+1,j+1).value=value;}));
 const registry=wb.addWorksheet('Реестр_качества');
 registry.getRow(1).values=['№ акта','Полный перечень документов качества и паспортов (черновик)'];
 registry.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
 registry.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF264461'}};
 registry.getColumn(1).width=15;registry.getColumn(2).width=100;
 registry.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};
 for(let i=0;i<data.acts.length;i++){const r=i+5,row=i+2,act=data.acts[i];
   registry.getCell(row,1).value={formula:blankSafe(`Ввод_работ!A${r}`),result:act.actNo||''};
   registry.getCell(row,2).value={formula:blankSafe(`Ввод_работ!H${r}`),result:act.qualityDocs||''};
   registry.getCell(row,2).alignment={wrapText:true,vertical:'middle'};
   registry.getRow(row).height=Math.max(22,Math.min(210,Math.ceil((act.qualityDocs||'').length/100)*18));
 }
 const workRows = data.acts.length;
 for(let i=0;i<workRows;i++){
   const act=data.acts[i],r=i+5;
   const ws=wb.addWorksheet(`Акт_${String(i+1).padStart(2,'0')}`);
   if(styleTemplate)applyStyledLayout(ws,styleTemplate);
   else {
     for(let c=1;c<=43;c++)ws.getColumn(c).width=2.7;
     ws.views=[{showGridLines:false}];
     ws.pageSetup={paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0};
     ws.pageMargins={left:0.45,right:0.45,top:0.45,bottom:0.45,header:0.15,footer:0.15};
   }
   for(let j=0;j<source.length;j++){
     const row=source[j], index=j+1;
     const nonempty=row.map((v,c)=>[c+1,String(v??'')]).filter(([c,v])=>v.trim());
     if(!nonempty.length)continue;
     const line=ws.getRow(index);
     const single=nonempty.length===1;
     if(!styleTemplate && single && (nonempty[0][0]===1) && index!==30){
       try{ws.mergeCells(index,1,index,43);}catch(_){}
     }
     if(!styleTemplate && single && nonempty[0][0]===24 && index<3){
       try{ws.mergeCells(index,24,index,43);}catch(_){}
     }
     for(const [col,v] of nonempty){
       // Rows populated with variable content are re-bound to the central work table.
       if([30,58,61,65,66,71,74,75,83].includes(index))continue;
       if(col===1 && v==='0')continue; // legacy empty-formula placeholders, not valid fields
       const cell=ws.getCell(index,col);
       if(col===1){
         cell.value={formula:`'Постоянные_поля'!B${j+3}`,result:index===4?(project.name||v):v};
       }else cell.value=v;
       if(!styleTemplate)cell.font={name:'Arial',size:index===27?12:9,bold:index===27||index===28};
       if(!styleTemplate)cell.alignment={vertical:'middle',wrapText:col===1};
       if(!styleTemplate && (/^\d+\. /.test(v)||/^(АКТ|освидетельствования скрытых работ)/i.test(v)))cell.font={name:'Arial',size:10,bold:true};
     }
     if(!styleTemplate)line.height=single&&nonempty[0][0]===1?Math.max(15,Math.min(85,Math.ceil(nonempty[0][1].length/125)*13)):18;
   }
   // Override only known variable fields from the source AOSR structure.
   const set=(row,col,expr,value,height=24)=>{
     const cell=ws.getCell(row,col);cell.value={formula:expr,result:scalar(value)};
     if(!styleTemplate)cell.font={name:'Arial',size:10,bold:row===58};
     cell.alignment={...cell.alignment,wrapText:true,vertical:'middle'};ws.getRow(row).height=Math.max(ws.getRow(row).height||0,styleTemplate?Math.min(height,220):height);
   };
   ws.getCell('B30').value='№';
   ws.getCell('A74').value='5. Даты:';ws.getCell('D74').value='начала работ';ws.getCell('D75').value='окончания работ';
   set(30,3,blankSafe(`Ввод_работ!A${r}`),act.actNo||'',22);
   // Original form separates date into day (U), Russian genitive month (X), and year (AG).
   const setDate=(row,sourceCol,date)=>{
     const p=dateParts(date);const ref=`Ввод_работ!${sourceCol}${r}`;
     set(row,row===30?21:13,`IF(${ref}=\"\",\"\",RIGHT(${ref},2))`,p.day,12);
     set(row,row===30?24:16,`IF(${ref}=\"\",\"\",CHOOSE(VALUE(MID(${ref},6,2)),${MONTHS.map(m=>`\"${m}\"`).join(',')}))`,p.month,12);
     set(row,row===30?33:25,`IF(${ref}=\"\",\"\",LEFT(${ref},4))`,p.year,12);
   };
   setDate(30,'E',act.actDate);
   set(58,1,blankSafe(`Ввод_работ!B${r}`),act.work||'',compactHeight(act.work));
   set(61,1,`'Постоянные_поля'!B63`,`Шифр проекта: ${data.header.projectCode||''}`,24);
   ws.getCell('U61').value='разработан в';
   set(80,1,'A61',`Шифр проекта: ${data.header.projectCode||''}`,12);
   const docsRef=`Ввод_работ!H${r}`;
   const docsNeedRegister=(act.qualityDocs||'').length>180 || (act.qualityDocs||'').split('\n').filter(Boolean).length>5;
   const docsSummary=docsNeedRegister?`Согласно приложению «Реестр_качества» к акту №${act.actNo||''}`:(act.qualityDocs||'');
   const docsFormula=`IF(${docsRef}="","",IF(OR(LEN(${docsRef})>180,LEN(${docsRef})-LEN(SUBSTITUTE(${docsRef},CHAR(10),""))>=5),"Согласно приложению Реестр_качества к акту №"&Ввод_работ!A${r},${docsRef}))`;
   set(65,1,docsFormula,docsSummary,compactHeight(docsSummary));
   set(71,1,`IF(Ввод_работ!B${r}="","","Исполнительная схема № "&IF(Ввод_работ!F${r}="","ПРЕДЛАГАЕТСЯ ${suggestedSchemeNumber(i)}",Ввод_работ!F${r})&" "&IF(Ввод_работ!G${r}="",Ввод_работ!B${r},Ввод_работ!G${r}))`,isFilled(act.work)?`Исполнительная схема № ${act.schemeNo||`ПРЕДЛАГАЕТСЯ ${suggestedSchemeNumber(i)}`} ${act.schemeTitle||act.work}`:'',compactHeight(act.work,90));
   setDate(74,'C',act.start);
   setDate(75,'D',act.end);
   const next=data.acts[i+1]?.work||'';
   set(83,1,`IF(Ввод_работ!B${r+1}="","",Ввод_работ!B${r+1})`,next,compactHeight(next));
   ws.getRow(55).addPageBreak(); // original signed AOSR uses 2 pages, page 2 begins at row 56
   ws.headerFooter.oddFooter='&CЧЕРНОВИК — перед подписанием проверить все реквизиты и приложения';
   ws.pageSetup.printArea='A1:AJ109';
 }
 return true;
}
