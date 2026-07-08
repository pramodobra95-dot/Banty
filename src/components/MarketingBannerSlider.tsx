import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles } from "lucide-react";
import { MarketingBanner } from "../types";

interface MarketingBannerSliderProps {
  banners: MarketingBanner[];
}

export default function MarketingBannerSlider({ banners = [] }: MarketingBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter banners: only active and current date between start_date and end_date
  const todayStr = new Date().toISOString().split("T")[0];
  const activeBanners = banners
    .filter((b) => {
      if (!b.is_active) return false;
      const start = b.start_date || "2000-01-01";
      const end = b.end_date || "2100-01-01";
      return todayStr >= start && todayStr <= end;
    })
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  // Auto-slide effect
  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length, isHovered]);

  if (activeBanners.length === 0) {
    return null; // Return nothing if no active promotional banners
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  // Touch Swipe Support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    // Minimum distance for swipe to trigger
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentBanner = activeBanners[currentIndex];

  return (
    <div
      id="marketing-promotional-banner-slider"
      className="relative w-full overflow-hidden bg-gray-50 py-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Module Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-600">
                BANTConfirm Partner Spotlights
              </span>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Featured Promotions
              </h2>
            </div>
          </div>
          
          {/* Controls - only if more than 1 banner */}
          {activeBanners.length > 1 && (
            <div className="flex items-center space-x-2">
              <button
                id="btn-banner-prev"
                onClick={handlePrev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-blue-600 focus:outline-none"
                aria-label="Previous Banner"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                id="btn-banner-next"
                onClick={handleNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-blue-600 focus:outline-none"
                aria-label="Next Banner"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Container */}
        <div
          id="banner-carousel-window"
          className="relative h-[240px] w-full md:h-[340px] rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-gradient-to-r from-blue-900 to-indigo-950 text-white cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 flex h-full w-full flex-col md:flex-row"
            >
              {/* Text content card */}
              <div className="flex flex-1 flex-col justify-center p-6 sm:p-10 md:p-12 z-10 bg-gradient-to-r from-blue-950 via-blue-950/90 to-transparent">
                <span className="mb-2 inline-block rounded bg-yellow-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-950">
                  EXCLUSIVE DEAL
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {currentBanner.title}
                </h3>
                
                {/* Optional description, button and link rendering */}
                <div className="mt-6 flex flex-wrap gap-4">
                  {currentBanner.redirect_url && (
                    <a
                      id={`btn-banner-link-${currentBanner.id}`}
                      href={currentBanner.redirect_url}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 shadow-md transition hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{currentBanner.button_text || "Explore Now"}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Banner Image Container */}
              <div className="relative flex-1 h-1/2 md:h-full w-full overflow-hidden">
                <img
                  src={currentBanner.image_url}
                  alt={currentBanner.title}
                  title={currentBanner.title}
                  loading="lazy"
                  width="1200"
                  height="340"
                  className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                {/* Soft gradient overlay to blend into the dark container */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-blue-950 via-transparent to-transparent" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Preloader overlay to optimize performance */}
          <link rel="preload" as="image" href={activeBanners[(currentIndex + 1) % activeBanners.length].image_url} />
        </div>

        {/* Pagination Dots */}
        {activeBanners.length > 1 && (
          <div className="mt-4 flex items-center justify-center space-x-2">
            {activeBanners.map((_, idx) => (
              <button
                id={`btn-banner-dot-${idx}`}
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 transition-all duration-300 rounded-full ${
                  idx === currentIndex ? "w-8 bg-blue-600" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to banner ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
