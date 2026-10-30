# Public research link register — construction PTO and Open Field Studio

**Compiled: 30 October 2026.** Inventory of links retained in repository research notes and README. A link is not proof that it remains reachable today, that it is an official regulation, or that its source code was copied. Confidential employee files are NOT reproduced.

## Distinguish sources from implementation

- Employee interview / original private AOSR example: 15 acts, shared fields, dates, schemes, certificates, quantities, Excel-first ergonomics. PRIVATE source, no public URL.
- Regulations 344/пр (with 369/пр) and 1026/пр: documentary boundaries; not automatic legal certification.
- Russian practitioners/vendors: qualitative workflow priority, not representative adoption statistics.
- GitHub: design patterns versus actual imported libraries, differentiated below.

## Source-to-function matrix

| Function | Inputs | Code in this fork | Licensing/limitations |
|---|---|---|---|
| 15 AOSR sheets / original form | Interview, 344/пр, Excel discussions | src/pto/domain.mjs, legacy-xls.mjs, source-layout.mjs, xlsx.mjs | Draft; customer approval and signatories still required |
| OJR import and date checks | 1026/пр, Exon/Аdept references, ExcelJS | src/pto/records.mjs, ojr-import.mjs, ojr-ui.mjs | ExcelJS 4.4.0 MIT actually used; imported CSV not statutory journal |
| Certificates, schemes, SHA-256 | OpenConstructionERP and local market comparisons | records.mjs, evidence-domain.mjs, evidence-store.mjs | Original JS patterns, not copied upstream AGPL Python |
| KS-2 quantity checking | Grand-Smeta, Smeta.RU, progress/quantity variance | domain.mjs, xlsx.mjs | Cross-check is not a signed acceptance |
| One-click draft ZIP | ALTIUS, PTO Online, JSZip | dossier.mjs | JSZip 3.10.2 MIT/GPL dual (MIT option); not regulatory XML |
| Inspections and original app | Upstream Open Field Studio | index.html, public/app.js, src/locales/ru.json | Original app license and market-specific adapters require review |

## Directly used libraries and studied repositories

- ExcelJS: https://github.com/exceljs/exceljs — MIT, dependency in the app.
- JSZip: https://github.com/Stuk/jszip — dual MIT/GPL, MIT option.
- Legacy xls-reader 0.7.0: MIT in installed dependency metadata; verify all transitive obligations before redistribution.
- OpenConstructionERP: https://github.com/datadrivenconstruction/OpenConstructionERP — AGPL-3.0; source studied at commit 6032873, code not copied.

## Complete cited URL index

Each row shows where a source appears in the public research; presence does NOT imply independent verification.

### Open-source repositories and libraries

| Public URL | Referenced from |
|---|---|
| https://github.com/FolderITDev/mobile-field-inspections | docs/PTO_DAILY_MODULES_RU.md:22 |
| https://github.com/OpenAEC-Foundation | README.md:370 |
| https://github.com/OpenAEC-Foundation/Open-Field-Studio | README.md:368, docs/DEVELOPMENT_PLAN_RU.md:3 |
| https://github.com/OpenAEC-Foundation/Open-Field-Studio.git | README.md:79 |
| https://github.com/OpenAEC-Foundation/Open-Field-Studio/issues | README.md:369 |
| https://github.com/Sereban-glitch/proakt-build-bot | docs/PTO_DAILY_MODULES_RU.md:24 |
| https://github.com/Stuk/jszip | docs/research/RU_PTO_ONE_CLICK_DOSSIER_PLAN.md:16 |
| https://github.com/ThatOpen/engine_web-ifc | README.md:204 |
| https://github.com/constructelligence-lab/construction-project-records | docs/PTO_DAILY_MODULES_RU.md:21 |
| https://github.com/drunkod/Open-Field-Studio | docs/DEVELOPMENT_PLAN_RU.md:2 |
| https://github.com/exceljs/exceljs | docs/research/RU_PTO_OJR_IMPORT_PLAN.md:12 |
| https://github.com/gba-mep/daily-construction-log | docs/PTO_DAILY_MODULES_RU.md:20 |
| https://github.com/gba-mep/excel-template-filler | docs/PTO_DAILY_MODULES_RU.md:23 |

### OpenConstructionERP pinned AGPL source

| Public URL | Referenced from |
|---|---|
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/LICENSE | docs/research/openconstructionerp/CODE_GRAPH.md:90 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/boq/manifest.py | docs/research/openconstructionerp/INTEGRATION_PLAN.md:35 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/cde/manifest.py | docs/research/openconstructionerp/INTEGRATION_PLAN.md:31 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/cde/service.py#L293-L350 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:31 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/changeorders/manifest.py | docs/research/openconstructionerp/INTEGRATION_PLAN.md:33 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/changeorders/service.py | docs/research/openconstructionerp/INTEGRATION_PLAN.md:33 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/daily_diary/service.py#L227-L270 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:27 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/documents/service.py#L621-L730 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:25 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/documents/service.py#L889-L1025 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:25 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/field_diary/schemas.py#L34-L112 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:27 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/inspections/service.py#L65-L180 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:30 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/progress/manifest.py | docs/research/openconstructionerp/INTEGRATION_PLAN.md:28 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/progress/quantity_variance.py#L133-L235 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:28 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/quality_concept/fsm.py#L14-L96 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:34 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/quality_concept/links.py#L243-L378 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:34 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/rfi/schemas.py#L62-L170 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:29 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/rfi/service.py#L141-L315 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:29 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/submittals/schemas.py#L105-L175 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:26 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/submittals/tracking.py#L148-L263 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:26 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/submittals/validators.py#L113-L250 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:26 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/transmittals/logic.py#L78-L216 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:32 |
| https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/transmittals/service.py#L380-L548 | docs/research/openconstructionerp/INTEGRATION_PLAN.md:32 |

