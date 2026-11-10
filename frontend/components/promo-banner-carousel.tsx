"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface PromoSlide {
  id: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  buttonText: string;
  href: string;
  image: string;
  alt: string;
  theme?: "dark" | "light" | "accessories" | "scoreboards";
  hasUnderline?: boolean;
  isRibbonBadge?: boolean;
  hasGoldBar?: boolean;
}

export const defaultPromoSlides: PromoSlide[] = [
  {
    id: "premium-snooker-tables",
    kicker: "Premium",
    title: "Snooker Tables",
    buttonText: "Shop Now",
    href: "/shop?category=Snooker+Tables",
    image: "/images/banners/banner-snooker-tables-clean.jpg",
    alt: "Luxury tournament snooker table with dark wood carved legs in an elegant hall",
    theme: "dark",
  },
  {
    id: "professional-cue-equipment",
    kicker: "Professional",
    title: "Cue Equipment",
    buttonText: "Explore Range",
    href: "/shop?category=Cues",
    image: "/images/banners/banner-cue-equipment-clean.jpg",
    alt: "Handcrafted professional snooker cue sticks, tips and chalk on green billiard cloth",
    theme: "light",
    hasUnderline: true,
  },
  {
    id: "essential-table-accessories",
    kicker: "Essential",
    title: "Table Accessories",
    buttonText: "Shop Now",
    href: "/shop?category=Table+Accessories",
    image: "/images/banners/banner-table-accessories-clean.jpg",
    alt: "Snooker table accessories with green cloth, balls, triangle rack, and brass net pockets",
    theme: "accessories",
    isRibbonBadge: true,
  },
  {
    id: "craft-scoreboards",
    title: "Scoreboards",
    subtitle: "Keep Track of Every Frame",
    buttonText: "Shop Now",
    href: "/shop?category=Scoreboards",
    image: "/images/banners/banner-scoreboards-clean.jpg",
    alt: "Handcrafted mahogany snooker scoreboard with brass rails and pointers on wall",
    theme: "scoreboards",
    hasGoldBar: true,
  },
];

interface PromoBannerCarouselProps {
  slides?: PromoSlide[];
  sectionTitle?: string;
}

const SLIDE_DURATION = 5000; // 5 seconds per slide

export function PromoBannerCarousel({
  slides = defaultPromoSlides,
  sectionTitle = "In The Spotlight",
}: PromoBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setCycleKey((prev) => prev + 1);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setCycleKey((prev) => prev + 1);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setCycleKey((prev) => prev + 1);
  };

  // Progress bar auto-rotation: advances to next slide when progress ends
  useEffect(() => {
    if (totalSlides <= 1 || isSwiping) return;

    autoPlayRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
      setCycleKey((prev) => prev + 1);
    }, SLIDE_DURATION);

    return () => {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    };
  }, [currentIndex, cycleKey, totalSlides, isSwiping]);

  // Touch gesture swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchDelta(0);
    setIsSwiping(true);
    if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchDelta(currentX - touchStart);
  };

  const handleTouchEnd = () => {
    if (touchStart === null) return;
    setIsSwiping(false);
    if (touchDelta < -40 && totalSlides > 1) {
      nextSlide();
    } else if (touchDelta > 40 && totalSlides > 1) {
      prevSlide();
    } else {
      setCycleKey((prev) => prev + 1);
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  return (
    <section className="promo-carousel-section" aria-label={sectionTitle}>
      <div className="container promo-carousel-container">
        {/* Top Text Heading (Flipkart / Amazon Style) */}
        <div className="promo-section-header">
          <h2 className="promo-section-title">{sectionTitle}</h2>
        </div>

        {/* Carousel Viewport (Arrows removed as requested) */}
        <div
          className="promo-carousel-viewport"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Continuous Sliding Horizontal Track */}
          <div
            className="promo-carousel-slider"
            style={{
              transform:
                isSwiping && touchDelta !== 0
                  ? `translateX(calc(-${currentIndex * 100}% + ${touchDelta}px))`
                  : `translateX(-${currentIndex * 100}%)`,
              transition: isSwiping ? "none" : "transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {slides.map((slide, index) => {
              const themeClass = slide.theme ? `theme-${slide.theme}` : "theme-dark";
              return (
                <div
                  key={slide.id}
                  className={`promo-banner-card ${themeClass}`}
                  aria-hidden={index !== currentIndex}
                >
                  {/* Clean Background Image */}
                  <div className="promo-card-bg">
                    <img
                      src={slide.image}
                      alt={slide.alt}
                      className="promo-bg-img"
                      loading="lazy"
                    />
                    {slide.theme === "dark" && <div className="promo-overlay-gradient" />}
                  </div>

                  {/* Standalone HTML/CSS Content (Separate from Image) */}
                  <div className="promo-card-content">
                    {slide.kicker && (
                      <div className="promo-kicker-wrap">
                        <span className="promo-kicker-text">{slide.kicker}</span>
                      </div>
                    )}

                    {slide.isRibbonBadge ? (
                      <div className="promo-ribbon-badge">
                        <span className="promo-ribbon-text">{slide.title}</span>
                      </div>
                    ) : (
                      <h2 className="promo-title-text">{slide.title}</h2>
                    )}

                    {slide.subtitle && (
                      <p className="promo-subtitle-text">{slide.subtitle}</p>
                    )}

                    {slide.hasUnderline && (
                      <svg className="promo-title-curve" viewBox="0 0 160 12" fill="none" aria-hidden="true">
                        <path d="M2 10 C 50 2, 110 2, 158 10" stroke="#c6a15b" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    )}

                    {slide.hasGoldBar && (
                      <span className="promo-gold-bar" aria-hidden="true" />
                    )}

                    <div className="promo-action-wrap">
                      <Link
                        href={slide.href}
                        className={`promo-action-btn ${slide.theme === "dark" ? "btn-gold" : "btn-forest"}`}
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={16} className="promo-btn-arrow" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Amazon & Flipkart-Style Animated Progress Bar Pill Indicators Underneath the Card */}
        {totalSlides > 1 && (
          <div className="promo-pills-indicator" aria-label="Slide progress indicators">
            {slides.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`promo-pill-track ${isActive ? "active" : ""}`}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  {isActive && !isSwiping && (
                    <span
                      key={`fill-${currentIndex}-${cycleKey}`}
                      className="promo-pill-fill"
                      style={{ animationDuration: `${SLIDE_DURATION}ms` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
