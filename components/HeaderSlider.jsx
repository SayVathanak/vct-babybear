// import React, { useState, useEffect } from "react";
// import { assets } from "@/assets/assets";
// import Image from "next/image";

// const HeaderSlider = () => {
//   const sliderData = [
//     {
//       id: 1,
//       title: "Experience Pure Sound - Your Perfect Headphones Awaits!",
//       offer: "Limited Time Offer 30% Off",
//       buttonText1: "Buy now",
//       buttonText2: "Find more",
//       imgSrcSm: assets.header_headphone_image_sm,
//       imgSrcMd: assets.header_headphone_image_md,
//     },
//     {
//       id: 2,
//       title: "Next-Level Gaming Starts Here - Discover PlayStation 5 Today!",
//       offer: "Hurry up only few lefts!",
//       buttonText1: "Shop Now",
//       buttonText2: "Explore Deals",
//       imgSrcSm: assets.header_playstation_image_sm,
//       imgSrcMd: assets.header_playstation_image_md,
//     },
//     {
//       id: 3,
//       title: "Power Meets Elegance - Apple MacBook Pro is Here for you!",
//       offer: "Exclusive Deal 40% Off",
//       buttonText1: "Order Now",
//       buttonText2: "Learn More",
//       imgSrcSm: assets.header_macbook_image_sm,
//       imgSrcMd: assets.header_macbook_image_md,
//     },
//   ];

//   const [currentSlide, setCurrentSlide] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentSlide((prev) => (prev + 1) % sliderData.length);
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [sliderData.length]);

//   const handleSlideChange = (index) => {
//     setCurrentSlide(index);
//   };

//   return (
//     <div className="sm:hidden overflow-hidden relative w-full">
//       <div
//         className="flex transition-transform duration-700 ease-in-out"
//         style={{
//           transform: `translateX(-${currentSlide * 100}%)`,
//         }}
//       >
//         {sliderData.map((slide, index) => (
//           <div
//             key={slide.id}
//             className="flex flex-col-reverse md:flex-row items-center justify-between bg-sky-50 md:py-8 md:px-14 mt-6 rounded-xl min-w-full"
//           >
//             {/* Hide this text content on mobile */}
//             <div className="hidden md:block md:pl-8 mt-10 md:mt-0">
//               <p className="md:text-base pb-1">{slide.offer}</p>
//               <h1 className="max-w-lg md:text-[40px] md:leading-[48px] text-2xl font-prata font-medium">
//                 {slide.title}
//               </h1>
//               <div className="flex items-center mt-4 md:mt-6">
//                 <button className="md:px-10 px-7 md:py-2.5 py-2 bg-sky-100 rounded-full font-medium">
//                   {slide.buttonText1}
//                 </button>
//                 <button className="group flex items-center gap-2 px-6 py-2.5 font-medium">
//                   {slide.buttonText2}
//                   <Image className="group-hover:translate-x-1 transition" src={assets.arrow_icon} alt="arrow_icon" />
//                 </button>
//               </div>
//             </div>

//             {/* Image is always visible */}
//             <div className="relative w-full h-full rounded-md md:flex md:items-center md:flex-1 md:justify-center">
//               <Image
//                 className="hidden md:block w-72 object-cover rounded-md"
//                 src={slide.imgSrcMd}
//                 alt={`Slide ${index + 1} - Desktop`}
//               />
//               <Image
//                 className="block md:hidden w-full object-cover rounded-md"
//                 src={slide.imgSrcSm}
//                 alt={`Slide ${index + 1} - Mobile`}
//               />
//             </div>

//           </div>
//         ))}
//       </div>

//       {/* Pagination Dots */}
//       <div className="flex items-center justify-center gap-2 mt-6">
//         {sliderData.map((_, index) => (
//           <div
//             key={index}
//             onClick={() => handleSlideChange(index)}
//             className={`h-1.5 w-1.5 rounded-full cursor-pointer ${currentSlide === index ? "bg-sky-300/70" : "bg-gray-300/30"
//               }`}
//           ></div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default HeaderSlider;

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

