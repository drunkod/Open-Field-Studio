// Domain logic intentionally independent of DOM, Tauri and locale.
// A matched KS-2 line is evidence of quantity correlation, NOT legal compliance.
export const SLOT_COUNT = 15;
export const suggestedSchemeNumber = index => `ИС-${String(index+1).padStart(2, '0')}`;
const MAX_MICRO = 1000000000000000n;
export const isFilled = value => String(value ?? '').trim() !== '';
export function newWorkspace() {
  return {
    version: 1,
    header: { contractor: '', designer: '', projectCode: '', inspector: '', customerRepresentative: '' },
    acts: Array.from({ length: SLOT_COUNT }, (_, i) => ({
      actNo: `1.${i}`, work: '', start: '', end: '', actDate: '',
      schemeNo: '', schemeTitle: '', qualityDocs: '', measuredQty: '',
      unit: '', ks2Id: '', notes: '',
    })),
    ks2: [], legacyLayout: null,
  };
}
export function safeWorkspace(value) {
  const empty = newWorkspace();
  if (!value || typeof value !== 'object' || value.version !== 1) return empty;
  const keys = Object.keys(empty.acts[0]);
  const clean = input => Object.fromEntries(keys.map(k => [k, String(input?.[k] ?? '').slice(0, 15000)]));
  return {
    version: 1,
    header: Object.fromEntries(Object.keys(empty.header).map(k => [k, String(value.header?.[k] ?? '').slice(0, 1000)])),
    acts: Array.from({ length: SLOT_COUNT }, (_, i) => clean(value.acts?.[i] || empty.acts[i])),
    legacyLayout: value.legacyLayout && Array.isArray(value.legacyLayout.rows) ? {
      rows: value.legacyLayout.rows.slice(0,140).map(r => Array.from({length:43}, (_,i)=>String(r?.[i]??'').slice(0,15000)))
    } : null,
    ks2: Array.isArray(value.ks2) ? value.ks2.slice(0, 2000).map(k => ({
      id: String(k.id ?? '').trim().slice(0, 100),
      description: String(k.description ?? '').slice(0, 1000),
      qty: String(k.qty ?? '').slice(0, 100),
      unit: String(k.unit ?? '').slice(0, 50),
    })) : [],
  };
}
export function unitKey(raw) {
  return String(raw ?? '').trim().toLowerCase().replace(/\s/g, '')
    .replace(/²|\^2/g, '2').replace(/³|\^3/g, '3')
    .replace(/^м2$/, 'м2').replace(/^m2$/, 'м2')
    .replace(/^м3$/, 'м3').replace(/^m3$/, 'м3')
    .replace(/^шт\.?$/, 'шт').replace(/^pcs\.?$/, 'шт')
    .replace(/^м$/, 'м').replace(/^m$/, 'м');
}
// Exact micro-unit conversion avoids floating-point addition in grouped acts.
// Max six fractional digits (no implicit unit conversions).
export function toMicro(input) {
  if (!isFilled(input)) return null;
  const s = String(input).replace(/[\u00a0\u202f\s]/g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{1,6})?$/.test(s)) return null;
  const [whole, fraction = ''] = s.split('.');
  const number = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
  if (number > MAX_MICRO) return null;
  return number;
}
export function microString(amount) {
  return (Number(amount) / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 6 });
}
export function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d));
  return x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d;
}
const issue = (code, severity, message, actIndex = null, ks2Id = null) =>
  ({ code, severity, message, actIndex, ks2Id });
