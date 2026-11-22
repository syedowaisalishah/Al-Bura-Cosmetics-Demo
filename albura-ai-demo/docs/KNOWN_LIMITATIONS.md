# Known limitations

This is a company demonstration, not a production-ready product.

- **Illustrative shade card:** Twelve sample shades have codes, names, HEX,
  families, levels and reflections. They are pending official Al Bura approval;
  the official 180-shade catalogue and measured colour data are not available.
- **Visual colour only:** Screen colour, photo lighting, exposure, original hair,
  previous treatments and the display affect the preview. The bounded CIELAB
  transform preserves contrast and reflections but cannot predict achievable
  chemical lift, grey coverage or the result of a real dye process. Dark-to-light
  previews remain deliberately limited; no exact colour accuracy is claimed.
- **Model boundaries:** Fine/flyaway hair, curls, dark backgrounds, headwear,
  transparent glasses, occlusion, strong colour casts and low light can lead to
  missed hair or unwanted regions. Strong agreement between the two existing models anchors recovery of
  connected strands with weaker corroborating hair evidence. A conservative
  skin exclusion protects the face. This can remove valid hair
  near skin. No synthetic masks are used. Zero-mask pixels are copied exactly;
  semantic errors inside a model-predicted mask are still possible.
- **Camera capture:** The camera displays normal video; AI runs on a captured
  still, not continuously. Permission, HTTPS/localhost, a supported browser and
  available hardware are required. Use the direct site URL if an embedded view
  blocks permission. Mobile browser policies vary; no universal support claim.
- **Device coverage:** Automated Chrome checks used a virtual webcam with real
  portrait source frames and the real models. They do not certify physical
  webcam prompts, real phones, Safari or Firefox. Those remain device tests.
- **Photo constraints:** JPG/JPEG, PNG and WebP; 15 MB and 50 MP limits. The longest
  processed side is 1024 px. A new photo requires a new IMAGE analysis. First
  loading downloads models/WASM and needs connectivity; there is no offline
  service worker. Processing time depends on the CPU and visible hair area.
- **Guide approval:** Natural level/history/grey/length/density are manual inputs.
  Lift is a demonstration classification marked `demo_unapproved`. No developer
  strengths, chemical quantities, mixing ratios, bleach procedures or processing
  timers are supplied. Official technical-team and professional approval are
  required before any production formulation feature.
- **Local state:** Refreshing closes the session; images are not stored by the app
  or restored from a database. PNG downloads are deliberately stored on the
  user's device. Browser/device software can still have its own permissions or
  download behaviour. There is no cloud upload, authentication, admin panel,
  analytics service or production database.
- **Deployment:** No Vercel credentials/project linkage are available here, so
  deployment is prepared with exact README steps rather than claimed complete.
  Vercel Hobby is limited to personal non-commercial use; confirm the demo's
  eligibility. No paid plan, trial or infrastructure is enabled. The previous
  Sites identity could not be accessed and is not the verified current demo.

Before production: obtain approved shade/guide material; establish measurable
accuracy targets using annotated images and accessory/skin/background checks;
validate physical cameras and target browsers; review accessibility, privacy,
security, performance and hosting eligibility; complete Al Bura sign-off.
