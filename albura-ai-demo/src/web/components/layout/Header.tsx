"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

export function Header() {
  const inStudio = usePathname().startsWith("/try-on");
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Al Bura Cosmetics demo home">
          <span className="brand-name">al bura<span>C O S M E T I C S</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/" aria-current={!inStudio ? "page" : undefined}>Discover</Link>
          <Link href="/try-on/" aria-current={inStudio ? "page" : undefined}>The colour studio</Link>
          <Link href="/try-on/#palette-title">The shade edit</Link>
        </nav>
        {inStudio
          ? <a href="#technical-guide" className="header-cta">Your consultation<ArrowUpRight size={17} aria-hidden="true" /></a>
          : <Link href="/try-on/" className="header-cta">Find your shade<ArrowUpRight size={17} aria-hidden="true" /></Link>}
      </div>
    </header>
  );
}
