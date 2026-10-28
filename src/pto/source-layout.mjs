// Reconstruct the user's own original-format AOSR *structure* from a private .xls
// imported locally. No source project/company data are bundled in this repository.
// BIFF8 reader exposes cell positions and text but NOT original merge/style records:
// spacing/merged regions are recreated for editing and printing, not asserted identical.
import {suggestedSchemeNumber,isFilled,safeWorkspace} from './domain.mjs';
const srcValue = (r,c=0) => String(r?.[c]??'');
const byRow = (ws,r)=>ws.getCell(`B${r+2}`);
const scalar = (value) => value || '';
export function appendOriginalLayout(wb,raw,project={}) {
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
 const workRows = data.acts.length;
 for(let i=0;i<workRows;i++){
   const act=data.acts[i],r=i+5;
   const ws=wb.addWorksheet(`Акт_${String(i+1).padStart(2,'0')}`);
   for(let c=1;c<=43;c++)ws.getColumn(c).width=2.7;
   ws.views=[{showGridLines:false}];
   ws.pageSetup={paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0};
   ws.pageMargins={left:0.45,right:0.45,top:0.45,bottom:0.45,header:0.15,footer:0.15};
   for(let j=0;j<source.length;j++){
     const row=source[j], index=j+1;
     const nonempty=row.map((v,c)=>[c+1,String(v??'')]).filter(([c,v])=>v.trim());
     if(!nonempty.length)continue;
     const line=ws.getRow(index);
     const single=nonempty.length===1;
     if(single && (nonempty[0][0]===1) && index!==30){
       try{ws.mergeCells(index,1,index,43);}catch(_){}
     }
     if(single && nonempty[0][0]===24 && index<3){
       try{ws.mergeCells(index,24,index,43);}catch(_){}
     }
     for(const [col,v] of nonempty){
       // Rows populated with variable content are re-bound to the central work table.
       if([30,58,61,65,66,71,74,75,83].includes(index))continue;
       const cell=ws.getCell(index,col);
       if(col===1){
         cell.value={formula:`'Постоянные_поля'!B${j+3}`,result:index===4?(project.name||v):v};
       }else cell.value=v;
       cell.font={name:'Arial',size:index===27?12:9,bold:index===27||index===28};
       cell.alignment={vertical:'middle',wrapText:col===1};
       if(/^\d+\. /.test(v)||/^(АКТ|освидетельствования скрытых работ)/i.test(v))cell.font={name:'Arial',size:10,bold:true};
     }
     line.height=single&&nonempty[0][0]===1?Math.max(15,Math.min(85,Math.ceil(nonempty[0][1].length/125)*13)):18;
   }
   // Override only known variable fields from the source AOSR structure.
   const set=(row,col,expr,value,height=24)=>{
     const cell=ws.getCell(row,col);cell.value={formula:expr,result:scalar(value)};
     cell.font={name:'Arial',size:10,bold:row===58};
     cell.alignment={wrapText:true,vertical:'middle'};ws.getRow(row).height=Math.max(ws.getRow(row).height||0,height);
   };
   ws.getCell('B30').value='№';
   ws.getCell('A74').value='5. Даты:';ws.getCell('D74').value='начала работ';ws.getCell('D75').value='окончания работ';
   set(30,3,`Ввод_работ!A${r}`,act.actNo||'',22);
   set(30,24,`Ввод_работ!E${r}`,act.actDate||'',22);
   set(58,1,`Ввод_работ!B${r}`,act.work||'',55);
   set(61,1,`'Постоянные_поля'!B63`,`Шифр проекта: ${data.header.projectCode||''}`,24);
   ws.getCell('U61').value='разработан в';
   set(65,1,`Ввод_работ!H${r}`,act.qualityDocs||'',Math.max(40,Math.min(340,Math.ceil((act.qualityDocs||'').length/105)*18)));
   set(71,1,`="Исполнительная схема № "&IF(Ввод_работ!F${r}="","ПРЕДЛАГАЕТСЯ ${suggestedSchemeNumber(i)}",Ввод_работ!F${r})&" "&IF(Ввод_работ!G${r}="",Ввод_работ!B${r},Ввод_работ!G${r})`,isFilled(act.work)?`Исполнительная схема № ${act.schemeNo||`ПРЕДЛАГАЕТСЯ ${suggestedSchemeNumber(i)}`} ${act.schemeTitle||act.work}`:'',50);
   set(74,12,`Ввод_работ!C${r}`,act.start||'',20);
   set(75,12,`Ввод_работ!D${r}`,act.end||'',20);
   const next=data.acts[i+1]?.work||'';
   set(83,1,`IF(Ввод_работ!B${r+1}="","",Ввод_работ!B${r+1})`,next,40);
   ws.getCell('A110').value='ЧЕРНОВИК — восстановленная сетка исходного АОСР. Оригинальные стили/объединения XLS не сохранены. Сверить печать.';
   ws.mergeCells('A110:AQ110');ws.getCell('A110').font={bold:true,color:{argb:'FFA94442'},size:9};ws.getRow(110).height=32;
   ws.printArea='A1:AQ110';
 }
 return true;
}