### Other technical references

| Public URL | Referenced from |
|---|---|
| https://img.shields.io/badge/built%20with-Tauri%20v2-orange | README.md:8 |
| https://img.shields.io/badge/i18n-i18next-green | README.md:9 |
| https://img.shields.io/badge/license-CC%20BY--SA%204.0-blue | README.md:7 |
| https://mozilla.github.io/pdf.js/ | README.md:203 |
| https://nodejs.org/ | README.md:71 |
| https://threejs.org/ | README.md:204 |
| https://v2.tauri.app/ | README.md:200 |
| https://vite.dev/ | README.md:201 |
| https://www.i18next.com/ | README.md:202 |
| https://www.rust-lang.org/tools/install | README.md:72 |

### Practitioner communities and deployment case studies

| Public URL | Referenced from |
|---|---|
| https://habr.com/ru/companies/pik_digital/articles/1071154/ | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:8 |
| https://habr.com/ru/companies/sminex_developer/articles/1021940/ | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:8 |
| https://qna.habr.com/q/409732 | docs/research/RU_PTO_OJR_IMPORT_PLAN.md:8 |
| https://www.excelworld.ru/forum/3-21585-1 | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:7 |
| https://www.reddit.com/r/ru_linux/comments/1xcnoka/ | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:7 |

### Russian estimating systems

| Public URL | Referenced from |
|---|---|
| https://help.grandsmeta.ru/ob-ekty-i-smety/eksport-smet-v-razlichnye-formaty/eksport-v-format-xml | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:10 |
| https://master-smeta.ru/help-smetaru-9/vypolnenie-rabot/akty-priemki-vypolnennykh-rabot-ks-2/eksport-i-import-aktov-ks-2/193-eksport-akta-ks-2-v-formate-xml.html | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:10 |
| https://shop.grandsmeta.ru/whatisthenewversion | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:10 |

### Russian laws and technical regulations

| Public URL | Referenced from |
|---|---|
| https://base.garant.ru/406064781/ | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:6 |
| https://base.garant.ru/412265818/ | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:9 |
| https://base.garant.ru/412373476/53f89421bbdaf741eb2d1ecc4ddb4c33/ | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:5 |
| https://kodeks.ru/news/read/vstupili-v-deistvie-xml-sxemy-dlia-etapa-stroitelstva | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:6 |
| https://sudact.ru/law/prikaz-minstroia-rossii-ot-16052023-n-344pr/ | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:5 |
| https://www.consultant.ru/document/cons_doc_LAW_26273/ | docs/DEVELOPMENT_PLAN_RU.md:7 |
| https://www.consultant.ru/document/cons_doc_LAW_516777/ | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:5 |

### Russian-market vendor and user guidance

| Public URL | Referenced from |
|---|---|
| https://autoloading.ru/articles/kak-podgotovit-excel-ozhr/ | docs/research/RU_PTO_OJR_IMPORT_PLAN.md:10 |
| https://autoloading.ru/requirements/works/ | docs/research/RU_PTO_OJR_IMPORT_PLAN.md:11 |
| https://exon.visgis.usedocs.com/article/83531 | docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:9 |
| https://gk-adept.ru/programmy/adeptispolnitelnaya_dokumentaciya/ | docs/research/RU_PTO_OJR_IMPORT_PLAN.md:9, docs/research/RU_PTO_ONE_CLICK_DOSSIER_PLAN.md:9, docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:9 |
| https://hardroller.ru/ | docs/research/RU_PTO_ONE_CLICK_DOSSIER_PLAN.md:10, docs/research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md:9 |
| https://pto-app.ru/instructions-app.pdf | docs/research/RU_PTO_ONE_CLICK_DOSSIER_PLAN.md:11 |
| https://www.altius.ru/program/ispolnitelnaya-dokumentaciya/ | docs/research/RU_PTO_ONE_CLICK_DOSSIER_PLAN.md:8 |

## Interpretation and verification

- Recheck applicable regulatory text, XML XSD and approved forms with specialists before production.
- OpenConstructionERP SHA-pinned links are source study, not portable APIs.
- The app retains Dutch-market integration paths and its handwritten/drawn signatures are not Russian qualified electronic signatures.
- URL availability was not live-checked in this documentation pass; additional unretained historical browsing cannot be reconstructed with certainty.
\n## Original local clone research (11 additional references)\n\nThe [full repository-by-repository clone and licence inventory](OSS_CLONE_REFERENCES.md) preserves the original 11 source candidates, including an unlicensed GitVerse KS-2 analyzer, Apache-2.0 tools, and the unresolved original Open Field Studio licence. The separate OpenConstructionERP study is AGPL-3.0 and was never copied into JS.\n\n## Additional historical research archive\n\nThe [historical public reference index](ARCHIVED_RESEARCH_REFERENCES.md) preserves further GitHub, GitVerse, Russian vendor and community sources from the original 12-tool comparison and international analogues. They were considered as options, not necessarily incorporated into our application.\n