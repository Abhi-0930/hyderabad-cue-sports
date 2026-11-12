"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth-modal";
import { useStorefront } from "@/components/storefront-shell";

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser, showNotice } = useStorefront();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="hcs-auth-page">
      <div className="hcs-auth-page-topbar">
        <button
          type="button"
          className="hcs-auth-page-back"
          onClick={handleBack}
          aria-label="Go back"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
          <span>Back</span>
        </button>
      </div>

      <div className="hcs-auth-page-body">
        <AuthCard
          isStandalonePage
          onSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            showNotice("Welcome to Hyderabad Cue Sports.");
            router.push("/");
          }}
        />
      </div>
    </div>
  );
}
