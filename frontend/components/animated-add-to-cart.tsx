"use client";

import React, { useState, useRef, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { useStorefront } from "@/components/storefront-shell";

interface AnimatedAddToCartProps {
  onAdd: () => void;
  className?: string;
  label?: string;
  addedLabel?: string;
  openDrawerOnComplete?: boolean;
}

export function AnimatedAddToCart({
  onAdd,
  className = "",
  label = "Add to Cart",
  addedLabel = "Added to Cart",
  openDrawerOnComplete = true,
}: AnimatedAddToCartProps) {
  const { openCart } = useStorefront();
  const [status, setStatus] = useState<"idle" | "animating" | "added">("idle");
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "idle") return;

    // Trigger cart action immediately for state update (with openSidebar=false)
    onAdd();

    setStatus("animating");

    // Phase 1: Cart drives in, snooker ball drops into cart, cart rushes away (1350ms)
    animTimerRef.current = setTimeout(() => {
      setStatus("added");

      // Open the sidebar drawer once the animation completes
      if (openDrawerOnComplete) {
        openCart();
      }

      // Phase 2: Show gold checkmark + success state, then return to idle (1250ms)
      resetTimerRef.current = setTimeout(() => {
        setStatus("idle");
      }, 1250);
    }, 1350);
  };

  return (
    <button
      type="button"
      className={`hcs-anim-cart-btn ${status} ${className}`.trim()}
      onClick={handleClick}
      aria-label={status === "added" ? addedLabel : label}
      disabled={status === "animating"}
    >
      {/* Default State: Icon + Label */}
      <span className="hcs-cart-btn-default">
        <ShoppingCart size={15} />
        <span>{label}</span>
      </span>

      {/* Animation Track: Rolling Cart + Dropping Snooker Ball */}
      <span className="hcs-cart-btn-track" aria-hidden="true">
        <span className="hcs-cart-chassis">
          {/* Glossy 3D Red Snooker Ball */}
          <svg className="hcs-snooker-ball" viewBox="0 0 20 20">
            <defs>
              <radialGradient id="hcsSnookerRedGrad" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#ff7b7b" />
                <stop offset="32%" stopColor="#d91424" />
                <stop offset="80%" stopColor="#800a14" />
                <stop offset="100%" stopColor="#3d0106" />
              </radialGradient>
            </defs>
            <circle cx="10" cy="10" r="9.5" fill="url(#hcsSnookerRedGrad)" />
            {/* Specular gloss glint */}
            <ellipse
              cx="7.2"
              cy="6.2"
              rx="3.5"
              ry="2"
              fill="#ffffff"
              opacity="0.72"
              transform="rotate(-22 7.2 6.2)"
            />
          </svg>

          {/* Wireframe Cue Sports Shopping Cart */}
          <svg
            className="hcs-cart-svg"
            width="34"
            height="28"
            viewBox="0 0 34 28"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Cart Basket */}
            <path d="M1 2h4.5l3.8 14.5h15.2l3-10H7.5" />
            {/* Basket Mesh */}
            <path
              d="M10 9h16M11.5 13h13"
              stroke="rgba(255,255,255,0.42)"
              strokeWidth="1.2"
            />
            {/* Front Wheel */}
            <g className="hcs-cart-wheel" style={{ transformOrigin: "11.5px 23px" }}>
              <circle
                cx="11.5"
                cy="23"
                r="2.8"
                stroke="#ffffff"
                fill="#174B35"
                strokeWidth="1.5"
              />
              <line
                x1="11.5"
                y1="20.2"
                x2="11.5"
                y2="25.8"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1"
              />
            </g>
            {/* Rear Wheel */}
            <g className="hcs-cart-wheel" style={{ transformOrigin: "22.5px 23px" }}>
              <circle
                cx="22.5"
                cy="23"
                r="2.8"
                stroke="#ffffff"
                fill="#174B35"
                strokeWidth="1.5"
              />
              <line
                x1="22.5"
                y1="20.2"
                x2="22.5"
                y2="25.8"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1"
              />
            </g>
          </svg>
        </span>
      </span>

      {/* Success State: Animated Gold Checkmark + Success Label */}
      <span className="hcs-cart-btn-success" aria-hidden="true">
        <svg
          className="hcs-success-check"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dfc181"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{addedLabel}</span>
      </span>
    </button>
  );
}

