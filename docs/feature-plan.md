# AI Providers DB – Feature Expansion Plan

## Summary of Requests

1. Combine the current two provider data sources (`initialData.json`, `batch2.json`) into a single canonical database file.
2. Ensure capability indicators (Web / API / SDK / etc.) render correctly; if the data is incomplete, augment it with accurate values.
3. Introduce provider detail views reachable from the main list.
4. Extend the data model to capture OpenAI compatibility metadata (API key portal link, compatible endpoint URL, compatible model names) and surface it in the UI.
5. Display detailed model availability and pricing on the new detail page.

## Current State Assessment

- Data is split between `provider-data/initialData.json` (JSON) and `provider-data/batch2.json` (JavaScript object). The app merges them at runtime and caches in `window.storage`.
- Capability badges are generated from the `client_types` array and styled client-side; no explicit boolean flags exist.
- The UI is a single-page React component rendered via `createRoot` and bundled with esbuild. There is no routing or detail view.
- The `ProviderData` TypeScript interface lacks OpenAI compatibility metadata, model pricing breakdowns, and explicit structure for per-model pricing.

## Data Model Changes

- Create a single unified JSON file (e.g., `provider-data/providers.json`) containing all providers.
- Extend each provider entry with:
  - `capabilities` (normalized list derived from `client_types`) to support consistent badge rendering.
  - `openai_compatible` object with fields:
    - `isCompatible: boolean`
    - `apiKeyPortal?: string`
    - `endpointDocs?: string`
    - `supportedModels?: string[]`
  - `models` array of objects to describe individual offerings:
    - `name: string`
    - `availability: 'free' | 'paid' | 'both'`
    - `pricing?: { unit: 'per_token' | 'subscription' | 'flat'; inputCost?: string; outputCost?: string; monthlyCost?: string; notes?: string }`
- Update TypeScript types and load logic to reflect the new structure.
- Establish a canonical capability taxonomy to drive normalization. Proposed internal keys and display labels:
   - `web_app` (aliases: `web`, `web app`, `browser`) → **Web App**
   - `api` (aliases: `http`, `rest`) → **API**
   - `sdk` (aliases: `client`, `library`) → **SDK**
   - `cli` (aliases: `command line`) → **CLI**
   - `desktop` (aliases: `app`, `native`) → **Desktop App**
   - `mobile` (aliases: `ios`, `android`) → **Mobile App**
   - `ide` (aliases: `ide extension`, `plugin`) → **IDE Extension**
   - `integration` (aliases: `zapier`, `make.com`) → **Integration**
   - `other` reserved for values that cannot be mapped; log and review during migration.
   - Store both the canonical key list and the display label map in code to keep data and UI synchronized.

## UI / UX Updates

- Replace the current badge logic with a dedicated capability mapper that reads from the normalized `capabilities` list.
- Add routing using a lightweight solution (e.g., `react-router-dom` or a custom hash-based router) to support:
  - `/` → “All Providers” list (existing view)
  - `/provider/:slug` → Detailed provider page
- On the detail page, display:
  - Provider hero section (name, website, capability badges, OpenAI compatibility status)
  - Detailed tier information (reuse free/paid tier copy)
  - Models table or cards showing availability and pricing
  - Links for API key portal and compatibility docs when available
- Ensure navigation back to main list (breadcrumb or top link).

## Implementation Steps

1. **Data Consolidation**
   - Merge `initialData.json` and `batch2.json` into `provider-data/providers.json` following the new schema.
   - Deduplicate providers by canonical slug. Prefer the entry from `batch2.json` when conflicts arise, but merge in non-empty fields from `initialData.json` to avoid regressions.
   - When field values differ, prioritize structured data (arrays/objects) over free-form strings and record discrepancies in a temporary migration log for manual review.
   - Update build script to copy the single file.
   - Remove legacy files and parsing logic.
   - Generate provider slugs using a deterministic kebab-case transform of the provider name. Allow an optional `slugOverride` field in data to handle collisions or non-Latin names.
   - If a slug cannot be derived or conflicts remain after overrides, block the merge and surface the issue in the migration log rather than silently skipping the provider.

