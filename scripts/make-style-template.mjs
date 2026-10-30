// Local-only construction of a public, style-only template from an authorized source.
// Usage: node scripts/make-style-template.mjs /private/source.xlsx public/pto-aosr-style.xlsx
// The output workbook contains no source values, formulas, hyperlinks, comments or metadata.
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';
const [sourcePath,outPath]=process.argv.slice(2);
if(!sourcePath||!outPath)throw Error('Usage: node scripts/make-style-template.mjs SOURCE.xlsx OUTPUT.xlsx');
const raw=new ExcelJS.Workbook();await raw.xlsx.load(await fs.readFile(sourcePath));
const source=raw.getWorksheet('1.0');if(!source)throw Error('Expected source act sheet 1.0');
const blank=new ExcelJS.Workbook();blank.creator='OFS style-only Russian AOSR template';blank.subject='Blank typography, layout and merge positions only';
const ws=blank.addWorksheet('Акт_образец');
for(let c=1;c<=43;c++){
 const from=source.getColumn(c),to=ws.getColumn(c);
 to.width=from.width;to.hidden=from.hidden;to.outlineLevel=from.outlineLevel;
}
for(let r=1;r<=110;r++){
 const original=source.getRow(r),target=ws.getRow(r);
 target.height=original.height;target.hidden=original.hidden;
 for(let c=1;c<=43;c++){
   const cell=original.getCell(c);
   if(Object.keys(cell.style||{}).length){target.getCell(c).style=JSON.parse(JSON.stringify(cell.style));target.getCell(c).value='';}
 }
}
for(const m of Object.values(source._merges)){
 const v=m.model;
 if(v.bottom<=110&&v.right<=43)ws.mergeCells(v.top,v.left,v.bottom,v.right);
}
ws.pageSetup={...source.pageSetup,paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,printArea:'A1:AJ109'};
ws.views=[{showGridLines:false}];ws.printArea='A1:AQ110';
await fs.writeFile(outPath,Buffer.from(await blank.xlsx.writeBuffer()));
// Scrub-sensitive verification: every value and formula must be empty, including merged cells.
const verify=new ExcelJS.Workbook();await verify.xlsx.load(await fs.readFile(outPath));
const check=verify.getWorksheet('Акт_образец');let nonempty=0,styled=0;
check.eachRow({includeEmpty:true},row=>row.eachCell({includeEmpty:true},cell=>{
 if(cell.value!==null&&cell.value!==undefined&&cell.value!=='')nonempty++;
 if(Object.keys(cell.style||{}).length)styled++;
}));
if(nonempty)throw Error('Sanitization failure: output template contains values!');
console.log(JSON.stringify({sheets:verify.worksheets.length,styledCells:styled,mergedRanges:Object.keys(check._merges).length,nonemptyCells:nonempty,sourceFileExcluded:true,bytes:(await fs.stat(outPath)).size}));
