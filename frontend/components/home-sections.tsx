"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, Ruler, Star } from "lucide-react";
import { formatInr, products } from "@/lib/products";
import { useStorefront, whatsappUrl } from "@/components/storefront-shell";

/* Homepage sections shown after the "Create your perfect snooker space" banner:
   shop by table size → customer reviews → consultation → newsletter.
   Copy marked "confirm" below is placeholder business information to verify with the client. */

/* ------------------------------------------------------- Shop tables by size */

// Rough room sizes for comfortable play (table + cue clearance). confirm with the client.
const TABLE_SIZES = [
  { size: "8 FT", label: "Compact", room: "≈ 17 × 13 ft room" },
  { size: "10 FT", label: "Club", room: "≈ 20 × 15 ft room" },
  { size: "12 FT", label: "Tournament", room: "≈ 22 × 16 ft room" },
];

export function ShopBySize() {
  // Photo and starting price per size come from the catalogue, so they stay in sync
  const sizes = useMemo(
    () =>
      TABLE_SIZES.map((entry) => {
        const tables = products.filter((p) => p.category === "Snooker Tables" && p.size === entry.size);
        return {
          ...entry,
          image: tables[0]?.image ?? "/images/snooker-room.jpg",
          from: tables.length ? Math.min(...tables.map((t) => t.price)) : null,
          href: `/shop?${new URLSearchParams({ category: "Snooker Tables", size: entry.size })}`,
        };
      }),
    [],
  );

  return (
    <section className="home-section home-sizes">
      <div className="home-section-inner home-panel home-panel-green">
        <div className="home-section-head">
          <h2 className="home-section-title">Shop tables by size</h2>
          <Link href="/shop?category=Snooker+Tables" className="featured-view-all" aria-label="View all snooker tables">
            <ChevronRight size={22} className="view-all-arrow" />
          </Link>
        </div>
        <div className="home-sizes-grid">
          {sizes.map((s) => (
            <Link key={s.size} href={s.href} className="home-size-card">
              <div className="home-size-media">
                <img src={s.image} alt={`${s.size} snooker table`} loading="lazy" />
                <span className="home-size-chip">{s.size}</span>
              </div>
              <div className="home-size-body">
                <strong>{s.label} tables</strong>
                {s.from !== null && <span className="home-size-price">From {formatInr(s.from)}</span>}
              </div>
              <span className="home-size-arrow" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Customer reviews */

// SAMPLE reviews (not real customers) — replace with genuine reviews before launch.
const REVIEWS = [
  {
    name: "Sample customer",
    city: "Hyderabad",
    product: "12 FT Tournament Table",
    text: "The proportions, the finish, the way the table settles into the room — this is exactly the feeling we wanted.",
  },
  {
    name: "Sample customer",
    city: "Mumbai",
    product: "10 FT Club Table",
    text: "A calm, clear way to choose the centrepiece of our playing room. The team guided us on size and lighting.",
  },
  {
    name: "Sample customer",
    city: "Bengaluru",
    product: "Cue & accessories",
    text: "Quick answers on WhatsApp and everything arrived well packed. The cue feels balanced and solid.",
  },
];

export function CustomerReviews() {
  return (
    <section className="home-section home-reviews">
      <div className="home-section-inner home-panel home-panel-gold">
        <div className="home-section-head">
          <h2 className="home-section-title">What our customers say</h2>
          <Link href="/shop" className="featured-view-all" aria-label="Shop the collection">
            <ChevronRight size={22} className="view-all-arrow" />
          </Link>
        </div>
        <div className="home-reviews-grid">
          {REVIEWS.map((r, i) => (
            <figure className="home-review-card" key={i}>
              <div className="home-review-stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} size={15} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <blockquote>“{r.text}”</blockquote>
              <figcaption>
                <span className="home-review-avatar" aria-hidden="true">
                  {r.city.charAt(0)}
                </span>
                <span>
                  <strong>{r.name}</strong>
                  <small>
                    {r.city} · {r.product}
                  </small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Free consultation */

export function ConsultationPanel() {
  return (
    <section className="home-section home-consult">
      <div className="home-consult-panel">
        <div className="home-consult-copy">
          <h2>Not sure which table fits your room?</h2>
          <p>Share your room size on WhatsApp and we’ll suggest the right table, cloth and lighting — free, no obligation.</p>
          <div className="home-consult-actions">
            <a
              className="home-consult-whatsapp"
              href={whatsappUrl("Hi, I'd like help choosing a snooker table for my room.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
            <Link href="/shop?category=Snooker+Tables" className="home-consult-secondary">
              Browse tables <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="home-consult-guide" aria-label="Room size guide">
          <span className="home-consult-guide-title">
            <Ruler size={16} aria-hidden="true" /> Room size guide
          </span>
          <ul>
            {TABLE_SIZES.map((s) => (
              <li key={s.size}>
                <strong>{s.size}</strong>
                <span>{s.room.replace("≈ ", "")}</span>
              </li>
            ))}
          </ul>
          <small>Approximate minimum room size for comfortable cueing.</small>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Newsletter */

export function NewsletterSignup() {
  const { showNotice } = useStorefront();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    // Not connected to an email service yet — nothing is sent.
    setSubscribed(true);
    showNotice("Thank you — you're on the list.", "success");
  };

  return (
    <section className="home-section home-newsletter">
      <div className="home-newsletter-panel">
        <div className="home-newsletter-copy">
          <h2>Get new arrivals &amp; offers first</h2>
          <p>Occasional updates on new tables, cues and accessories. No spam — unsubscribe anytime.</p>
        </div>
        {subscribed ? (
          <div className="home-newsletter-done" role="status">
            <span aria-hidden="true">
              <Check size={18} strokeWidth={2.6} />
            </span>
            You’re on the list.
          </div>
        ) : (
          <form className="home-newsletter-form" onSubmit={submit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              required
            />
            <button type="submit">
              Subscribe <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
