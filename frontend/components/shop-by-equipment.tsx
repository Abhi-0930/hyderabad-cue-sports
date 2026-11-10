"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface EquipmentItem {
  id: string;
  title: string;
  priceTag: string;
  badge?: string;
  image: string;
  href: string;
}

export const defaultEquipmentList: EquipmentItem[] = [
  {
    id: "snooker-tables",
    title: "Snooker Tables",
    priceTag: "From ₹1,49,000",
    badge: "Tournament Slate",
    image: "/images/categories/snooker-tables.jpg",
    href: "/shop?category=Snooker+Tables",
  },
  {
    id: "cue-sticks",
    title: "Professional Cues",
    priceTag: "From ₹14,500",
    badge: "Master Crafted",
    image: "/images/products/featured-cue-stick.jpg",
    href: "/shop?category=Cues",
  },
  {
    id: "match-balls",
    title: "Match Ball Sets",
    priceTag: "From ₹6,800",
    badge: "Official Match",
    image: "/images/products/featured-balls-15.jpg",
    href: "/shop?category=Table+Accessories",
  },
  {
    id: "table-cloth",
    title: "Table Cloth & Baize",
    priceTag: "From ₹7,200",
    badge: "Fast Pace Baize",
    image: "/images/products/featured-table-cloth.jpg",
    href: "/shop?category=Table+Accessories",
  },
  {
    id: "scoreboards",
    title: "Scoreboards",
    priceTag: "From ₹18,900",
    badge: "Club Essential",
    image: "/images/categories/scoreboards.jpg",
    href: "/shop?category=Scoreboards",
  },
  {
    id: "table-accessories",
    title: "Racks & Accessories",
    priceTag: "From ₹2,400",
    badge: "Match Accessories",
    image: "/images/categories/table-accessories.jpg",
    href: "/shop?category=Table+Accessories",
  },
  {
    id: "table-lighting",
    title: "Table Lighting",
    priceTag: "From ₹18,500",
    badge: "Glare-Free",
    image: "/images/snooker-detail.jpg",
    href: "/shop?category=Table+Accessories",
  },
  {
    id: "cases-storage",
    title: "Cue Cases & Bags",
    priceTag: "From ₹4,500",
    badge: "Gear Protection",
    image: "/images/snooker-collection.jpg",
    href: "/shop?category=Cues",
  },
];

interface ShopByEquipmentProps {
  items?: EquipmentItem[];
  sectionTitle?: string;
}

export function ShopByEquipment({
  items = defaultEquipmentList,
  sectionTitle = "Shop by Equipment",
}: ShopByEquipmentProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const slide = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const firstCard = sliderRef.current.querySelector(".equipment-card") as HTMLElement | null;
      const cardStep = firstCard ? firstCard.offsetWidth + 18 : 280;
      const scrollAmount = direction === "left" ? -cardStep * 2 : cardStep * 2;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="shop-equipment-section" aria-label={sectionTitle}>
      <div className="container shop-equipment-container">
        {/* Amazon & Flipkart-Style Header: Clean Title + Circular Arrow Icon (NO supporting text, NO explore all button) */}
        <div className="shop-equipment-header">
          <h2 className="shop-equipment-title">{sectionTitle}</h2>
          <Link
            href="/shop"
            className="featured-view-all"
            aria-label="View all equipment"
          >
            <ChevronRight size={22} className="view-all-arrow" />
          </Link>
        </div>

        {/* Carousel Slider Shell with Left/Right Arrows */}
        <div className="shop-equipment-slider-shell">
          <button
            type="button"
            className={`equipment-nav-btn prev ${canScrollLeft ? "visible" : "hidden"}`}
            onClick={() => slide("left")}
            aria-label="Previous equipment items"
            tabIndex={canScrollLeft ? 0 : -1}
          >
            <ChevronLeft size={22} />
          </button>

          <div
            className="shop-equipment-rail"
            ref={sliderRef}
            onScroll={checkScroll}
          >
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="equipment-card"
              >
                {/* Image Container with Pedestal */}
                <div className="equipment-card-media">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="equipment-card-img"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="equipment-badge-pill">{item.badge}</span>
                  )}
                </div>

                {/* Card Body: Price Tag + Title (Clean, NO supporting text) */}
                <div className="equipment-card-body">
                  <div className="equipment-price-tag">{item.priceTag}</div>
                  <h3 className="equipment-card-title">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            className={`equipment-nav-btn next ${canScrollRight ? "visible" : "hidden"}`}
            onClick={() => slide("right")}
            aria-label="Next equipment items"
            tabIndex={canScrollRight ? 0 : -1}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
}
