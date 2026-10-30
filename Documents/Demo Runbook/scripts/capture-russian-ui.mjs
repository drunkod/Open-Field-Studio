// Reproducible screenshots of the running Russian UI. Synthetic data ONLY.
// Run from repo root: node 'Documents/Demo Runbook/scripts/capture-russian-ui.mjs'
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const dest=path.resolve('Documents/Demo Runbook/screenshots');
await fs.mkdir(dest,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1512,height:960},deviceScaleFactor:1,acceptDownloads:true});
const errors=[],screens=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('dialog',async dialog=>dialog.accept());
await page.addInitScript(()=>{localStorage.setItem('ofs_lang','ru');localStorage.removeItem('openFieldStudio');});
await page.goto('http://127.0.0.1:3042/',{waitUntil:'domcontentloaded'});
await page.locator('[data-tab="pto"]').waitFor();
if(await page.locator('html').getAttribute('lang')!=='ru')throw Error('RU locale not selected');
const snap=async(code,title,selector=null)=>{
  const filename=code+'.png',target=selector?page.locator(selector):page;
  await target.screenshot({path:path.join(dest,filename),fullPage:!selector,animations:'disabled',timeout:45000});
  const titleText=await page.locator('.nav-btn.active').innerText().catch(()=>'');
  const headers=await page.locator('.tab-content.active h2, .tab-content.active h3').allInnerTexts();
  const actions=(await page.locator('.tab-content.active button:visible').allInnerTexts()).map(x=>x.trim()).filter(Boolean);
  screens.push({file:filename,description:title,tab:titleText,headings:headers.slice(0,30),actions:actions.slice(0,42)});
  process.stdout.write('SCREENSHOT '+filename+' '+title+'\n');
};
await page.evaluate(()=>{
 const a=window.app;
 Object.assign(a.project,{name:'Учебный объект «Кровля-А»',number:'DEMO-PTO-2026-01',
    client:'АО «Пример-Заказчик» (вымышленно)',address:'Учебный проспект, 10',
    city:'Примерный город',description:'Демонстрация исполнительной документации кровли'});
 a.loadProjectForm();a.saveToLocalStorage();
});
await page.locator('[data-tab="pto"]').click();
await page.locator('#pto-sample').click();
await page.locator('#pto-results').waitFor();
const tabs=[['01','project','Проект и общие реквизиты'],
 ['02','plattegrond','Чертежи и загрузка планов'],['03','ifc','3D BIM и загрузка IFC'],
 ['04','opname','Обследование и замечания'],['05','inspectie','Инспекции и шаблоны'],
 ['06','oplevering','Сдача объекта'],['07','dashboard','Панель управления'],
 ['08','export','Экспорт и резервные копии'],['09','koppelingen','Интеграции'],
 ['10','handleiding','Справка'],['11','pto','АОСР и КС-2']];
for(const [n,id,title] of tabs){
 await page.locator('[data-tab="'+id+'"]').click();
 await page.waitForTimeout(180);
 await snap(n+'-'+id,title,id==='pto'?'#pto-tab':null);
}

