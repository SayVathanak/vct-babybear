import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import axios from "axios";

const HeaderSlider = () => {
    const [sliderData, setSliderData] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use ref instead of state for loaded images to avoid re-renders
    const loadedImagesRef = useRef(new Set());
    const intervalRef = useRef(null);
    const mountedRef = useRef(true);

    const AUTOPLAY_DELAY = 8000;
    const TRANSITION_DURATION = 1500; // Reduced from 3000ms

    // Memoize the preload function to avoid recreating it
    const preloadImage = useCallback((src) => {
        if (loadedImagesRef.current.has(src)) return;

        const img = new window.Image();
        img.onload = () => {
            if (mountedRef.current) {
                loadedImagesRef.current.add(src);
            }
        };
        img.onerror = () => {
            console.warn(`Failed to preload image: ${src}`);
        };
        img.src = src;
    }, []);

    // Optimize fetch function with better error handling
    const fetchSliders = useCallback(async (retryCount = 0) => {
        if (!mountedRef.current) return;

        try {
            setIsLoading(true);
            setError(null);

            const { data } = await axios.get('/api/slider/public', {
                timeout: 5000, // Reduced timeout
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            if (!mountedRef.current) return;

            if (data.success && data.sliders?.length > 0) {
                const activeSliders = data.sliders.filter(slider => slider.isActive);
                setSliderData(activeSliders);

                // Preload first two images immediately
                if (activeSliders[0]) {
                    preloadImage(activeSliders[0].imgSrcMd);
                    preloadImage(activeSliders[0].imgSrcSm);
                }
                if (activeSliders[1]) {
                    preloadImage(activeSliders[1].imgSrcMd);
                    preloadImage(activeSliders[1].imgSrcSm);
                }
            } else {
                setError("No active sliders available");
            }
        } catch (error) {
            if (!mountedRef.current) return;

            console.error('Failed to fetch sliders:', error);

            if (retryCount < 1 && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
                setTimeout(() => fetchSliders(retryCount + 1), 1000);
                return;
            }

            setError("Failed to load slider content");
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [preloadImage]);

    // Optimize slide advancement
    const advanceSlide = useCallback(() => {
        if (!mountedRef.current) return;

        setCurrentSlide(prev => {
            const nextSlide = (prev + 1) % sliderData.length;

            // Preload next images
            if (sliderData[nextSlide]) {
                preloadImage(sliderData[nextSlide].imgSrcMd);
                preloadImage(sliderData[nextSlide].imgSrcSm);
            }

            // Preload the image after next
            const afterNext = (nextSlide + 1) % sliderData.length;
            if (sliderData[afterNext]) {
                preloadImage(sliderData[afterNext].imgSrcMd);
                preloadImage(sliderData[afterNext].imgSrcSm);
            }

            return nextSlide;
        });
    }, [sliderData.length, sliderData, preloadImage]);

    // Auto-advance slides with cleanup
    useEffect(() => {
        if (sliderData.length <= 1) return;

        intervalRef.current = setInterval(advanceSlide, AUTOPLAY_DELAY);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [sliderData.length, advanceSlide]);

    // Handle visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            } else if (sliderData.length > 1) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                intervalRef.current = setInterval(advanceSlide, AUTOPLAY_DELAY);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [sliderData.length, advanceSlide]);

    // Initial fetch and cleanup
    useEffect(() => {
        mountedRef.current = true;
        fetchSliders();

        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchSliders]);

    // Memoize slider styles to prevent recalculation
    const sliderStyles = useMemo(() => ({
        transform: `translateX(-${currentSlide * 100}%)`,
        transitionDuration: `${TRANSITION_DURATION}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)"
    }), [currentSlide]);

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
            className="relative w-full mt-6 rounded-xl transition-all duration-300 ease-out overflow-hidden"
            role="region"
            aria-label="Image carousel"
            aria-live="polite"
        >
            <div className="overflow-hidden relative w-full rounded-md bg-gradient-to-br from-sky-50 to-white">
                <div
                    className="flex transition-transform will-change-transform"
                    style={sliderStyles}
                >
                    {sliderData.map((slide, index) => (
                        <SlideComponent
                            key={slide._id || index}
                            slide={slide}
                            index={index}
                            currentSlide={currentSlide}
                            isVisible={Math.abs(index - currentSlide) <= 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Separate slide component to prevent unnecessary re-renders
const SlideComponent = React.memo(({ slide, index, currentSlide, isVisible }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div className="relative min-w-full aspect-[21/9] md:aspect-[16/5] lg:aspect-[21/6]">
            {isVisible && (
                <>
                    <Image
                        className="hidden md:block object-cover transition-opacity duration-500"
                        src={slide.imgSrcMd}
                        alt={slide.alt || `Slide ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 100vw"
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        quality={85}
                        onLoad={() => setImageLoaded(true)}
                    />
                    <Image
                        className="block md:hidden object-cover transition-opacity duration-500"
                        src={slide.imgSrcSm}
                        alt={slide.alt || `Slide ${index + 1}`}
                        fill
                        sizes="100vw"
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        quality={85}
                        onLoad={() => setImageLoaded(true)}
                    />
                </>
            )}

            {!imageLoaded && isVisible && (
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
    );
});

SlideComponent.displayName = 'SlideComponent';

export default HeaderSlider;