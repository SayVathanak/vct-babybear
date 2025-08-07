// components/Navbar/Logo.jsx
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";

const Logo = () => {
    const { router } = useAppContext();
    const [currentLogo, setCurrentLogo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCurrentLogo();
    }, []);

    const fetchCurrentLogo = async () => {
        try {
            setError(null);
            const { data } = await axios.get('/api/settings/logo');
            
            if (data.success && data.logo) {
                setCurrentLogo(data.logo);
            }
        } catch (error) {
            console.error('Error fetching logo:', error);
            setError('Failed to load logo');
            // If logo fetch fails, we'll show the fallback
        } finally {
            setLoading(false);
        }
    };

    const handleLogoClick = () => {
        router.push("/");
    };

    // Helper function to handle image load errors
    const handleImageError = () => {
        console.warn('Logo image failed to load, falling back to text logo');
        setCurrentLogo(null);
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center">
                <div className="w-28 md:w-32 h-10 bg-white animate-pulse rounded"></div>
            </div>
        );
    }

    // Check if the logo is an SVG
    const isSvg = currentLogo?.format === 'svg' || currentLogo?.url?.includes('.svg') || currentLogo?.url?.includes('image/svg+xml');

    return (
        <div className="flex-1 flex justify-center">
            {currentLogo?.url ? (
                isSvg ? (
                    // Use regular img tag for SVGs to avoid Next.js restrictions
                    <img
                        className="cursor-pointer w-28 md:w-32 max-h-10 object-contain"
                        onClick={handleLogoClick}
                        src={currentLogo.url}
                        alt="logo"
                        width={currentLogo.width || 128}
                        height={currentLogo.height || 40}
                        onError={handleImageError}
                        onLoad={() => setError(null)}
                    />
                ) : (
                    // Use Next.js Image component for other formats
                    <Image
                        className="cursor-pointer w-28 md:w-32 max-h-10 object-contain"
                        onClick={handleLogoClick}
                        src={currentLogo.url}
                        alt="logo"
                        width={currentLogo.width || 128}
                        height={currentLogo.height || 40}
                        priority
                        onError={handleImageError}
                        onLoadingComplete={() => setError(null)}
                    />
                )
            ) : (
                <div
                    className="text-xl font-bold cursor-pointer transition-colors hover:text-sky-600"
                    onClick={handleLogoClick}
                >
                    Baby Bear Store
                </div>
            )}
            
            {error && (
                <div className="absolute top-full left-0 right-0 text-xs text-red-500 text-center">
                    {error}
                </div>
            )}
        </div>
    );
};

export default Logo;