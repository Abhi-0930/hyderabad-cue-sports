"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductPage } from "@/components/pages";
import { resolveProductFromQueryParams, verifyProductUrlSignature } from "@/lib/url";
import { Loader2 } from "lucide-react";

function ProductQueryContent() {
  const searchParams = useSearchParams();
  const pid = searchParams.get("pid");
  const slug = searchParams.get("slug");
  const sig = searchParams.get("sig");

  const product = resolveProductFromQueryParams({ pid, slug });

  // If a signature is present, verify it wasn't modified or tampered with
  let isTampered = false;
  if (product && sig) {
    isTampered = !verifyProductUrlSignature(product.id, product.slug, sig);
  }

  return (
    <ProductPage
      slug={product?.slug || slug || ""}
      pid={product?.id || pid || ""}
      isTampered={isTampered}
    />
  );
}

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
      <ProductQueryContent />
    </Suspense>
  );
}

