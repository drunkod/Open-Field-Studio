# Russian PTO stage plan: ОЖР → АОСР source-data import

**30 October 2026 · Status: implementation plan written before coding.** This module helps a roofing ПТО engineer reuse dated entries from a separately maintained **общий журнал работ (ОЖР)** and compare them to 10–15 draft acts. It does **not** legally establish or replace the official journal under Order 1026/пр.

## Evidence and priority

- **Employee interview (private `yura/docs/01_Интервью_и_задачи_ПТО.md`):** He dates АОСР from ОЖР, wants to change 3–4 work fields once, and specifically does *not* want automated engineering schemes. Exact original journal file was not among the supplied examples; no actual ОЖР content is assumed.
- [Russian ПТО engineer on Habr Q&A](https://qna.habr.com/q/409732): materials and work-progress journals precede generation of hidden-work acts. Individual practitioner testimony, not adoption statistics.
- [Адепт:Исполнительная документация](https://gk-adept.ru/programmy/adeptispolnitelnaya_dokumentaciya/): vendor reports workflows where journal entries create act drafts and inspections. Vendor description, not proof of sector-wide popularity.
- [Exon daily OЖР Excel practice](https://autoloading.ru/articles/kak-podgotovit-excel-ozhr/): reuse the work code and dated rows rather than re-entering description for each day. Commercial integration guidance, not an official Exon API contract.
- [Exon Excel mapping requirements](https://autoloading.ru/requirements/works/): linked work IDs across sheets matter. Our simple importer requires explicit mapping to an existing АОСР number; it does not pretend to support Exon's full schema.
- [ExcelJS](https://github.com/exceljs/exceljs): existing MIT-licensed dependency already used for our .xlsx reading. Keep our own CSV parser small and tested; no third-party source transplant or new upload service.

## Stage sequence

1. **Stage A — source import (implement now).** Russian user controls for a journal file (.xlsx or UTF-8 .csv); local-only processing; strict file and row limits; select worksheet, header row and mapping for work/act ID, date, description and original page/entry reference. Recognise Russian column synonyms but require user confirmation; present preview and rejected rows before committing.
2. **Stage B — no-overwrite reconciliation (implement now).** Match only existing populated acts via explicit act number. Detect invalid/ambiguous dates, missing act references, duplicate entries and unmatched identifiers. Commit journal records only after confirmation; preserve original input and all 15 act fields. Suggest earliest/latest linked journal dates as `start`/`end` only if the act field is blank and the user explicitly selects filling; never overwrite existing dates or claim source authenticity.
3. **Stage C — evidence provenance (next).** Optional attachment of original journal and digest via existing IndexedDB vault; retain source filename, revision, import timestamp, hash, row numbers in metadata without modifying the original journal.
4. **Stage D — domestic interoperability (next).** Real-world sample-based adapters for linked work codes from Exon, Адепт and other customers. Include XLSX daily-entry fields and a journal section-3 export only if the format and permissions are verified. Formal XML/XSD/ЭП is separate regulatory work.
5. **Stage E — market validation (pilot).** Specialist checks matched dates and generated АОСР print layout against the source journal, measures avoided edits, false warnings and returned acts; retain offline Excel-first workflow.


## Implementation seams and acceptance gates

- `src/pto/ojr-import.mjs`: independent parser, XLSX worksheet extraction and date normalisation. Never execute formulas or follow external workbook links. Parsing does not mutate workspace. A row is acceptable only with an existing act number, valid calendar date and nonempty description; preserve source row and page/entry reference.
- `src/pto/ui.mjs`: optional panel inside existing «Ежедневные документы инженера ПТО», with file input, mapping and dry-run preview, then a separate «Подтвердить импорт» button. First validation shows accepted/rejected/unmatched counts and sample records.
- `src/pto/records.mjs`: compare existing ОЖР records to act dates. Do not treat a missing journal file as proof of a violation. Duplicate handling should be deterministic, and warnings in Russian.
- Keep current `newWorkspace` / `safeWorkspace` version 1 and `Ввод_работ` / print XLSX unchanged; imported journal entries persist using existing journal records and export/reimport.
- **Unit gates:** quoted semicolon/newlines in CSV, BOM, Russian DD.MM.YYYY and ISO dates, actual Excel numeric date serials, mismatched code, unknown work, malformed dates, duplicate existing rows, too many rows, formula-like text, user-selected mappings, date proposal without overriding existing fields.
- **Browser gates:** Russian interface shows preview, commits a synthetic two-day journal into matching acts, reload retains imported rows, separate dates fill explicit blanks only, existing document and АОСР export still pass. All existing tests and build/lint pass.
- **Security:** local-only, 10 MB max import, 300 imported journal entries max, reject unsupported formats and rows, formula-like fields exported safely; avoid linking unmatched work descriptions by fuzzy inference.
- **Regulatory/UX:** statuses read “Введено из файла — проверить по оригиналу”, *not* “Зарегистрирован ОЖР” or “Согласовано”; formal statutory journal, signatures and verified source file preservation remain later phases.

**Decision:** Stage A+B now, leave C–E explicitly planned. A single engineer's experience and vendor features are qualitative demand signals, **not a defensible numeric ranking** for the entire Russian construction market.


## Delivery notes (implementation stages A+B)

- Implemented `src/pto/ojr-import.mjs`: CSV with quoted fields, Russian date / ISO / Excel date serial conversion, `.xlsx` worksheet extraction using existing ExcelJS, explicit column mapping, exact-code match, rejected rows and duplicate suppression. Excel formula cached values are **not** used as diary evidence.
- Implemented `src/pto/ojr-ui.mjs` and optional panel in `src/pto/ui.mjs`: local file import with encoding fallback for legacy Windows-1251 CSV, mapping preview and rejection reasons, explicit confirmation, separate opt-in for filling **only blank** start/end dates. Existing act and signing dates are not rewritten.
- Automated unit and Chromium acceptance checks use fictional records. Exact user file `АОСР (Гурзуф).xls` is not an ОЖР, and no actual general journal was supplied; actual third-party export mappings and legal ОЖР completeness are **not** certified.
- Follow-up Stage C: store source journal bytes/hash in the local evidence vault and preserve source line identifiers. Stage D: verified Exon/Адепт adapters only with authorised representative examples.

## Verified local tests (30 October 2026)

- `npm run check:mvp`: ESLint, 36/36 Node tests, production Vite build and 10/10 serial Chromium browser tests passed. One end-to-end scenario covers Russian file headings, mapping, two accepted/two rejected rows, opt-in blank-only dates, local persistence and duplicate reimport blocking.
- XLSX tests use a synthetic date-cell and explicitly refuse formula-cached date values. No real OЖР document from the interviewed employee was supplied; source-system exports from Exon/Адепт are future Stage D fixtures, not verified integration today.
- Security and documentation: source file and journal metadata stay local; no customer records or actual site documents have been copied into the public repository. Certificate integrity and legal sign-off require independent professional review.
