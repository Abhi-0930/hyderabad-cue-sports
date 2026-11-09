import type { Metadata } from "next";
import "./globals.css";
import { BackToTop, CartDrawer, FloatingWhatsApp, SiteFooter, SiteHeader, StorefrontProvider, ToastNotice } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "Hyderabad Cue Sports — Premium Snooker Boards, Cues & Apparel",
  description: "Official storefront for Hyderabad Cue Sports. Premium tournament snooker boards, hand-crafted cues, and streetwear club apparel.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StorefrontProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <CartDrawer />
          <ToastNotice />
          <BackToTop />
          <FloatingWhatsApp />
        </StorefrontProvider>
      </body>
    </html>
  );
}
