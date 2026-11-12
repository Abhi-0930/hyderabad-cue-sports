import { redirect } from "next/navigation";
import { getProduct } from "@/lib/products";
import { buildProductUrl } from "@/lib/url";
import { ProductPage } from "@/components/pages";

export default function Page({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (product) {
    redirect(buildProductUrl(product, { ref: "hcs_path_redirect" }));
  }
  return <ProductPage slug={params.slug} />;
}
