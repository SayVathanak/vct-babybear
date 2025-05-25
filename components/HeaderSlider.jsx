'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

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
  const hideControlsTimeoutRef = useRef(null);
  const sliderRef = useRef(null);

  // === CONFIG ===
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

  const preloadImage = useCallback((src) => {
    if (loadedImages.has(src)) return;

    const img = new Image();
    img.onload = () => setLoadedImages(prev => new Set(prev).add(src));
    img.src = src;
  }, [loadedImages]);

  const fetchSliders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await axios.get('/api/slider/public', { timeout: 10000 });

      if (data.success && data.sliders?.length > 0) {
        setSliderData(data.sliders);
        preloadImage(data.sliders[0].imgSrcMd);
        preloadImage(data.sliders[0].imgSrcSm);
      } else {
        setError('No active sliders available');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load slider content');
    } finally {
      setIsLoading(false);
    }
  }, [preloadImage]);

  const changeSlide = useCallback((newIndex, pause = true) => {
    if (isTransitioning || newIndex === currentSlide) return;

    setIsTransitioning(true);
    setCurrentSlide(newIndex);
    showControlsTemporarily();

    if (sliderData.length > 1 && pause) {
      setIsAutoplayPaused(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsAutoplayPaused(false);
      }, MANUAL_PAUSE_DURATION);
    }

    const nextIndex = (newIndex + 1) % sliderData.length;
    const prevIndex = (newIndex - 1 + sliderData.length) % sliderData.length;

    preloadImage(sliderData[nextIndex]?.imgSrcMd);
    preloadImage(sliderData[nextIndex]?.imgSrcSm);
    preloadImage(sliderData[prevIndex]?.imgSrcMd);
    preloadImage(sliderData[prevIndex]?.imgSrcSm);

    setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, [isTransitioning, currentSlide, sliderData, preloadImage, showControlsTemporarily]);

  const goToNextSlide = useCallback(() => {
    changeSlide((currentSlide + 1) % sliderData.length);
  }, [currentSlide, sliderData.length, changeSlide]);

  const goToPrevSlide = useCallback(() => {
    changeSlide((currentSlide - 1 + sliderData.length) % sliderData.length);
  }, [currentSlide, sliderData.length, changeSlide]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
      setTouchEnd(e.touches[0].clientX);
      showControlsTemporarily();
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      setTouchEnd(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > SWIPE_THRESHOLD) {
      distance > 0 ? goToNextSlide() : goToPrevSlide();
    }
  };

  const handleKeyDown = (e) => {
    if (!sliderRef.current?.contains(document.activeElement)) return;
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
    }
  };

  const toggleAutoplay = () => {
    setIsAutoplayPaused(prev => !prev);
    showControlsTemporarily();
  };

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
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (error) {
    return (
      <div className="w-full h-48 md:h-80 bg-gradient-to-br from-sky-50 to-white mt-6 flex items-center justify-center text-sky-600">
        <p className="text-sm">{error}</p>
        <button onClick={fetchSliders} className="ml-4 px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-48 md:h-80 bg-gradient-to-br from-sky-50 to-white mt-6 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (sliderData.length === 0) return null;

  return (
    <div
      ref={sliderRef}
      className="relative w-full mt-6 overflow-hidden rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex transition-transform duration-[1200ms] ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
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
              priority={index === 0}
              sizes="100vw"
              quality={85}
            />
            <Image
              className="block md:hidden object-cover transition-all duration-1000 ease-out"
              src={slide.imgSrcSm}
              alt={slide.alt || `Slide ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              quality={85}
            />
            {slide.href && (
              <a
                href={slide.href}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
              />
            )}
          </div>
        ))}
      </div>

      {sliderData.length > 1 && (
        <>
          <button
            onClick={goToPrevSlide}
            aria-label="Previous"
            className={`absolute top-1/2 left-3 -translate-y-1/2 z-10 p-3 bg-white/90 backdrop-blur-sm rounded-full text-sky-600 hover:text-sky-800 hover:bg-white shadow transition-all duration-700 ease-out ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={goToNextSlide}
            aria-label="Next"
            className={`absolute top-1/2 right-3 -translate-y-1/2 z-10 p-3 bg-white/90 backdrop-blur-sm rounded-full text-sky-600 hover:text-sky-800 hover:bg-white shadow transition-all duration-700 ease-out ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight size={22} />
          </button>

          <button
            onClick={toggleAutoplay}
            aria-label={isAutoplayPaused ? 'Play' : 'Pause'}
            className={`absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full text-sky-600 hover:text-sky-800 shadow transition-all duration-700 ease-out ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {isAutoplayPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </>
      )}
    </div>
  );
};

export default HeaderSlider;