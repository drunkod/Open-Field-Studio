import {test,expect} from '@playwright/test';
test('Russian UI covers original inspection template options and questions',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('ofs_lang','ru'));
 await page.goto('http://127.0.0.1:3042/');
 await page.locator('[data-tab="inspectie"]').click();
 await expect(page.locator('#new-inspection-btn')).toContainText('Новая инспекция');
 await page.locator('#new-inspection-btn').click();
 await expect(page.locator('#insp-template')).toContainText('Обследование строительных конструкций');
 await expect(page.locator('#insp-template')).toContainText('Памятник — исторические интерьеры');
 await page.locator('#insp-name').fill('Учебная проверка');
 await page.locator('#insp-type').selectOption('checklist');
 await page.locator('#insp-template').selectOption('tpl_bouwkundig');
 await page.locator('#start-inspection-btn').click();
 await expect(page.locator('.checklist-item-question').first()).toContainText('кирпичной кладки');
 await expect(page.locator('.checklist-item-question')).toHaveCount(16);
 await expect(page.locator('#checklist-items')).not.toContainText('Staat van het metselwerk');
 expect(errors).toEqual([]);
});
