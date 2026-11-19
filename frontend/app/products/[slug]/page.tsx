import { redirect } from "next/navigation";
import { getProduct, fetchStorefrontProductBySlug } from "@/lib/products";
import { buildProductUrl } from "@/lib/url";
import { ProductPage } from "@/components/pages";

export default async function Page({ params }: { params: { slug: string } }) {
  let product = getProduct(params.slug);
  if (!product) {
    product = await fetchStorefrontProductBySlug(params.slug);
  }
  if (product) {
    redirect(buildProductUrl(product, { ref: "hcs_path_redirect" }));
  }
  return <ProductPage slug={params.slug} />;
}

