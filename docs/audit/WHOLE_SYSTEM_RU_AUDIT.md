# Whole-system audit — Russian Open Field Studio fork

**Audit date:** 30 October 2026. **Baseline commit:** `f22cc3ec5899e633104c7cfab2df5179e76cc17e` on `feature/ru-aosr-ks2-prototype`. **Mode:** local Vite, headless Chromium, 1512×960 desktop. **Locale:** `ru` explicitly set and confirmed by `<html lang="ru">`. **Fixture:** wholly synthetic roofing project (DEMO-PTO-2026-01), fictional plan, documents, OЖР, 3 populated acts and 12 empty slots.

**Evidence:** [34 screenshots of the actual UI](../../Documents/Demo%20Runbook/SCREEN_ATLAS.md), [machine-readable capture manifest](../../Documents/Demo%20Runbook/SCREEN_CAPTURE_MANIFEST.json), [reproducible capture script](../../Documents/Demo%20Runbook/scripts/capture-russian-ui.mjs), full `npm run check:mvp` regression, translation tests and source-code review. Captures reported **0 browser JavaScript page errors**, but this is not proof that all functionality or external integrations work.

## Method and scope

1. Forced Russian locale in a fresh browser context; seeded a fictional named object, 3 АОСР, example journal, a PDF-like synthetic attachment and a generated plan drawing. No employee/customer file was used.
2. Visited **all 11 navigation sections** and captured their visible UI; additionally inspected document/PTO panels, journal-preview, defect modal, inspection setup/execution/signature, handover setup/execution/signature and contact editor.
3. Compared the actual controls and workflows with the engineer interview and earlier Russian-market/source research, using source files and tests to distinguish implemented actions from visual affordances.
4. Categorised findings as **Demonstrated**, **Covered by automated test**, **Not tested**, and **Not suitable as Russian legal acceptance without further work**. A visible button alone is not tested end-to-end functionality.

## Coverage of every main screen

| Main navigation screen | What is displayed and staff use | Actual capture | Audit outcome |
|---|---|---|---|
| **Проект** | Name, project number, customer, address, date, surveyor, description, participants, save; imported connector option | [01](../../Documents/Demo%20Runbook/screenshots/01-project.png), [30 — contact](../../Documents/Demo%20Runbook/screenshots/30-project-contact.png) | **Demonstrated** with fictional values; BAG Netherlands address lookup is foreign-market-specific |
| **Чертежи** | Upload and list floor plans; user can select/remove them | [02 — empty](../../Documents/Demo%20Runbook/screenshots/02-plattegrond.png), [19 — uploaded synthetic plan](../../Documents/Demo%20Runbook/screenshots/19-plans-demo.png) | **Demonstrated** with generated PNG; no real CAD/project drawing validation |
| **3D BIM** | IFC 2x3/IFC4 upload area and 3D canvas | [03](../../Documents/Demo%20Runbook/screenshots/03-ifc.png) | **Visual smoke only**; no real IFC loaded, no Russian design compliance verification |
| **Обследование** | Plan selector, status/category/priority filters, on-plan remarks, ticket editor | [04 — empty](../../Documents/Demo%20Runbook/screenshots/04-opname.png), [20 — with plan](../../Documents/Demo%20Runbook/screenshots/20-survey-with-plan.png), [21 — ticket form](../../Documents/Demo%20Runbook/screenshots/21-ticket-editor.png) | **Demonstrated** navigation, plan and modal; actual completed ticket lifecycle needs real-user pilot |
| **Инспекции** | Inspection list, create form, template selector, checklist execution, signature interface | [05](../../Documents/Demo%20Runbook/screenshots/05-inspectie.png), [22](../../Documents/Demo%20Runbook/screenshots/22-inspection-setup.png), [23](../../Documents/Demo%20Runbook/screenshots/23-inspection-execution.png), [27](../../Documents/Demo%20Runbook/screenshots/27-inspection-signature.png) | **Demonstrated** with synthetic inspection; drawn signatures are NOT УКЭП/УНЭП |
| **Сдача объекта** | Handover list, date, type, participant, decision, signatures, item list | [06](../../Documents/Demo%20Runbook/screenshots/06-oplevering.png), [24](../../Documents/Demo%20Runbook/screenshots/24-handover-setup.png), [28](../../Documents/Demo%20Runbook/screenshots/28-handover-execution.png), [29](../../Documents/Demo%20Runbook/screenshots/29-handover-signature.png) | **Demonstrated** draft stages, not legally accepted client handover |
| **Панель управления** | Counts by issue status/category/assignee, inspection stats and activity | [07 — baseline](../../Documents/Demo%20Runbook/screenshots/07-dashboard.png), [25 — after inspection](../../Documents/Demo%20Runbook/screenshots/25-dashboard-with-activity.png) | **Visual demonstrated**; computed values depend on entered/saved records |
| **АОСР · КС-2** | Shared requisites, 15 acts, quantities, documents, OЖР and evidence, warnings, Excel/ZIP export | [11 — complete](../../Documents/Demo%20Runbook/screenshots/11-pto.png), [12–18 and 26 in atlas](../../Documents/Demo%20Runbook/SCREEN_ATLAS.md) | **Strongest tested workflow** (unit/E2E); formal customer acceptance still missing |
| **Экспорт** | Report formats, PDF/HTML, BCF, JSON backups, sync controls | [08](../../Documents/Demo%20Runbook/screenshots/08-export.png) | **Visual** plus existing unit/E2E report tests; not all export methods manually exercised in this pass |
| **Интеграции** | Connector cards, configure actions and foreign provider adapters | [09](../../Documents/Demo%20Runbook/screenshots/09-koppelingen.png) | **Visual only**, no live credentials or production integrations tested; Russia-specific gaps |
| **Справка** | Russian in-app help and menu instructions | [10](../../Documents/Demo%20Runbook/screenshots/10-handleiding.png) | **Visual**, should be expanded for domestic ПТО, backups and legal boundaries |


