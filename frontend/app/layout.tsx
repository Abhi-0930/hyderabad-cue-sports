import type { Metadata } from "next";
import "./globals.css";
import { BackToTop, CartDrawer, SiteFooter, SiteHeader, StorefrontProvider, ToastNotice } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "Hyderabad Cue Sports — Premium Snooker Tables",
  description: "A premium illustrative storefront for snooker tables and equipment, crafted for precision.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><StorefrontProvider><SiteHeader /><main>{children}</main><SiteFooter /><CartDrawer /><ToastNotice /><BackToTop /></StorefrontProvider></body></html>;
}
