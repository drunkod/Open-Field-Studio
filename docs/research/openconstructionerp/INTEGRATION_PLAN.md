# OpenConstructionERP → Russian PTO assistant: source-led integration plan

**Date:** 29 October 2026. **Upstream pinned commit:** 6032873c58e930e420af3d7fd483b61ea1b246d3.
**Our baseline:** Open-Field-Studio fork, branch feature/ru-aosr-ks2-prototype, commit 327e5f3.
**Status:** code research and implementation plan only. No OpenConstructionERP code copied into the fork.
**Primary evidence:** the employee interview notes in yura/docs/01_Интервью_и_задачи_ПТО.md, yura/docs/13_Полный_разбор_интервью_с_цитатами.md, and yura/docs/16_Interview_vs_MVP_audit.md.

## 1. Non-negotiable workflow

The interviewed roofing PTO engineer asked to prepare approximately 15 acts of hidden works (АОСР) from one Excel header and one table of changing work names, dates, scheme references and material certificates. Dates must be checked against the general works journal (ОЖР); measured quantities must be compared against the scheme and the estimator's КС-2. He expressly did not request automatic generation of engineering drawings.
Keep our existing editable Excel workbook, original-style print pack and human review at the center. A larger ERP must not force entry of estimating, tendering, procurement or finance data simply to print an АОСР.

## 2. Method: Code Graph, evidence and limitations

The upstream repository was reviewed by a shallow sparse clone with blob filtering. The repeatable local graph generator [build_code_graph.py](build_code_graph.py) parses Python manifest.py declared dependencies and static cross-module imports **without running upstream code**.
- [CODE_GRAPH.json](CODE_GRAPH.json): 20 inspected modules, declared dependencies, counted import statements and pinned source paths.
- [CODE_GRAPH.mmd](CODE_GRAPH.mmd): readable Mermaid dependency diagram. Arrow direction means “source depends on target”; dotted arrows mean observed static imports, **not proof of a runtime call**.
- Modules outside the sparse checkout may be referenced but were not inspected in depth. This is not a full runtime Code Graph or proof of endpoint behavior.
- Verified source statements are marked **[SOURCE]**; integration choices are **[PROPOSAL]**.

## 3. Relevant modules, verified entry points, and what to take

