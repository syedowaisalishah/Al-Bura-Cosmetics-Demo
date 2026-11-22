import Link from "next/link";
import { BookOpen, ScanFace, SwatchBook } from "lucide-react";
import { demoShades } from "@/data/shades";

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="home-hero container">
        <div className="hero-copy">
          <p className="eyebrow">THE AL BURA VIRTUAL COLOUR STUDIO</p>
          <h1>A new shade.<br /><em>A new perspective.</em></h1>
          <p className="hero-description">A space to imagine your next hair colour, with a virtual preview and thoughtful colour guidance side by side.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/try-on/">Try your hair colour</Link><span className="small-note">Photos and video stay on your device</span></div>
          <div className="hero-footnote"><span className="gold-line" aria-hidden="true" /><p>Made for curiosity.<br /><strong>Inspired by the possibilities of colour.</strong></p></div>
        </div>
        <div className="colour-composition" aria-label="Illustrative hair colour swatches in brown, copper, and blonde">
          <span className="composition-caption">THE COLOUR EDIT</span>
          <div className="colour-ribbon ribbon-brown" /><div className="colour-ribbon ribbon-copper" /><div className="colour-ribbon ribbon-blonde" />
          <div className="composition-note"><span>From subtle changes<br />to a fresh expression.</span><span className="composition-monogram" aria-hidden="true">ab</span></div>
          <span className="composition-disclaimer">Illustrative colours · Not actual hair results</span>
        </div>
      </section>
      <section className="studio-intro">
        <div className="container">
          <div className="section-heading"><div><p className="eyebrow">ONE STUDIO, TWO PERSPECTIVES</p><h2>See the colour. Understand the journey.</h2></div><span className="quiet-tag">Photo & camera capture</span></div>
          <div className="intro-grid">
            <article><ScanFace size={25} strokeWidth={1.25} aria-hidden="true" /><h3>Your virtual try-on</h3><p>Explore shades with a portrait comparison or a photo captured with your camera. Save your favourite as a PNG.</p></article>
            <article><BookOpen size={25} strokeWidth={1.25} aria-hidden="true" /><h3>Your colour companion</h3><p>A second window for guidance based on your starting hair level and chosen shade.</p></article>
            <article><SwatchBook size={25} strokeWidth={1.25} aria-hidden="true" /><h3>A palette to explore</h3><p>Twelve illustrative colours give a first look at the future shade-card experience.</p></article>
          </div>
          <div className="mini-palette" aria-label="Illustrative demo palette">{demoShades.map((shade) => <span key={shade.id} style={{ backgroundColor: shade.hex }} title={`${shade.name} — illustrative`} />)}</div>
          <p className="small-note intro-disclaimer">Demo colours are illustrative, not officially approved Al Bura shades. AI visual preview only. Actual colour results may vary. The technical guide is an unapproved educational demonstration.</p>
        </div>
      </section>
    </main>
  );
}
