// components/BottomNav/BottomNavbar.jsx
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import NavigationBar from "./NavigationBar";

const BottomNavbar = () => {
    const { setSearchOpen } = useAppContext();
    const pathname = usePathname();

    // Don't show navbar on seller pages
    if (pathname.startsWith('/seller')) {
        return null;
    }

    const toggleSearch = () => setSearchOpen(prev => !prev);

    return (
        <>
            <NavigationBar
                pathname={pathname}
                onToggleSearch={toggleSearch}
            />
            <div className="h-20 md:hidden"></div>
        </>
    );
};

export default BottomNavbar;