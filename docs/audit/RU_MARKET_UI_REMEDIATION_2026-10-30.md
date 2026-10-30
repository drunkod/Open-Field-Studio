# Russian UI remediation — address registry and external integrations

**Date:** 30 October 2026. **Base:** audited fork and `docs/audit/WHOLE_SYSTEM_RU_AUDIT.md`. **Purpose:** correct first-order misleading Russian-market affordances without inventing integrations.

## Evidence and sources

- [ФНС: официальный ФИАС/ГАР](https://www.nalog.gov.ru/rn77/service/fias/) identifies the Federal Address Information System and State Address Register, administered by ФНС.
- [Официальный портал ФИАС](https://fias-file.nalog.ru/) provides manual address search and developer resources. It does **not** mean our fork is an authorised FIАS API client.
- [Reference describing FIАS integration methods](https://www.consultant.ru/document/cons_doc_LAW_531681/ff850d27514bc742e55aa77db5c6ac1998f0a75e/) discusses FIАS APIs, structured address fields and ID FIAS; actual terms and endpoint readiness require approval.
- [Минстрой 344/пр consolidated](https://base.garant.ru/406969808/), amended by [369/пр](https://base.garant.ru/412373476/) effective 1 March 2026, remains separate from address entry. Nothing in this UI patch makes acts compliant or formally signed.
- [Source audit](SOURCE_REGISTER.md) distinguishes international inherited connectors, domestic vendor comparisons and source-code reuse.

## Sequential remediation plan (safe prototype slice)

1. **Russian address mode:** when `lang==='ru'`, hide the Netherlands BAG and EP-online actions/badges from the Project screen, preserve the user-editable address fields and show a clearly labelled official **manual FIАS search** link with a note that results must be copied and checked by the operator. Do not claim validation, do not call an unknown API, and do not send the entered project address to the portal.
2. **Other languages:** retain original BAG/EP-online functionality for NL/EN/DE/FR (including a language switch in the current session). Hide the FIАS affordance when not Russian.
3. **Russian connector guidance:** show a concise, visible warning on the Integrations page that existing provider connectors are inherited international options; they are **unconfigured and not domestic/1С/Exon/ГРАНД-Смета certified integrations**. Keep configuration possible for organisations that intentionally use these providers.
4. **Translation catalog:** add exact keys in all five locale JSON catalogs without changing existing translated keys; keep Russian interface default and avoid duplicate i18n DOM nodes.
5. **Automated verification:** Playwright fresh RU page, language switch RU→EN→RU, external link security attributes, no BAG/EPOL labels shown RU, no false “verified” claim, no programmatic network calls for address; capture new screenshots of corrected project/integrations pages, run full previous regression.
6. **Documentation:** new screenshots and source citations in the existing `Documents/Demo Runbook`; update findings as **remediated in UI**, while authentic FIАS API lookup and domestic connectors remain **unimplemented**.

## Acceptance boundaries

No client project data is sent from this manual link (static URL). Manual FIАS lookup is an information reference, **not automatic address validation**. Nor are optional foreign connectors turned into domestic services by a translation. Legal form compliance and role/signature review remain separate P0 requirements.


## Implemented and tested

- Russian locale now hides Netherlands BAG and EP-online address/energy controls and suppresses any previously loaded BAG verification badge. Manual address inputs remain editable and a link to the official FNS FIАS/ГАР site appears; no project address is included in the URL.
- The Integrations page shows a Russian-only caution about inherited international services, without breaking configurations for other language users.
- 3 new translation keys were added to all 5 locale catalogs. The English (international) mode continues to show the original BAG action.
- New tests: `tests/e2e-russian-market-profile.spec.mjs`, two Chromium scenarios for Russian mode, inherited verification badge suppression and RU→EN→RU switching; **2/2 passed**. The screenshot manifest now includes screens 31 and 32, **32/32 captured**, no JavaScript page errors.
- **Still not implemented:** machine-verifiable FIАS ID resolution, secure FIАS API/authentication, address-copy integration, domestic estimating connectors, qualified e-signatures, customer-authorised print forms.

### Final regression checkpoint

The complete `npm run check:mvp` passed: **ESLint, 36/36 Node unit tests, Vite production build and 12/12 Playwright Chromium tests**. Screenshots regenerated from synthetic data: 32/32 screens, RU locale, zero browser page errors. New sources appended to the source provenance index (168 unique references). Outstanding production acceptance: official address ID/API lookup, verified Russian integrations, original form/page fidelity and legal e-signatures.
