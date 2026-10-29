// Legacy АОСР import. Read-only bridge for Russian BIFF8 (Excel .xls) workbooks.
// The 'Шапка' and 'Табл' layout matches the historical PTO workbook; it is
// unrelated to KS-2 and must never be interpreted as a KS-2 estimate.
import { newWorkspace, safeWorkspace } from './domain.mjs';

const months = {
  января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6,
  июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12,
};
const text = value => value === null || value === undefined ? '' : String(value).trim();
const cell = (sheet, rowIndex, column = 0) => text(sheet?.rows?.[rowIndex]?.[column]);
function dateFromCells(row) {
  if (!row) return '';
  const day = Number(text(row[1]));
  const month = months[text(row[2]).toLowerCase()];
  const year = Number(text(row[3]));
  if (!Number.isInteger(day) || !month || !Number.isInteger(year)) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1 || date.getUTCFullYear() !== year) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
export function extractLegacyAosr(sheetCollection) {
  const sheets = Array.isArray(sheetCollection) ? sheetCollection : sheetCollection?.sheets;
  const details = sheets?.find(x => x.name === 'Шапка');
  const input = sheets?.find(x => x.name === 'Табл');
  if (!details || !input) {
    throw Error('Ожидались листы «Шапка» и «Табл»: это не исходный формат АОСР ПТО.');
  }
  const candidates = input.rows.map((row, index) => ({ row, index, id: text(row?.[0]) }))
    .filter(x => /^\d+\.\d+$/.test(x.id));
  if (!candidates.length) throw Error('На листе «Табл» не найдены номера актов вида 1.0, 1.1 и т. д.');
  if (candidates.length > 15) throw Error('Найдено более 15 актов. Их нужно разделить на отдельные комплекты.');
  const data = newWorkspace();
  const actForm = sheets.find(x => /^\d+\.\d+$/.test(x.name));
  if (actForm) data.legacyLayout = {rows: actForm.rows.map(r => Array.from({length:43},(_,i)=>text(r?.[i])))};
  const warnings = [];
  const project = {
    name: cell(details, 1), // full official project designation; does not infer a separate address
    number: '', address: '', city: '',
    client: cell(details, 5), // 'Застройщик / техзаказчик' in the supplied template
  };
  data.header.contractor = cell(details, 13);
  data.header.designer = cell(details, 18);
  data.header.inspector = cell(details, 40);
  data.header.customerRepresentative = cell(details, 29);
  data.header.projectCode = cell(details, 60).replace(/^\s*Шифр\s+проекта\s*:\s*/i, '');
  candidates.forEach((source, i) => {
    const next = i + 1 < candidates.length ? candidates[i + 1].index : input.rows.length;
    const row = source.row || [];
    const sourceAct=sheets.find(sh=>sh.name===source.id);
    const actDateCells=sourceAct?.rows?.[29]||[];
    const sourcedDate=dateFromCells([null,actDateCells[20],actDateCells[23],actDateCells[32]]);
    const drawingLine=sourceAct?.rows?.map(r=>text(r?.[0])).find(v=>/Исполнительная схема\s*№/i.test(v))||'';
    const sourcedScheme=(/Исполнительная схема\s*№\s*([0-9]+(?:\.[0-9]+)*)/i.exec(drawingLine)||[])[1]||'';
    const description = [text(row[4]), text(row[5])].filter(Boolean).join(' ');
    const docs = [];
    for (let j = source.index; j < next; j++) {
      const r = input.rows[j] || [];
      if (j > source.index && text(r[5])) docs.push(text(r[5]));
      if (text(r[6])) docs.push(text(r[6]));
    }
    // The second row in each source act carries the work completion date.
    const datesRow = input.rows[source.index + 1];
    data.acts[i] = {
      ...data.acts[i], actNo: source.id, work: description,
      start: dateFromCells(row), end: dateFromCells(datesRow),
      actDate: sourcedDate, // independently read from the dated source act itself
      schemeNo: sourcedScheme, // only from the real cited scheme label in the act
      schemeTitle: '', // dynamically follows work unless explicitly overridden
      qualityDocs: [...new Set(docs)].join('\n'),
      measuredQty: '', unit: '', ks2Id: '', // no measured quantities or KS-2 in this source
      notes: 'Перенесено из исходного АОСР .xls; данные требуют проверки.',
    };
    if (!data.acts[i].start || !data.acts[i].end) warnings.push(`Акт ${source.id}: даты работ не распознаны.`);
    if (!description) warnings.push(`Акт ${source.id}: отсутствует вид работ.`);
  });
  if (!project.name) warnings.push('Название объекта не найдено на листе «Шапка».');
  warnings.push('В исходном файле отсутствует отдельная таблица КС-2; сопоставление объёмов требует загрузки КС-2 и проверки инженером.');
  warnings.push('Даты актов и номера схем извлечены только там, где указаны в исходных листах актов; подлинность подписей, фактические объёмы и КС-2 требуется проверить отдельно.');
  return { data: safeWorkspace(data), project, count: candidates.length, warnings };
}
export async function importLegacyAosr(bytes) {
  const { readXls } = await import('xls-reader');
  try { return extractLegacyAosr(readXls(bytes)); }
  catch (e) { throw Error(`Не удалось прочитать исходный АОСР: ${e.message}`); }
}
