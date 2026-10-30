# Stage: compact Russian АОСР input for a ПТО engineer

**30 October 2026 · Written before implementation.** Goal: remove repeated editing friction while retaining existing source workbook, advanced inputs, data provenance and draft-only status.

## Evidence

- Interview analysis: the private Yura interview-to-MVP audit is retained outside the public fork (not copied to Git). Quote: «Хотелось бы менять только несколько граф в этом акте. Не все, а только три-четыре». Required changing groups are **work**, **dates**, **scheme title/sequence reference**, **passports/certificates**. The engineer explicitly excludes automating original executive drawings.
- Public Russian comparison: [АЛТИУС — исполнительная документация](https://www.altius.ru/program/ispolnitelnaya-dokumentaciya/) discusses entering shared data once and propagating them between journal and acts; this is vendor-reported behaviour, not an independent popularity measure.
- [Smeta.RU partner overview](https://smeta.ru/partner-products/altius) repeats one-time-entry workflow; no proprietary source is copied.
- Existing fork: `src/pto/ui.mjs` renders 15 acts with ten visible column fields; `src/pto/domain.mjs` and `src/pto/xlsx.mjs` already preserve advanced KS-2 fields and export logic. This project only needs a presentation-level change.

## Implementation plan and acceptance criteria

1. Add **Краткий ввод** (default for new sessions) and **Все графы** mode controls directly above the 15 acts. Both act on the *same* `data.acts`, retaining unchanged existing JSON, xls import and xlsx export schemas.
2. In compact mode show a 15-item selectable list/accordion. Expanded act editor has just **three grouped panels**: work name; start/end/act dates; confirmed scheme No + passports/certificates (four underlying variable categories). Present a suggested sequential scheme number as explicitly *unverified*, never auto-write to the confirmed field. Show act No as read-only; editing numbers, quantities, units, KS-2 IDs and other details remains in **Все графы**.
3. Prevent data loss: edits should persist immediately to local workspace; switching compact/full mode must preserve all fields including advanced quantity, previous confirmed scheme, text, dates and evidence links. Do not replace or clear hidden values.
4. Accessibility: label every input, keyboard-operable mode buttons, active button with `aria-pressed`, and native `details/summary` for act selection; unfilled slots remain available, no hidden disabled data entry.
5. Backward compatibility: existing full table and all Excel workflows must be preserved. Existing older browser regression tests should explicitly switch to `Все графы` when testing full-column operations; add new browser tests for fast edit, persistence, two-way switching and export.
6. Capture fresh synthetic Russian screenshots for compact and advanced act modes under `Documents/Demo Runbook/screenshots/`, update atlas and staff runbook, link this plan from audit. No real employee data in Git.
7. Run complete lint, unit, build, Chromium tests; publish verified results to draft PR #1. No legal/compliance claim: approval of original AОСР print form remains outstanding.

## Exclusions

No automated executive scheme creation, no fabricated verified scheme numbers or passports, no new obligatory data or automatic act approvals. This is a workflow simplification, not a regulatory converter.


## Delivered prototype and limits

- Source `src/pto/quick-entry.mjs`: 15 native `<details>` panels. Each expanded act exposes only **work**, **dates** and **scheme/material documents** groups; scheme No remains unverified until typed from the original. Work edits update the card title. All act fields are saved to the original workspace objects, with no extra schema.
- `src/pto/ui.mjs`: default **Краткий ввод — 3 группы** and optional **Все графы — подробный режим**. The full ten-column table still works; values are re-rendered from the same acts on every switch. All source/print/XLSX/ZIP/JSON operations stay unchanged.
- Regression: `tests/e2e-pto-quick-entry.spec.mjs` tests six quick-edit fields, advanced quantity retention, mode switching, local reload and no JavaScript page errors; older advanced editor tests opt in to full mode explicitly.
- Actual Russian screenshots: `Documents/Demo Runbook/screenshots/34-pto-quick-act.png` (one expanded act) and `33-pto-full-acts.png` (legacy full view); the screen atlas and PTO runbook explain both.
- This does not validate or print a legally approved official form, prepare original CAD execution drawings, issue scheme numbers as verified, or generate original passports/certificates.

## Regression and visual evidence (30 October 2026)

`npm run check:mvp` passed **ESLint, 36/36 Node unit tests, Vite build and 13/13 Chromium browser tests**. The dedicated quick-entry test covers compact editing, advanced quantity preservation, view switching and persistence after reload. The screenshot manifest contains **34/34 real Russian captures**, including 33 (full) and 34 (compact), with **zero page JavaScript errors**. Original customer-approved AОСР paper layout and legal signatures have not been accepted.
