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
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react";

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
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const sliderRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Configuration constants
  const AUTOPLAY_DELAY = 5000;
  const MANUAL_PAUSE_DURATION = 10000;
  const SWIPE_THRESHOLD = 75;
  const TRANSITION_DURATION = 500;
  const CONTROLS_HIDE_DELAY = 3000;
  const PROGRESS_UPDATE_INTERVAL = 50;

  // Show controls and set auto-hide timer
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        setShowControls(false);
      }
    }, CONTROLS_HIDE_DELAY);
  }, [isHovered]);

  // Progress bar animation
  const startProgress = useCallback(() => {
    setProgress(0);
    const startTime = Date.now();
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / AUTOPLAY_DELAY) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(progressIntervalRef.current);
      }
    }, PROGRESS_UPDATE_INTERVAL);
  }, []);

  const stopProgress = useCallback(() => {
    clearInterval(progressIntervalRef.current);
    setProgress(0);
  }, []);

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
    showControlsTemporarily();
    stopProgress();

    // Sound effect (if enabled)
    if (isSoundEnabled) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBzuV2+/KeSsFJH7J8N2QQAoUXrTp66hVFApGn+DyvmEcBz');
        audio.volume = 0.1;
        audio.play().catch(() => {}); // Ignore errors for autoplay restrictions
      } catch (e) {
        // Ignore audio errors
      }
    }

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
      if (!isAutoplayPaused && sliderData.length > 1) {
        startProgress();
      }
    }, TRANSITION_DURATION);
  }, [currentSlide, isTransitioning, sliderData, preloadImage, showControlsTemporarily, stopProgress, startProgress, isAutoplayPaused, isSoundEnabled]);

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
      showControlsTemporarily();
    }
  }, [showControlsTemporarily]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      setTouchEnd(e.touches[0].clientX);
      // Prevent scrolling during swipe
      if (Math.abs(touchStart - e.touches[0].clientX) > 10) {
        e.preventDefault();
      }
    }
  }, [touchStart]);

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

  // Mouse enter/leave handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!sliderRef.current?.contains(e.target)) return;

    showControlsTemporarily();

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
  }, [goToPrevSlide, goToNextSlide, goToSlide, sliderData.length, showControlsTemporarily]);

  // Toggle autoplay
  const toggleAutoplay = useCallback(() => {
    setIsAutoplayPaused(prev => {
      const newPaused = !prev;
      if (newPaused) {
        stopProgress();
      } else {
        startProgress();
      }
      return newPaused;
    });
    clearTimeout(timeoutRef.current);
    showControlsTemporarily();
  }, [showControlsTemporarily, stopProgress, startProgress]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Initialize component
  useEffect(() => {
    fetchSliders();
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(progressIntervalRef.current);
      clearTimeout(timeoutRef.current);
      clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [fetchSliders]);

  // Autoplay logic
  useEffect(() => {
    if (sliderData.length > 1 && !isAutoplayPaused) {
      startProgress();
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % sliderData.length);
      }, AUTOPLAY_DELAY);
    } else {
      clearInterval(intervalRef.current);
      stopProgress();
    }

    return () => {
      clearInterval(intervalRef.current);
      stopProgress();
    };
  }, [sliderData.length, isAutoplayPaused, startProgress, stopProgress]);

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
        stopProgress();
      } else if (!isAutoplayPaused && sliderData.length > 1) {
        startProgress();
        intervalRef.current = setInterval(() => {
          setCurrentSlide(prev => (prev + 1) % sliderData.length);
        }, AUTOPLAY_DELAY);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAutoplayPaused, sliderData.length, startProgress, stopProgress]);

  // Error state with retry option
  if (error) {
    return (
      <div className="w-full h-48 md:h-80 bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl mt-6 flex flex-col items-center justify-center text-slate-600 border border-slate-200/50">
        <div className="w-16 h-16 mb-4 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 text-red-500">⚠</div>
        </div>
        <p className="text-sm mb-4 font-medium text-center max-w-sm">{error}</p>
        <button
          onClick={() => fetchSliders()}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-48 md:h-80 bg-gradient-to-br from-slate-100 via-white to-slate-100 rounded-2xl mt-6 overflow-hidden shadow-lg border border-slate-200/50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full animate-[shimmer_2s_infinite] transform"></div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
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
      className="relative w-full mt-6 mb-6 group focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:ring-offset-2 rounded-2xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      role="region"
      aria-label="Image carousel"
      aria-live="polite"
    >


      {/* Main Slider Container */}
      <div className="overflow-hidden relative w-full rounded-md bg-gradient-to-br from-slate-50 to-white">
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
                className="hidden md:block object-cover transition-all duration-700"
                src={slide.imgSrcMd}
                alt={slide.alt || `Promotional slide ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 100vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={90}
                onLoad={() => setLoadedImages(prev => new Set([...prev, slide.imgSrcMd]))}
              />

              {/* Mobile Image */}
              <Image
                className="block md:hidden object-cover transition-all duration-700"
                src={slide.imgSrcSm}
                alt={slide.alt || `Promotional slide ${index + 1}`}
                fill
                sizes="100vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={90}
                onLoad={() => setLoadedImages(prev => new Set([...prev, slide.imgSrcSm]))}
              />

              {/* Loading overlay for unloaded images */}
              {!loadedImages.has(slide.imgSrcMd) && !loadedImages.has(slide.imgSrcSm) && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-100 animate-pulse flex items-center justify-center">
                  <div className="relative">
                    <div className="w-10 h-10 border-4 border-slate-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              )}

              {/* Slide Number Indicator */}
              <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full">
                {index + 1} / {sliderData.length}
              </div>

              {/* Optional Link Overlay */}
              {slide.href && (
                <a
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-blue-500/50 rounded-2xl"
                  aria-label={`Go to ${slide.href}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons - Enhanced design */}
      {sliderData.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => goToPrevSlide()}
            className={`absolute top-1/2 left-4 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-md text-slate-700 hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 border border-white/20 ${
              showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
          >
            <ChevronLeft size={20} strokeWidth={2.5} className="ml-0.5" />
          </button>
          
          <button
            aria-label="Next slide"
            onClick={() => goToNextSlide()}
            className={`absolute top-1/2 right-4 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-md text-slate-700 hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 border border-white/20 ${
              showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            <ChevronRight size={20} strokeWidth={2.5} className="mr-0.5" />
          </button>

          {/* Enhanced Slide Indicators - Much smaller dots positioned below image */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 backdrop-blur-md rounded-full px-3 py-2">
            {sliderData.map((_, index) => (
              <button
                key={index}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={currentSlide === index ? "true" : undefined}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 hover:scale-150 ${
                  currentSlide === index 
                    ? "bg-white shadow-lg scale-125" 
                    : "bg-white/60 hover:bg-white/80"
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>

          {/* Control Panel - Enhanced with more options */}
          <div className={`absolute bottom-4 right-4 flex gap-2 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}>
            {/* Sound Toggle */}
            <button
              aria-label={isSoundEnabled ? "Disable sound effects" : "Enable sound effects"}
              onClick={toggleSound}
              className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full text-slate-700 hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 border border-white/20"
            >
              {isSoundEnabled ? <Volume2 size={16} strokeWidth={2.5} /> : <VolumeX size={16} strokeWidth={2.5} />}
            </button>

            {/* Autoplay Toggle */}
            <button
              aria-label={isAutoplayPaused ? "Play slideshow" : "Pause slideshow"}
              onClick={toggleAutoplay}
              className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full text-slate-700 hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 border border-white/20"
            >
              {isAutoplayPaused ? <Play size={16} strokeWidth={2.5} className="ml-0.5" /> : <Pause size={16} strokeWidth={2.5} />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HeaderSlider;