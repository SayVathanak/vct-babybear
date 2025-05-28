import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import axios from "axios";

const HeaderSlider = () => {
  const [sliderData, setSliderData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedImages, setLoadedImages] = useState(new Set());

  const intervalRef = useRef(null);
  const AUTOPLAY_DELAY = 6000;
  const FADE_DURATION = 3000; // Smoother fade duration

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

  // Auto-advance slides
  useEffect(() => {
    if (sliderData.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => {
          const nextSlide = (prev + 1) % sliderData.length;
          if (sliderData[nextSlide]) {
            // Preload the next image
            preloadImage(sliderData[nextSlide].imgSrcMd);
            preloadImage(sliderData[nextSlide].imgSrcSm);
          }
          return nextSlide;
        });
      }, AUTOPLAY_DELAY);
    }
    return () => clearInterval(intervalRef.current);
  }, [sliderData.length, preloadImage]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else if (sliderData.length > 1) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setCurrentSlide(prev => (prev + 1) % sliderData.length);
        }, AUTOPLAY_DELAY);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sliderData.length]);

  // Initial fetch
  useEffect(() => {
    fetchSliders();
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [fetchSliders]);

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
      className="relative w-full mt-6 rounded-xl overflow-hidden"
      role="region"
      aria-label="Image carousel"
      aria-live="polite"
    >
      <div className="relative w-full aspect-[21/9] md:aspect-[16/5] lg:aspect-[21/6] bg-gradient-to-br from-sky-50 to-white rounded-md overflow-hidden">
        {sliderData.map((slide, index) => (
          <div
            key={slide._id || index}
            className={`absolute inset-0 transition-opacity duration-${FADE_DURATION} ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            style={{
              transitionDuration: `${FADE_DURATION}ms`,
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <Image
              className="hidden md:block object-cover"
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
              className="block md:hidden object-cover"
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
  );
};

export default HeaderSlider;