// HeaderSlider.tsx
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

  const AUTOPLAY_DELAY = 7000;
  const MANUAL_PAUSE_DURATION = 12000;
  const SWIPE_THRESHOLD = 75;
  const TRANSITION_DURATION = 1400;
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
      const { data } = await axios.get('/api/slider/public', { timeout: 10000 });

      if (data.success && data.sliders?.length > 0) {
        setSliderData(data.sliders);
        preloadImage(data.sliders[0].imgSrcMd);
        preloadImage(data.sliders[0].imgSrcSm);
      } else {
        setError("No active sliders available");
      }
    } catch (error) {
      if (retryCount < 2 && (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED')) {
        setTimeout(() => fetchSliders(retryCount + 1), 2000);
        return;
      }
      if (error.response?.status === 403) setError("Access denied");
      else if (error.response?.status >= 500) setError("Server error");
      else setError("Failed to load slider content");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const preloadImage = useCallback((src) => {
    if (loadedImages.has(src)) return;
    const img = new window.Image();
    img.onload = () => setLoadedImages(prev => new Set(prev).add(src));
    img.src = src;
  }, [loadedImages]);

  const changeSlide = useCallback((newIndex, pauseAutoplay = true) => {
    if (isTransitioning || newIndex === currentSlide) return;

    setIsTransitioning(true);
    setCurrentSlide(newIndex);
    showControlsTemporarily();

    const next = (newIndex + 1) % sliderData.length;
    const prev = (newIndex - 1 + sliderData.length) % sliderData.length;

    [sliderData[next], sliderData[prev]].forEach(slide => {
      if (slide) {
        preloadImage(slide.imgSrcMd);
        preloadImage(slide.imgSrcSm);
      }
    });

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
    changeSlide((currentSlide + 1) % sliderData.length);
  }, [currentSlide, sliderData.length, changeSlide]);

  const goToPrevSlide = useCallback(() => {
    changeSlide((currentSlide - 1 + sliderData.length) % sliderData.length);
  }, [currentSlide, sliderData.length, changeSlide]);

  const goToSlide = useCallback(index => changeSlide(index), [changeSlide]);

  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.touches[0].clientX);
    setTouchEnd(e.touches[0].clientX);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    const delta = touchStart - touchEnd;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      delta > 0 ? goToNextSlide() : goToPrevSlide();
    }
  }, [touchStart, touchEnd, goToNextSlide, goToPrevSlide]);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayPaused(prev => !prev);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleKeyDown = useCallback((e) => {
    if (!sliderRef.current?.contains(e.target)) return;
    showControlsTemporarily();
    switch (e.key) {
      case 'ArrowLeft': goToPrevSlide(); break;
      case 'ArrowRight': goToNextSlide(); break;
      case ' ': e.preventDefault(); toggleAutoplay(); break;
      case 'Home': goToSlide(0); break;
      case 'End': goToSlide(sliderData.length - 1); break;
    }
  }, [goToPrevSlide, goToNextSlide, goToSlide, sliderData.length, toggleAutoplay, showControlsTemporarily]);

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
        setCurrentSlide(prev => (prev + 1) % sliderData.length);
      }, AUTOPLAY_DELAY);
    }
    return () => clearInterval(intervalRef.current);
  }, [sliderData.length, isAutoplayPaused]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (error) return <div className="text-red-600 py-6 text-center">{error}</div>;
  if (isLoading) return <div className="animate-pulse bg-sky-100 rounded-xl h-60 my-6 w-full" />;

  return (
    <div
      ref={sliderRef}
      className="relative w-full rounded-xl overflow-hidden mt-6 group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={showControlsTemporarily}
      onMouseMove={showControlsTemporarily}
      role="region"
      aria-label="Image carousel"
    >
      <div
        className="flex transition-transform duration-[1400ms] ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {sliderData.map((slide, index) => (
          <div key={slide._id || index} className="min-w-full relative aspect-[21/9]">
            <Image
              className="object-cover transition-opacity duration-1000 ease-in-out"
              src={slide.imgSrcMd}
              alt={slide.alt || `Slide ${index + 1}`}
              fill
              sizes="(min-width: 768px) 100vw"
              loading={index === 0 ? "eager" : "lazy"}
              quality={85}
              style={{
                opacity: loadedImages.has(slide.imgSrcMd) ? 1 : 0,
              }}
            />
            {slide.href && (
              <a
                href={slide.href}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
                aria-label={`Go to ${slide.href}`}
              />
            )}
          </div>
        ))}
      </div>

      {sliderData.length > 1 && (
        <>
          <button
            aria-label="Previous"
            onClick={goToPrevSlide}
            className={`absolute top-1/2 left-3 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow hover:scale-110 transition-all duration-700 ease-in-out ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            aria-label="Next"
            onClick={goToNextSlide}
            className={`absolute top-1/2 right-3 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow hover:scale-110 transition-all duration-700 ease-in-out ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight size={24} />
          </button>

          <button
            onClick={toggleAutoplay}
            className={`absolute bottom-4 right-4 p-3 bg-white/90 rounded-full shadow hover:scale-110 transition-all duration-700 ease-in-out ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label={isAutoplayPaused ? "Resume autoplay" : "Pause autoplay"}
          >
            {isAutoplayPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </>
      )}
    </div>
  );
};

export default HeaderSlider;