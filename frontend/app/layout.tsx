import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { BackToTop, CartDrawer, FloatingCartBar, SiteFooter, SiteHeader, StorefrontProvider } from "@/components/storefront-shell";
import { Toaster } from "sonner";

/* The only font on the site. Next.js downloads Poppins at build time and serves
   it from this site (no request to Google from the visitor's browser), so it
   always shows. Weights: 400 body · 500 subheadings & product names · 600 headings & prices. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-poppins",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Hyderabad Cue Sports — Premium Snooker Tables, Cues & Accessories",
  description: "Hyderabad Cue Sports — premium snooker tables, cues, balls, table cloth, scoreboards and lighting, delivered and installed across India.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={poppins.className}>
        <StorefrontProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <CartDrawer />
          <FloatingCartBar />
          <Toaster
            position="top-center"
            duration={3200}
            offset="14px"
            mobileOffset="12px"
            toastOptions={{
              className: "dynamic-island-toast",
            }}
          />
          <BackToTop />
        </StorefrontProvider>
      </body>
    </html>
  );
}
