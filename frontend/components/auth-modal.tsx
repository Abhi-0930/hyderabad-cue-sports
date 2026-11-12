"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { allCountries, type Country } from "country-telephone-data";
import { apiFetch, type AuthUser } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: AuthUser) => void;
  isStandalonePage?: boolean;
  onRegisterBackAction?: (handler: () => boolean) => void;
}

const SORTED_COUNTRIES: Country[] = [
  ...allCountries.filter((c) => c.iso2 === "in"),
  ...allCountries.filter((c) => c.iso2 !== "in"),
];

const DEFAULT_COUNTRY: Country =
  SORTED_COUNTRIES.find((c) => c.iso2 === "in") || SORTED_COUNTRIES[0];

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

function formatCountryDisplayName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim() || name;
}

function validatePhoneByCountry(digits: string, country: Country): string | null {
  if (country.iso2 === "in") {
    return /^[6-9]\d{9}$/.test(digits)
      ? null
      : "Please enter a valid 10-digit Indian mobile number.";
  }
  return digits.length >= 6 && digits.length <= 15
    ? null
    : "Please enter a valid mobile number (6 to 15 digits).";
}

function PhoneNumberField({
  selectedCountry,
  onCountryChange,
  value,
  onChange,
}: {
  selectedCountry: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChange: (digits: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [dropdownOpen]);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SORTED_COUNTRIES;
    const digitQuery = q.replace(/^\+/, "");
    return SORTED_COUNTRIES.filter((c) => {
      const displayName = formatCountryDisplayName(c.name).toLowerCase();
      return (
        displayName.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.dialCode.includes(digitQuery) ||
        `+${c.dialCode}`.includes(q)
      );
    });
  }, [searchQuery]);

  const maxDigits = selectedCountry.iso2 === "in" ? 10 : 15;

  return (
    <div className="hcs-auth-phone-wrap" ref={wrapRef}>
      <div className="hcs-auth-phone-box">
        <button
          type="button"
          className="hcs-auth-country-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDropdownOpen((prev) => {
              if (prev) setSearchQuery("");
              return !prev;
            });
          }}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          aria-label={`Select country code (current +${selectedCountry.dialCode})`}
        >
          <span>+{selectedCountry.dialCode}</span>
          <ChevronDown
            size={15}
            strokeWidth={2.2}
            className={dropdownOpen ? "hcs-chevron-open" : ""}
          />
        </button>

        <div className="hcs-auth-divider" />

        <input
          ref={phoneInputRef}
          type="tel"
          inputMode="numeric"
          maxLength={maxDigits}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, maxDigits))}
          placeholder="Mobile number"
          className="hcs-auth-input"
          aria-label="Mobile number"
        />
      </div>

      {dropdownOpen && (
        <div
          className="hcs-auth-country-panel"
          role="dialog"
          aria-label="Choose country code"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="hcs-country-search-wrap">
            <Search size={15} className="hcs-country-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or code (+91, India...)"
              className="hcs-country-search-input"
              aria-label="Search country or dial code"
            />
            {searchQuery && (
              <button
                type="button"
                className="hcs-country-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear country search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <ul className="hcs-auth-country-menu" role="listbox" aria-label="Country code list">
            {filteredCountries.length === 0 ? (
              <li className="hcs-country-empty">No countries match &ldquo;{searchQuery}&rdquo;</li>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.iso2 === selectedCountry.iso2;
                return (
                  <li key={country.iso2} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      className={`hcs-auth-country-option ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        onCountryChange(country);
                        if (country.iso2 === "in" && value.length > 10) {
                          onChange(value.slice(0, 10));
                        }
                        setDropdownOpen(false);
                        setSearchQuery("");
                        window.setTimeout(() => phoneInputRef.current?.focus(), 0);
                      }}
                    >
                      <span className="hcs-country-iso">{country.iso2.toUpperCase()}</span>
                      <span className="hcs-country-name">
                        {formatCountryDisplayName(country.name)}
                      </span>
                      <span className="hcs-country-dial">+{country.dialCode}</span>
                      {isSelected && <Check size={14} className="hcs-country-check" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AuthBrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`hcs-auth-brand ${className}`.trim()}>
      <span className="hcs-auth-badge">HCS</span>
      <div className="hcs-auth-brand-text">
        <span className="hcs-auth-title">HYDERABAD</span>
        <span className="hcs-auth-subtitle">CUE SPORTS</span>
      </div>
    </div>
  );
}

export function AuthCard({
  onClose,
  onSuccess,
  isStandalonePage = false,
  onRegisterBackAction,
}: Omit<AuthModalProps, "isOpen">) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const [step, setStep] = useState<AuthStep>("entry");
  const [entryMode, setEntryMode] = useState<EntryMode>("phone");
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [onboardingToken, setOnboardingToken] = useState("");
  const [maskedIdentifier, setMaskedIdentifier] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const resetToEntry = () => {
    setStep("entry");
    setOnboardingToken("");
    setMaskedIdentifier("");
    setError("");
    setTurnstileToken(null);
    setTurnstileError(false);
    turnstileRef.current?.reset();
  };

  useEffect(() => {
    if (!onRegisterBackAction) return;
    onRegisterBackAction(() => {
      if (step !== "entry") {
        resetToEntry();
        return true;
      }
      return false;
    });
  }, [step, onRegisterBackAction]);

  const toggleEntryMode = () => {
    setEntryMode((prev) => (prev === "phone" ? "email" : "phone"));
    setError("");
  };

  const handleContinueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanDigits = phoneInput.replace(/\D/g, "");
    if (entryMode === "phone") {
      const phoneError = validatePhoneByCountry(cleanDigits, selectedCountry);
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
          ? {
              mode: "phone",
              phone: `+${selectedCountry.dialCode}${cleanDigits}`,
              turnstileToken,
            }
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
      const phoneError = validatePhoneByCountry(cleanDigits, selectedCountry);
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
          : { phone: `+${selectedCountry.dialCode}${cleanDigits}`, onboardingToken };

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
      <AuthBrandLogo />

      {step === "entry" ? (
        <form
          onSubmit={handleContinueSubmit}
          className={`hcs-auth-form ${entryMode === "email" ? "hcs-auth-form--email" : ""}`}
          noValidate
        >
          <h2 className="hcs-auth-heading">Log in for the best experience</h2>
          <p className="hcs-auth-subtext">
            {entryMode === "phone"
              ? "Enter your mobile number to continue"
              : "Enter your email address to continue"}
          </p>

          {entryMode === "phone" ? (
            <PhoneNumberField
              selectedCountry={selectedCountry}
              onCountryChange={(country) => {
                setSelectedCountry(country);
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
                  setTurnstileError(false);
                  if (error) setError("");
                }}
                onExpire={() => {
                  setTurnstileToken(null);
                  turnstileRef.current?.reset();
                }}
                onError={() => {
                  setTurnstileToken(null);
                  setTurnstileError(true);
                  setError("Human verification could not load. Tap below to retry.");
                }}
                options={{ theme: "light", size: "flexible" }}
              />
              {turnstileError && (
                <button
                  type="button"
                  className="hcs-turnstile-retry-btn"
                  onClick={() => {
                    setTurnstileError(false);
                    setError("");
                    turnstileRef.current?.reset();
                  }}
                >
                  Retry Verification Check
                </button>
              )}
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
        <form
          onSubmit={handleCompleteSignup}
          className={`hcs-auth-form ${step === "needs_email" ? "hcs-auth-form--needs-email" : ""}`}
          noValidate
        >
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
              selectedCountry={selectedCountry}
              onCountryChange={(country) => {
                setSelectedCountry(country);
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
