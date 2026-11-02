import { ProductPage } from "@/components/pages";

export default function Page({ params }: { params: { slug: string } }) {
  return <ProductPage slug={params.slug} />;
}
