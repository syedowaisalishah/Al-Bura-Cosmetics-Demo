import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowDownRight, ArrowUpRight, Camera, Check, Fingerprint, ScanFace, ShieldCheck, Sparkles } from "lucide-react";
import { demoShades } from "@/shared/data/shades";

const featured = ["natural", "ash", "gold", "copper", "red", "violet"].map((family) => demoShades.find((shade) => shade.family === family)!);

export default function HomePage() {
  return (
    <main id="main-content" className="home-page">
      <section className="editorial-hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> YOUR VIRTUAL COLOUR STUDIO</p>
          <h1 id="hero-title">A little colour.<br />A whole new<br /><em>feeling.</em></h1>
          <p className="hero-description">Some changes start with a little curiosity. Explore a new shade on your own hair, before making it your own.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/try-on/">Find your shade <ArrowUpRight size={19} aria-hidden="true" /></Link><a className="text-link" href="#colour-edit">Explore the colours <ArrowDownRight size={18} aria-hidden="true" /></a></div>
          <p className="hero-privacy"><ShieldCheck size={16} aria-hidden="true" /> Your photo. Your device. Always private.</p>
          <div className="hero-index"><span>01 / THE COLOUR EDIT</span><a href="#how-it-works" aria-label="Discover how the colour studio works"><ArrowDown size={18} aria-hidden="true" /></a></div>
        </div>
        <div className="hero-art">
          <div className="hero-photo"><Image src="/images/colour-story-editorial.webp" alt="Editorial portrait with flowing chestnut waves and soft copper highlights" fill sizes="(max-width: 760px) 92vw, 48vw" preload /><span className="photo-edition">THE ART OF POSSIBILITY</span></div>
          <div className="hero-colour-note"><span className="note-kicker">A SHADE OF POSSIBILITY</span><p>Made for your<br /><em>next chapter.</em></p><div className="note-swatches" aria-hidden="true"><span style={{ background: "#332622" }} /><span style={{ background: "#8d4c36" }} /><span style={{ background: "#763747" }} /><span style={{ background: "#d8c5a4" }} /><ArrowUpRight size={19} /></div></div>
          <p className="editorial-caption">AI-created editorial imagery · not a try-on result</p>
        </div>
      </section>

      <div className="promise-strip"><div className="container"><p><ScanFace size={19} strokeWidth={1.4} aria-hidden="true" /> Your hair, a new perspective</p><p><Sparkles size={19} strokeWidth={1.4} aria-hidden="true" /> Colour with texture & depth</p><p><Fingerprint size={19} strokeWidth={1.4} aria-hidden="true" /> Private by design</p></div></div>

      <section id="colour-edit" className="home-colour-edit container" aria-labelledby="colour-edit-title">
        <div className="section-heading"><div><p className="eyebrow">THE SHADE EDIT</p><h2 id="colour-edit-title">Find your kind of <em>colour.</em></h2></div><Link className="text-link" href="/try-on/#palette-title">Explore all 12 shades <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
        <div className="editorial-shades">{featured.map((shade, index) => <Link href={`/try-on/?shade=${encodeURIComponent(shade.id)}`} key={shade.id} className="editorial-shade" aria-label={`Try ${shade.name} in the colour studio`}><div className="editorial-swatch" style={{ backgroundColor: shade.hex }}><span>0{index + 1}</span><ArrowUpRight size={21} aria-hidden="true" /></div><div className="editorial-shade-info"><h3>{shade.name}</h3><span>{shade.code} / {shade.family}</span></div></Link>)}</div>
        <p className="collection-note">A first look at the possibilities. These twelve sample shades are illustrative, pending official Al Bura shade-card approval.</p>
      </section>

      <section id="how-it-works" className="home-journey" aria-labelledby="journey-title"><div className="container journey-layout">
        <div className="journey-heading"><p className="eyebrow">A MOMENT FOR YOURSELF</p><h2 id="journey-title">Less wondering.<br /><em>More imagining.</em></h2><p>Your next look starts with three simple steps.</p><Link className="text-link" href="/try-on/">Make it your moment <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
        <ol className="journey-steps"><li><span>01</span><div><Camera size={22} strokeWidth={1.4} aria-hidden="true" /><h3>Start with you.</h3><p>Upload a portrait or take a photo. Good light and visible hair make all the difference.</p></div></li><li><span>02</span><div><Sparkles size={22} strokeWidth={1.4} aria-hidden="true" /><h3>Follow your curiosity.</h3><p>Explore the palette, switch shades and slide between your original and colour preview.</p></div></li><li><span>03</span><div><Check size={22} strokeWidth={1.4} aria-hidden="true" /><h3>See the bigger picture.</h3><p>Save your look and build a colour consultation to discuss with your stylist.</p></div></li></ol>
      </div></section>

      <section className="home-invitation container"><div><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>A colour you love.<br /><em>A choice that feels like you.</em></h2><Link className="button button-light" href="/try-on/">Step into the studio <ArrowUpRight size={19} aria-hidden="true" /></Link></div><div className="invitation-arcs" aria-hidden="true"><span /><span /><span /></div><p className="invitation-note">AI visual preview only. Actual colour results may vary.</p></section>
    </main>
  );
}
