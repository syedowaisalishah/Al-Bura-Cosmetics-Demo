import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Al Bura Cosmetics demo home">
          <span className="brand-mark" aria-hidden="true">AB</span>
          <span className="brand-name">AL BURA<span>COSMETICS · DEMO</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/">Overview</Link>
          <Link href="/try-on/">Try-on studio</Link>
          <a href="/try-on/#technical-guide">Colour consultation</a>
        </nav>
        <span className="header-tag">COLOUR, REIMAGINED</span>
      </div>
    </header>
  );
}
