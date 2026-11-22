# Al Bura Cosmetics — AI Hair Colour Try-On Demo

The application lives in [albura-ai-demo](albura-ai-demo/README.md).

```bash
cd albura-ai-demo
npm ci
npm run dev
```

Open http://127.0.0.1:3000/try-on/. Upload a portrait or capture a camera photo,
choose one of twelve illustrative shades, compare and download the result, then
review the synchronized educational guide. All photo processing stays local.

- [Installation, checks, build and exact Vercel deployment steps](albura-ai-demo/README.md)
- [Clean-build deployment readiness](albura-ai-demo/docs/VERCEL_READINESS.md)
- [Three-minute company demonstration](albura-ai-demo/docs/DEMO_GUIDE.md)
- [Phase 5 audit and test report](albura-ai-demo/docs/PHASE_5_REPORT.md)
- [Known limitations and production work](albura-ai-demo/docs/KNOWN_LIMITATIONS.md)

Vercel deployment settings are configured in `albura-ai-demo/vercel.json`.
Select root **`albura-ai-demo`**, framework **Other**, and output **`out`**.
No live Vercel deployment is claimed. Hobby eligibility depends on
personal non-commercial use; no paid services are enabled. The earlier private
Sites deployment is historical and does not contain these verified local changes.
A real Git-ignored `.env` is present locally; the demo needs no secret API key.
