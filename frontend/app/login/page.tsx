"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AuthCard } from "@/components/auth-modal";
import { useStorefront } from "@/components/storefront-shell";

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useStorefront();
  const backActionRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleBack = () => {
    // If on Step 2, backActionRef returns true after transitioning to Step 1
    if (backActionRef.current && backActionRef.current()) {
      return;
    }

    // On Step 1: navigate to the previous page or home
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
          <ChevronLeft size={26} strokeWidth={2.4} />
        </button>
      </div>

      <div className="hcs-auth-page-body">
        <AuthCard
          isStandalonePage
          onRegisterBackAction={(handler) => {
            backActionRef.current = handler;
          }}
          onSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            router.push("/");
          }}
        />
      </div>
    </div>
  );
}