2. **Type and Loader Updates**
   - Update TypeScript interfaces for the new data shape.
   - Refactor data-loading logic to fetch the unified JSON file and populate state (including metadata caching).
   - Adjust caching metadata to record the single source path.
   - Add a `typecheck` npm script (`tsc --noEmit`) and include it in CI/local validation to catch schema drift early.
   - Enforce runtime validation: when `openai_compatible.isCompatible` is `true`, require `supportedModels` to be a non-empty array and at least one of `apiKeyPortal` or `endpointDocs` to exist. Log descriptive errors if validation fails.

3. **Capability Indicators**
   - Normalize capability strings using the taxonomy above (case-insensitive match against aliases).
   - Provide a mapping for display labels and ensure badges render for all providers.
   - Annotate providers that still contain unmapped capability strings so we can reconcile them before enabling the new UI.

4. **Routing and Structure**
   - Introduce routing (likely `react-router-dom` for clarity) and reorganize components into:
     - `ProviderListPage`
     - `ProviderDetailPage`
     - Shared UI components (badges, tier cards, etc.)
5. **Detail Page Content**
   - Present free/paid tier details, models list with pricing, and OpenAI compatibility block.
   - Highlight capability badges and provide direct links to website/API docs.
   - When a provider lacks structured `models` data, surface a "Model catalog coming soon" stub with links to documentation instead of leaving the section empty.
   - Include pricing notes even when numeric pricing is unavailable to avoid gaps in the UI.

6. **OpenAI Compatibility Block**
   - Add a prominent section summarizing compatibility status, key URLs, and supported model names.
   - Treat `supportedModels` as required when compatibility is true; if missing, flag during data ingest and do not mark the provider as compatible until resolved.

7. **Testing & Validation**
   - Verify list view still supports search/filter.
   - Confirm capability badges display for all providers.
   - Test navigation between list and detail pages.
   - Validate caching logic (refresh, reload) and metadata display.
   - Run `npm run build` to ensure bundle compiles without errors.
   - Run `npm run typecheck` (new script) or `npx tsc --noEmit` to validate types against the new schema.
   - Add targeted unit tests for the capability mapper, slug generator, and OpenAI compatibility validation helpers.
   - If new routing utilities are introduced, include tests to cover fallback navigation behavior.

## Data Normalization & Migration Checklist

1. Export both legacy data sources to a temporary working directory and run a diff to identify overlapping providers.
2. Generate canonical slugs for every provider; review collisions and add `slugOverride` entries where needed.
3. Apply the capability taxonomy mapping and produce a report of unmapped values for manual remediation.
4. Merge provider records, preferring structured data and marking unresolved conflicts in the migration log.
5. Validate that every provider has at least one capability and that compatibility rules (e.g., required `supportedModels`) are satisfied.
6. Backfill missing model pricing notes or add TODO markers before finalizing the unified dataset.
7. Once validation passes, delete legacy data files and update documentation to reference only `provider-data/providers.json`.

## Open Questions / Follow-ups

- Confirm desired format for pricing (raw string vs. structured numbers). Current plan keeps descriptive strings for flexibility.
- Determine whether the detail page should support additional sections (e.g., notes, documentation links) beyond the specified requirements.

## Next Steps

Await approval of this plan. Upon approval, proceed with implementation in the order above, ensuring comprehensive test coverage and documentation updates as needed.


## Initial Assignment

```
Fixes:

combine the two file db's into one
the web/sdk/api indicators arent working- fix if broken, otherwise go get that info and add to the model & data
add a new details page- clicking on a provider takes you to its detail page
add new data to the model & fetch: OpenAI-compatible, if so, link to api key area from the provider, openai compatible endpoint form, openai-compatible model names
On detail page: list available models and current prices
YOU MUST DEEPLY FOCUS ON THIS

Create a plan first. document plan in markdown file, and only implement after I approve.
```