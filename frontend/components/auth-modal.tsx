"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Check, ChevronDown, Loader2, X } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { apiFetch, type AuthUser } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: AuthUser) => void;
  isStandalonePage?: boolean;
}

interface CountryOption {
  code: string;
  dial: string;
  name: string;
}

const COUNTRY_CODES: CountryOption[] = [
  { code: "IN", dial: "+91", name: "India" },
  { code: "AE", dial: "+971", name: "United Arab Emirates" },
  { code: "US", dial: "+1", name: "United States / Canada" },
  { code: "GB", dial: "+44", name: "United Kingdom" },
  { code: "SG", dial: "+65", name: "Singapore" },
  { code: "AU", dial: "+61", name: "Australia" },
  { code: "SA", dial: "+966", name: "Saudi Arabia" },
  { code: "QA", dial: "+974", name: "Qatar" },
  { code: "MY", dial: "+60", name: "Malaysia" },
  { code: "DE", dial: "+49", name: "Germany" },
];

type AuthStep = "entry" | "needs_email" | "needs_phone";
type EntryMode = "phone" | "email";

interface ContinueResponse {
  success: boolean;
  status?: "logged_in" | "needs_email" | "needs_phone";
  user?: AuthUser;
  onboardingToken?: string;
  maskedPhone?: string;
  maskedEmail?: string;
  message?: string;
}

interface CompleteSignupResponse {
  success: boolean;
  status?: "logged_in";
  user?: AuthUser;
  message?: string;
}

function validatePhoneByCountry(digits: string, dialCode: string): string | null {
  if (dialCode === "+91") {
    return /^[6-9]\d{9}$/.test(digits)
      ? null
      : "Please enter a valid 10-digit Indian mobile number.";
  }
  return digits.length >= 7 && digits.length <= 15
    ? null
    : "Please enter a valid mobile number (7 to 15 digits).";
}

