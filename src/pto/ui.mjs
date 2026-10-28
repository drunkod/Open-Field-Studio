import { newWorkspace, safeWorkspace, validateWorkspace, generateDraftHtml, parseKs2Csv } from './domain.mjs';

const FIELDS = [
  ['actNo','№ акта','text'], ['work','Вид работ','text'], ['start','Начало','date'],
  ['end','Окончание','date'], ['actDate','Дата акта','date'],
  ['schemeNo','№ схемы','text'], ['qualityDocs','Материалы, сертификаты, паспорта','text'],
  ['measuredQty','Объём по схеме','text'], ['unit','Ед.','text'],
  ['ks2Id','Позиция КС-2','text'],
];
function el(tag, text, attrs = {}) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}
async function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  // Tauri desktop does not reliably handle object-URL browser downloads.
  // Use binary-safe writeFile (not writeTextFile, which corrupts XLSX).
  if ('__TAURI_INTERNALS__' in window && window.__tauriDialog?.save && window.__tauriFs?.writeFile) {
    const ext = filename.split('.').pop();
    const dest = await window.__tauriDialog.save({ defaultPath: filename,
      filters: [{name: ext.toUpperCase(), extensions: [ext]}] });
    if(!dest) return;
    await window.__tauriFs.writeFile(dest, new Uint8Array(await blob.arrayBuffer()));
    return;
  }
  const url = URL.createObjectURL(blob), link = el('a', null, { download: filename, href: url });
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
const UI = `
<style>
#pto-tab .pto-hint{color:var(--text-muted,#6b7280);font-size:.87rem;line-height:1.6}
#pto-tab .pto-table{overflow:auto;max-width:100%}
#pto-tab table{border-collapse:collapse;width:100%;font-size:.82rem}
#pto-tab th,#pto-tab td{border:1px solid var(--border-color,#d4d4d8);padding:.35rem}
#pto-tab th{background:var(--concrete,#f4f4f5);text-align:left;white-space:nowrap}
#pto-tab td input{min-width:90px;width:100%;padding:.44rem;border:1px solid var(--border-color,#a1a1aa);border-radius:4px;background:var(--card-bg,#fff);color:var(--text-primary,inherit)}
#pto-tab td input[data-col="work"]{min-width:250px}
#pto-tab td input[data-col="qualityDocs"]{min-width:310px}
#pto-tab td input[type="date"]{min-width:132px}
#pto-tab .pto-actions{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:1rem 0}
#pto-tab .pto-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:.75rem}
#pto-tab .pto-grid label{display:block;font-size:.8rem;font-weight:600;margin-bottom:3px}
#pto-tab .pto-grid input{width:100%;padding:.5rem;border:1px solid var(--border-color,#bbb);border-radius:5px;background:var(--card-bg,#fff);color:inherit}
#pto-tab .pto-summary{padding:12px;border-left:3px solid #b45309;background:var(--concrete,#f5f5f5);margin:12px 0;white-space:pre-wrap}
#pto-tab .pto-errors li{margin-bottom:5px}
#pto-tab .pto-error{color:#dc2626}#pto-tab .pto-warning{color:#b45309}#pto-tab .pto-info{color:var(--text-muted,#71717a)}
</style>
<div class="panel">
 <h2 data-i18n="nav_pto">АОСР · сверка с КС-2</h2>
 <p class="pto-hint">Экспериментальная локальная форма инженера ПТО: 15 актов, один набор реквизитов и отдельные позиции КС-2. Проверяется только согласованность введённых данных, не юридическое соответствие. Печатный вывод всегда «ЧЕРНОВИК».</p>
 <div id="pto-project-caption" class="pto-summary">Объект: не указан (укажите его на вкладке «Проект»).</div>
 <h3>Общие реквизиты (один раз для всех актов)</h3><div class="pto-grid" id="pto-header"></div>
 <div class="pto-actions">
   <button type="button" class="btn btn-secondary btn-sm" id="pto-sample">Загрузить вымышленный пример</button>
   <button type="button" class="btn btn-secondary btn-sm" id="pto-save-json">Сохранить JSON</button>
   <label class="btn btn-secondary btn-sm" for="pto-load-json">Загрузить JSON</label><input type="file" accept=".json,application/json" id="pto-load-json" style="display:none">
   <button type="button" class="btn btn-primary btn-sm" id="pto-export">Печатные черновики (HTML)</button>
   <button type="button" class="btn btn-primary btn-sm" id="pto-export-xlsx">Экспорт АОСР в Excel (.xlsx)</button>
   <label class="btn btn-secondary btn-sm" for="pto-import-xlsx">Загрузить книгу АОСР (.xlsx)</label><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" id="pto-import-xlsx" style="display:none">
 </div>
</div>
<div class="panel">
 <h3>Акты скрытых работ — 15 строк</h3>
 <p class="pto-hint">Название исполнительной схемы формируется из вида работ, если не указано отдельно. Единицы измерения для КС-2 и АОСР должны совпадать. Если одна позиция КС-2 относится к нескольким актам, укажите один и тот же ID позиции во всех строках.</p>
 <div class="pto-table"><table><thead><tr id="pto-act-head"></tr></thead><tbody id="pto-act-rows"></tbody></table></div>
</div>
<div class="panel">
 <h3>Позиции КС-2 (для сопоставления, не заверенные сведения)</h3>
 <p class="pto-hint">Импортируйте Excel (.xlsx) с просмотром сопоставления колонок или CSV с колонками «позиция;наименование;количество;ед.изм.» (разделитель «;»). Файлы .xls/.xlsx пока не поддерживаются — экспортируйте нужные позиции в CSV. Сопоставление подтверждает инженер, а не программа.</p>
 <div class="pto-actions">
   <label class="btn btn-secondary btn-sm" for="pto-ks2-file">Импорт КС-2 (CSV / XLSX)</label><input type="file" id="pto-ks2-file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none">
   <button type="button" class="btn btn-secondary btn-sm" id="pto-add-ks2">Добавить позицию вручную</button>
   <button type="button" class="btn btn-secondary btn-sm" id="pto-ks2-template">Скачать образец CSV</button>
 </div>
 <div class="pto-summary" id="pto-xlsx-map" style="display:none">
  <strong>Сопоставление столбцов КС-2</strong><p class="pto-hint">Проверьте, где находятся номер позиции, описание, количество и единица измерения. Включаются только корректные строки.</p>
  <div class="pto-grid" id="pto-mapping-controls"></div>
  <pre id="pto-xlsx-preview" style="white-space:pre-wrap;max-height:180px;overflow:auto"></pre>
  <button type="button" class="btn btn-primary btn-sm" id="pto-ks2-confirm">Применить сопоставление</button>
  <button type="button" class="btn btn-secondary btn-sm" id="pto-ks2-cancel">Отмена</button>
 </div>
 <div class="pto-table"><table><thead><tr><th>ID позиции</th><th>Наименование КС-2</th><th>Количество</th><th>Ед.</th><th></th></tr></thead><tbody id="pto-ks2-rows"></tbody></table></div>
</div>
<div class="panel">
 <h3>Результаты технической сверки</h3>
 <div class="pto-summary" id="pto-results" aria-live="polite"></div>
 <div class="pto-table"><table><thead><tr><th>Позиция КС-2</th><th>Описание</th><th>АОСР (сумма)</th><th>КС-2</th><th>Результат</th></tr></thead><tbody id="pto-groups"></tbody></table></div>
 <ul id="pto-issues" class="pto-errors"></ul>
 <p class="pto-hint">ОЖР, реальное исполнение, сроки действия сертификатов, подписи и актуальную форму документа необходимо проверять отдельно. Совпадение сумм — не заключение о соответствии требованиям законодательства.</p>
</div>`;
export function mountPtoWorkspace(app) {
  const nav = document.querySelector('.tab-strip');
  const main = document.querySelector('.main-content');
  if (!nav || !main || document.getElementById('pto-tab')) return;
  const navBtn = el('button', null, { type:'button', class:'nav-btn', 'data-tab':'pto' });
  const label = el('span', 'АОСР · КС-2', { 'data-i18n':'nav_pto' });
  navBtn.appendChild(label);
  nav.insertBefore(navBtn, nav.querySelector('[data-tab="export"]'));
  const section = el('section', null, { id:'pto-tab', class:'tab-content' });
  section.innerHTML = UI;
  main.appendChild(section);
  navBtn.addEventListener('click', () => { app.switchTab('pto'); showProject(); refreshDiagnostics(); });
  let data = safeWorkspace(app.ptoWorkspace || newWorkspace());
  const byId = id => document.getElementById(id);
  const persist = () => {
    app.ptoWorkspace = data;
    app.saveToLocalStorage();
  };
  const showProject = () => {
    const p = app.project || {};
    byId('pto-project-caption').textContent = `Объект: ${p.name || '[не заполнено]'}; заказчик: ${p.client || '[не заполнено]'}; адрес: ${[p.address,p.city].filter(Boolean).join(', ') || '[не заполнен]'}. Измените эти сведения на вкладке «Проект».`;
  };
  const headers = [
    ['contractor','Подрядчик'],['designer','Проектировщик'],
    ['projectCode','Шифр проекта'],['inspector','Инженер ПТО / стройконтроль'],
    ['customerRepresentative','Представитель заказчика'],
  ];
  const renderHeader = () => {
    const root = byId('pto-header'); root.replaceChildren();
    headers.forEach(([key, title]) => {
      const wrap = el('div'); const l = el('label', title, { for:`pto-h-${key}` });
      const input = el('input', null, { id:`pto-h-${key}`, value:data.header[key], autocomplete:'off' });
      input.addEventListener('input', () => { data.header[key] = input.value; persist(); });
      wrap.append(l, input); root.appendChild(wrap);
    });
  };
  const inputFor = (obj, field, type, aria, action) => {
    const input = el('input', null, { type, 'aria-label': aria, 'data-col': field });
    input.value = obj[field] ?? '';
    input.addEventListener('input', () => { obj[field] = input.value; persist(); refreshDiagnostics(); });
    if (action) input.addEventListener('change', action);
    return input;
  };
  const renderActs = () => {
    const head = byId('pto-act-head'); head.replaceChildren();
    FIELDS.forEach(([,title]) => head.appendChild(el('th',title)));
    const body = byId('pto-act-rows'); body.replaceChildren();
    data.acts.forEach((act,i) => {
      const tr=el('tr');
      FIELDS.forEach(([field,title,type]) => {
        const td=el('td');
        td.appendChild(inputFor(act,field,type,`Акт ${i+1}, ${title}`));
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  };
  const renderKs2 = () => {
    const body=byId('pto-ks2-rows'); body.replaceChildren();
    data.ks2.forEach((line,i) => {
      const tr=el('tr');
      [['id','ID'],['description','Наименование'],['qty','Количество'],['unit','Ед.']].forEach(([field,title])=>{
        const td=el('td'); td.appendChild(inputFor(line, field, 'text', `КС-2 ${i+1} ${title}`)); tr.appendChild(td);
      });
      const td=el('td'), button=el('button','Удалить',{type:'button',class:'btn btn-secondary btn-sm'});
      button.addEventListener('click',()=>{data.ks2.splice(i,1);persist();renderKs2();refreshDiagnostics();});
      td.appendChild(button);tr.appendChild(td);body.appendChild(tr);
    });
  };
  const refreshDiagnostics = () => {
    const checked = validateWorkspace(data);
    byId('pto-results').textContent = `Заполнено актов: ${checked.count} из 15 · ошибок: ${checked.errors} · предупреждений: ${checked.warnings}. Статус: ЧЕРНОВИК / требуется проверка инженера.`;
    const groups=byId('pto-groups');groups.replaceChildren();
    checked.groups.forEach(g=>{
      const tr=el('tr');
      [g.id,g.description,g.actual||'нет данных',`${g.expected} ${g.unit}`,{
        quantity_correlates:'Количество совпадает (не юридическое заключение)',
        difference:'Расхождение',unit_mismatch:'Разные единицы',unverified:'Недостаточно данных',
      }[g.status]].forEach(x=>tr.appendChild(el('td',x)));
      groups.appendChild(tr);
    });
    const list=byId('pto-issues');list.replaceChildren();
    checked.issues.forEach(entry=>{
      const location=entry.actIndex !== null ? `Акт ${entry.actIndex+1}. ` : '';
      list.appendChild(el('li',location+entry.message,{class:`pto-${entry.severity}`}));
    });
  };
  const rerender = () => {renderHeader();renderActs();renderKs2();showProject();refreshDiagnostics();};
  byId('pto-add-ks2').addEventListener('click',()=>{
    data.ks2.push({id:'',description:'',qty:'',unit:''});persist();renderKs2();refreshDiagnostics();
  });
  byId('pto-ks2-template').addEventListener('click',async()=>{
    await download('ks2_sample.csv','\ufeffпозиция;наименование;количество;ед.изм.\r\nКС2-01;Пример условных кровельных работ;12,5;м²\r\n','text/csv;charset=utf-8');
  });
  let ks2Workbook=null;
  const mappingFields=[['row','Строка заголовков'],['id','Колонка номера'],['description','Колонка наименования'],['qty','Колонка количества'],['unit','Колонка единицы']];
  const configureMapping=async()=>{
    const {suggestMapping}=await import('./xlsx.mjs');
    const ws=ks2Workbook.getWorksheet(byId('pto-map-sheet').value);
    const suggestion=suggestMapping(ws),root=byId('pto-mapping-controls');
    root.querySelectorAll('[data-map-field]').forEach(x=>{x.value=suggestion[x.dataset.mapField]||1;});
    byId('pto-xlsx-preview').textContent=Array.from({length:Math.min(ws.rowCount,12)},(_,i)=>{
      return `Строка ${i+1}: `+Array.from({length:Math.min(ws.columnCount,14)},(_,j)=>{
        const v=ws.getRow(i+1).getCell(j+1).value;
        return `${j+1}=${String(typeof v==='object'?(v?.text??v?.result??''):v??'').slice(0,60)}`;
      }).join(' | ');
    }).join('\n');
  };
  byId('pto-ks2-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>20*1024*1024)throw Error('Максимальный размер импортируемого файла — 20 МБ.');
      if(/\.xlsx$/i.test(file.name)){
        const {readWorkbook}=await import('./xlsx.mjs');
        ks2Workbook=await readWorkbook(await file.arrayBuffer());
        const root=byId('pto-mapping-controls');root.replaceChildren();
        const wrap=el('div'),selector=el('select',null,{id:'pto-map-sheet'});
        ks2Workbook.worksheets.forEach(ws=>selector.appendChild(el('option',ws.name,{value:ws.name})));
        wrap.appendChild(el('label','Лист КС-2'));wrap.appendChild(selector);root.appendChild(wrap);
        mappingFields.forEach(([key,label])=>{
          const box=el('div'),input=el('input',null,{type:'number',min:'1',max:'10000','data-map-field':key});
          box.appendChild(el('label',label));box.appendChild(input);root.appendChild(box);
        });
        selector.addEventListener('change',configureMapping);
        byId('pto-xlsx-map').style.display='block';await configureMapping();
      }else{
        const loaded=parseKs2Csv(await file.text());
        if(data.ks2.length&&!confirm('Заменить текущие позиции КС-2 на позиции из CSV?'))return;
        data.ks2=loaded;persist();renderKs2();refreshDiagnostics();
      }
    }catch(err){alert(`Ошибка импорта КС-2: ${err.message}`);}
    finally{e.target.value='';}
  });
  byId('pto-ks2-cancel').addEventListener('click',()=>{ks2Workbook=null;byId('pto-xlsx-map').style.display='none';});
  byId('pto-ks2-confirm').addEventListener('click',async()=>{
    if(!ks2Workbook)return;
    try{
      const {extractKs2}=await import('./xlsx.mjs');
      const mapping=Object.fromEntries([...byId('pto-mapping-controls').querySelectorAll('[data-map-field]')].map(x=>[x.dataset.mapField,x.value]));
      const result=extractKs2(ks2Workbook.getWorksheet(byId('pto-map-sheet').value),mapping);
      const warning=result.rejected.length?`\nПропущено строк: ${result.rejected.length}.\n${result.rejected.slice(0,12).join('\n')}`:'';
      if(!confirm(`Импортировать ${result.items.length} позиций КС-2? Текущий список будет заменён.${warning}`))return;
      data.ks2=result.items;persist();renderKs2();refreshDiagnostics();
      ks2Workbook=null;byId('pto-xlsx-map').style.display='none';
    }catch(err){alert(`Ошибка сопоставления: ${err.message}`);}
  });
  byId('pto-export-xlsx').addEventListener('click',async()=>{
    try{
      const {writeDraftXlsx}=await import('./xlsx.mjs');
      const bytes=await writeDraftXlsx(data,app.project||{});
      await download('aosr_ks2_drafts.xlsx',bytes,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }catch(err){alert(`Ошибка экспорта Excel: ${err.message}`);}
  });
  byId('pto-import-xlsx').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>20*1024*1024)throw Error('Максимальный размер импортируемого файла — 20 МБ.');
      const {importDraftXlsx}=await import('./xlsx.mjs');
      const incoming=await importDraftXlsx(await file.arrayBuffer());
      if(!confirm('Заменить АОСР и КС-2 сведениями из этой книги?'))return;
      data=incoming.data;
      Object.assign(app.project,incoming.project);
      app.loadProjectForm();persist();rerender();
    }catch(err){alert(`Ошибка загрузки Excel: ${err.message}`);}
    finally{e.target.value='';}
  });
  byId('pto-sample').addEventListener('click',async()=>{
    if(data.acts.some(x=>x.work)||data.ks2.length){if(!confirm('Заменить введённые данные вымышленным примером?'))return;}
    try{const result=await fetch('/pto-demo.json');if(!result.ok)throw Error('example unavailable');
      data=safeWorkspace(await result.json());
      // Fill only missing project fields: never overwrite an existing client's details.
      const demoProject={name:'Учебный объект (вымышленно)',number:'DEMO-2026',
        address:'Учебная улица, дом 1',city:'Примерный город',client:'Учебный заказчик'};
      for(const [k,v] of Object.entries(demoProject))if(!app.project[k])app.project[k]=v;
      app.loadProjectForm();persist();rerender();
    }catch(err){alert(`Не удалось загрузить пример: ${err.message}`);}
  });
  byId('pto-save-json').addEventListener('click',async()=>{
    await download('pto-aosr-ks2-draft.json',JSON.stringify(data,null,2),'application/json;charset=utf-8');
  });
  byId('pto-load-json').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const incoming=JSON.parse(await file.text());
      if(incoming.version!==1||!Array.isArray(incoming.acts))throw Error('Ожидается файл экспорта АОСР версии 1.');
      if(!confirm('Заменить текущую таблицу АОСР данными JSON?'))return;
      data=safeWorkspace(incoming);persist();rerender();
    }catch(err){alert(`Не удалось прочитать JSON: ${err.message}`);}
    finally{e.target.value='';}
  });
  byId('pto-export').addEventListener('click',async()=>{
    const html=generateDraftHtml(data,app.project);
    await download('aosr-ks2-drafts.html',html,'text/html;charset=utf-8');
  });
  rerender();
  // The parent app imports / clears its own JSON. Re-read the module state after those actions.
  window.addEventListener('pto-loaded', () => {
    data = safeWorkspace(app.ptoWorkspace || newWorkspace());
    rerender();
  });
  window.addEventListener('focus',showProject);
}