const HeaderSlider = () => {
  const [sliderData, setSliderData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const sliderRef = useRef(null);

  // Configuration constants
  const AUTOPLAY_DELAY = 5000;
  const MANUAL_PAUSE_DURATION = 10000;
  const SWIPE_THRESHOLD = 75;
  const TRANSITION_DURATION = 500;

  // Fetch sliders with error handling and retry logic
  const fetchSliders = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use public endpoint for slider display
      const { data } = await axios.get('/api/slider/public', {
        timeout: 10000, // 10 second timeout
      });

      if (data.success && data.sliders?.length > 0) {
        setSliderData(data.sliders);
        // Preload first image
        preloadImage(data.sliders[0].imgSrcMd);
        preloadImage(data.sliders[0].imgSrcSm);
      } else {
        setError("No active sliders available");
      }
    } catch (error) {
      console.error('Failed to fetch sliders:', error);

      // Retry logic for network errors
      if (retryCount < 2 && (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED')) {
        setTimeout(() => fetchSliders(retryCount + 1), 2000);
        return;
      }

      // Different error messages based on status
      if (error.response?.status === 403) {
        setError("Access denied");
      } else if (error.response?.status >= 500) {
        setError("Server error - please try again later");
      } else {
        setError("Failed to load slider content");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Preload images for better performance
  const preloadImage = useCallback((src) => {
    if (loadedImages.has(src)) return;

    const img = new window.Image();
    img.onload = () => {
      setLoadedImages(prev => new Set([...prev, src]));
    };
    img.src = src;
  }, [loadedImages]);

  // Enhanced slide change with transition state
  const changeSlide = useCallback((newIndex, pauseAutoplay = true) => {
    if (isTransitioning || newIndex === currentSlide) return;

    setIsTransitioning(true);
    setCurrentSlide(newIndex);

    // Preload adjacent images
    const nextIndex = (newIndex + 1) % sliderData.length;
    const prevIndex = (newIndex - 1 + sliderData.length) % sliderData.length;

    if (sliderData[nextIndex]) {
      preloadImage(sliderData[nextIndex].imgSrcMd);
      preloadImage(sliderData[nextIndex].imgSrcSm);
    }
    if (sliderData[prevIndex]) {
      preloadImage(sliderData[prevIndex].imgSrcMd);
      preloadImage(sliderData[prevIndex].imgSrcSm);
    }

    // Handle autoplay pause
    if (pauseAutoplay && sliderData.length > 1) {
      setIsAutoplayPaused(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsAutoplayPaused(false);
      }, MANUAL_PAUSE_DURATION);
    }

    // Reset transition state
    setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, [currentSlide, isTransitioning, sliderData, preloadImage]);

  // Navigation functions
  const goToNextSlide = useCallback(() => {
    const nextIndex = (currentSlide + 1) % sliderData.length;
    changeSlide(nextIndex);
  }, [currentSlide, sliderData.length, changeSlide]);

  const goToPrevSlide = useCallback(() => {
    const prevIndex = (currentSlide - 1 + sliderData.length) % sliderData.length;
    changeSlide(prevIndex);
  }, [currentSlide, sliderData.length, changeSlide]);

  const goToSlide = useCallback((index) => {
    changeSlide(index);
  }, [changeSlide]);

  // Enhanced touch handling with better gesture detection
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
      setTouchEnd(e.touches[0].clientX);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      setTouchEnd(e.touches[0].clientX);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStart - touchEnd;
    const absSwipeDistance = Math.abs(swipeDistance);

    if (absSwipeDistance > SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        goToNextSlide();
      } else {
        goToPrevSlide();
      }
    }
  }, [touchStart, touchEnd, goToNextSlide, goToPrevSlide]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!sliderRef.current?.contains(e.target)) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevSlide();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNextSlide();
        break;
      case ' ':
        e.preventDefault();
        setIsAutoplayPaused(prev => !prev);
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(sliderData.length - 1);
        break;
    }
  }, [goToPrevSlide, goToNextSlide, goToSlide, sliderData.length]);

  // Toggle autoplay
  const toggleAutoplay = useCallback(() => {
    setIsAutoplayPaused(prev => !prev);
    clearTimeout(timeoutRef.current);
  }, []);

  // Initialize component
  useEffect(() => {
    fetchSliders();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [fetchSliders]);

  // Autoplay logic
  useEffect(() => {
    if (sliderData.length > 1 && !isAutoplayPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % sliderData.length);
      }, AUTOPLAY_DELAY);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [sliderData.length, isAutoplayPaused]);

  // Keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle visibility change (pause when tab is not active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else if (!isAutoplayPaused && sliderData.length > 1) {
        intervalRef.current = setInterval(() => {
          setCurrentSlide(prev => (prev + 1) % sliderData.length);
        }, AUTOPLAY_DELAY);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAutoplayPaused, sliderData.length]);

  // Error state with retry option
  if (error) {
    return (
      <div className="w-full h-48 md:h-80 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl mt-6 flex flex-col items-center justify-center text-gray-500">
        <p className="text-sm mb-2">{error}</p>
        <button
          onClick={() => fetchSliders()}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-48 md:h-80 bg-gray-100 rounded-xl mt-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-slide"></div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no sliders
  if (sliderData.length === 0) {
    return null;
  }

  return (
    <div
      ref={sliderRef}
      className="relative w-full mt-6 group focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Image carousel"
      aria-live="polite"
    >
      {/* Main Slider Container */}
      <div className="overflow-hidden relative w-full rounded-xl shadow-lg bg-gray-100">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            height: "auto",
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {sliderData.map((slide, index) => (
            <div
              key={slide._id || index}
              className="relative min-w-full aspect-[21/9] md:aspect-[16/5] lg:aspect-[21/6]"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${sliderData.length}`}
            >
              {/* Desktop Image */}
              <Image
                className="hidden md:block object-cover transition-opacity duration-300"
                src={slide.imgSrcMd}
                alt={slide.alt || `Promotional slide ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 100vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={85}
                onLoad={() => setLoadedImages(prev => new Set([...prev, slide.imgSrcMd]))}
              />

              {/* Mobile Image */}
              <Image
                className="block md:hidden object-cover transition-opacity duration-300"
                src={slide.imgSrcSm}
                alt={slide.alt || `Promotional slide ${index + 1}`}
                fill
                sizes="100vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={85}
                onLoad={() => setLoadedImages(prev => new Set([...prev, slide.imgSrcSm]))}
              />

              {/* Loading overlay for unloaded images */}
              {!loadedImages.has(slide.imgSrcMd) && !loadedImages.has(slide.imgSrcSm) && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Optional Link Overlay */}
              {slide.href && (
                <a
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-blue-400 rounded-xl"
                  aria-label={`Go to ${slide.href}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {sliderData.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => goToPrevSlide()}
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black bg-opacity-30 text-white p-2 hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => goToNextSlide()}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black bg-opacity-30 text-white p-2 hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ChevronRight size={24} />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
            {sliderData.map((_, index) => (
              <button
                key={index}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={currentSlide === index ? "true" : undefined}
                className={`w-3 h-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  currentSlide === index ? "bg-blue-600" : "bg-white bg-opacity-50"
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>

          {/* Autoplay Toggle */}
          <button
            aria-label={isAutoplayPaused ? "Play slideshow" : "Pause slideshow"}
            onClick={toggleAutoplay}
            className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isAutoplayPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </>
      )}
    </div>
  );
};

export default HeaderSlider;