// Load a sanitized (zero data/formulas) typography-only copy of the authorized AOSR.
// No original customer/company values are distributed with the application.
import ExcelJS from 'exceljs';
let cached;
export async function loadAosrStyleTemplate() {
  if (!cached) cached = (async () => {
    let bytes;
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      const response = await fetch('/pto-aosr-style.xlsx');
      if (!response.ok) throw Error('Не удалось загрузить локальный макет АОСР.');
      bytes = await response.arrayBuffer();
    } else {
      const { readFile } = await import('node:fs/promises');
      bytes = await readFile(new URL('../../public/pto-aosr-style.xlsx', import.meta.url));
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    const sheet = workbook.getWorksheet('Акт_образец');
    if (!sheet || Object.keys(sheet._merges).length < 100) throw Error('Повреждён макет печатной формы АОСР.');
    return sheet;
  })();
  return cached;
}
export function applyStyledLayout(target, source) {
  for (let col=1;col<=43;col++) {
    target.getColumn(col).width=source.getColumn(col).width;
    target.getColumn(col).hidden=source.getColumn(col).hidden;
  }
  for (let row=1;row<=110;row++) {
    target.getRow(row).height=source.getRow(row).height;
    for (let col=1;col<=43;col++) {
      const cell=source.getRow(row).getCell(col),out=target.getRow(row).getCell(col);
      if (Object.keys(cell.style||{}).length) out.style=JSON.parse(JSON.stringify(cell.style));
    }
  }
  for (const merge of Object.values(source._merges)) {
    const v=merge.model;
    if(v.right<=43 && v.bottom<=110)target.mergeCells(v.top,v.left,v.bottom,v.right);
  }
  target.views=[{showGridLines:false}];
  target.pageSetup={...source.pageSetup,paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,printArea:'A1:AJ109'};
}
