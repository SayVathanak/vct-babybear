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
  const [showControls, setShowControls] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const sliderRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const transitionTimeoutRef = useRef(null);

  // Refined timing constants for premium feel
  const AUTOPLAY_DELAY = 6000; // Slower autoplay for contemplation
  const MANUAL_PAUSE_DURATION = 12000; // Longer pause after manual interaction
  const SWIPE_THRESHOLD = 60; // More sensitive swipe
  const TRANSITION_DURATION = 1800; // Slower, more elegant transition
  const CONTROLS_HIDE_DELAY = 4000; // Longer visibility for controls
  const CONTROLS_FADE_DURATION = 800; // Slower fade for controls

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (!isHovering) {
        setShowControls(false);
      }
    }, CONTROLS_HIDE_DELAY);
  }, [isHovering]);

  const fetchSliders = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await axios.get('/api/slider/public', {
        timeout: 15000, // Longer timeout for premium experience
      });

      if (data.success && data.sliders?.length > 0) {
        setSliderData(data.sliders);
        // Preload first few images for smoother experience
        data.sliders.slice(0, 3).forEach((slide, index) => {
          setTimeout(() => {
            preloadImage(slide.imgSrcMd);
            preloadImage(slide.imgSrcSm);
          }, index * 200);
        });
      } else {
        setError("No active sliders available");
      }
    } catch (error) {
      console.error('Failed to fetch sliders:', error);
      if (retryCount < 3 && (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED')) {
        setTimeout(() => fetchSliders(retryCount + 1), 3000);
        return;
      }
      if (error.response?.status === 403) {
        setError("Access denied");
      } else if (error.response?.status >= 500) {
        setError("Server error - please try again later");
      } else {
        setError("Failed to load slider content");
      }
    } finally {
      // Smooth loading state transition
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, []);

  const preloadImage = useCallback((src) => {
    if (loadedImages.has(src)) return;
    const img = new window.Image();
    img.onload = () => {
      setLoadedImages(prev => new Set([...prev, src]));
    };
    img.onerror = () => {
      console.warn(`Failed to preload image: ${src}`);
    };
    img.src = src;
  }, [loadedImages]);

  const changeSlide = useCallback((newIndex, pauseAutoplay = true, isManual = true) => {
    if (isTransitioning || newIndex === currentSlide) return;
    
    setIsTransitioning(true);
    
    // Smooth state update with micro-delay for better perceived performance
    requestAnimationFrame(() => {
      setCurrentSlide(newIndex);
      if (isManual) {
        showControlsTemporarily();
      }
    });

    // Intelligent preloading of adjacent images
    const nextIndex = (newIndex + 1) % sliderData.length;
    const prevIndex = (newIndex - 1 + sliderData.length) % sliderData.length;
    const nextNextIndex = (newIndex + 2) % sliderData.length;

    setTimeout(() => {
      [nextIndex, prevIndex, nextNextIndex].forEach(index => {
        if (sliderData[index]) {
          preloadImage(sliderData[index].imgSrcMd);
          preloadImage(sliderData[index].imgSrcSm);
        }
      });
    }, 100);

    if (pauseAutoplay && sliderData.length > 1 && isManual) {
      setIsAutoplayPaused(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsAutoplayPaused(false);
      }, MANUAL_PAUSE_DURATION);
    }

    // Smoother transition completion
    clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION - 100);
  }, [currentSlide, isTransitioning, sliderData, preloadImage, showControlsTemporarily]);

  const goToNextSlide = useCallback(() => {
    const nextIndex = (currentSlide + 1) % sliderData.length;
    changeSlide(nextIndex, true, true);
  }, [currentSlide, sliderData.length, changeSlide]);

  const goToPrevSlide = useCallback(() => {
    const prevIndex = (currentSlide - 1 + sliderData.length) % sliderData.length;
    changeSlide(prevIndex, true, true);
  }, [currentSlide, sliderData.length, changeSlide]);

  const goToSlide = useCallback((index) => {
    changeSlide(index, true, true);
  }, [changeSlide]);

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
      // Prevent page scroll during horizontal swipe
      if (Math.abs(e.touches[0].clientX - touchStart) > 10) {
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

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    // Delay hide controls when leaving hover
    setTimeout(() => {
      if (!isHovering) {
        setShowControls(false);
      }
    }, 1000);
  }, [isHovering]);

  const handleMouseMove = useCallback(() => {
    if (isHovering) {
      showControlsTemporarily();
    }
  }, [isHovering, showControlsTemporarily]);

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

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayPaused(prev => !prev);
    clearTimeout(timeoutRef.current);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  useEffect(() => {
    fetchSliders();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
      clearTimeout(hideControlsTimeoutRef.current);
      clearTimeout(transitionTimeoutRef.current);
    };
  }, [fetchSliders]);

  useEffect(() => {
    if (sliderData.length > 1 && !isAutoplayPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => {
          const nextSlide = (prev + 1) % sliderData.length;
          // Preload upcoming images during autoplay
          if (sliderData[nextSlide]) {
            setTimeout(() => {
              preloadImage(sliderData[nextSlide].imgSrcMd);
              preloadImage(sliderData[nextSlide].imgSrcSm);
            }, 100);
          }
          return nextSlide;
        });
      }, AUTOPLAY_DELAY);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [sliderData.length, isAutoplayPaused, preloadImage]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else if (!isAutoplayPaused && sliderData.length > 1) {
        // Restart with slight delay when tab becomes visible
        setTimeout(() => {
          intervalRef.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % sliderData.length);
          }, AUTOPLAY_DELAY);
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAutoplayPaused, sliderData.length]);

  if (error) {
    return (
      <div className="w-full h-48 md:h-80 bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl mt-6 flex flex-col items-center justify-center text-slate-600 shadow-sm border border-slate-100">
        <div className="text-center space-y-4 px-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin opacity-60"></div>
          </div>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">{error}</p>
          <button
            onClick={() => fetchSliders()}
            className="group px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm font-medium rounded-xl hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-500 ease-out transform hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            <span className="group-hover:scale-105 transition-transform duration-300 inline-block">
              Try Again
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-48 md:h-80 bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl mt-6 overflow-hidden shadow-sm border border-slate-100">
        <div className="absolute inset-0">
          {/* Sophisticated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-[shimmer_2.5s_ease-in-out_infinite]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white/50 animate-[fade_3s_ease-in-out_infinite_alternate]"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-slate-400 rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-2 border-slate-100 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
          </div>
        </div>
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes fade {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  if (sliderData.length === 0) {
    return null;
  }

  return (
    <div
      ref={sliderRef}
      className="relative w-full mt-6 group focus-within:outline-none focus-within:ring-4 focus-within:ring-slate-400/20 focus-within:ring-offset-4 rounded-2xl transition-all duration-700 ease-out"
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
      <div className="overflow-hidden relative w-full rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-lg border border-slate-100/50">
        <div
          className="flex transition-transform duration-[1800ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] will-change-transform"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            height: "auto",
          }}
        >
          {sliderData.map((slide, index) => (
            <div
              key={slide._id || index}
              className="relative min-w-full aspect-[21/9] md:aspect-[16/5] lg:aspect-[21/6]"
            >
              <Image
                className="hidden md:block object-cover transition-all duration-[2000ms] ease-out"
                src={slide.imgSrcMd}
                alt={slide.alt || `Slide ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 100vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={90}
                onLoad={() => setLoadedImages(prev => new Set([...prev, slide.imgSrcMd]))}
              />
              <Image
                className="block md:hidden object-cover transition-all duration-[2000ms] ease-out"
                src={slide.imgSrcSm}
                alt={slide.alt || `Slide ${index + 1}`}
                fill
                sizes="100vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={90}
                onLoad={() => setLoadedImages(prev => new Set([...prev, slide.imgSrcSm]))}
              />
              
              {/* Elegant loading state */}
              {!loadedImages.has(slide.imgSrcMd) && !loadedImages.has(slide.imgSrcSm) && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-50 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-3 border-transparent border-t-slate-400 rounded-full animate-spin"></div>
                  </div>
                </div>
              )}
              
              {/* Subtle overlay for better contrast */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none transition-opacity duration-1000"
                style={{ opacity: currentSlide === index ? 1 : 0 }}
              ></div>
              
              {slide.href && (
                <a
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-slate-400/20 focus:ring-offset-4 rounded-2xl transition-all duration-500 hover:bg-black/5"
                  aria-label={`Go to ${slide.href}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced controls with better timing */}
      {sliderData.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={goToPrevSlide}
            className={`absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/95 backdrop-blur-md text-slate-700 p-3.5 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-400/20 focus:ring-offset-2 shadow-lg border border-white/20 transform hover:scale-110 active:scale-95 transition-all duration-[${CONTROLS_FADE_DURATION}ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
              showControls 
                ? 'opacity-100 translate-x-0 pointer-events-auto' 
                : 'opacity-0 -translate-x-6 pointer-events-none'
            }`}
            style={{ 
              transitionDuration: `${CONTROLS_FADE_DURATION}ms`,
              transitionDelay: showControls ? '0ms' : '100ms'
            }}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          <button
            aria-label="Next slide"
            onClick={goToNextSlide}
            className={`absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/95 backdrop-blur-md text-slate-700 p-3.5 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-400/20 focus:ring-offset-2 shadow-lg border border-white/20 transform hover:scale-110 active:scale-95 transition-all duration-[${CONTROLS_FADE_DURATION}ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
              showControls 
                ? 'opacity-100 translate-x-0 pointer-events-auto' 
                : 'opacity-0 translate-x-6 pointer-events-none'
            }`}
            style={{ 
              transitionDuration: `${CONTROLS_FADE_DURATION}ms`,
              transitionDelay: showControls ? '50ms' : '150ms'
            }}
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>

          <button
            aria-label={isAutoplayPaused ? "Play slideshow" : "Pause slideshow"}
            onClick={toggleAutoplay}
            className={`absolute bottom-5 right-5 p-3.5 bg-white/95 backdrop-blur-md rounded-full text-slate-700 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-400/20 focus:ring-offset-2 shadow-lg border border-white/20 transform hover:scale-110 active:scale-95 transition-all duration-[${CONTROLS_FADE_DURATION}ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
              showControls 
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
            }`}
            style={{ 
              transitionDuration: `${CONTROLS_FADE_DURATION}ms`,
              transitionDelay: showControls ? '100ms' : '200ms'
            }}
          >
            {isAutoplayPaused ? <Play size={20} strokeWidth={2.5} /> : <Pause size={20} strokeWidth={2.5} />}
          </button>

          {/* Elegant slide indicators */}
          <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 transition-all duration-[${CONTROLS_FADE_DURATION}ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
            showControls 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          style={{ 
            transitionDelay: showControls ? '150ms' : '50ms'
          }}>
            {sliderData.map((_, index) => (
              <button
                key={index}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ease-out hover:scale-125 focus:outline-none focus:ring-2 focus:ring-slate-400/40 focus:ring-offset-2 ${
                  currentSlide === index
                    ? 'bg-white shadow-lg scale-125'
                    : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeaderSlider;