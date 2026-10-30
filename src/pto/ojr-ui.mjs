// Optional Russian ОЖР→АОСР import UI; all source mapping remains user-controlled.
import {parseOjrCsv,readOjrXlsx,suggestOjrMapping,previewOjrImport,
  dateSuggestions,fillMissingActDates} from './ojr-import.mjs';
const byId=id=>document.getElementById(id);
const make=(tag,label,attrs={})=>{
  const e=document.createElement(tag);
  if(label!==null)e.textContent=label;
  for(const [key,value] of Object.entries(attrs))e.setAttribute(key,value);
  return e;
};
const MAP_LABELS={
  headerRow:'Строка заголовков',actNo:'Колонка № акта / кода',
  date:'Колонка даты',description:'Колонка описания работ',
  reference:'Колонка страницы / номера записи (0 — нет)',
};
export function mountOjrImport({getData,persist,afterCommit,download}){
  let sheets=null,checked=null,filename='';
  const panel=byId('pto-ojr-map-panel');
  const summary=byId('pto-ojr-preview-summary'),preview=byId('pto-ojr-source-preview');
  const cancel=()=>{sheets=null;checked=null;filename='';panel.hidden=true;summary.textContent='';
    byId('pto-ojr-confirm').disabled=true;};
  const current=()=>sheets?.[Number(byId('pto-ojr-sheet').value)]||null;
  const mapping=()=>Object.fromEntries([...panel.querySelectorAll('[data-ojr-map]')]
    .map(input=>[input.dataset.ojrMap,input.value]));
  const resetPreview=()=>{checked=null;byId('pto-ojr-confirm').disabled=true;
    summary.textContent='Изменены параметры импорта. Проверьте записи заново.';};

  const configure=()=>{
    const source=current();if(!source)return;
    const proposed=suggestOjrMapping(source.rows);
    const controls=byId('pto-ojr-map-controls');controls.replaceChildren();
    Object.entries(MAP_LABELS).forEach(([key,label])=>{
      const wrap=make('div',null),caption=make('label',label),input=make('input',null,{
        type:'number',min:key==='reference'?'0':'1',max:'1000',
        'data-ojr-map':key,'aria-label':label,
      });
      input.value=proposed[key]||0;
      input.addEventListener('input',resetPreview);
      wrap.append(caption,input);controls.appendChild(wrap);
    });
    preview.textContent=source.rows.slice(0,9).map((row,index)=>
      'Строка '+(index+1)+': '+row.slice(0,10).map((x,i)=>
        (i+1)+'='+String(x??'').slice(0,75)).join(' | ')).join('\n');
    checked=null;summary.textContent='Проверьте расположение колонок; источник: '+filename;
    byId('pto-ojr-confirm').disabled=true;
  };
  byId('pto-ojr-file').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      if(file.size>10*1024*1024)throw Error('Размер источника больше 10 МБ.');
      filename=file.name;
      if(/\.xlsx$/i.test(filename))sheets=await readOjrXlsx(await file.arrayBuffer());
      else if(/\.csv$/i.test(filename)){
        const bytes=await file.arrayBuffer();
        let csv=new TextDecoder('utf-8').decode(bytes);
        if(csv.includes('�'))csv=new TextDecoder('windows-1251').decode(bytes);
        sheets=[{name:'CSV',rows:parseOjrCsv(csv)}];
      }else throw Error('Поддерживаются только .csv и .xlsx.');
      if(!sheets.length)throw Error('В источнике нет листов.');
      panel.hidden=false;const select=byId('pto-ojr-sheet');select.replaceChildren();
      sheets.forEach((sheet,i)=>select.appendChild(make('option',sheet.name,{value:String(i)})));
      configure();
    }catch(err){cancel();alert('Ошибка чтения ОЖР: '+err.message);}
    finally{event.target.value='';}
  });

  byId('pto-ojr-sheet').addEventListener('change',configure);
  byId('pto-ojr-preview-btn').addEventListener('click',()=>{
    try{
      const source=current();if(!source)throw Error('Сначала выберите файл ОЖР.');
      checked=previewOjrImport(source.rows,mapping(),getData());
      const suggestions=dateSuggestions(getData(),checked.items);
      const details=checked.items.slice(0,12).map(x=>[x.actNo,x.date,x.description,x.reference].join(' · '));
      summary.textContent='К импорту: '+checked.items.length+
        ' записей; отклонено: '+checked.rejected.length+
        '. Предлагаемые интервалы: '+suggestions.map(s=>s.actNo+' '+s.first+'—'+s.last).join(', ')+
        '\nПринятые записи:\n'+details.join('\n')+
        '\nОтклонения:\n'+checked.rejected.slice(0,25).join('\n')+
        '\nСведения нужно сверить с подлинным ОЖР.';
      byId('pto-ojr-confirm').disabled=!checked.items.length;
    }catch(err){checked=null;byId('pto-ojr-confirm').disabled=true;
      summary.textContent='Ошибка проверки: '+err.message;}
  });
  byId('pto-ojr-confirm').addEventListener('click',()=>{
    if(!checked?.items.length)return;
    const dateFill=byId('pto-ojr-fill-blanks').checked;
    const dateText=dateFill?' и дополнить ТОЛЬКО пустые даты АОСР (предложение из строк ОЖР)':'';
    if(!confirm('Добавить '+checked.items.length+' записей ОЖР'+dateText+
      '? Оригинальный журнал и уже заполненные даты актов не изменяются.'))return;
    const data=getData();
    // Preview again against current records; disallow stale mappings or duplicate imports.
    let currentPreview;
    try{currentPreview=previewOjrImport(current().rows,mapping(),data);}
    catch(err){alert('Проверка устарела: '+err.message);return;}
    if(JSON.stringify(currentPreview.items)!==JSON.stringify(checked.items)){
      alert('Данные изменились. Повторите предпросмотр перед импортом.');resetPreview();return;
    }
    data.journal.push(...currentPreview.items);
    const changed=dateFill?fillMissingActDates(data,data.journal):[];
    persist();afterCommit();cancel();
    alert('Добавлено записей: '+currentPreview.items.length+
      '. Заполнено пустых полей дат: '+changed.length+'. Сверьте с оригиналом ОЖР.');
  });

  byId('pto-ojr-cancel').addEventListener('click',cancel);
  byId('pto-ojr-template').addEventListener('click',async()=>{
    const csv='\ufeff№ акта;Дата выполнения;Описание работ;Страница журнала\r\n'+
      '1.0;12.10.2026;Учебная запись по работам;ОЖР стр. 1\r\n'+
      '1.0;13.10.2026;Учебная запись по работам;ОЖР стр. 2\r\n';
    await download('ojr_import_example.csv',csv,'text/csv;charset=utf-8');
  });
  return {reset:cancel};
}
