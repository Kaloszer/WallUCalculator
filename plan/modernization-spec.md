# WallU Calculator — Modernization Spec (v2, aggressive)

> **Goal:** Modernize the dependency stack and toolchain to current bleeding-edge (June 2026): **full shadcn/ui on Tailwind v4**, **TypeScript 7 (RC) as the primary typechecker**, the **three.js stack realigned off its alpha pin**, **lucide v1**, and the security/hygiene fixes — while preserving app behavior.
>
> **Status:** Ready to implement. Use this file as the implementation goal.
> **Research method:** Versions pulled live from the npm registry (`npm outdated` / `npm view`, not training data) and breaking-change analysis cross-checked via Exa web search against official sources (June 2026). Dated source URLs are in §8.

---

## 0. Locked decisions (from the user)

| Decision | Choice |
|---|---|
| Icons | **Keep lucide** (it *is* shadcn's default `iconLibrary`), upgrade 0.453 → **v1**. No icon-library swap. |
| shadcn scope | **Latest architecture** — refresh every component to the new-york-v4 registry (data-slot, no `forwardRef`, OKLCH theme, unified `radix-ui` package). |
| Tailwind | **Migrate to v4 now** (required for the latest shadcn registry). |
| TypeScript | **Go all-in on TS 7** — adopt the `typescript@rc` (7.0.1-rc) native compiler as the primary typechecker (see the hard constraint in §1). |

---

## 1. The two non-obvious constraints (read first)

**A. TypeScript 7 cannot be the *only* compiler yet.**
`typescript@rc` is **7.0.1-rc** (Go-native, binary `tsc`, GA est. ~mid-July 2026). But the **programmatic API (`ts.createProgram`, transforms, plugins) is not implemented until 7.1** — and Next.js's build-time typecheck and `typescript-eslint` both depend on it. So "all-in" means:
- **Primary typecheck** (`tsc --noEmit`, dev + CI) → run on **TS 7 RC**.
- The **resolved `typescript` package** that Next.js and ESLint import stays on **stable 6.0.3** (the official "bridge" release that pre-announces 7's removals).
- Cut the resolved package over to 7.0 when GA lands and 7.1 restores the API for tooling.

**B. Tailwind v4 emits OKLCH colors; `html2canvas` can't parse them.**
The PDF export (`app/api/export/pdf/route.ts`) rasterizes the DOM with `html2canvas@1.4.1` (unmaintained since 2021). Tailwind v4's default theme uses `oklch()`, which html2canvas chokes on → **the PDF export will silently break** the moment v4 lands unless we swap to **`html2canvas-pro`** (API-compatible drop-in) in the same phase.

---

## 2. Baseline (verified facts)

- **Stack:** Next.js 15.1.6 (App Router) · React 19.0.0 · TypeScript 5.7.3 · Tailwind 3.4.17 · Node 22 · Bun 1.2.
- **`tsc --noEmit` currently passes clean** (exit 0) — regression gate for every phase.
- **Only 1 unit test** (`lib/__tests__/calculations/rValue.test.ts`, vitest). No in-repo e2e.
- **3D stack used in only 4 files** — small blast radius.
- **Pre-existing inconsistencies (not introduced here):** two lockfiles tracked (`bun.lock` + `package-lock.json`); `Dockerfile` references the **deleted** `bun.lockb` (Docker build broken).
- **The live GitHub Pages deploy is partially BROKEN today.** CI uploads a static `out/`, but the app has **10 `app/api/*/route.ts` handlers — all `export const dynamic = 'force-dynamic'`** — that the client `fetch()`es (materials DB, compliance, geocode, climate, import/export), and there is **no `output: 'export'`** in `next.config.mjs`. A static host has no server for those routes, so those features 404 in production. **Resolved in Phase 1.5 (full static export).**

---

## 3. Guiding principles

1. **Behavior-preserving** except the unavoidable lucide-v1 icon renames/brand-icon swaps and any intentional shadcn-v4 visual deltas.
2. **Phased & independently shippable** — each phase is its own PR with its own green gate. The two big phases (TS7, Tailwind4+shadcn) are deliberately late so the safe wins ship first.
3. **Gate every phase** (§5). `bun run build` is the real integration test; manual smoke is mandatory (no automated UI coverage).

---

## 4. Phase plan (in order)

### Phase 0 — Hygiene & P0 fixes (low risk, do first)

| # | Action | Why |
|---|--------|-----|
| 0.1 | **Fix `xlsx` CVEs.** `bun add xlsx@https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. | Resolves CVE-2023-30533 (prototype pollution, High) + CVE-2024-22363 (ReDoS). APIs identical 0.18→0.20 → **zero code changes** (`lib/utils/export.ts`, `app/api/export/route.ts`). |
| 0.2 | **Remove `recharts` + `@types/recharts`.** `bun remove recharts @types/recharts`. | Confirmed imported nowhere. Dead dep; `@types/recharts` deprecated. |
| 0.3 | **Move `repomix` to devDependencies** + update: `bun remove repomix && bun add -d repomix@latest`. | Dev/LLM tool wrongly in `dependencies` (ships to prod). |
| 0.4 | **Align React types:** `bun add -d @types/react@^19.2 @types/react-dom@^19.2`. | Real latent bug — React 19 runtime against `@types/react@18`. Keep in lockstep. |
| 0.5 | **React latest patch:** `bun add react@^19.2 react-dom@^19.2`. | 19.0→19.2 additive, no breaking changes. Do with 0.4. |
| 0.6 | **Safe minors** (`bun update` within ranges): `chart.js`→4.5.1, `react-chartjs-2`→5.3.1, `jspdf-autotable`→5.0.8, `fuse.js`, `postcss`, `@thi.ng/math`, `@dnd-kit/sortable`→10 (peer-dep-tracking only; core@6.3.1 satisfies it). **Do NOT bump `tailwind-merge` or individual `@radix-ui/*` here** — they're superseded in Phase 4 (tailwind-merge→v3, radix→unified package). | Semver-safe, no code changes. |
| 0.7 | **Pick ONE package manager → Bun.** Delete `package-lock.json`, add to `.gitignore`, `rm -rf node_modules && bun install`. | Two lockfiles diverge silently. (Name `buncn`, `bun.lock` tracked, `trustedDependencies` is Bun-only, CI uses Bun.) |
| 0.8 | **Fix Dockerfile:** `bun.lockb` → `bun.lock` (3 refs). | Docker build currently broken. |
| 0.9 | **Fix CI cache key** in `.github/actions/setup-node/action.yml`: hash `bun.lock`, not `package-lock.json`. | Cache never hits today. |

**Gate:** full gate (§5). Green with no app-code edits.

---

### Phase 1 — Realign the three.js / pmndrs stack (low risk, high value)

The current `@react-three/fiber@9.0.0-alpha.8` (alpha pin) + `@react-three/drei@9` (peer-deps fiber **v8**/React 18) is a latent break. Upgrade the whole cluster to its React-19-compatible set, **atomically**:

```bash
bun add @react-three/fiber@^9.6.1 @react-three/drei@^10.7.7
bun add three@^0.185.0 @types/three@^0.185.0
bun add @react-three/csg@^4.0.0
bun add @react-spring/three@^10.1.2   # not imported in the 4 files; lockfile-only
```

- **No partial bumps** — fiber-9 + drei-9 is as broken as today.
- **Pin `three` and `@types/three` to the same 0.185.0.**
- **Expected code changes: none.** All 4 consumers (`HouseVisualization.tsx`, `house-sample/components/WallSection.tsx`, `calculator/WallVisualization3D.tsx`, `ExplodedWallViewClient.tsx`) use only stable APIs (`Canvas`, `OrbitControls`, CSG `Geometry/Base/Subtraction`, `useFrame`, `THREE.Shape`).
- **Visual check:** three r180+ improved PBR energy conservation → rough `meshStandardMaterial` renders slightly brighter. Spot-check the 3D views.

**Gate:** full gate + manual visual smoke of all three 3D views.

---

### Phase 1.5 — Static-export consolidation: make the deploy actually work (medium risk, high value)

**Decision (resolves §7):** the app becomes a **fully static SPA** (`output: 'export'`). Delete all 10 API routes; move their logic client-side. This fixes the currently-broken production features **and** unblocks Next 16. Feasibility is confirmed: localStorage CRUD modules already exist, the compute routes are thin wrappers over pure `lib/` functions, and the two external APIs are keyless + CORS-enabled.

1. **`next.config.mjs`:** add `output: 'export'`. Keep `images.unoptimized: true`, `trailingSlash: true`, and the prod `basePath` (all already export-compatible).
2. **Replace each `fetch('/api/...')` with a direct client call:**
   | Client caller | Was | Replace with |
   |---|---|---|
   | `material-database/MaterialDatabase.tsx` (list/create/update/delete/import/export) | `/api/materials*` | `lib/storage/materialStorage.ts` CRUD + `lib/calculations/materials.ts` validation |
   | `compliance/ComplianceDashboard.tsx` | `/api/compliance` | `lib/calculations/compliance.ts` (`checkCompliance` / `checkMultipleCompliance`) directly |
   | `climate/ClimateDisplay.tsx` | `/api/location/climate?lat&lon` | browser `fetch` to `https://archive-api.open-meteo.com/v1/archive` (move the route's parse logic into `lib/api/weather.ts`) |
   | `climate/LocationSelector.tsx` | `/api/location/geocode?q` | browser `fetch` to Nominatim (drop the server-only `User-Agent` header; browser sets its own) |
   | assemblies/compare, export | `/api/...` | `lib/calculations/comparison.ts`, `lib/utils/export.ts` directly |
3. **Move the shared types** currently imported from route files (`ClimateDataResult` is imported from `@/app/api/location/climate/route` in `ClimateDisplay.tsx` and `lib/calculations/climate.ts`) into `lib/` so nothing imports from `app/api/**`.
4. **Delete `app/api/**`** and the now-dead server-only deps usage. Remove `export const dynamic` references (gone with the routes).
5. **External-API etiquette:** Nominatim asks for an identifying referrer for heavy use — fine for this low-volume calculator; if rate-limited later, add a client-side debounce (a `LocationSelector` debounce already exists) and cache results in localStorage.
6. **CI sanity:** `bun run build` now genuinely produces `out/` (the `mkdir out` step in `publish.yml` becomes redundant — remove it). The static deploy will finally contain a working app.

**Gate:** full gate; in the built `out/`, manually verify materials CRUD + import/export, compliance check, geocode search, and climate lookup all work **with no network calls to `/api/*`** (DevTools Network tab). Run `/ponytail-review --fix`.

---

### Phase 2 — TypeScript 7 RC as primary typechecker (medium risk; the "all-in" move)

Honors the §1.A constraint: TS7 checks, TS6 resolves for tooling.

1. **Set the resolved `typescript` to the 6.0 bridge** and add the TS7 RC under an alias:
   ```jsonc
   // package.json devDependencies
   "typescript": "^6.0.3",
   "typescript-7": "npm:typescript@rc"   // 7.0.1-rc, Go-native `tsc`
   ```
2. **Scripts:**
   ```jsonc
   "typecheck":        "node_modules/typescript-7/bin/tsc --noEmit",   // PRIMARY (TS7, ~10x faster)
   "typecheck:stable": "tsc --noEmit"                                   // TS6 fallback / tooling parity
   ```
3. **TS 6.0 breaking-change sweep** (6.0 is the largest breaking set since 2.0): add `"types": ["node"]` to `tsconfig.json` (6.0 now defaults `types` to empty — would silently drop `process`/`Buffer` globals); confirm `moduleResolution: "bundler"` (already set) and `strict: true` (already set); remove the stray `"../personal/gme-lots.ts"` from `tsconfig.json` `include`.
4. **Verify `typescript-eslint` supports TS 6** (bump it in Phase 3); it resolves the stable `typescript`, not the alias.
5. **CI:** run `bun run typecheck` (TS7) as the gate; optionally keep `typecheck:stable` as a parallel job until GA.
6. **Editors (optional):** install the "TypeScript Native Preview" VS Code extension, set `"typescript.experimental.useTsgo": true`.

**Do NOT** point `next build` at the alias — Next resolves `typescript` (6.0.3) for its programmatic-API typecheck.

**GA cutover (Phase 5, ~mid-July 2026):** flip resolved `typescript` → `^7.0`, drop the alias, and (after TS 7.1) migrate anything using the programmatic API.

**Gate:** both `typecheck` (TS7) and `typecheck:stable` (TS6) clean; `bun run build` clean.

---

### Phase 3 — Next.js 15.5 patch + linter consolidation (low–medium risk)

| # | Action | Notes |
|---|--------|-------|
| 3.1 | **Next 15.1→15.5:** `bun add next@~15.5 eslint-config-next@~15.5`. | Additive; pre-announces v16 deprecations. **Stay on 15.x** (16 deferred — §5/§7). |
| 3.2 | **Consolidate to ONE linter.** Default: **ESLint for linting** (keeps `eslint-plugin-next` App-Router rules + react-hooks + type-aware rules Biome lacks), **Biome formatter-only or removed.** Migrate `.eslintrc.json` → flat `eslint.config.js`, `eslint@^9`, `typescript-eslint` (latest, TS6-compatible). Set `"lint": "eslint ."` (don't rely on `next lint`, removed in 16). | If keeping Biome as formatter, set `biome.json` `linter.enabled: false`. |

**Gate:** full gate; `bun run lint` clean and wired into CI explicitly.

---

### Phase 4 — Tailwind v4 + full shadcn-v4 refresh + lucide v1 (HIGH risk, the big one)

This is one logically-atomic migration; split into reviewable commits but ship/validate together. **Order matters.**

**4a. Tailwind v3 → v4**
```bash
bun add tailwindcss@^4 @tailwindcss/postcss tailwind-merge@^3 tw-animate-css
bun remove tailwindcss-animate
npx @tailwindcss/upgrade@next        # rewrites config → CSS, @import "tailwindcss", utility renames
```
- `postcss.config.mjs`: `tailwindcss: {}` → `"@tailwindcss/postcss": {}`.
- `globals.css`: `@tailwind base/components/utilities` → `@import "tailwindcss"`; replace `@plugin "tailwindcss-animate"` usage with `@import "tw-animate-css"`.
- Convert the shadcn HSL CSS-variable theme to the v4 OKLCH + `@theme inline` pattern (codemod does most; hand-fix `:root`/`.dark`).
- **`tailwind-merge` v3** is required for v4 (theme-scale keys changed; safe if `twMerge` is used with defaults, which it is here).
- Audit `chartHelpers.ts` / chart configs for `hsl(var(--chart-*))` — drop the `hsl()` wrapper if the value already includes it post-migration.

**4b. Swap `html2canvas` → `html2canvas-pro`** (REQUIRED — see §1.B)
```bash
bun remove html2canvas && bun add html2canvas-pro
```
- Update the single import in `app/api/export/pdf/route.ts` (`html2canvas` → `html2canvas-pro`, same `(el).then(canvas => …)` API). Must be in place before the OKLCH theme goes live, or PDF export breaks.

**4c. shadcn → new-york-v4 registry (full refresh)**
```bash
# components.json: set "tailwind": { "config": "" } (v4 signal), confirm "style": "new-york", "iconLibrary": "lucide"
npx shadcn@latest add --all --overwrite     # v4 components: data-slot, no forwardRef, OKLCH
npx shadcn@latest migrate radix             # @radix-ui/react-* (in components/ui) → unified `radix-ui`
npx shadcn@latest migrate radix app/components   # also migrate direct radix usage outside ui/
```
- After migration, **remove the individual `@radix-ui/react-*` packages** from `package.json` (the unified `radix-ui` replaces them). **Keep `@radix-ui/react-icons`** — it's a separate icon package still imported directly.
- `forwardRef`→`data-slot`: audit any app code that passed `ref` to a shadcn primitive or queried old DOM shapes (tests, CSS selectors).

**4d. lucide-react 0.453 → 1.x** (kept as shadcn's default `iconLibrary`)
```bash
bun add lucide-react@^1
```
- Renames (mechanical): `CheckCircle`→`CircleCheck`, `XCircle`→`CircleX`, `AlertCircle`→`CircleAlert`. Affected: `compliance/ComplianceDashboard.tsx`, `compliance/ComplianceChecklist.tsx`, `compliance/CodeSelector.tsx`, `compliance/ViolationReport.tsx`, `comparison/ComparisonView.tsx`, `climate/ClimateDisplay.tsx`.
- **Brand icons removed in v1** → replace with [Simple Icons](https://simpleicons.org/) SVGs: `Github` in `app/components/Header.tsx`; `Twitter`/`Facebook`/`Linkedin` in `app/components/reporting/ShareDialog.tsx`.

**Gate:** full gate + **heavy manual visual QA** of the entire UI (every shadcn primitive, dark mode, charts, 3D views, Leaflet map) **and** confirm Excel **and** PDF export still produce valid files (PDF is the html2canvas-pro risk point).

---

### Phase 5 — Deferred follow-ons (separate efforts, not this sweep)

- **Next.js 16** (medium–high). Breaking for this repo: async `params`/`searchParams` (codemod `npx @next/codemod@canary upgrade latest`), `next lint` removed, eslint-plugin-next flat-config default (pairs with 3.2), `middleware.ts`→`proxy.ts`, Turbopack default build, `revalidateTag` 2nd arg. **Blocked on resolving §7 first.**
- **TS 7 GA cutover** (~mid-July 2026): flip resolved `typescript`→7.0, drop alias; after TS 7.1, migrate programmatic-API consumers.
- **Leaflet 2.0** — hold; `leaflet@1.9.4` + `react-leaflet@5` is the correct React-19 pairing today. React-leaflet will need a paired upgrade when Leaflet 2.0 (ESM-only, Pointer Events) goes stable.

---

## 5. Verification gate (run after every phase)

```bash
bun install                 # clean, no peer-dep errors
bun run typecheck           # TS 7 RC, exit 0 (baseline is clean)   [Phase 2+]
bun run typecheck:stable    # TS 6 parity                            [Phase 2+]
bun run lint                # clean                                  [Phase 3+]
bunx vitest run             # rValue tests pass
bun run build               # succeeds — the real integration test
```
**Manual smoke** (no automated UI coverage exists): 3D wall views render & orbit; Chart.js charts render; Leaflet climate map renders; **Excel and PDF export both produce valid files**; drag-reorder of material rows works; dark mode intact (esp. after Phase 4).

**Cleanup pass (every phase):** after the phase is green, run **`/ponytail-review --fix`** on the phase diff to strip over-engineering / reinvented-stdlib / dead flexibility introduced or exposed by the change, then re-run the gate.

**Before Phase 0:** add a minimal CI gate (`typecheck` + `bun run build` + `vitest run`) so each modernization PR is guarded — current CI only builds on push to `main`.

---

## 6. Consolidated decision table

| Item | Current | Target | Phase | Risk |
|---|---|---|---|---|
| xlsx (SheetJS) | 0.18.5 (CVEs) | 0.20.3 (CDN) | 0 | **security**, none-code |
| recharts (+types) | 2.15 / 1.8 | **removed** | 0 | none |
| repomix | 0.2.29 prod | latest dev | 0 | low |
| @types/react(-dom) | 18.3 | 19.2 | 0 | low |
| react / react-dom | 19.0 | 19.2 | 0 | low |
| chart.js / dnd-kit / jspdf-autotable / fuse / postcss | minor-behind | latest minor | 0 | safe |
| @react-three/fiber | **9.0.0-alpha.8** | 9.6.1 | 1 | low |
| @react-three/drei | 9.121 (**mismatch**) | 10.7.7 | 1 | low |
| three / @types/three | 0.170 / 0.169 | 0.185 / 0.185 | 1 | low |
| @react-three/csg | 3.3 | 4.0 | 1 | low |
| deploy model | broken (static+dynamic APIs) | **`output: 'export'`, APIs→client** | 1.5 | medium |
| typescript (resolved) | 5.7 | **6.0.3** (bridge) | 2 | medium |
| typescript-7 (alias) | — | **7.0.1-rc** (primary check) | 2 | medium |
| next / eslint-config-next | 15.1 | 15.5 | 3 | low |
| eslint + biome | both lint | ESLint flat + Biome format-only | 3 | medium |
| typescript-eslint | — | latest (TS6-compatible) | 3 | low |
| tailwindcss | 3.4 | **4.x** | 4a | **high** |
| tailwind-merge | 2.6 | 3.x | 4a | medium |
| tailwindcss-animate | 1.0 | **tw-animate-css** | 4a | low |
| html2canvas | 1.4.1 (unmaint.) | **html2canvas-pro** | 4b | medium (OKLCH) |
| shadcn components | new-york v3 | **new-york-v4** (data-slot) | 4c | high |
| @radix-ui/react-* (individual) | many | **unified `radix-ui`** | 4c | medium |
| @radix-ui/react-icons | 1.3.2 | keep (still used) | 4c | — |
| lucide-react | 0.453 | **1.x** | 4d | medium (icon swaps) |
| jspdf | 4.2.1 | already latest | — | — |
| leaflet / react-leaflet | 1.9.4 / 5.0 | hold | 5 | — |
| Next 16 / TS7 GA | — | deferred | 5 | high |

---

## 7. The static-export decision — RESOLVED (→ Phase 1.5)

The project targeted two incompatible deploy models: CI ships a static `out/` to GitHub Pages, but 10 `force-dynamic` API routes (client-fetched) need a server, and the `Dockerfile` runs `next start`. **Decision: full static SPA** (`output: 'export'`), API logic moved client-side, routes deleted — see **Phase 1.5**. This fixes the currently-broken prod features and unblocks Next 16. The `Dockerfile`/`next start` path is dropped (GitHub Pages is the deploy target); if a server deploy is ever wanted again, that's a separate decision.

---

## 8. PR sequencing

1. `chore/deps-p0-hygiene` — Phase 0.
2. `chore/r3f-stack-realign` — Phase 1.
3. `refactor/static-export` — Phase 1.5 (delete API routes, client-side data, `output: 'export'`).
4. `chore/typescript-7-rc` — Phase 2.
5. `chore/next-15.5-lint` — Phase 3.
6. `feat/tailwind4-shadcn-v4` — Phase 4 (4a→4b→4c→4d as ordered commits; the heaviest review).
7. Separate efforts — Phase 5 (Next 16; TS7 GA cutover).

Run `/ponytail-review --fix` at the end of each phase before opening the PR.

### Key sources (Exa-verified, June 2026)
- TS 7.0 RC: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-rc/ (2026-06-18) · native previews: https://devblogs.microsoft.com/typescript/announcing-typescript-native-previews/ · feature matrix: https://github.com/microsoft/typescript-go
- shadcn Tailwind v4: https://ui.shadcn.com/docs/tailwind-v4 · CLI v4 changelog: https://ui.shadcn.com/docs/changelog · unified radix-ui: https://ui.shadcn.com/docs/changelog/2026-02-radix-ui · icons/components.json: https://ui.shadcn.com/docs/components-json
- Tailwind v4 upgrade: https://tailwindcss.com/docs/upgrade-guide · tailwind-merge: https://github.com/dcastil/tailwind-merge/releases
- R3F v9 migration: https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide · drei React19: https://github.com/pmndrs/drei/discussions/2213
- xlsx advisories: GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9 · SheetJS install: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/
- lucide v1 migration: https://lucide.dev/guide/version-1
- Next 16 upgrade: https://nextjs.org/docs/app/guides/upgrading/version-16