export function validateWorkspace(raw) {
  const data = safeWorkspace(raw);
  const issues = [];
  const active = data.acts.map((act, index) => ({ act, index })).filter(({ act }) => isFilled(act.work));
  const numbers = new Map();
  const grouped = new Map();
  const ks2Ids = new Map();
  data.ks2.forEach((line, index) => {
    if (!line.id) issues.push(issue('ks2_missing_id', 'error', `Позиция КС-2 №${index + 1}: отсутствует идентификатор.`));
    if (ks2Ids.has(line.id)) issues.push(issue('ks2_duplicate', 'error', `Повтор идентификатора позиции КС-2: ${line.id}.`, null, line.id));
    ks2Ids.set(line.id, line);
    if (toMicro(line.qty) === null) issues.push(issue('ks2_bad_qty', 'error', `Позиция КС-2 ${line.id}: проверьте количество.`, null, line.id));
    if (!unitKey(line.unit)) issues.push(issue('ks2_missing_unit', 'error', `Позиция КС-2 ${line.id}: нет единицы измерения.`, null, line.id));
  });
  active.forEach(({ act: a, index: i }) => {
    if (!isFilled(a.actNo)) issues.push(issue('missing_number', 'error', 'Не указан номер акта.', i));
    else if (numbers.has(a.actNo)) issues.push(issue('duplicate_act', 'error', `Повторяется номер акта ${a.actNo}.`, i));
    else numbers.set(a.actNo, i);
    if (!validDate(a.start) || !validDate(a.end)) issues.push(issue('missing_dates', 'warning', 'Нет корректных дат начала и окончания работ.', i));
    else if (a.start > a.end) issues.push(issue('reversed_dates', 'error', 'Начало работ позже их окончания.', i));
    if (!validDate(a.actDate)) issues.push(issue('missing_act_date', 'warning', 'Дата акта не введена.', i));
    else if (validDate(a.end) && a.actDate < a.end) issues.push(issue('early_act_date', 'warning', 'Дата акта раньше окончания работ: требуется ручная проверка.', i));
    if (!isFilled(a.schemeNo)) issues.push(issue('missing_scheme', 'warning', 'Не указан подтверждённый номер исполнительной схемы.', i));
    if (!isFilled(a.qualityDocs)) issues.push(issue('missing_documents', 'warning', 'Документы качества или отметка «не применяются» не указаны.', i));
    if (toMicro(a.measuredQty) === null) issues.push(issue('missing_quantity', 'warning', 'Не введён действительный фактический объём по схеме.', i));
    if (!unitKey(a.unit)) issues.push(issue('missing_unit', 'warning', 'Нет единицы измерения фактического объёма.', i));
    if (!isFilled(a.ks2Id)) issues.push(issue('missing_ks2_link', 'warning', 'Нет ссылки на позицию КС-2 (допустимо при иной детализации, требует решения инженера).', i));
    else {
      if (!ks2Ids.has(a.ks2Id)) issues.push(issue('unknown_ks2_link', 'error', `Нет позиции КС-2 с ID «${a.ks2Id}».`, i, a.ks2Id));
      if (!grouped.has(a.ks2Id)) grouped.set(a.ks2Id, []);
      grouped.get(a.ks2Id).push({ act: a, index: i });
    }
  });
  const groups = [];
  for (const [id, acts] of grouped) {
    const line = ks2Ids.get(id);
    if (!line) continue;
    const units = acts.map(({ act }) => unitKey(act.unit));
    const expectedUnit = unitKey(line.unit);
    const mismatch = units.some(u => !u || u !== expectedUnit);
    const volumes = acts.map(({ act }) => toMicro(act.measuredQty));
    let status = 'unverified';
    if (mismatch) {
      status = 'unit_mismatch';
      issues.push(issue('unit_mismatch', 'error', `Позиция КС-2 ${id}: единицы измерения актов отличаются от КС-2.`, null, id));
    } else if (volumes.some(v => v === null) || toMicro(line.qty) === null) {
      issues.push(issue('incomplete_group', 'warning', `Позиция КС-2 ${id}: недостающие или ошибочные объёмы.`, null, id));
    } else {
      const total = volumes.reduce((sum, v) => sum + v, 0n);
      const delta = total > toMicro(line.qty) ? total - toMicro(line.qty) : toMicro(line.qty) - total;
      if (delta > 1000n) {
        status = 'difference';
        issues.push(issue('qty_difference', 'warning', `Позиция КС-2 ${id}: сумма объёмов АОСР ${microString(total)} ${line.unit}, в КС-2 ${line.qty} ${line.unit}. Сверить с инженером и сметчиком.`, null, id));
      } else status = 'quantity_correlates';
    }
    const total = volumes.every(v => v !== null) ? volumes.reduce((a, v) => a + v, 0n) : null;
    groups.push({ id, description: line.description, unit: line.unit, expected: line.qty, actual: total === null ? '' : microString(total), actCount: acts.length, status });
  }
  data.ks2.filter(line => !grouped.has(line.id)).forEach(line => issues.push(issue('unlinked_ks2', 'info', `Позиция КС-2 ${line.id} не связана с актами.`, null, line.id)));
  return { issues, groups, count: active.length, errors: issues.filter(x => x.severity === 'error').length, warnings: issues.filter(x => x.severity === 'warning').length };
}
function detectDelimiter(line) { return (line.match(/;/g) || []).length > (line.match(/,/g) || []).length ? ';' : ','; }
export function parseCsv(text) {
  const source = String(text).replace(/^\ufeff/, '');
  const delimiter = detectDelimiter(source.split(/\r?\n/)[0] || '');
  const rows = [], row = [];
  let field = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === delimiter && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(field); if (row.some(isFilled)) rows.push(row.splice(0)); else row.length = 0; field = '';
    } else field += c;
  }
  if (quoted) throw new Error('Ошибка CSV: незакрытая кавычка.');
  row.push(field); if (row.some(isFilled)) rows.push(row);
  return rows;
}
const aliases = {
  id: ['id', 'position', 'позиция', 'код', 'номер', '№', '№ п/п', 'поз.', 'поз'],
  description: ['description', 'наименование', 'наименование работ и затрат', 'работа', 'вид работ', 'описание'],
  qty: ['quantity', 'qty', 'количество', 'кол-во', 'объём', 'объем'],
  unit: ['unit', 'единица', 'ед.', 'ед.изм.', 'ед. изм.', 'ед.изм', 'ед изм'],
};
export function parseKs2Csv(csv) {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error('CSV не содержит строк КС-2.');
  const heads = rows[0].map(x => x.toLowerCase().trim());
  const columns = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, heads.findIndex(h => names.includes(h))]));
  if (Object.values(columns).some(i => i < 0)) throw new Error('Нужны заголовки: позиция; наименование; количество; ед.изм.');
  const seen = new Set();
  return rows.slice(1).map((r, i) => {
    const line = Object.fromEntries(Object.entries(columns).map(([key, j]) => [key, String(r[j] ?? '').trim()]));
    if (!line.id || seen.has(line.id)) throw new Error(`Строка ${i + 2}: пустой или повторный ID КС-2.`);
    if (toMicro(line.qty) === null) throw new Error(`Строка ${i + 2}: неверное количество.`);
    if (!unitKey(line.unit)) throw new Error(`Строка ${i + 2}: нет единицы измерения.`);
    seen.add(line.id);
    return line;
  });
}
export const htmlEscape = input => String(input ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function generateDraftHtml(input, project = {}) {
  const data = safeWorkspace(input), check = validateWorkspace(data), esc = htmlEscape;
  const projectTitle = project.name || '[заполнить объект]';
  const active = data.acts.filter(act => isFilled(act.work));
  const page = act => {
    const messages = check.issues.filter(x => x.actIndex === data.acts.indexOf(act));
    return `<article class="act"><h1>ЧЕРНОВИК — Акт освидетельствования скрытых работ № ${esc(act.actNo)}</h1>
      <p><strong>Объект:</strong> ${esc(projectTitle)} — ${esc(project.address)} ${esc(project.city)}</p>
      <p><strong>Заказчик:</strong> ${esc(project.client)} · <strong>Подрядчик:</strong> ${esc(data.header.contractor)}</p>
      <p><strong>Проектировщик:</strong> ${esc(data.header.designer)} · <strong>Проект:</strong> ${esc(data.header.projectCode)}</p>
      <p><strong>Дата акта:</strong> ${esc(act.actDate)}</p>
      <h2>Предъявленные работы</h2><p>${esc(act.work)}</p>
      <p><strong>Срок выполнения:</strong> ${esc(act.start)} — ${esc(act.end)}</p>
      <p><strong>Исполнительная схема:</strong> ${esc(act.schemeNo)} — ${esc(act.schemeTitle || act.work)}</p>
      <p><strong>Материалы и документы качества:</strong> ${esc(act.qualityDocs)}</p>
      <p><strong>Фактический объём:</strong> ${esc(act.measuredQty)} ${esc(act.unit)} · <strong>Позиция КС-2:</strong> ${esc(act.ks2Id)}</p>
      <h2>Предварительная проверка</h2><p>${messages.length ? messages.map(x => esc(x.message)).join('; ') : 'В строке акта не обнаружено замечаний по доступным полям. Нормативная проверка не проводилась.'}</p>
      <p class="signature">Представитель заказчика: _____________________ · Представитель исполнителя: _____________________</p>
      <footer>ЧЕРНОВИК. Не является подписанным или утверждённым актом. Проверить форму, ОЖР, схему, материалы и КС-2.</footer></article>`;
  };
  const grid = check.groups.map(g => `<tr><td>${esc(g.id)}</td><td>${esc(g.description)}</td><td>${esc(g.actual)}</td><td>${esc(g.expected)} ${esc(g.unit)}</td><td>${esc(g.status)}</td></tr>`).join('');
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Черновики АОСР</title>
    <style>body{font:14px/1.5 Arial,sans-serif;color:#172b3a;max-width:920px;margin:auto;padding:20px}h1{font-size:19px}h2{font-size:15px;border-bottom:1px solid #aaa}p{white-space:pre-wrap}article.act{padding:16px 0;page-break-after:always;break-after:page}article.act:last-of-type{page-break-after:auto;break-after:auto}footer{margin-top:35px;border-top:1px solid #aaa;font-size:11px;color:#777}.signature{margin-top:30px}table{border-collapse:collapse;width:100%}th,td{padding:7px;border:1px solid #bbb;text-align:left}@page{size:A4;margin:15mm}@media print{body{padding:0}}</style>
    </head><body><h1>Реестр сверки АОСР с КС-2 (черновик)</h1><p>${esc(projectTitle)}; ${check.count} заполненных актов; замечаний: ${check.errors} ошибок, ${check.warnings} предупреждений.</p>
    <table><thead><tr><th>Позиция КС-2</th><th>Описание</th><th>Объём АОСР</th><th>КС-2</th><th>Итог</th></tr></thead><tbody>${grid}</tbody></table>
    <p>Совпадение цифр не означает приемку работ или соблюдение российских строительных нормативов.</p>
    ${active.map(page).join('')}</body></html>`;
}