// Russian market remediation: capture the official manual registry guidance and the connector caveat.
await page.locator('[data-tab="project"]').click();
await snap('31-project-fias-ru','Российская проверка адреса: ручная справка ФИАС / ГАР','#project-tab');
await page.locator('[data-tab="koppelingen"]').click();
await snap('32-connectors-ru-warning','Российское предупреждение об иностранных интеграциях','#koppelingen-tab');
await page.locator('[data-tab="pto"]').click();
await snap('12-pto-acts','АОСР: краткий ввод и 15 актов','#pto-tab > .panel:nth-of-type(2)');
await snap('34-pto-quick-act','Краткий ввод: работа, даты, схема и паспорта','#pto-quick-acts details:first-child');
await page.locator('#pto-full-mode').click();
await snap('33-pto-full-acts','Подробный ввод: все графы АОСР','#pto-tab > .panel:nth-of-type(2)');
await page.locator('#pto-quick-mode').click();
await snap('13-pto-ks2','КС-2: позиции и количества','#pto-tab > .panel:nth-of-type(3)');
await snap('14-pto-validation','Контроль расхождений и предупреждения','#pto-tab > .panel:nth-of-type(4)');
await page.locator('#pto-evidence-kind').selectOption('passport');
await page.locator('#pto-evidence-file').setInputFiles({
 name:'Паспорт_мембраны_ДЕМО.pdf',mimeType:'application/pdf',
 buffer:Buffer.from('%PDF-1.4\nSynthetic construction certificate DEMO ONLY\n')
});
await page.locator('#pto-evidence-rows tr').first().waitFor();
await snap('15-pto-evidence','Файловые вложения, SHA-256 и редакции','#pto-evidence-vault');
const journalCSV='№ акта;Дата выполнения;Описание работ;Страница журнала\r\n'+
 '1.0;01.10.2026;Гидроизоляция кровли, зона А (демо);ОЖР, стр. 3\r\n'+
 '1.0;02.10.2026;Завершение работ по кровле, зона А;ОЖР, стр. 4\r\n'+
 '1.99;03.10.2026;Несуществующий акт;ОЖР, стр. 5\r\n';
await fs.mkdir(path.resolve('Documents/Demo Runbook/examples'),{recursive:true});
await fs.writeFile(path.resolve('Documents/Demo Runbook/examples/Демо_ОЖР_для_импорта.csv'),'\ufeff'+journalCSV.replace(/\r\n/g,'\n'),'utf8');
await fs.copyFile('public/pto-demo.json',path.resolve('Documents/Demo Runbook/examples/Демо_АОСР_рабочие_данные.json'));
await page.locator('#pto-ojr-import summary').click();
await page.locator('#pto-ojr-file').setInputFiles({name:'Учебный_ОЖР.csv',mimeType:'text/csv',buffer:Buffer.from(journalCSV)});
await page.locator('#pto-ojr-preview-btn').click();
await snap('16-pto-ojr-preview','Импорт ОЖР: сопоставление колонок, принятые и отклонённые строки','#pto-ojr-import');
await page.locator('#pto-ojr-confirm').click();
await snap('17-pto-document-register','Реестры ОЖР, паспортов и схем, контроль комплектности','#pto-field-registers');
await page.locator('#pto-ojr-import summary').click();
await page.locator('#pto-export-xlsx').focus();
await snap('18-pto-main-after-import','Главный экран ПТО после импорта с предупреждениями','#pto-tab > .panel:nth-of-type(1)');

