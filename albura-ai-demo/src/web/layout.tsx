import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Header } from "@/web/components/layout/Header";
import { Footer } from "@/web/components/layout/Footer";
import "./styles/globals.css";
import "./styles/guide.css";
import "./styles/camera.css";
import "./styles/studio.css";
import "./styles/consultation.css";

const bodyFont = localFont({ src: [
  { path: "../../public/fonts/manrope-400.ttf", weight: "400", style: "normal" },
  { path: "../../public/fonts/manrope-600.ttf", weight: "600", style: "normal" },
  { path: "../../public/fonts/manrope-700.ttf", weight: "700", style: "normal" },
], variable: "--font-body", display: "swap" });
const editorialFont = localFont({ src: [
  { path: "../../public/fonts/instrument-serif-normal.ttf", weight: "400", style: "normal" },
  { path: "../../public/fonts/instrument-serif-italic.ttf", weight: "400", style: "italic" },
], variable: "--font-editorial", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Al Bura Cosmetics · Virtual Colour Studio", template: "%s · Al Bura Cosmetics" },
  description: "Explore the Al Bura Cosmetics AI hair colour try-on demo. An illustrative colour studio, prepared for browser-based previews.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${editorialFont.variable}`}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
