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

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const sliderRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);

  const AUTOPLAY_DELAY = 5000;
  const MANUAL_PAUSE_DURATION = 10000;
  const SWIPE_THRESHOLD = 75;
  const TRANSITION_DURATION = 1200;
  const CONTROLS_HIDE_DELAY = 3000;

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_HIDE_DELAY);
  }, []);

  const fetchSliders = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await axios.get('/api/slider/public', {
        timeout: 10000,
      });

      if (data.success && data.sliders?.length > 0) {
        setSliderData(data.sliders);
        preloadImage(data.sliders[0].imgSrcMd);
        preloadImage(data.sliders[0].imgSrcSm);
      } else {
        setError("No active sliders available");
      }
    } catch (error) {
      console.error('Failed to fetch sliders:', error);
      if (retryCount < 2 && (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED')) {
        setTimeout(() => fetchSliders(retryCount + 1), 2000);
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
      setIsLoading(false);
    }
  }, []);

  const preloadImage = useCallback((src) => {
    if (loadedImages.has(src)) return;
    const img = new window.Image();
    img.onload = () => {
      setLoadedImages(prev => new Set([...prev, src]));
    };
    img.src = src;
  }, [loadedImages]);

  const changeSlide = useCallback((newIndex, pauseAutoplay = true) => {
    if (isTransitioning || newIndex === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(newIndex);
    showControlsTemporarily();

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

    if (pauseAutoplay && sliderData.length > 1) {
      setIsAutoplayPaused(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsAutoplayPaused(false);
      }, MANUAL_PAUSE_DURATION);
    }

    setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, [currentSlide, isTransitioning, sliderData, preloadImage, showControlsTemporarily]);

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

  const handleMouseEnter = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

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
    };
  }, [fetchSliders]);

  useEffect(() => {
    if (sliderData.length > 1 && !isAutoplayPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => {
          const nextSlide = (prev + 1) % sliderData.length;
          if (sliderData[nextSlide]) {
            preloadImage(sliderData[nextSlide].imgSrcMd);
            preloadImage(sliderData[nextSlide].imgSrcSm);
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
        intervalRef.current = setInterval(() => {
          setCurrentSlide(prev => (prev + 1) % sliderData.length);
        }, AUTOPLAY_DELAY);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAutoplayPaused, sliderData.length]);

  if (error) {
    return (
      <div className="w-full h-48 md:h-80 bg-gradient-to-br from-sky-50 to-white rounded-xl mt-6 flex flex-col items-center justify-center text-sky-600">
        <p className="text-sm mb-2 font-medium">{error}</p>
        <button
          onClick={() => fetchSliders()}
          className="px-6 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm rounded-lg hover:from-sky-600 hover:to-sky-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-48 md:h-80 bg-gradient-to-br from-sky-50 to-white rounded-xl mt-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-sky-200 to-sky-100 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-slide"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (sliderData.length === 0) {
    return null;
  }

  return (
    <div
      ref={sliderRef}
      className="relative w-full mt-6 group focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400 focus-within:ring-offset-2 rounded-xl transition-all duration-300 ease-out"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      role="region"
      aria-label="Image carousel"
      aria-live="polite"
    >
      <div className="overflow-hidden relative w-full rounded-md bg-gradient-to-br from-sky-50 to-white">
        <div
          className="flex transition-transform duration-[1200ms] ease-out will-change-transform"
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
                className="hidden md:block object-cover transition-all duration-1000 ease-out"
                src={slide.imgSrcMd}
                alt={slide.alt || `Slide ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 100vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={85}
                onLoad={() => setLoadedImages(prev => new Set([...prev, slide.imgSrcMd]))}
              />
              <Image
                className="block md:hidden object-cover transition-all duration-1000 ease-out"
                src={slide.imgSrcSm}
                alt={slide.alt || `Slide ${index + 1}`}
                fill
                sizes="100vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={85}
                onLoad={() => setLoadedImages(prev => new Set([...prev, slide.imgSrcSm]))}
              />
              {!loadedImages.has(slide.imgSrcMd) && !loadedImages.has(slide.imgSrcSm) && (
                <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-white animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
                </div>
              )}
              {slide.href && (
                <a
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-sky-400 rounded-xl transition-all duration-300"
                  aria-label={`Go to ${slide.href}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {sliderData.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={goToPrevSlide}
            className={`absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm text-sky-600 p-3 hover:bg-white hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 transform hover:scale-110 transition-all duration-700 ease-out ${
              showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          <button
            aria-label="Next slide"
            onClick={goToNextSlide}
            className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm text-sky-600 p-3 hover:bg-white hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 transform hover:scale-110 transition-all duration-700 ease-out ${
              showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>

          <button
            aria-label={isAutoplayPaused ? "Play slideshow" : "Pause slideshow"}
            onClick={toggleAutoplay}
            className={`absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full text-sky-600 hover:bg-white hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 transform hover:scale-110 transition-all duration-700 ease-out ${
              showControls ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }`}
          >
            {isAutoplayPaused ? <Play size={20} strokeWidth={2.5} /> : <Pause size={20} strokeWidth={2.5} />}
          </button>
        </>
      )}
    </div>
  );
};

export default HeaderSlider;