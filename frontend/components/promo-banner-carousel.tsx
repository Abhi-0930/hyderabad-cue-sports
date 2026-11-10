"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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

const SLIDE_DURATION = 5000;

export function PromoBannerCarousel({
  slides = defaultPromoSlides,
  sectionTitle = "In The Spotlight",
}: PromoBannerCarouselProps) {
  const [activePage, setActivePage] = useState(0);
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [cycleKey, setCycleKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);

  // Responsive device detection:
  // Mobile (<=640px): 1 card visible
  // Tablet (641px - 1024px): 2 cards visible
  // Desktop (>1024px): 3 cards visible
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 640) {
        setVisibleCount(1);
      } else if (width <= 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute number of pages/dots accordingly:
  // Mobile (visible 1): 4 slides -> 4 dots
  // Tablet (visible 2): 4 slides -> 2 dots
  // Desktop (visible 3): 4 slides -> 2 dots
  const pageCount =
    visibleCount === 1
      ? slides.length
      : Math.max(1, Math.ceil(slides.length / visibleCount));

  // Ensure activePage does not exceed pageCount if window is resized
  useEffect(() => {
    if (activePage >= pageCount) {
      setActivePage(Math.max(0, pageCount - 1));
      setCycleKey((prev) => prev + 1);
    }
  }, [pageCount, activePage]);

  // Navigate to a specific page smoothly
  const goToPage = useCallback(
    (pageIndex: number) => {
      if (!scrollRef.current) return;
      const { scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 0) return;

      let targetLeft = 0;
      if (pageIndex === 0) {
        targetLeft = 0;
      } else if (pageIndex >= pageCount - 1) {
        targetLeft = maxScroll;
      } else {
        targetLeft = (pageIndex / (pageCount - 1)) * maxScroll;
      }

      isProgrammaticScrollRef.current = true;
      scrollRef.current.scrollTo({
        left: targetLeft,
        behavior: "smooth",
      });
      setActivePage(pageIndex);
      setCycleKey((prev) => prev + 1);

      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    },
    [pageCount]
  );

  // Auto-advance progress timer
  useEffect(() => {
    if (pageCount <= 1 || isPaused) return;

    const timer = setTimeout(() => {
      const nextPage = (activePage + 1) % pageCount;
      goToPage(nextPage);
    }, SLIDE_DURATION);

    return () => clearTimeout(timer);
  }, [activePage, pageCount, isPaused, cycleKey, goToPage]);

  // Handle manual scroll (swipe, drag, trackpad)
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current || !scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      if (activePage !== 0) setActivePage(0);
      return;
    }
    const progress = Math.min(Math.max(0, scrollLeft / maxScroll), 1);
    const newPage = Math.min(
      Math.max(0, Math.round(progress * (pageCount - 1))),
      pageCount - 1
    );
    if (newPage !== activePage) {
      setActivePage(newPage);
      setCycleKey((prev) => prev + 1);
    }
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDownRef.current) {
      isDownRef.current = false;
      setIsPaused(false);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
    }
  };

  return (
    <section className="promo-carousel-section" aria-label={sectionTitle}>
      <div className="container promo-carousel-container">
        {/* Top Text Heading (Flipkart / Amazon Style) */}
        <div className="promo-section-header">
          <h2 className="promo-section-title">{sectionTitle}</h2>
        </div>

        {/* Horizontal Gesture Scroll Rail */}
        <div
          className="promo-carousel-viewport"
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onMouseEnter={() => setIsPaused(true)}
        >
          <div className="promo-carousel-slider">
            {slides.map((slide) => {
              const themeClass = slide.theme ? `theme-${slide.theme}` : "theme-dark";
              return (
                <div
                  key={slide.id}
                  className={`promo-banner-card ${themeClass}`}
                >
                  {/* Clean Background Image */}
                  <div className="promo-card-bg">
                    <img
                      src={slide.image}
                      alt={slide.alt}
                      className="promo-bg-img"
                      loading="lazy"
                      draggable={false}
                    />
                    {slide.theme === "dark" && <div className="promo-overlay-gradient" />}
                  </div>

                  {/* Standalone HTML/CSS Content */}
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
                      <h3 className="promo-title-text">{slide.title}</h3>
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
                        onClick={handleLinkClick}
                        className={`promo-action-btn ${slide.theme === "dark" ? "btn-gold" : "btn-forest"}`}
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={14} className="promo-btn-arrow" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Amazon & Flipkart-Style Animated Progress Bar Pill Indicators Underneath the Cards */}
        {pageCount > 1 && (
          <div
            className={`promo-pills-indicator ${isPaused ? "paused" : ""}`}
            aria-label="Slide progress indicators"
          >
            {Array.from({ length: pageCount }).map((_, idx) => {
              const isActive = idx === activePage;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`promo-pill-track ${isActive ? "active" : ""}`}
                  onClick={() => goToPage(idx)}
                  aria-label={`Go to slide group ${idx + 1}`}
                >
                  {isActive && !isPaused && (
                    <span
                      key={`fill-${idx}-${cycleKey}`}
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
