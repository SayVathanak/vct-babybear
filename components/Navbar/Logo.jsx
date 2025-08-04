// components/Navbar/Logo.jsx
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";

const Logo = () => {
    const { router } = useAppContext();
    const [currentLogo, setCurrentLogo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCurrentLogo();
    }, []);

    const fetchCurrentLogo = async () => {
        try {
            const { data } = await axios.get('/api/settings/logo');
            
            if (data.success && data.logo) {
                setCurrentLogo(data.logo);
            }
        } catch (error) {
            console.error('Error fetching logo:', error);
            // If logo fetch fails, we'll show the fallback
        } finally {
            setLoading(false);
        }
    };

    const handleLogoClick = () => {
        router.push("/");
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center">
                <div className="w-28 md:w-32 h-10 bg-gray-200 animate-pulse rounded"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex justify-center">
            {currentLogo?.url ? (
                <Image
                    className="cursor-pointer w-28 md:w-32 max-h-10 object-contain"
                    onClick={handleLogoClick}
                    src={currentLogo.url}
                    alt="logo"
                    width={currentLogo.width || 128}
                    height={currentLogo.height || 40}
                    priority
                />
            ) : (
                <div
                    className="text-xl font-bold cursor-pointer transition-colors hover:text-sky-600"
                    onClick={handleLogoClick}
                >
                    Baby Bear Store
                </div>
            )}
        </div>
    );
};

export default Logo;