## PTO workflow subviews: what staff actually see

| Captured view | Contents and daily use | Limits |
|---|---|---|
| [12 — АОСР input](../../Documents/Demo%20Runbook/screenshots/12-pto-acts.png) | 15 compact act cards with work, dates, scheme and documents; the full ten-column view remains available | Compact UI helps routine entry; specialist acceptance not yet tested |
| [13 — КС-2](../../Documents/Demo%20Runbook/screenshots/13-pto-ks2.png) | Positions, units, measured quantities, CSV/XLSX import | Needs actual estimator-approved source, unit mappings |
| [14 — checks](../../Documents/Demo%20Runbook/screenshots/14-pto-validation.png) | Quantity differences, missing source fields and chronology warnings | Input-only consistency, not an official legal pass |
| [15, 26 — evidence](../../Documents/Demo%20Runbook/screenshots/15-pto-evidence.png) | Local passport PDF, SHA-256, revisions, backup and per-act associations | Browser IndexedDB may be cleared; JSON/XLSX are metadata-only backups |
| [16 — ОЖР preview](../../Documents/Demo%20Runbook/screenshots/16-pto-ojr-preview.png) | Source sheet/column mapping, accepted/rejected journal rows and confirmation | Source OЖР file is not retained by import automatically; no registration under 1026/пр |
| [17 — registers](../../Documents/Demo%20Runbook/screenshots/17-pto-document-register.png) | Work-journal references, passports/certificates, schemes and per-act completeness | A linked row is not an authenticated original |
| [18 — common fields](../../Documents/Demo%20Runbook/screenshots/18-pto-main-after-import.png) | Shared header, one-click draft XLSX and ZIP ID, JSON/HTML | 344/пр applicability and customer-specific print/signatories need validation |

## Russian localisation: findings

**Verified coverage:** the navigation is displayed in Russian; Russian locale dictionary and translation-key tests are part of the automated suite. Screenshots show Russian forms for all 11 tabs and Russian PTO controls, with Cyrillic filenames supported in the demo.

**Market adaptation is not complete:** Russian-language labels and Russia-appropriate business workflows are different issues.

| Priority | Finding | Evidence | Recommendation |
|---|---|---|---|
| **P1, mitigated 30.10.2026** | Previous screenshot showed **«Найти адрес (BAG Нидерланды)»** in Russian; UI now hides BAG/EP-online and shows an official manual ФИАС/ГАР link | 01, 31 | Manual lookup **is not automated API validation**; approved FIАS integration remains future work |
| **P1, warning added 30.10.2026** | Integrations and exports reference foreign providers such as KYP Project / ERPNext / n8n | 08, 09, 32 | An explicit warning now labels these as inherited international connectors; domestic compatibility and data-transfer permissions still unverified |
| **P1** | Inspection template catalog originates in mixed market standards (including European NEN vocabulary) | 22, 23 | Build a versioned Russian checklist catalog with engineer/quality-control approval; do not auto-map foreign standards into СП/ГОСТ |
| **P1, mitigated** | Previously every АОСР row exposed ten fields, despite the employee requesting three–four changing groups | 11–13, 33–34 | The new compact three-group editor is default; all fields remain in «Все графы». Time savings are not yet measured |
| **P0** | Drawn inspection/handover signatures and internal review labels are not qualified Russian electronic signatures | 27, 29 | Distinguish internal acknowledgement from legally valid signatures; defer formal ЭП/МЧД to a verified adapter |
| **P0** | АОСР form and role mapping have not been formally accepted by customer against actual approved template | 11–18 and private source-layout audit | Require page-by-page printing and signatures/party-role check before declaring production readiness |

