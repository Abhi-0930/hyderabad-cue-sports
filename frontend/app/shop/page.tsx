import { Suspense } from "react";
import { ShopPage } from "@/components/pages";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          className="container"
          style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}
        >
          <Loader2 size={24} className="hcs-spin" />
        </div>
      }
    >
      <ShopPage />
    </Suspense>
  );
}
