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
  near skin. Still photos additionally recover bounded gaps supported by the
  multiclass model and undo dilation-only exclusions on strong hair agreement;
  direct skin exclusions remain intact. No synthetic masks are used. Zero-mask pixels are copied exactly;
  semantic errors inside a model-predicted mask are still possible.
- **Camera capture:** Take Photo displays normal video; AI runs once on the
  captured still. Permission, HTTPS/localhost, a supported browser and
  available hardware are required. Use the direct site URL if an embedded view
  blocks permission. Mobile browser policies vary; no universal support claim.
- **Experimental live:** Separate VIDEO inference uses the existing two models,
  with conservative skin exclusion and the shared colour engine. In automated
  Chrome tests, the updated CPU preview delivered about 3.4 displayed FPS at 640 × 480; software-rendered GPU was
  slower (about 0.7 sequential frames/sec after warm-up). Auto avoids known
  software renderers. Actual hardware GPU speed is unverified. The preview
  downscales after sustained slow pixel/transfer work, so fine edges can be missed. Take
  Photo remains recommended. A live strength slider and gentler exposure mapping
  reduce the painted cap appearance; bright shades will look subtler on dark
  hair. FPS is measured rather than guaranteed. The fixed
  512/256 model tensor sizes limit what input downscaling can improve.
  The current scheduler also intentionally caps analyses at eight per second;
  the camera's normal video frame rate is not the AI preview's measured FPS.
- **Device coverage:** Automated Chrome checks used a virtual webcam with real
  portrait source frames and the real models. They do not certify physical
  webcam prompts, real phones, Safari or Firefox. Those remain device tests.
- **Photo constraints:** JPG/JPEG, PNG and WebP; 15 MB and 50 MP limits. The longest
  processed side is 1024 px. A new photo requires a new IMAGE analysis. First
  loading downloads models/WASM and needs connectivity; there is no offline
  service worker. Processing time depends on the CPU and visible hair area.
- **Guide approval:** Starting level may be suggested from original photo hair
  pixels, then requires confirmation or manual correction. It is an illustrative
  depth estimate, not a calibrated measurement of natural roots. History,
  grey/length/density remain manual inputs.
  Lift is a demonstration classification marked `demo_unapproved`. No developer
  strengths, chemical quantities, mixing ratios, bleach procedures or processing
  timers are supplied. Official technical-team and professional approval are
  required before any production formulation feature.
- **Local state:** Refreshing closes the session; images are not stored by the app
  or restored from a database. PNG downloads are deliberately stored on the
  user's device. Browser/device software can still have its own permissions or
  download behaviour. There is no cloud upload, authentication, admin panel,
  analytics service or production database.
- **Deployment:** The existing demo is hosted at
  [albura-ai.vercel.app](https://albura-ai.vercel.app/). Successful deployment and
  browser-check records are dated evidence, not ongoing uptime monitoring or
  physical-device certification. Full-stack `.next` output is required for its
  backend; a static `out/` deployment would omit those handlers. No paid plan,
  trial or inference service was added by this implementation.

Before production: obtain approved shade/guide material; establish measurable
accuracy targets using annotated images and accessory/skin/background checks;
validate physical cameras and target browsers; review accessibility, privacy,
security, performance and hosting eligibility; complete Al Bura sign-off.