**Change log:** the initial audit photographed the BAG Netherlands button in Russian. The follow-up branch now suppresses Dutch address/energy services only in Russian, supplies a manual link to the official ФИАС/ГАР site, and warns about inherited international connectors. No official address verification, domestic connector API or legally significant signature was added.

## Implementation & feature audit

| Capability | Current evidence | Operational conclusion |
|---|---|---|
| Original-style 43-column AОСР template, 15 linked act sheets | Automated source layout, import/reimport tests; earlier private real-file test | Technical foundation exists, **customer-approved legal print fidelity not signed off** |
| Draft bundle XLSX / ZIP with attachments and manifest | Dedicated unit and Chromium E2E tests, synthetic PDF verified byte-for-byte | Suitable for internal draft pilot, not proof of authentic evidence |
| OЖР import with Russian dates and code mapping | Unit/E2E tests including rejected rows, duplicates and fill-only-blank | Useful assistant; **not** an officially maintained ОЖР |
| Local certificate/drawing files and backup | IndexedDB SHA unit/browser tests with synthetic bytes | Backups and user permissions are indispensable; no durable server archive |
| KS-2 comparison, multiple acts per cost item | Numeric/domain tests and synthetic import mapping | Advisory only; units and project quantity evidence require human validation |
| Ticket and plan selection | Captures 19–21, original application tests | Visual pilot, not verified with real scaled site drawings |
| Inspection / handover workflows | Captures 22–29; original automated Russian checklist tests | Standard-site pilot possible, legal sign-off and Russian standards not implemented |
| IFC 3D | Empty viewer screenshot 03, source module present | **Not tested with a real IFC**, no performance/fidelity or model QA claim |
| Third-party connectors | Cards visible, no external credentials used | **Unverified** end-to-end; possible privacy, API or data-residency concerns |
| PDF/BCF/HTML outputs | Export UI 08, unit report checks, smoke suite | Not all real-user document/printing flows exercised |


## Security, data retention and source traceability

- **Synthetic data only:** screenshots, project JSON, journal CSV and roof plan contain no real staff names, customer files or the private original workbook. They are not approved engineering design documents.
- **Storage:** main project state is locally persisted; the attachment vault keeps binary files in browser IndexedDB, which can be removed by browser/profile cleanup. Ordinary project JSON/XLSX may hold filenames and SHA metadata only; **separate attachment backup** is mandatory.
- **File hashes:** SHA-256 catches changed local bytes. It does not prove origin, certificate validity, authorisation or qualified electronic signature.
- **Exports/links:** the interfaces offer third-party connectors and exports. This screenshot pass did not use credentials or monitor full outbound network behavior; do not claim a penetration test or data-residency review.
- **Localization audit:** tests cover key translations and 15 original checklist templates, but user-defined records, provider content and domain-specific regulations still need specialist review.
- **Source references:** see [full research URL register](SOURCE_REGISTER.md), [source JSON index](SOURCE_URL_INDEX.json), [Russian market adaptation](../research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md), [Code Graph](../research/openconstructionerp/CODE_GRAPH.md) and [ОЖР integration plan](../research/RU_PTO_OJR_IMPORT_PLAN.md). Information from vendor websites, GitHub source and real employee interview is kept in distinct evidence categories.

## Prioritised remediation and Russian-market acceptance

**P0 — before a formal construction-documentation pilot with real customer materials**

1. Conduct a user-assisted, page-by-page comparison of generated АОСР against the customer-approved blank original, including every merged cell, project role, signatory, normative reference, attachment list and print range.
2. Clarify required workflows for formal ОЖР 1026/пр, executive documentation 344/пр (including current amendments), electronic XML/XSD and permitted signature mechanisms with a qualified Russian construction-document specialist.
3. Establish a confidential data-handling, retention and backup plan, including encrypted storage where appropriate, permission policy and testing recovery of attachments.
4. Distinguish observed app status from actual construction performance, customer signature and document certification in every staff-facing instruction.

**P1 — next product-development stage**

