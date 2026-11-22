# Company demonstration guide

## Prepare

Start the verified local app or use a verified HTTPS deployment. Keep a clear,
front-facing JPG/PNG/WebP portrait available with the person's permission. Use
even light, visible hair, no headwear and a simple background. Test the actual
presentation laptop/browser first. Close apps using its camera. Warm the model
with one photo before the meeting if the first download would interrupt the demo.

Use a direct browser tab for the camera. On mobile, use an HTTPS address and
allow camera permission. Keep Upload Photo as the fallback. Do not imply a
physical camera has been tested merely because automated camera checks pass.

## Three-minute script

| Time | Action and suggested explanation |
| --- | --- |
| 0:00–0:20 | Open the studio. “This is a local visual try-on and an educational guide. These twelve shades are illustrative and need Al Bura approval.” Point to the privacy notice and the two windows. |
| 0:20–0:50 | Upload the prepared portrait. Show the preparation/AI/colour status. “The existing models find hair on this device; the photo is not sent to an inference server.” |
| 0:50–1:25 | Select Copper, Burgundy, then Ash Blonde. Use search or a family filter. “After the first analysis, colour changes reuse the hair mask. The preview preserves texture but does not predict the real dye result.” |
| 1:25–1:45 | Drag the before/after slider; use Original, Compare and Colour preview. Download Result and open the PNG. Show that it contains the processed image. |
| 1:45–2:15 | Select Take Photo → Open Camera. “This is normal video.” Capture Photo; point out the camera stops and the same still-photo AI workflow runs. Show Retake if time permits. Use Upload Photo if permission is denied. |
| 2:15–2:45 | Look at Window 2; on mobile select Technical Guide. Change the natural level from 4 to 7. “This manual input changes the level difference and demo lift assessment. It does not rerun the photo analysis.” Show history/grey/length controls. |
| 2:45–3:00 | Point to the approval notice and locked categories. “Official shade data, technical approval, broader device testing and production engineering are the next steps. No chemical formula is supplied.” |

## Feature walkthrough

1. **Add a photo:** Upload Photo accepts JPG/JPEG, PNG or WebP up to 15 MB and
   50 megapixels. Processing limits the longest side to 1024 px and preserves
   browser-decoded orientation. Reset clears the current image and cache.
2. **Take a photo:** Open Camera starts only with permission. Mirror selfie
   defaults on; the saved original and colour result use that same orientation.
   Capture Photo freezes the frame, stops the tracks and processes the local
   PNG. Stop Camera cancels. Retake opens a new preview; failed permission keeps
   the previous photo. Switching tabs or hiding/leaving the page stops the stream.
3. **Choose a shade:** Search by name, code, HEX, level or reflection. Combine a
   family filter with the search. Clear filters restores the twelve samples;
   filtering does not change the selected shade. Selected details remain in
   Window 1 and Window 2 even when its tile is filtered out.
4. **Compare:** Drag the divider, use the range slider/arrow keys, or use the three
   view buttons. Replacing/capturing a new image starts with a 50/50 comparison.
5. **Save:** Download Result is enabled only when the selected shade is ready.
   It saves a processed PNG. Changing shades always starts from the original
   cached pixels, so repeated selections do not accumulate colour.
6. **Review:** Set natural level 1–10, history, grey percentage, length and density
   manually. Target level/reflection come from the chosen sample shade. The
   guide calculates a demonstration level difference/classification only. Print
   demo guide prints the assessment and safety notices without the portrait.

## Implemented

Photo upload and camera capture; real local dual-model IMAGE segmentation;
conservative confidence/skin mask, inward edge feathering; texture-preserving
CIELAB recolouring; twelve validated illustrative shades; search/family filters;
shared selection; comparison; PNG download; reset/retake/errors; responsive studio
tabs; manual educational guide, references, approval locks and print view.

## Planned for production

Official approved shade/Lab data and technical rules; annotated image evaluation
across diverse hair, skin, lighting, accessories and backgrounds; physical mobile
and desktop camera testing; Safari/Firefox validation; accessibility/performance
review; operational hosting, product security/privacy review and brand sign-off.
Any future accounts, database/admin or server processing require a separate brief.
Do not present those as existing features or unlock treatment formulas by default.
