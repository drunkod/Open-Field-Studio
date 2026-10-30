# Studied open-source clone inventory — licences and reuse

**Copied as provenance notes** from the local research manifest in the parent Yura project, as it existed on 30 October 2026. The Git repositories themselves and customer data are NOT being copied into this fork.

There were 11 locally cloned candidates; separate OpenConstructionERP (AGPL-3.0) was subsequently studied. This inventory records the full search field, including projects not selected.

| Project | Origin | Local folder | Commit SHA | Licence / restrictions |
|---|---|---|---|---|
| ПрорАКТ | [https://github.com/Sereban-glitch/proakt-build-bot.git](https://github.com/Sereban-glitch/proakt-build-bot) | `proakt-build-bot/` | `fb2171ba3363` | MIT |
| КС-2 Analyzer | [https://gitverse.ru/aleaivanov/agent-ks2.git](https://gitverse.ru/aleaivanov/agent-ks2) | `agent-ks2/` | `8c5701c36787` | НЕ УКАЗАНА (LICENSE не найден) |
| RPAForge | [https://github.com/chelslava/rpaforge.git](https://github.com/chelslava/rpaforge) | `rpaforge/` | `95b419d82f14` | Apache-2.0 |
| Daily construction log | [https://github.com/gba-mep/daily-construction-log.git](https://github.com/gba-mep/daily-construction-log) | `daily-construction-log/` | `e9d1307ed5f0` | MIT |
| Construction project records | [https://github.com/constructelligence-lab/construction-project-records.git](https://github.com/constructelligence-lab/construction-project-records) | `construction-project-records/` | `7e0e2ac4ed7e` | MIT (код), CC BY 4.0 (материалы) |
| Mobile field inspections | [https://github.com/FolderITDev/mobile-field-inspections.git](https://github.com/FolderITDev/mobile-field-inspections) | `mobile-field-inspections/` | `6c5b7d312043` | MIT |
| AEC Open Source Directory | [https://github.com/opensource-construction/osc-directory.git](https://github.com/opensource-construction/osc-directory) | `osc-directory/` | `3f7fad0468da` | MIT |
| Excel Template Filler | [https://github.com/gba-mep/excel-template-filler.git](https://github.com/gba-mep/excel-template-filler) | `excel-template-filler/` | `713220bfd25c` | MIT |
| Python-docx Photo Grid | [https://github.com/gba-mep/python-docx-photo-grid.git](https://github.com/gba-mep/python-docx-photo-grid) | `python-docx-photo-grid/` | `0d58fbe9f3a6` | MIT |
| Fieldjig | [https://github.com/eli-reid/fieldjig.git](https://github.com/eli-reid/fieldjig) | `fieldjig/` | `45bf33923c66` | Apache-2.0 |
| Open Field Studio | [https://github.com/OpenAEC-Foundation/Open-Field-Studio.git](https://github.com/OpenAEC-Foundation/Open-Field-Studio) | `Open-Field-Studio/` | `433b34edca3594539` | UNRESOLVED: README CC BY-SA 4.0, no software LICENSE file |

## Reuse decision per category

- Used as **patterns only**: daily-construction-log, construction-project-records, mobile-field-inspections, excel-template-filler and proakt-build-bot. No source file from these projects was transplanted.
- Evaluated but **not copied**: rpaforge, osc-directory, python-docx-photo-grid and fieldjig; not essential to the 15-act engineer pilot.
- **Do not copy code** from agent-ks2 until redistribution terms are established; its cloned source did not expose a licence.
- **Critical license review before release:** Open Field Studio upstream has no unambiguous standalone software LICENSE file in the examined clone; README CC BY-SA does not resolve every source-code right. Project owner/counsel must determine redistribution obligations.
- **OpenConstructionERP**: https://github.com/datadrivenconstruction/OpenConstructionERP — AGPL-3.0; studied at commit 6032873, patterns only. See static code graph and integration plan.
- Direct dependencies actually used in PTO: ExcelJS 4.4.0 MIT, xls-reader 0.7.0 MIT, JSZip 3.10.2 dual MIT/GPL-3.0-or-later under MIT option. Versions checked against installed local package metadata.

## Traceability rules

Use each repository URL, commit hash and a licence check before code reuse. A publicly available GitHub/GitVerse repository is not automatic permission to copy or redistribute. Supplier and repository examples do not establish Russian regulatory conformity.
