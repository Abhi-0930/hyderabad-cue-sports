import type { Metadata } from "next";
import "./globals.css";
import { BackToTop, CartDrawer, FloatingWhatsApp, SiteFooter, SiteHeader, StorefrontProvider } from "@/components/storefront-shell";
import { Toaster } from "sonner";

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
          <FloatingWhatsApp />
        </StorefrontProvider>
      </body>
    </html>
  );
}
