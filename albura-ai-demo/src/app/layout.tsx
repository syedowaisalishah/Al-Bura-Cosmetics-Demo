import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Al Bura Cosmetics · Virtual Colour Studio", template: "%s · Al Bura Cosmetics" },
  description: "Explore the Al Bura Cosmetics AI hair colour try-on demo. An illustrative colour studio, prepared for browser-based previews.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
