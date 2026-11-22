# Phase 1 verification

Historical Phase 1 snapshot, verified **2026-11-22**, Asia/Karachi.
Phase 2 is now implemented; see [PHASE_2_REPORT.md](PHASE_2_REPORT.md) for current
behaviour and verification. Statements below describe the earlier Phase 1 state.

## Installed environment and technologies

| Technology | Version |
| --- | --- |
| OS | Ubuntu 26.04 LTS, Linux x86_64 |
| Node.js / npm / Git | 22.22.1 / 9.2.0 / 2.53.0 |
| create-next-app / Next.js | 16.4.6 / 16.4.6 |
| React / React DOM | 19.3.0 / 19.3.0 |
| TypeScript | 5.9.3 |
| Tailwind CSS / Tailwind Turbopack loader | 4.3.3 / 4.3.3 |
| ESLint / eslint-config-next | 9.39.5 / 16.4.6 |
| MediaPipe Tasks Vision | 1.2.3 |
| lucide-react | 1.77.0 |
| Zod | 4.6.7 |
| clsx / tailwind-merge | 2.1.1 / 3.7.1 |
| tsx (TypeScript utility runner) | 4.23.15 |
| Chrome used for verification | 151.0.7922.169 |

Application dependencies are exact-pinned and the full graph is locked.
The current Next.js ESLint plugins require ESLint 9; ESLint 10 caused peer-range
conflicts and was replaced with compatible 9.39.5. npm reports a deprecation
notice for ESLint 9, but the resolved peer ranges and lint check pass. No peer
dependencies were forced. The system Node build lacks native TypeScript support,
so utility scripts use the local tsx runner. Neither required system changes.

## Results

| Check | Result |
| --- | --- |
| Clean `npm ci --ignore-scripts=false` | PASS; postinstall copied 4 matching WASM/runtime files |
| Install audit | 0 vulnerabilities reported |
| `npm run model:download` | PASS; official file restored and verified before replacement |
| `npm run model:verify` | PASS; size, SHA-256, TFL3, schema, shapes, embedded labels |
| `npm run typecheck` | PASS; route types generated and `tsc --noEmit` succeeded |
| `npm run lint` | PASS; ESLint with zero-warning threshold |
| `npm run build` | PASS; `/` and `/try-on/` prerendered, `out/` generated |
| Development server | PASS; homepage and studio both HTTP 200 |
| `npm start` static export preview | PASS; homepage and studio both HTTP 200 |
| WASM response | HTTP 200, `application/wasm` MIME type |
| Server-side loader guard | PASS; rejects initialization before dynamic SDK import |
| Separate CPU/WASM browser initialization | PASS; official model initialized, exact labels checked, instance closed |
| Desktop/mobile browser inspection | PASS; 1280px desktop, 390px studio, 320px homepage |

The browser check used a temporary verification page outside the application and
the actual bundled model factory. It confirmed WebAssembly, Canvas 2D, and labels
`["background", "hair"]`. It **did not call segment or segmentForVideo**. This
establishes initialization compatibility on the tested machine; it does not
establish inference quality, speed across devices, or recolouring accuracy.

Browser inspection found no uncaught JavaScript exceptions or horizontal
overflow. The studio renders twelve sample shades. All future business controls
are disabled. The application pages make no model/WASM requests automatically.
Screenshots were reviewed for layout; verification-only files were kept in a
temporary directory and are not shipped as application routes.

## Model evidence

- Official float32 HairSegmenter v1: **781,618 bytes**.
- SHA-256: `2628cf3ce5f695f604cbea2841e00befcaa3624bf80caf3664bef2656d59bf84`.
- TFLite FlatBuffer `TFL3`, schema 3.
- Input `[1, 512, 512, 4]`; output `[1, 512, 512, 2]`.
- Binary-associated `labels.txt`: index 0 background, index 1 hair.
- Apache-2.0 license and Google's original model card are included.
- Full [source and license record](../public/models/README.md).

## Blockers and Phase 2 readiness

There are **no remaining local Phase 1 setup blockers**. The project scope PDF
was absent; shade values and D-prefixed codes are illustrative placeholders.
Approved shade data and technical guide rules remain inputs for later phases.

Ready for Phase 2: all files under `src/components/try-on`, `src/components/guide`,
`src/lib/ai`, `src/lib/color`, `src/lib/guide`, `src/types`, and `src/data`, plus
`src/app/try-on/page.tsx`. These are UI shells, verified model setup, and typed
extension points. They do not implement inference, recolouring, camera access,
upload processing, shade selection, or guide calculations.

Local verification servers are stopped after checks. Use the commands in
[SETUP.md](SETUP.md) to restart them. The static hosting configuration is tracked
in `.openai/hosting.json`; publication is verified separately by the hosting tools.
