# Russian PTO: one-click executive-documentation dossier (АОСР + опись + вложения)

**Decision (30 October 2026):** automate preparation of *draft* executive-documentation handover packages (*комплект ИД*) from the existing 15-act form and linked evidence. This is a practical high-priority workflow, not a statistically proven #1 by market-share or survey frequency.

## 1. Evidence from Russian market and interview

- The interviewed engineer requires ≈15 АОСР from one common project header, with roof-work dates, work names, executive schemes, quality documents and КС-2 reconciliation. The approved customer form and human review remain essential.
- [АЛТИУС — исполнительная документация](https://www.altius.ru/program/ispolnitelnaya-dokumentaciya/): explicitly markets automatic inventory, automatic batch print of documents **with attachments**, and reuse of common works-journal data. These are vendor claims, not independent usage statistics.
- [Адепт — исполнительная документация](https://gk-adept.ru/programmy/adeptispolnitelnaya_dokumentaciya/): automatic register, one-time data entry and act preparation with electronic review.
- [HARDROLLER](https://hardroller.ru/): Word/Excel export and document completeness checks; its commercial results are not independent benchmarks.
- [ПТО Онлайн user manual](https://pto-app.ru/instructions-app.pdf): source-driven work dates from ОЖР and acts downloaded with certificates, schemes and other files.
- Local community analysis and regulatory caveats: [Russian market adaptation study](../research/openconstructionerp/RUSSIAN_MARKET_ADAPTATION.md).

## 2. Open-source implementation source

- [Stuk/jszip](https://github.com/Stuk/jszip), version 3.10.2 pinned directly; choose the **MIT option** in its dual MIT/GPL licence for browser-side ZIP assembly. Add it as a direct pinned dependency, lazy-loaded. Do not copy code from the proprietary Russian products or AGPL OpenConstructionERP.
- Reuse our existing source: [writePrintPackXlsx](../../src/pto/xlsx.mjs), [recordDiagnostics](../../src/pto/records.mjs), [getEvidence and SHA verification](../../src/pto/evidence-store.mjs), [safeWorkspace](../../src/pto/domain.mjs). Add a new standalone module `src/pto/dossier.mjs` and one optional button in `src/pto/ui.mjs`.

## 3. Build steps in strict order

1. **Define package contract and tests:** only populated acts; always mark draft; an act register showing work, dates and available evidence; attachments inventory listing act links, revision, filename and SHA-256; machine-readable manifest with file hashes and warnings.
2. **Assemble offline ZIP:** include `АОСР_черновики.xlsx` (existing print-only layout); `Реестр_ИД.csv`; `Опись_приложений.csv`; `Манифест.json`; `ПРОЧТИТЕ_ЧЕРНОВИК.txt`; and unique, hashed filenames under `Приложения/`. A file shared by two acts must appear once physically and twice in the inventory.
3. **Integrity and security:** re-read IndexedDB bytes and verify SHA before adding; refuse missing/corrupt evidence rather than silently producing a “complete” dossier; no traversal, reserved names or executable files; maximum 40 MiB total uncompressed attachments, 300 records; no silent cloud calls, no personal employee files in Git. Protect CSV against formula injection.
4. **Russian UI:** one clear button next to existing print export; show an explicit draft warning; preserve existing Excel and JSON workflows. The ZIP is local output, not signed XML or formal ЕГРЗ/Минстрой submission.
5. **Automated verification:** unit tests for empty acts, shared file, Cyrillic filenames, register accuracy, missing/corrupt bytes and CSV injection; Chromium end-to-end checks complete ZIP download from synthetic evidence, inner XLSX act sheet count, act register and integrity manifest. Run all existing 28+ tests, all existing 8+ browser tests, lint/build and dependency audit.
6. **Publish only after green:** commit under existing `feature/ru-aosr-ks2-prototype` branch and update draft PR #1. Document tested limits and pilot acceptance.

## 4. Russian acceptance and boundaries

- Pilot with employee's private source АОСР: print forms are drafts, retain original customer form and Russian fields, no invented certificates or approval.
- No statutory claim: Order 344/пр (as amended), ОЖР 1026/пр, customer-approved templates, signatures and scheme originals require qualified specialist review; ZIP manifest with SHA-256 is **not** УКЭП/УНЭП nor regulatory XML. No “ready for official submission” badge.
- Measure whether 10–15 acts + their supporting documents can be assembled in one action, and whether the engineer can audit which attachment supports which act. Verify filenames and Windows extraction with Cyrillic before production.
- Future work: validated DOCX and Minstroy XML adapters, genuine approval routes and signatures, original journal-file import, and separate secure archival backup.


## 5. Implementation mapping and acceptance

- **Implemented:** `src/pto/dossier.mjs` builds ZIP, register and attachment inventories, SHA-256 manifest, source-linked warnings and a standalone print-only XLSX workbook. Only nonempty act slots are included.
- **UI:** `src/pto/ui.mjs` exposes the Russian button `Собрать комплект ИД с приложениями (.zip)` after the existing print export, with a pre-export warning and clear error on missing/corrupted evidence.
- **Library:** JSZip is pinned as a direct dependency (3.10.2, MIT-licence option). Original application code is not copied from commercial Russian vendors.
- **Tests:** `tests/pto-dossier.test.mjs` checks empty workspaces, reuse of a physical attachment, exact ZIP entries and integrity failure; `tests/e2e-pto-dossier.spec.mjs` exercises browser export and inspects the resulting ZIP and workbook using only synthetic data.
- **Formal limitation:** a ZIP and workbook are a *draft handover package*, not an approved АОСР form, Minstroy XML document or a signed set. The operator must verify missing attachments indicated in `Замечания.csv`.

## 6. Verified results and remaining deployment checks

- Local `npm run check:mvp`: **31/31 Node unit tests** and **9/9 Chromium tests** passed, plus ESLint and the Vite production build. The single-click ZIP end-to-end test verified three acts, CSV inventories, SHA manifest and byte-exact extraction of a fictional PDF.
- A fresh `npm audit --omit=dev` could **not complete** because the Mac connection to npm registry dropped during the audit request. No clean audit result is claimed for this commit; rerun in working network/CI before deployment. The JSZip 3.10.2 version has no reported direct issues in Snyk’s public listing as of this research, which does not substitute for a full lockfile audit.
- Not tested: customer-approved official forms, qualified signatures, Minstroy XML, extraction in every Windows archive utility, native desktop Tauri binaries, and review of real private site evidence. All generated docs clearly remain drafts.
