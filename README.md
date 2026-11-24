# Al Bura Cosmetics · AI Colour Studio

A full-stack Next.js app with three on-device hair try-on modes and a connected
colour consultation. The deployed demo is [albura-ai.vercel.app](https://albura-ai.vercel.app/).

**For an interview or first code review, start with the
[plain-language interview guide](albura-ai-demo/docs/INTERVIEW_GUIDE.md).** It
explains each technology, traces a photo and API request, and links to the code.

```bash
cd albura-ai-demo
npm ci
npm run dev
```

The application root stays **albura-ai-demo**, matching the existing Vercel
project settings. Source code is organized by responsibility:

```text
albura-ai-demo/src/
├── app/       # Thin Next.js page, layout and HTTP entry files
├── web/       # React UI, styles, camera and browser AI
├── api/       # Backend handlers, validation and services
└── shared/    # Common catalogue, types and pure consultation rules
```

- [Folder guide and NestJS/Python tradeoffs](albura-ai-demo/docs/PROJECT_STRUCTURE.md)
- [Run and deployment instructions](albura-ai-demo/README.md)
- [Architecture](albura-ai-demo/docs/ARCHITECTURE.md)
- [Documentation index: current guides and historical reports](albura-ai-demo/docs/README.md)
- [Scope review and submission record](albura-ai-demo/docs/INTERVIEW_SUBMISSION.md)

Photos and video stay in the browser. The backend validates profile metadata
and returns an assessment. Official shade-card data, database/admin publishing
and approved chemical formulations remain production work.
