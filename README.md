# Al Bura Cosmetics · AI Colour Studio

The application is in [albura-ai-demo](albura-ai-demo/README.md).

```bash
cd albura-ai-demo
npm ci
npm run dev
```

A working interview prototype with real local MediaPipe hair recolouring,
Upload Photo / Experimental Live / Take Photo, before/after and PNG download,
and a photo-connected colour consultation with a validated Next.js backend.
Photos and video stay in the browser.

**Window 2:** photo analysis suggests a starting hair level; the user confirms it,
chooses a shade and hair profile, then reviews and exports the consultation.
This estimate is approximate; the prototype does not issue chemical formulas.

- [Run and Vercel deployment instructions](albura-ai-demo/README.md)
- [Interview walkthrough and scope review](albura-ai-demo/docs/INTERVIEW_SUBMISSION.md)

Vercel now uses **Next.js**, root **albura-ai-demo**, and **`.next` output**.
Remove the earlier Other / `out` settings so the backend routes run. No live
cloud deployment is claimed. Official shade-card data, authenticated admin,
database and approved formulations remain part of the larger production scope.