1. Simplify routine АОСР input to the interviewee's 3–4 changing groups; make КС-2 and advanced evidence registers optional and easily collapsed.
2. Provide a Russian-market profile: disable Dutch BAG from the Russian default and mark foreign integrations as optional unconfigured services; research documented 1С, ГРАНД-Смета, Smeta.RU and Exon interchange only when examples/API terms are available.
3. Keep the original imported ОЖР source file hash and revision, row references and operator review; never auto-approve a journal import.
4. Define compatible domestic inspection checklist templates and assessment rules with construction-control staff. Preserve editable schemas without mislabelling foreign standards.
5. Test on actual target machines: Windows Excel, local offline browser and desktop distribution; include printing 2–3 copies and Cyrillic filenames.

**P2 — larger company integration**

- Dedicated roles/permissions, versioned approvals, real secure audit trail and signed document exchange only after compliance design.
- Real BIM, multi-project load, connectors and report UX benchmark under production constraints, with explicit logging and consent.
- Evaluate UX daily with staff for fewer clicks, fewer duplicate entries and corrected returned acts. Do not invent time savings.

## Executed automated checks (30 October 2026)

- **36/36 Node unit tests passed**, including domain, OЖР parsing, XLSX import/reimport, ZIP dossier, evidence storage and 443-key Russian translation coverage.
- **13/13 Chromium Playwright tests passed**, including Russian reports, checklist templates, the original-layout АОСР print workbook, ОЖР import, KS-2, and local evidence/ZIP exports.
- ESLint and Vite production build passed; Vite reported large bundled chunks for IFC and XLSX, a performance follow-up rather than a test failure.
- **34/34 screenshot captures** completed with locale RU and **zero page errors**. Test capture deliberately did not use production files or live external connectors.
- **Markdown path validation:** eight principal new documents checked; 0 broken relative references. Source link register contains public URLs indexed from retained project notes; external URL availability not live audited.
- **npm advisory/security check:** no successful fresh dependency advisory result in this documentation work. This is not a security audit, penetration test or clearance to use real client data in unapproved services.

## Reproducibility and test classification

- Navigate the Russian UI using [capture-russian-ui.mjs](../../Documents/Demo%20Runbook/scripts/capture-russian-ui.mjs) against Vite on `http://127.0.0.1:3042/`. The script forces `ofs_lang=ru` and clears app localStorage for the run, creates its own fictional project, and saves images and a JSON manifest.
- Screenshots are a **browser visual walk-through**. Unit tests check data transformations and some export/import paths. Playwright tests check selected interactions. Neither alone certifies legal, security or production suitability.
- See [PTO day-in-the-life scenario](../../Documents/Demo%20Runbook/01_День_инженера_ПТО.md), [site inspection and handover scenario](../../Documents/Demo%20Runbook/02_Прораб_инспекция_и_сдача.md), [role schedule](../../Documents/Demo%20Runbook/03_Роли_и_ежедневные_сценарии.md) and [pilot acceptance checklist](../../Documents/Demo%20Runbook/04_Контрольная_ведомость_пилота.md).
- **Explicitly not tested here:** legal ЕД/ИД submission; legally binding signatures; external connector credentials/transmissions; real IFC model fidelity; official source OЖР XML; customer-approved form and actual project/employee signoff.

## Audit conclusion

The fork is demonstrably a Russian-language **working technical prototype** spanning project management, drawings, issues, inspections, handover, dashboards and PTO. Its strongest validated daily flow is 15 draft АОСР, OЖР references, document/evidence registers, КС-2 warnings and an unsigned ZIP dossier. It is **not yet a fully localised Russian domestic construction-documentation product or an approved production replacement**. The priority is input efficiency, original-form acceptance, domestic domain adapters and legally/operationally safe data handling—not additional broad ERP modules.

## Follow-up remediation — 30 October 2026

The [Russian-market UI remediation plan](RU_MARKET_UI_REMEDIATION_2026-10-30.md) links to ФНС/ФИАС and documents new manual address guidance, inherited-connector warning, localisation keys and the regression tests. Screenshots 31–32 show the corrected UI. The earlier screenshot is retained as an audit provenance description, while screenshot files 01 and 09 have been refreshed. **No automatic FIАS lookup or domestic integration was implemented.**

## Workflow remediation: compact АОСР entry

The [source-backed implementation plan](../research/RU_PTO_QUICK_ENTRY_IMPLEMENTATION.md) records the employee request and vendor comparison. АОСР defaults to three grouped controls per act; the complete ten-column table is still accessible. Both edit the same 15 act records, used for print/XLSX/ZIP. [Screenshots 33–34](../../Documents/Demo%20Runbook/SCREEN_ATLAS.md) show the modes. **No legal print approval, actual time-savings measurement or original CAD automation has been claimed.**
