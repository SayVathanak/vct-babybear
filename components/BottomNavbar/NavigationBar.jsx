// components/BottomNav/NavigationBar.jsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { 
  Home, 
  Package, 
  Search, 
  ShoppingCart, 
  User
} from 'lucide-react';

const NavigationBar = ({ pathname, onToggleSearch }) => {
    const router = useRouter();
    const { user } = useUser();

    const navItems = [
        {
            id: 'home',
            label: 'Home',
            icon: Home,
            path: '/',
            active: pathname === '/'
        },
        {
            id: 'products',
            label: 'Products',
            icon: Package,
            path: '/all-products',
            active: pathname === '/all-products'
        },
        {
            id: 'search',
            label: 'Search',
            icon: Search,
            action: onToggleSearch,
            active: false
        },
        {
            id: 'cart',
            label: 'Cart',
            icon: ShoppingCart,
            path: '/cart',
            active: pathname === '/cart'
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: User,
            path: '/my-orders',
            active: pathname === '/my-orders' || pathname === '/add-address',
            isProfile: true
        }
    ];

    const handleNavClick = (item) => {
        if (item.action) {
            item.action();
        } else if (item.path) {
            router.push(item.path);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg md:hidden">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item)}
                            className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                                item.active 
                                    ? 'text-blue-600' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {item.isProfile && user ? (
                                <div className="w-6 h-6 relative">
                                    <UserButton 
                                        appearance={{
                                            elements: {
                                                avatarBox: "w-6 h-6",
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <Icon size={20} />
                            )}
                            <span className="text-xs font-medium">{item.label}</span>
                            
                            {/* Active indicator */}
                            {item.active && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Safe area for devices with home indicator */}
            <div className="h-2 bg-white"></div>
        </nav>
    );
};

export default NavigationBar;