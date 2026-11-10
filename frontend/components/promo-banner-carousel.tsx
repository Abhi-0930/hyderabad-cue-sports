"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export interface PromoSlide {
  id: string;
  kicker: string;
  title: string;
  buttonText: string;
  href: string;
  image: string;
  alt: string;
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
  },
];

interface PromoBannerCarouselProps {
  slides?: PromoSlide[];
}

export function PromoBannerCarousel({ slides = defaultPromoSlides }: PromoBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Autoplay if more than 1 slide
  useEffect(() => {
    if (totalSlides <= 1) return;
    autoPlayRef.current = setInterval(nextSlide, 5500);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [totalSlides]);

  // Touch handlers for mobile gesture swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && totalSlides > 1) nextSlide();
    if (isRightSwipe && totalSlides > 1) prevSlide();
  };

  return (
    <section className="promo-carousel-section" aria-label="Promotional Showcase">
      <div className="container promo-carousel-container">
        <div
          className="promo-carousel-stage"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={slide.id}
                className={`promo-banner-card ${isActive ? "active" : ""}`}
                aria-hidden={!isActive}
              >
                {/* Clean Background Image */}
                <div className="promo-card-bg">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="promo-bg-img"
                    loading="lazy"
                  />
                  {/* Rich Emerald Gradient Overlay */}
                  <div className="promo-overlay-gradient" />
                </div>

                {/* Standalone HTML/CSS Content (Separate from Image) */}
                <div className="promo-card-content">
                  <div className="promo-kicker-wrap">
                    <span className="promo-kicker-gold">{slide.kicker}</span>
                  </div>
                  <h2 className="promo-title-white">{slide.title}</h2>
                  <div className="promo-action-wrap">
                    <Link href={slide.href} className="promo-shop-now-btn">
                      <span>{slide.buttonText}</span>
                      <ArrowRight size={16} className="promo-btn-arrow" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Desktop Arrow Controls (Visible only if > 1 slide) */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                className="promo-arrow-nav prev"
                onClick={prevSlide}
                aria-label="Previous promotional banner"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="promo-arrow-nav next"
                onClick={nextSlide}
                aria-label="Next promotional banner"
              >
                <ChevronRight size={22} />
              </button>

              {/* Dots Pagination Indicator */}
              <div className="promo-dots-indicator">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`promo-dot-bullet ${idx === currentIndex ? "active" : ""}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to promotional slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