// Also demonstrate actual drawing upload and on-plan ticket workflow.
await page.locator('[data-tab="plattegrond"]').click();
const planPng=await page.evaluate(()=>{
 const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=650;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f9fb';ctx.fillRect(0,0,1100,650);
 ctx.fillStyle='#0f3652';ctx.font='bold 26px Arial';ctx.fillText('УЧЕБНАЯ СХЕМА КРОВЛИ — НЕ ПРОЕКТНЫЙ ДОКУМЕНТ',38,55);
 ctx.strokeStyle='#3b5569';ctx.lineWidth=9;ctx.strokeRect(125,130,810,430);
 ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(530,130);ctx.lineTo(530,560);ctx.moveTo(125,335);ctx.lineTo(935,335);ctx.stroke();
 ctx.font='bold 35px Arial';ctx.fillStyle='#476a8c';ctx.fillText('Зона А',250,250);ctx.fillText('Зона Б',625,250);
 ctx.font='19px Arial';ctx.fillText('ДЕМО · геометрия условная',340,615);
 return canvas.toDataURL('image/png').split(',')[1];
});
const planBytes=Buffer.from(planPng,'base64');
await fs.writeFile(path.resolve('Documents/Demo Runbook/examples/Учебный_план_кровли.png'),planBytes);
await page.locator('#floor-plan-input').setInputFiles({name:'Учебный_план_кровли.png',mimeType:'image/png',buffer:planBytes});
await page.waitForTimeout(500);
await snap('19-plans-demo','Загруженный учебный план кровли');
await page.locator('[data-tab="opname"]').click();
await snap('20-survey-with-plan','Обследование с условным планом');
await page.evaluate(()=>window.app.openPointModal(null,42,45));
await page.locator('#point-modal.active').waitFor();
await page.locator('#point-label').fill('Протечка у парапета — учебное замечание');
await page.locator('#point-description').fill('Демо: проверить примыкание мембраны и добавить фото.');
await snap('21-ticket-editor','Карточка замечания: описание, категория, приоритет и ответственный','#point-modal .modal-content');
await page.locator('#cancel-point').click();
await page.locator('[data-tab="inspectie"]').click();
await page.locator('#new-inspection-btn').click();
await page.locator('#insp-name').fill('Учебная проверка кровли');
await page.locator('#insp-inspector').fill('Инженер ПТО (демо)');
await page.locator('#insp-type').selectOption('checklist');
await snap('22-inspection-setup','Создание инспекции с выбором шаблона','#inspectie-setup');
await page.locator('#start-inspection-btn').click();
if(await page.locator('#inspectie-execute').isVisible())await snap('23-inspection-execution','Контрольный лист и ход выполнения инспекции','#inspectie-execute');
await page.locator('#finish-inspection-btn').click();
if(await page.locator('#inspectie-sign').isVisible())
 await snap('27-inspection-signature','Экран подписи инспекции (НЕ УКЭП)','#inspectie-sign');
await page.locator('[data-tab="oplevering"]').click();
await page.locator('#new-handover-btn').click();
await snap('24-handover-setup','Подготовка акта сдачи объекта, участники и дата','#oplevering-setup');
await page.locator('#ho-participants .ho-participant-row input').first().fill('Вымышленный представитель');
await page.locator('#ho-date').fill('2026-10-30');
await page.locator('#start-handover-btn').click();
if(await page.locator('#oplevering-execute').isVisible()){
 await snap('28-handover-execution','Проверка пунктов сдачи и вложений','#oplevering-execute');
 await page.locator('#finish-handover-btn').click();
 if(await page.locator('#oplevering-sign').isVisible())
  await snap('29-handover-signature','Экран завершения сдачи (не юридически значимая ЭП)','#oplevering-sign');
}

await page.locator('[data-tab="dashboard"]').click();
await snap('25-dashboard-with-activity','Панель управления после создания демонстрационной инспекции');
await page.locator('[data-tab="project"]').click();
await page.locator('#add-contact-btn').click();
if(await page.locator('#contact-modal.active').isVisible()){
 await snap('30-project-contact','Карточка участника проекта','#contact-modal .modal-content');
 await page.locator('#contact-modal .modal-close').first().click();
}
await page.locator('[data-tab="pto"]').click();
await snap('26-pto-evidence-and-records','Файлы и документы для исполнительного комплекта','#pto-evidence-vault');

const audit={
 capturedAt:new Date().toISOString(),origin:'http://127.0.0.1:3042/',
 locale:await page.locator('html').getAttribute('lang'),
 project:'Учебный объект «Кровля-А» (100% synthetic)',
 browser:'Playwright Chromium headless, desktop 1512×960',
 navigation:await page.locator('.nav-btn').evaluateAll(nodes=>nodes.map(n=>({
  id:n.dataset.tab,label:n.textContent.trim()
 }))),
 screens,errors
};
await fs.writeFile(path.resolve('Documents/Demo Runbook/SCREEN_CAPTURE_MANIFEST.json'),
 JSON.stringify(audit,null,2)+'\n');
console.log('SUMMARY',JSON.stringify({
 total:screens.length,nav:audit.navigation.length,errors:errors.slice(0,10),locale:audit.locale
}));
await browser.close();
if(errors.length)process.exitCode=2;
