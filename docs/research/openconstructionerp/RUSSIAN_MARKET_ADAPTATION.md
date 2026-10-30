# Russian construction market validation and updated integration roadmap
**Research date:** 29 October 2026. **Upstream:** OpenConstructionERP commit `6032873`. **Status:** researched user needs + targeted implementation, NOT certified regulatory compliance.

## Distinguish evidence classes
- **Regulations:** Minstroy Order **344/пр of 16 May 2023**, as amended by **369/пр of 23 June 2025** (effective 1 March 2026), governs executive documentation; its Appendix 3 is the recommended АОСР form. Electronic executive documentation follows the applicable XML scheme where one exists, and fallback formats under clause 5 in the defined circumstances. PDF/XLSX draft output by itself is NOT a signed electronic executive document. Sources: [344/пр consolidated](https://sudact.ru/law/prikaz-minstroia-rossii-ot-16052023-n-344pr/); [369/пр](https://base.garant.ru/412373476/53f89421bbdaf741eb2d1ecc4ddb4c33/); [Minstroy letter on recommended form](https://www.consultant.ru/document/cons_doc_LAW_516777/).
- **ОЖР:** Order **1026/пр of 2 December 2022** governs the general works journal; legally maintained electronic journals are not ordinary local notes. XML and an A4-readable print representation matter. Source: [1026/пр](https://base.garant.ru/406064781/); [construction-stage XSD availability](https://kodeks.ru/news/read/vstupili-v-deistvie-xml-sxemy-dlia-etapa-stroitelstva).
- **Practitioner experience, NOT law:** [ExcelWorld engineer discussion](https://www.excelworld.ru/forum/3-21585-1) describes single-entry common project details, tabular act generation, certificate references, and Word outputs; [IspDoc Russian community discussion (22 Oct 2026)](https://www.reddit.com/r/ru_linux/comments/1xcnoka/) emphasizes an offline Linux workflow and import from Russian estimate software. These show demand, not measured market shares or formal requirements.
- **Corporate retrospective, NOT neutral benchmarking:** [PIK BuildDocs rollout, 17 Aug 2026](https://habr.com/ru/companies/pik_digital/articles/1071154/) reports that only 4 of 34 surveyed pilot users found the new process convenient, with many complaining about extra clicks. The sample is small and self-reported. [Sminex case, 10 Apr 2026](https://habr.com/ru/companies/sminex_developer/articles/1021940/) emphasizes status tracking, approvals and API access; vendor and company results should not be generalized.
- **Market references:** [Adept](https://gk-adept.ru/programmy/adeptispolnitelnaya_dokumentaciya/), [Exon ИТД help](https://exon.visgis.usedocs.com/article/83531), [HARDROLLER](https://hardroller.ru/), and [Russian software registry list](https://base.garant.ru/412265818/) demonstrate an existing market for АОСР, ОЖР, inspection and approval. Vendor features are stated claims, not independently benchmarked.
- **Estimating interoperability:** [ГРАНД-Смета XML export](https://help.grandsmeta.ru/ob-ekty-i-smety/eksport-smet-v-razlichnye-formaty/eksport-v-format-xml), [ГРАНД-Смета КС-2 Excel output](https://shop.grandsmeta.ru/whatisthenewversion), and [Smeta.RU KS-2 XML export](https://master-smeta.ru/help-smetaru-9/vypolnenie-rabot/akty-priemki-vypolnennykh-rabot-ks-2/eksport-i-import-aktov-ks-2/193-eksport-akta-ks-2-v-formate-xml.html). Do not confuse estimate XML with Minstroy executive-document XML.

## Fit of OpenConstructionERP components in the Russian PTO context

| Component from source graph | Practical fit (1–5) | Localisation gaps / necessary adaptation | Decision |
|---|---:|---|---|
| Documents + revisions | 5 | Cyrillic filenames, offline storage, site/batch passport identity, versioned attachment and privacy controls | **Implement now:** private local file vault, SHA-256, act links and revisions |
| Submittals/review | 4 | Russian contractors, customer/строительный контроль/author-supervision roles, real signatories, corrections and deadline history | Next: review as manually recorded process, not legal e-signature |
| Daily diary / field diary | 4 | Adapt to ОЖР 1026/пр and its XML schema; section/page, entry date, evidence provenance; avoid fake statutory journals | Next: import/read-only source and chronology reconciliation |
| Progress + BOQ | 4 | Russian cost item norms, КС-2/КС-3, ГРАНД-Смета/Smeta.RU formats, comma decimals and Russian measurement units | Next: typed XLSX/XML adapters, three-way quantity evidence |
| RFI + change orders | 3 | РД revisions, requests from прораб/ПТО, designer's documented permission and client approval | Introduce deviations register after linked evidence |
| Inspections + punchlist | 4 | Existing OFS inspection UX must be reused; terminology “замечание/предписание/устранено” | Link records rather than duplicate |
| CDE + transmittals | 3 | Russian customer processes, exportable archives, УКЭП/УНЭП and МЧД subject to applicable rules, versioned XSDs | Optional after server authentication and legal review |
| Quality-concept, IFC takeoff, finance | 1–2 | Foreign standards, broad module dependencies, mismatched legal roles/acceptance definitions | Defer and do not present as Russian compliance engine |

**Key risk:** native localisation is more than translating menus. OpenConstructionERP does not automatically produce Russian legally compliant АОСР, ОЖР, КС-2, XML schemas or legally valid signatures for our use case. Every relevant module needs a Russian data/role/format adapter and specialist acceptance.


## Domestic-software integration strategy and delivery sequence

### RU0 — Regulatory and user-workflow profile (before electronic filing)
- Maintain a versioned **RU document profile**: source order number/edition, status/review date, contract-approved act template ID, form type, required roles, whether paper or legally valid electronic filing has been authorised by parties. Expert approval needed; no “compliant” badge based on template alone.
- Provide forms based on 344/пр (recommended Appendix 3, and permitted approved alternatives) and ОЖР 1026/пр only after professional validation. Preserve original customer's XLS layout for his pilot even if it differs; warn of discrepancies and request an approved template.
- Keep input efficient: 15 act rows, one shared header, autofill suggestions marked unconfirmed, advanced registers collapsed and optional. Benchmark clicks and elapsed time against the engineer's actual workbook.
- Keep Russia-specific terminology (АОСР, ИД, ОЖР, КС-2/КС-3, ИС, входной контроль), date format DD.MM.YYYY in reports and comma decimal quantities; store ISO dates and fixed-point values internally to prevent ambiguity.

### RU1 — Private evidence files and provenance (**implementation begins now**)
- Add IndexedDB-based local attachment storage with SHA-256 checksums and revision numbers. Associate passports/certificates and executive drawing files with act IDs; support Cyrillic filenames.
- Protect users from malicious filenames and unsupported executable formats; show explicitly which records are merely **saved**, versus reviewed by engineer. Do not upload data to a cloud service.
- Provide a separate binary-inclusive backup for evidence; regular JSON/XLSX may contain metadata only. Until backed up, remind the user that browser storage may be cleared.
- **Acceptance:** Cyrillic PDF, JPG, XLSX, XML and DWG files can be imported and downloaded byte-for-byte; reload retains records; two versions are preserved; act links survive; unsupported executables are rejected. Test without real employee data.

### RU2 — Russian certificates and document control
- Require issuer, batch/material and document type only when relevant; do not treat a nominal expiry date or self-entered manufacturer as authenticity evidence. Include incoming quality-control journal reference (журнал входного контроля), status and reviewer history.
- Compare the document review workflow with Адепт/Exon/HARDROLLER behavior at a feature level, not by copying vendor formats; permit export to ordinary XLSX/CSV and a documented JSON schema.

### RU3 — ОЖР and formal executive-document formats
- Separate a **draft diary reference** from formally maintained ОЖР under 1026/пр. Import journal section 3 entries, pages and approved timestamps when present, retaining source identity and file hash.
- Implement a versioned adapter against Ministry-published XSD for each actual supported document type. Validate with trusted XSD and local regulatory expert; no generic XML exporter advertised as compliant.
- For electronic signature use a separate regulated adapter for qualified or infrastructure-based enhanced non-qualified signatures as applicable, certificate checks, role authority and MЧД. SHA-256 is only content integrity evidence, not electronic signature.

### RU4 — Russian estimating and tendering compatibility
- Current CSV/XLSX КС-2 mapping remains the fallback. Add tested import adapters for **ГРАНД-Смета 2026.x** export and **Smeta.RU** act XML only after obtaining anonymised representative samples and schema/vendor permission.
- Map invoice/estimate position IDs, work descriptions, units and quantities; validate many АОСР to one КС-2 position; retain design vs measured vs submitted/accepted quantity provenance. Do not assume the КС-2 quantity equals inspected work or that КС-2 is mandatory on every contract.

### RU5 — Pilot and market delivery
- First pilot is a single engineer and his **private** Gurzuf workbook: same act layout, 15 slots, no duplicate entry, error review, no forced accounts or cloud. Only synthetic examples in public Git.
- Evaluate Windows Excel 2016/2019/2021/365, LibreOffice, desktop Tauri on Windows/Linux, and offline browser; public GitHub availability alone is not evidence of registry status as domestic software.
- Export openly documented XLSX/CSV/JSON and (when validated) DOCX/PDF/XML; future integrations with 1С and Russian e-ID providers should be optional adapters, not an unavoidable vendor lock-in.
- Before selling to state-funded customers, investigate registry listing, location of personal data, contracts, infosec controls and procurement constraints separately; the fork is **not** automatically in the Russian software registry.
- Acceptance research: recruit ≥3 Russian PTO engineers, 1 estimator and 1 construction-control signatory; measure clicks, missing certificates caught, false positives, print fidelity and actual approval cycles; do not extrapolate corporate case-study savings.

## Implementation dependency changes to the previous plan

Insert RU0 before M0. Implement M1 and RU1 together, preserving user data via workspace migrations. Next implement RU2 with review statuses, then M3/RU3 and M4/RU4 in that order. Defer heavy CDE, finance, foreign standard identifiers and production signing to a separate properly resourced server project.

## References in the existing fork

[OpenConstructionERP source dependency graph](CODE_GRAPH.md) · [Original eight-stage integration plan](INTEGRATION_PLAN.md) · [PTO daily register notes](../../PTO_DAILY_MODULES_RU.md).

The source communities demonstrate workflows and preferences, **not** certification, sector-wide survey data or suitability for every Russian project.