function PhoneNumberField({
  dialCode,
  onDialChange,
  value,
  onChange,
}: {
  dialCode: string;
  onDialChange: (dial: string) => void;
  value: string;
  onChange: (digits: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [dropdownOpen]);

  const maxDigits = dialCode === "+91" ? 10 : 15;

  return (
    <div className="hcs-auth-phone-wrap" ref={wrapRef}>
      <div className="hcs-auth-phone-box">
        <button
          type="button"
          className="hcs-auth-country-btn"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          aria-label="Select country code"
        >
          <span>{dialCode}</span>
          <ChevronDown
            size={15}
            strokeWidth={2.2}
            className={dropdownOpen ? "hcs-chevron-open" : ""}
          />
        </button>

        <div className="hcs-auth-divider" />

        <input
          type="tel"
          inputMode="numeric"
          maxLength={maxDigits}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, maxDigits))}
          placeholder="Mobile number"
          className="hcs-auth-input"
          aria-label="Mobile number"
          autoFocus
        />
      </div>

      {dropdownOpen && (
        <ul className="hcs-auth-country-menu" role="listbox" aria-label="Country code list">
          {COUNTRY_CODES.map((country) => {
            const isSelected = country.dial === dialCode;
            return (
              <li key={country.code} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={`hcs-auth-country-option ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    onDialChange(country.dial);
                    if (country.dial === "+91" && value.length > 10) {
                      onChange(value.slice(0, 10));
                    }
                    setDropdownOpen(false);
                  }}
                >
                  <span className="hcs-country-iso">{country.code}</span>
                  <span className="hcs-country-name">{country.name}</span>
                  <span className="hcs-country-dial">{country.dial}</span>
                  {isSelected && <Check size={14} className="hcs-country-check" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function AuthCard({
  onClose,
  onSuccess,
  isStandalonePage = false,
}: Omit<AuthModalProps, "isOpen">) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const [step, setStep] = useState<AuthStep>("entry");
  const [entryMode, setEntryMode] = useState<EntryMode>("phone");
  const [countryDial, setCountryDial] = useState("+91");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [onboardingToken, setOnboardingToken] = useState("");
  const [maskedIdentifier, setMaskedIdentifier] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const resetToEntry = () => {
    setStep("entry");
    setOnboardingToken("");
    setMaskedIdentifier("");
    setError("");
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  const toggleEntryMode = () => {
    setEntryMode((prev) => (prev === "phone" ? "email" : "phone"));
    setError("");
  };

  const handleContinueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanDigits = phoneInput.replace(/\D/g, "");
    if (entryMode === "phone") {
      const phoneError = validatePhoneByCountry(cleanDigits, countryDial);
      if (phoneError) {
        setError(phoneError);
        return;
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    if (!turnstileSiteKey) {
      setError("Security configuration is missing (NEXT_PUBLIC_TURNSTILE_SITE_KEY).");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the human verification check.");
      return;
    }

    setLoading(true);
    try {
      const payload =
        entryMode === "phone"
          ? { mode: "phone", phone: `${countryDial}${cleanDigits}`, turnstileToken }
          : { mode: "email", email: emailInput.trim(), turnstileToken };

      const { ok, data } = await apiFetch<ContinueResponse>("/api/auth/continue", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!ok || !data.success) {
        setError(data.message || "Verification failed. Please try again.");
        setTurnstileToken(null);
        turnstileRef.current?.reset();
        return;
      }

      if (data.status === "logged_in" && data.user) {
        onSuccess(data.user);
        return;
      }

      if (data.status === "needs_email" && data.onboardingToken) {
        setOnboardingToken(data.onboardingToken);
        setMaskedIdentifier(data.maskedPhone || "");
        setEmailInput("");
        setStep("needs_email");
        return;
      }

      if (data.status === "needs_phone" && data.onboardingToken) {
        setOnboardingToken(data.onboardingToken);
        setMaskedIdentifier(data.maskedEmail || "");
        setPhoneInput("");
        setStep("needs_phone");
        return;
      }
    } catch {
      setError("Unable to reach server. Please ensure the backend is running.");
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanDigits = phoneInput.replace(/\D/g, "");
    if (step === "needs_email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    } else if (step === "needs_phone") {
      const phoneError = validatePhoneByCountry(cleanDigits, countryDial);
      if (phoneError) {
        setError(phoneError);
        return;
      }
    }

    setLoading(true);
    try {
      const payload =
        step === "needs_email"
          ? { email: emailInput.trim(), onboardingToken }
          : { phone: `${countryDial}${cleanDigits}`, onboardingToken };

      const { ok, data } = await apiFetch<CompleteSignupResponse>(
        "/api/auth/complete-signup",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!ok || !data.success || !data.user) {
        setError(data.message || "Could not complete registration. Please try again.");
        return;
      }

      onSuccess(data.user);
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`hcs-auth-card ${isStandalonePage ? "standalone" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {!isStandalonePage && onClose && (
        <button
          type="button"
          className="hcs-auth-close"
          onClick={onClose}
          aria-label="Close sign in window"
        >
          <X size={20} />
        </button>
      )}

      {/* Brand Logo (Centered HCS Angled Gold Badge + Bold Green Typography) */}
      <div className="hcs-auth-brand">
        <span className="hcs-auth-badge">HCS</span>
        <div className="hcs-auth-brand-text">
          <span className="hcs-auth-title">HYDERABAD</span>
          <span className="hcs-auth-subtitle">CUE SPORTS</span>
        </div>
      </div>

      {step === "entry" ? (
        <form onSubmit={handleContinueSubmit} className="hcs-auth-form" noValidate>
          <h2 className="hcs-auth-heading">Log in for the best experience</h2>
          <p className="hcs-auth-subtext">
            {entryMode === "phone"
              ? "Enter your mobile number to continue"
              : "Enter your email address to continue"}
          </p>

          {entryMode === "phone" ? (
            <PhoneNumberField
              dialCode={countryDial}
              onDialChange={(dial) => {
                setCountryDial(dial);
                if (error) setError("");
              }}
              value={phoneInput}
              onChange={(digits) => {
                setPhoneInput(digits);
                if (error) setError("");
              }}
            />
          ) : (
            <div className="hcs-auth-email-box">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Email address"
                className="hcs-auth-input"
                aria-label="Email address"
                autoFocus
              />
            </div>
          )}

          <div className="hcs-auth-mode-row">
            <button
              type="button"
              className="hcs-auth-toggle-link"
              onClick={toggleEntryMode}
            >
              {entryMode === "phone" ? "Use Email-ID" : "Use Mobile Number"}
            </button>
          </div>

          {/* Cloudflare Turnstile Managed Verification */}
          {turnstileSiteKey && (
            <div className="hcs-auth-turnstile">
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  if (error) setError("");
                }}
                onExpire={() => setTurnstileToken(null)}
                onError={() => {
                  setTurnstileToken(null);
                  setError("Human verification could not load. Please refresh and try again.");
                }}
                options={{ theme: "light", size: "flexible" }}
              />
            </div>
          )}

          {error && <div className="hcs-auth-error" role="alert">{error}</div>}

          <p className="hcs-auth-legal">
            By continuing, you confirm that you are above 18 years of age, and you agree to
            Hyderabad Cue Sports&apos;{" "}
            <a href="#terms" onClick={(e) => e.preventDefault()}>
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a href="#privacy" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            .
          </p>

          <button type="submit" className="hcs-auth-submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="hcs-spin" /> : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCompleteSignup} className="hcs-auth-form" noValidate>
          <button type="button" className="hcs-auth-back" onClick={resetToEntry}>
            <ArrowLeft size={15} />
            <span>Change {step === "needs_email" ? "mobile number" : "email"}</span>
          </button>

          <h2 className="hcs-auth-heading">
            {step === "needs_email"
              ? "Add your email to finish"
              : "Add your mobile number"}
          </h2>
          <p className="hcs-auth-subtext">
            {step === "needs_email"
              ? `Signing up with ${maskedIdentifier}. Enter your email for order updates & receipts.`
              : `Signing up with ${maskedIdentifier}. Enter your mobile number for delivery updates.`}
          </p>

          {step === "needs_email" ? (
            <div className="hcs-auth-email-box">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your email address"
                className="hcs-auth-input"
                aria-label="Email address"
                autoFocus
              />
            </div>
          ) : (
            <PhoneNumberField
              dialCode={countryDial}
              onDialChange={(dial) => {
                setCountryDial(dial);
                if (error) setError("");
              }}
              value={phoneInput}
              onChange={(digits) => {
                setPhoneInput(digits);
                if (error) setError("");
              }}
            />
          )}

          {error && <div className="hcs-auth-error" role="alert">{error}</div>}

          <button type="submit" className="hcs-auth-submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="hcs-spin" /> : "Complete Sign Up"}
          </button>
        </form>
      )}
    </div>
  );
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="hcs-auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <AuthCard onClose={onClose} onSuccess={onSuccess} />
    </div>
  );
}