| Priority | Upstream component / exact source | Confirmed implementation detail [SOURCE] | Proposed use in our fork [PROPOSAL] |
|---|---|---|---|
| **P0** | [documents/service.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/documents/service.py#L621-L730), [revisions](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/documents/service.py#L889-L1025) | Upload and revision methods; depends on projects. | Real local attachment storage with SHA-256, provenance, version and per-act links, replacing filename-only fields. |
| **P0** | [submittals/schemas.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/submittals/schemas.py#L105-L175), [validators.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/submittals/validators.py#L113-L250), [tracking.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/submittals/tracking.py#L148-L263) | Review and decision statuses, reviewer/approver fields, revision and review-window checks. | Material certificate / passport review register with genuine manual evidence states and action history. |
| **P0** | [daily_diary/service.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/daily_diary/service.py#L227-L270), [field_diary/schemas.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/field_diary/schemas.py#L34-L112) | Canonical diary snapshot and SHA-256; separately modelled field diary entries and activities. | ОЖР source-reference import, immutable local snapshot history, date-to-act checks. Never represent this as a legally certified ОЖР. |
| **P1** | [progress/quantity_variance.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/progress/quantity_variance.py#L133-L235), [progress manifest](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/progress/manifest.py) | Decimal quantity variance, status and rollup; directly depends on BOQ. | Add design / installed / scheme / КС-2 quantities to the existing reconciliation table, with explicit source links and unit checks. |
| **P1** | [rfi/service.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/rfi/service.py#L141-L315), [rfi/schemas.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/rfi/schemas.py#L62-L170) | Requests, response workflow, drawing links and cost/schedule impact. | Journal of design deviations and RFIs: proраб → engineer → designer → decision, linked to acts but not auto-approved. |
| **P1** | [inspections/service.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/inspections/service.py#L65-L180) | Checklist structure validation and inspection records. | Link existing Open Field Studio inspections and photos to АОСР evidence; do not duplicate inspection UI. |
| **P2** | [cde/service.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/cde/service.py#L293-L350), [cde/manifest.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/cde/manifest.py) | State transitions, role gating and revision trail; depends on users, projects, documents, also imports additional services. | Lightweight document revisions and read-only provenance first; full ISO 19650 CDE later, separately integrated. |
| **P2** | [transmittals/logic.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/transmittals/logic.py#L78-L216), [transmittals/service.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/transmittals/service.py#L380-L548) | Issue blockers, sequence numbers, acknowledgements and responses. | АОСР handover register: package manifest, recipients, issue date, response and receipts. |
| **P2** | [changeorders/manifest.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/changeorders/manifest.py), [changeorders/service.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/changeorders/service.py) | Project/BOQ-linked scope changes and approvals. | Record approved design deviations and quantities as references, not a full financial change-order system. |
| **Defer** | [quality_concept/fsm.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/quality_concept/fsm.py#L14-L96), [links.py](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/quality_concept/links.py#L243-L378) | Evidence resolution and several distinct state machines, with dependencies on project governance, construction control, commissioning, closeout, etc. | Learn the separation between “evidence found”, “reviewed” and “officially accepted”; **do not transplant** the legal-effect or acceptance state machinery. |
| **Defer** | [boq](https://github.com/datadrivenconstruction/OpenConstructionERP/blob/6032873c58e930e420af3d7fd483b61ea1b246d3/backend/app/modules/boq/manifest.py) / CAD/BIM takeoff | Estimating and design quantity modules with broad dependencies. | Keep existing КС-2 import; optional read-only IFC/DWG/QTO adapter if engineer later supplies verified source files. |

**Code Graph observations:** submittals imports approval_routes (5 statements) and documents (2); cde imports documents (3), file_versions (3) and approval_routes (2); quality_concept imports project_governance (24), construction_control (23), requirements (15), commissioning (14). These are coupling indicators from static source, not execution frequencies.


## 4. Exact integration seam in our current Open Field Studio fork

| Current file | Existing role (verified in fork) | Planned extension |
|---|---|---|
| [src/pto/domain.mjs](../../../src/pto/domain.mjs) | The 15 acts, header, КС-2 rows and safeWorkspace() | Add versioned data migration; retain the existing JSON and Excel contract. |
| [src/pto/records.mjs](../../../src/pto/records.mjs) | ОЖР, quality-document and scheme registries; recordDiagnostics() | Link each register row to an actual evidence ID and validation status, not just a filename. |
| [src/pto/ui.mjs](../../../src/pto/ui.mjs) | Russian data-entry forms and readiness table | Add “Files and versions”, “Document review”, “Project deviations”, and “Handover” as *optional* collapsed panels; preserve minimal AОСР editing. |
| [src/pto/xlsx.mjs](../../../src/pto/xlsx.mjs) | Template-based 15-act XLSX, annex sheets, PDF-ready print values and reimport | Export evidence manifest, review register, and quantity discrepancy annex without changing approved act layout. |
| [src/pto/legacy-xls.mjs](../../../src/pto/legacy-xls.mjs) | Import of the employee's actual legacy .xls workbook | Keep the original import contract stable; new metadata remains optional. |
| [src/pto/source-layout.mjs](../../../src/pto/source-layout.mjs) | Reproduced act forms and page setup | No change to its visible act positions without a page-by-page print regression. |
| [src/pto/styled-template.mjs](../../../src/pto/styled-template.mjs) | Sanitised style-only layout | No customer information or uploaded documents committed to Git. |
| [tests/pto-records.test.mjs](../../../tests/pto-records.test.mjs) and [tests/e2e-pto-records.spec.mjs](../../../tests/e2e-pto-records.spec.mjs) | Current register and browser tests | Extend for file digests, state transitions, import roundtrips and immutable history. |

## 5. Target graph (new links, not copied upstream code)

See CODE_GRAPH.mmd for what actually depends on what upstream. Our proposed event/data flow is:

**Private source file → local file vault + SHA-256 → immutable revision reference → link to WorkItem/Act → human verification → warnings and readiness report → АОСР draft XLSX + separate evidence annex → reviewed handover manifest.**

Design constraints:
- Keep data on the device initially. Use browser IndexedDB for actual bytes with explicit export/backup; use Tauri local filesystem APIs when in desktop mode. Never place files in localStorage or Git.
- Keep a material record separate from its passport, certificate or declaration; multiple works may refer to one document revision. Do not infer an on-site batch from a document title.
- Refer to immutable revision IDs and content hashes rather than mutable filenames; digest comparison proves byte equality, not authenticity or legal validity.
- Distinguish unknown / missing reference / found file / reviewed by engineer / approved externally / expired. The last two must only follow a recorded human decision or real evidence, never just an automatic flag.
- Do not silently change the scheme number, work quantities, signed dates or design decisions based on OCR or model takeoff.
- Data export must be project-scoped, reversible and readable even if the app is removed.

## 6. Ordered implementation milestones with acceptance gates

### M0 — Freeze compatibility and decide reuse policy (before any copied code)
- Record current build, 25 unit tests and six Chromium tests; keep the source employee workbook and its 10 populated acts as PRIVATE regression fixtures.
- Define a workspace migration from version 1 to version 2, preserving 15 act slots, original imported header, three existing registers, КС-2 group references and print configuration. Legacy JSON and XLSX still reimport.
- Confirm AGPL and the existing fork's unresolved licence position with project counsel before copying code; use independently implemented patterns in the meantime.
- **Gate:** no loss of existing records or change in printed signatures, dates, merged ranges or page count.

### M1 — Actual local file vault (highest-value missing component)
- Create new files: src/pto/evidence-store.mjs and src/pto/evidence-manifest.mjs. Add an optional “Файлы и версии” panel.
- Add FileRecord, DocumentRevision and ActEvidenceLink entities. Include project ID, type, original filename, MIME, size, SHA-256, revision, storage key, importedAt, source type, reference act(s), reviewedBy, reviewedAt.
- Import passports, certificates, approved drawings, journal photos and KS-2 *as files*; deduplicate by hash with explicit review. Use IndexedDB and Tauri storage adapter, bounded sizes and guarded download paths.
- **Gate:** import two similarly named but different PDFs without overwriting; 1 file can support 2 acts; detect changed bytes; reload, JSON metadata backup and full file-bundle export/restore work offline; prohibit path traversal and dangerous browser content.

### M2 — Material submittal / certificate review (source: submittals)
- Create src/pto/document-review.mjs and a small “Проверка документов качества” panel.
- Record draft → submitted → under_review → returned/rejected OR reviewed; each event includes actor, timestamp, revision, comment and evidence link.
- In a single-user offline MVP, “reviewed by” is a self-recorded assertion, NOT an authenticated organizational approval. Stronger roles require backend access control and audit trail later.
- Add configurable review due dates and an explicit warning for certificate expiry where expiry is legally relevant; neither OCR nor an unexpired date establishes compliance.
- **Gate:** any new revision resets prior review conclusion; reviewer fields cannot be modified silently via a simple document edit; history survives exports; no false “approved” status.

### M3 — OЖР provenance and chronology (source: daily_diary / field_diary)
- Extend src/pto/records.mjs with JournalSource, JournalEntry, EntryRevision, and a per-act link to page/entry/date. Add CSV/XLSX import mapping with preview, never rewrite the source document.
- Canonicalise entries and create deterministic SHA-256 snapshot digests with sorted keys/rows, record former hash when edited. An offline digest is not an official signature.
- Permit overlapping work intervals; flag dates outside a linked work period, missing journal source, duplicate references and chronological anomalies for a person's review.
- **Gate:** 10 real source acts import unchanged; inserting an older diary record preserves traceability; changed imported file is detected; no automatic legal claim about the OЖР.

### M4 — Quantity evidence and КС-2 reconciliation (source: progress/quantity_variance)
- Extend src/pto/domain.mjs and src/pto/xlsx.mjs with QuantitySource and QuantityObservation keyed by actNo, ks2PositionId, unit and source revision.
- Compare planned/project, physically documented scheme and КС-2 quantities using current six-decimal fixed-point/BigInt approach; no float rounding. Group multiple acts to one КС-2 item and require exact unit equivalence or explicit vetted mapping.
- Show three-way deltas, source dates and a human sign-off note; do not equate КС-2 financial acceptance with engineering completion.
- **Gate:** exact unit mismatch is blocked from numeric comparison; missing scheme volume reports “not checked”; changing КС-2 source invalidates previous comparison; new annex has no customer personal data.

### M5 — Designer queries, deviations and issue follow-up (source: rfi, changeorders)
- Create src/pto/project-deviations.mjs for DesignQuery, ChangeNotice, Resolution, affected act/scheme and submitted/answered/closed states.
- Require source drawing revision and a human-entered designer decision before showing a resolved deviation; use no automatic construction design changes.
- Integrate with existing Open Field Studio inspection issues instead of adding a second defect-tracking system.
- **Gate:** a reopened RFI invalidates its former “resolved” badge on linked acts; a changed scheme revision surfaces in the readiness report, not a silent overwrite.

### M6 — Handover dossier and transmittals (source: transmittals, cde)
- Implement a manifest of 10–15 printed acts plus linked evidence revisions, scheme PDFs, certificate register, OЖР cross-references and the optional КС-2 comparison annex.
- Track prepared/issued/acknowledged/returned statuses with recipient and timestamp; exported zip or folder manifest includes hashes and evidence provenance.
- “Acknowledged” requires a recorded receipt, not a click on export. Signing remains a separate legally evaluated workflow.
- **Gate:** two regenerations from unchanged inputs produce equivalent document manifests; missing evidence is visibly flagged; 2/3 requested paper copies can be printed without changing act content; recipient and acknowledgement are not fabricated.

### M7 — Optional larger-company integration; NOT for the first engineer pilot
- Only after the Excel-first process has user acceptance, investigate independent OpenConstructionERP deployment through versioned REST APIs for BOQ/quantities, CDE or project management.
- Full quality_concept, CDE, BIM takeoff, AI estimating, scheduling, procurement and finance are out of the first scope because of coupling, dependencies and legal review.
- **Gate:** dedicated security review, migration plan, AGPL obligations and latency/backup tests; fallback to local XLSX/JSON if the optional service is unavailable.


## 7. Testing, security and project acceptance

**All stages:** retain the current 25 unit tests / 6 serialised browser tests, run lint and production build, import→export→reimport round trips, language regression for every new Russian control, and private page-by-page print comparison.
- Privacy: only synthetic data in public Git; original employee XLS, personal identifiers, site documents and real attached PDFs remain outside the repository.
- Security: hash file bytes locally, prohibit untrusted filename/path traversal, inspect file signatures/MIME, limit file sizes, enforce project boundaries, escape HTML, guard CSV/Excel formulas and eliminate accidental cloud uploads.
- Statuses: separate a technical warning, a user's review decision, actual signed approvals and documents accepted by a client. Do not present simple file presence as “verified”.
- Licensing: OpenConstructionERP ships AGPL-3.0; direct incorporation and especially network-hosted derivatives may require source disclosure. Check every subdependency and the existing fork's own unresolved upstream software-licence position. This document **does not authorise copy/paste or relicensing**. Request legal clearance or explicit compatible permission before reusing source code.
- Accuracy: quantity checks need original КС-2 documents and verified as-built quantities; calendar checks need actual journal pages; authentic certification/legality needs a responsible qualified person. No new module alone can certify an АОСР.
- Offline: document manifest and review history must survive app restart and an independent backup/restore with no external server.
- Versioning: reimport old version-1 JSON and XLSX with no missing acts, and no loss of existing OЖР/material/scheme text or the Russian translation.

## 8. Recommended first implementation slice

**Build M0 → M1 → M2 first.** This immediately closes the largest gap left by our previous register implementation: we currently store passport and scheme **filenames**, not the evidence bytes, revisions or review history. After that, M3 integrates real ОЖР and M4 improves КС-2 comparisons. Delay transmittals and broad ERP until a specialist has tried the original Excel-first workflow.

A user-acceptance trial should measure actual manual edits, export-to-print time, missing-evidence warnings caught, corrections returned by the client, and which imported documents still require engineering interpretation. These are **measures to collect**, not invented productivity guarantees.

## 9. Reproducibility and evidence

1. Sparse upstream checkout: /Users/test/Documents/work/yura/Documents/Source-Repositories/OpenConstructionERP, pinned to commit 6032873c58e930e420af3d7fd483b61ea1b246d3. Git checkout contains only selected modules; no upstream installation or test suite was run.
2. Regenerate the graph with: python3 docs/research/openconstructionerp/build_code_graph.py /Users/test/Documents/work/yura/Documents/Source-Repositories/OpenConstructionERP.
3. Compare graphs against a new upstream commit before using code paths, since its repository and module APIs can change.
4. Local baseline of our fork when research began: commit 327e5f3 on feature/ru-aosr-ks2-prototype; the plan itself does not add product features or legal approvals.

**Decision:** proceed with original JavaScript implementation of the file-evidence and review patterns first; reconsider embedding or independently deploying AGPL components only after a license and architecture assessment.
