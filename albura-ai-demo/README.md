# Al Bura Cosmetics — AI Hair Colour Try-On Demo

Phase 1 setup and scaffolding only. The interface is a preview shell; image
upload, segmentation inference, recolouring, camera, and guide calculations are
not connected.

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:3000 and http://127.0.0.1:3000/try-on/.
Use Node 22.22.1 (`.nvmrc`). No API keys or paid services are required.

```bash
npm run typecheck
npm run lint
npm run model:verify
npm run build
npm start
```

The production build exports `out/`; `npm start` previews that export locally.
The official Google HairSegmenter is included. Matching WASM files are copied
from the locked SDK on installation and before dev/build. All future image
processing stays in the browser.

- [Setup and free-hosting configuration](docs/SETUP.md)
- [Architecture and complete folder map](docs/ARCHITECTURE.md)
- [Phase boundaries and implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Verification results](docs/VERIFICATION.md)
- [Model provenance, checksum, labels, and license](public/models/README.md)

The repository did not contain a scope PDF. All 12 sample shade values and codes
are illustrative placeholders, not officially approved Al Bura shades. Brand
technical rules are pending. Wait for Phase 2 instructions before implementing
business features.
