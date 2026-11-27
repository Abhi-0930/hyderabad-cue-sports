import { Suspense } from "react";
import { AllCategoriesPage } from "@/components/categories-page";

export const metadata = {
  title: "All Categories — Hyderabad Cue Sports",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AllCategoriesPage />
    </Suspense>
  );
}
