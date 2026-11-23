import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div><Link href="/" className="footer-wordmark">al bura</Link><p>A little curiosity. A world of colour.</p></div>
        <div className="footer-links"><Link href="/try-on/">Enter the studio <ArrowUpRight size={15} aria-hidden="true" /></Link><Link href="/#how-it-works">How it works <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        <div className="footer-note"><p><LockKeyhole size={14} aria-hidden="true" /> Your photos stay on your device.</p><span>Interactive prototype · Illustrative shades.<br />Actual colour results may vary.</span></div>
      </div>
    </footer>
  );
}
