// Compact Russian АОСР input; edits existing acts without changing workbook schema.
const fieldGroups=[
  ['Работа',[['work','Вид выполненных работ','text']]],
  ['Даты',[['start','Начало работ','date'],['end','Окончание работ','date'],['actDate','Дата составления акта','date']]],
  ['Исполнительная схема и материалы',[
    ['schemeNo','№ схемы (подтверждённый)','text'],
    ['qualityDocs','Паспорта, сертификаты и документы качества','text'],
  ]],
];
const node=(tag,content,attrs={})=>{
  const el=document.createElement(tag);
  if(content!==null)el.textContent=content;
  for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);
  return el;
};
export function mountQuickEntry({root,getActs,onEdit}){
  let expanded=0;
  const render=()=>{
    root.replaceChildren();
    getActs().forEach((act,index)=>{
      const details=node('details',null,{class:'pto-quick-card'});
      details.open=index===expanded;
      const caption=()=>`${act.actNo||'Акт '+(index+1)} — ${act.work||'работа не указана'}`;
      const summary=node('summary',caption());
      details.appendChild(summary);
      const grid=node('div',null,{class:'pto-quick-fields'});
      fieldGroups.forEach(([title,fields])=>{
        const group=node('div',null,{class:'pto-quick-group'});
        const set=node('fieldset',null);
        set.appendChild(node('legend',title));
        fields.forEach(([key,label,type])=>{
          const field=node('label',label);
          const input=(key==='work'||key==='qualityDocs')
            ?node('textarea',null,{rows:key==='qualityDocs'?'3':'2'})
            :node('input',null,{type});
          input.dataset.field=key;
          input.setAttribute('aria-label',`Акт ${index+1}, ${label}`);
          input.value=act[key]??'';
          input.addEventListener('input',()=>{
            act[key]=input.value;
            if(key==='work')summary.textContent=caption();
            onEdit();
          });
          field.appendChild(input);set.appendChild(field);
          if(key==='schemeNo')set.appendChild(node('small',
            `Предложение: ИС-${String(index+1).padStart(2,'0')} (НЕ подтверждено; не подставляется автоматически)`));
        });
        group.appendChild(set);grid.appendChild(group);
      });
      details.appendChild(grid);
      details.addEventListener('toggle',()=>{if(details.open)expanded=index;});
      root.appendChild(details);
    });
  };
  render();
  return {render};
}
