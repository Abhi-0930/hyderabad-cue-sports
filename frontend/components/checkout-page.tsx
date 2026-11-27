"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Banknote, Building2, Check, ChevronRight, CreditCard, Home, Lock, MapPin, Minus, Plus, ShoppingCart, Smartphone, Trash2 } from "lucide-react";
import { formatInr, products } from "@/lib/products";
import { buildLoginUrl, buildProductUrl } from "@/lib/url";
import { useStorefront, whatsappUrl } from "@/components/storefront-shell";
import { RelatedRail } from "@/components/product-detail";

/* ---------------------------------------------------------------
   Checkout — Flipkart/Amazon style:
   1. Delivery address  2. Order summary  3. Payment
   with a Price details card and "You may also like" products.
   The address is remembered in this browser only (localStorage).
   Online payment is not connected yet: "Place order" says so.
   --------------------------------------------------------------- */

type Address = {
  name: string;
  phone: string;
  pincode: string;
  house: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  type: "Home" | "Work";
};

const EMPTY_ADDRESS: Address = { name: "", phone: "", pincode: "", house: "", area: "", landmark: "", city: "", state: "Telangana", type: "Home" };
const ADDRESS_KEY = "hcs-checkout-address";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const PAYMENT_OPTIONS = [
  { id: "upi", label: "UPI", note: "Google Pay, PhonePe, Paytm and other UPI apps", icon: Smartphone },
  { id: "card", label: "Credit / Debit card", note: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Net banking", note: "All major Indian banks", icon: Building2 },
  { id: "cod", label: "Cash on delivery", note: "Pay when your order arrives", icon: Banknote },
] as const;

type Step = 1 | 2 | 3;

function validate(a: Address) {
  const errors: Partial<Record<keyof Address, string>> = {};
  if (a.name.trim().length < 2) errors.name = "Enter your full name";
  if (!/^[6-9]\d{9}$/.test(a.phone.trim())) errors.phone = "Enter a valid 10-digit mobile number";
  if (!/^\d{6}$/.test(a.pincode.trim())) errors.pincode = "Enter a valid 6-digit pincode";
  if (!a.house.trim()) errors.house = "Enter house / flat number";
  if (!a.area.trim()) errors.area = "Enter area or street";
  if (!a.city.trim()) errors.city = "Enter city";
  if (!a.state) errors.state = "Choose a state";
  return errors;
}

function StepCard({ n, title, active, done, summary, onChange, children }: {
  n: number;
  title: string;
  active: boolean;
  done: boolean;
  summary?: React.ReactNode;
  onChange?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section className={`co-step ${active ? "is-active" : ""} ${done ? "is-done" : ""}`}>
      <header className="co-step-head">
        <span className="co-step-num">{done && !active ? <Check size={14} strokeWidth={3} /> : n}</span>
        <div className="co-step-title">
          <h2>{title}</h2>
          {!active && done && summary && <div className="co-step-summary">{summary}</div>}
        </div>
        {!active && done && onChange && <button type="button" className="co-change" onClick={onChange}>Change</button>}
      </header>
      {active && <div className="co-step-body">{children}</div>}
    </section>
  );
}

export function CheckoutPage() {
  const { cart, storageReady, authReady, user, updateQuantity, removeFromCart, showNotice } = useStorefront();
  const router = useRouter();

  // Checkout is for signed-in customers: guests go to login and come back here
  useEffect(() => {
    if (authReady && !user) router.replace(buildLoginUrl({ ref: "hcs_checkout_guard", next: "/checkout" }));
  }, [authReady, user, router]);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [savedAddress, setSavedAddress] = useState<Address | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [step, setStep] = useState<Step>(1);
  const [payment, setPayment] = useState<string>("upi");

  // Remembered address from an earlier visit (this browser only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADDRESS_KEY);
      if (raw) {
        const a = { ...EMPTY_ADDRESS, ...JSON.parse(raw) } as Address;
        if (!Object.keys(validate(a)).length) {
          setAddress(a);
          setSavedAddress(a);
          setStep(2);
        }
      }
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  const count = cart.reduce((n, i) => n + i.quantity, 0);
  const mrp = cart.reduce((n, i) => n + (i.compareAt && i.compareAt > i.price ? i.compareAt : i.price) * i.quantity, 0);
  const total = cart.reduce((n, i) => n + i.price * i.quantity, 0);
  const savings = mrp - total;

  const related = useMemo(() => {
    const inCart = new Set(cart.map((i) => i.id));
    const cartCats = new Set(cart.map((i) => i.category));
    const hasTable = cart.some((i) => i.type === "table");
    const pool = products.filter((p) => !inCart.has(p.id));
    // Tables in the cart → suggest accessories first; otherwise same categories first
    const score = (p: (typeof products)[number]) => (hasTable && p.type === "accessory" ? 2 : 0) + (cartCats.has(p.category) ? 1 : 0);
    return [...pool].sort((a, b) => score(b) - score(a)).slice(0, 10);
  }, [cart]);

  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = key === "phone" || key === "pincode" ? e.target.value.replace(/\D/g, "") : e.target.value;
    setAddress((a) => ({ ...a, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const saveAddress = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(address);
    setErrors(found);
    if (Object.keys(found).length) return;
    const clean = Object.fromEntries(Object.entries(address).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])) as Address;
    setAddress(clean);
    setSavedAddress(clean);
    try { localStorage.setItem(ADDRESS_KEY, JSON.stringify(clean)); } catch { /* storage unavailable */ }
    setStep(2);
  };

  const placeOrder = () => {
    if (!savedAddress) { setStep(1); return; }
    showNotice("Online payment isn't connected yet", "info");
  };

  const primary = step === 1
    ? { label: "Save and continue", action: () => (document.getElementById("co-address-form") as HTMLFormElement | null)?.requestSubmit() }
    : step === 2
      ? { label: "Continue", action: () => setStep(3) }
      : { label: "Place order", action: placeOrder };

  if (!storageReady || !authReady || !user) return <div className="co-page co-loading" aria-busy="true" />;

  if (cart.length === 0) {
    return (
      <div className="co-page">
        <div className="co-empty">
          <span className="co-empty-icon"><ShoppingCart size={34} strokeWidth={1.6} /></span>
          <h1>Your cart is empty</h1>
          <p>Add tables, cues and accessories to your cart and check out here.</p>
          <Link href="/shop" className="co-btn co-btn-primary">Shop now</Link>
        </div>
        <RelatedRail title="Popular right now" items={products.slice(0, 10)} />
      </div>
    );
  }

  const addressLine = savedAddress
    ? `${savedAddress.house}, ${savedAddress.area}${savedAddress.landmark ? `, ${savedAddress.landmark}` : ""}, ${savedAddress.city}, ${savedAddress.state} – ${savedAddress.pincode}`
    : "";

  return (
    <div className="co-page">
      <ol className="co-progress" aria-label="Checkout steps">
        {["Address", "Order summary", "Payment"].map((label, i) => {
          const n = (i + 1) as Step;
          const state = step > n ? "done" : step === n ? "current" : "";
          return (
            <li key={label} className={state}>
              <span className="co-progress-dot">{step > n ? <Check size={12} strokeWidth={3} /> : n}</span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="co-layout">
        <div className="co-main">
          {/* 1. Address */}
          <StepCard
            n={1}
            title="Delivery address"
            active={step === 1}
            done={!!savedAddress}
            onChange={() => setStep(1)}
            summary={savedAddress && <>
              <strong>{savedAddress.name}</strong> <span className="co-tag">{savedAddress.type}</span> <span className="co-muted">{savedAddress.phone}</span>
              <p>{addressLine}</p>
            </>}
          >
            <form id="co-address-form" className="co-form" onSubmit={saveAddress} noValidate>
              <div className="co-field">
                <label htmlFor="co-name">Full name</label>
                <input id="co-name" value={address.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name && <small>{errors.name}</small>}
              </div>
              <div className="co-field">
                <label htmlFor="co-phone">Mobile number</label>
                <input id="co-phone" value={address.phone} onChange={set("phone")} inputMode="numeric" maxLength={10} autoComplete="tel-national" aria-invalid={!!errors.phone} />
                {errors.phone && <small>{errors.phone}</small>}
              </div>
              <div className="co-field">
                <label htmlFor="co-pincode">Pincode</label>
                <input id="co-pincode" value={address.pincode} onChange={set("pincode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" aria-invalid={!!errors.pincode} />
                {errors.pincode && <small>{errors.pincode}</small>}
              </div>
              <div className="co-field">
                <label htmlFor="co-city">City</label>
                <input id="co-city" value={address.city} onChange={set("city")} autoComplete="address-level2" aria-invalid={!!errors.city} />
                {errors.city && <small>{errors.city}</small>}
              </div>
              <div className="co-field co-span">
                <label htmlFor="co-house">House / flat no., building</label>
                <input id="co-house" value={address.house} onChange={set("house")} autoComplete="address-line1" aria-invalid={!!errors.house} />
                {errors.house && <small>{errors.house}</small>}
              </div>
              <div className="co-field co-span">
                <label htmlFor="co-area">Area, street, sector</label>
                <input id="co-area" value={address.area} onChange={set("area")} autoComplete="address-line2" aria-invalid={!!errors.area} />
                {errors.area && <small>{errors.area}</small>}
              </div>
              <div className="co-field">
                <label htmlFor="co-landmark">Landmark <span className="co-optional">(optional)</span></label>
                <input id="co-landmark" value={address.landmark} onChange={set("landmark")} />
              </div>
              <div className="co-field">
                <label htmlFor="co-state">State</label>
                <select id="co-state" value={address.state} onChange={set("state")} autoComplete="address-level1" aria-invalid={!!errors.state}>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
                {errors.state && <small>{errors.state}</small>}
              </div>
              <div className="co-field co-span">
                <span className="co-label">Address type</span>
                <div className="co-chips">
                  {(["Home", "Work"] as const).map((t) => (
                    <button key={t} type="button" className={`co-chip ${address.type === t ? "is-selected" : ""}`} aria-pressed={address.type === t} onClick={() => setAddress((a) => ({ ...a, type: t }))}>
                      {t === "Home" ? <Home size={15} /> : <Building2 size={15} />} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="co-form-actions co-span">
                <button type="submit" className="co-btn co-btn-primary">Save and deliver here</button>
                {savedAddress && <button type="button" className="co-btn co-btn-ghost" onClick={() => { setAddress(savedAddress); setErrors({}); setStep(2); }}>Cancel</button>}
              </div>
            </form>
          </StepCard>

          {/* 2. Order summary */}
          <StepCard
            n={2}
            title="Order summary"
            active={step === 2}
            done={step > 2}
            onChange={() => setStep(2)}
            summary={<span className="co-muted">{count} {count === 1 ? "item" : "items"}</span>}
          >
            <ul className="co-items">
              {cart.map((item) => (
                <li key={item.id} className="co-item">
                  <Link href={buildProductUrl(item, { ref: "hcs_checkout" })} className="co-item-img"><img src={item.image} alt="" /></Link>
                  <div className="co-item-info">
                    <Link href={buildProductUrl(item, { ref: "hcs_checkout" })} className="co-item-name">{item.name}</Link>
                    <span className="co-muted">{item.category} · {item.size}</span>
                    <div className="co-item-price">
                      <strong>{formatInr(item.price)}</strong>
                      {item.compareAt && item.compareAt > item.price && <>
                        <del>{formatInr(item.compareAt)}</del>
                        <span className="co-off">{Math.round(((item.compareAt - item.price) / item.compareAt) * 100)}% off</span>
                      </>}
                    </div>
                    <div className="co-item-actions">
                      <div className="co-qty" aria-label={`Quantity of ${item.name}`}>
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1} aria-label="Decrease quantity"><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                      </div>
                      <button type="button" className="co-remove" onClick={() => removeFromCart(item.id)}><Trash2 size={15} /> Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="co-step-foot">
              <span className="co-muted">Order confirmation will be sent to <strong>{savedAddress?.phone}</strong></span>
              <button type="button" className="co-btn co-btn-primary" onClick={() => setStep(3)}>Continue</button>
            </div>
          </StepCard>

          {/* 3. Payment */}
          <StepCard n={3} title="Payment options" active={step === 3} done={false}>
            <div className="co-pay-list" role="radiogroup" aria-label="Payment options">
              {PAYMENT_OPTIONS.map(({ id, label, note, icon: Icon }) => (
                <label key={id} className={`co-pay ${payment === id ? "is-selected" : ""}`}>
                  <input type="radio" name="payment" value={id} checked={payment === id} onChange={() => setPayment(id)} />
                  <span className="co-radio" aria-hidden="true" />
                  <span className="co-pay-icon"><Icon size={20} /></span>
                  <span className="co-pay-text">
                    <strong>{label}</strong>
                    <span>{note}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="co-step-foot">
              <span className="co-pay-total">Total <strong>{formatInr(total)}</strong></span>
              <button type="button" className="co-btn co-btn-accent" onClick={placeOrder}>Place order</button>
            </div>
          </StepCard>
        </div>

        <aside className="co-side">
          <div className="co-price-card" id="co-price">
            <h2>Price details</h2>
            <dl>
              <div><dt>Price ({count} {count === 1 ? "item" : "items"})</dt><dd>{formatInr(mrp)}</dd></div>
              {savings > 0 && <div><dt>Discount</dt><dd className="co-green">− {formatInr(savings)}</dd></div>}
              <div><dt>Delivery &amp; installation</dt><dd className="co-muted">Confirmed with order</dd></div>
              <div className="co-total"><dt>Total amount</dt><dd>{formatInr(total)}</dd></div>
            </dl>
            {savings > 0 && <p className="co-save">You will save {formatInr(savings)} on this order</p>}
          </div>
          <ul className="co-trust">
            <li><BadgeCheck size={18} /><span>Genuine products from Hyderabad Cue Sports</span></li>
            <li><Lock size={18} /><span>Your details are only used to deliver your order</span></li>
            <li><MapPin size={18} /><span>Questions? <a href={whatsappUrl("Hi, I have a question about my order")} target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a></span></li>
          </ul>
        </aside>
      </div>

      <RelatedRail title="You may also like" items={related} />

      {/* Phones: total + next action pinned to the bottom */}
      <div className="co-mobile-bar">
        <div>
          <strong>{formatInr(total)}</strong>
          <a href="#co-price">View price details</a>
        </div>
        <button type="button" className={`co-btn ${step === 3 ? "co-btn-accent" : "co-btn-primary"}`} onClick={primary.action}>
          {primary.label} {step < 3 && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}

