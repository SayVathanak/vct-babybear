"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { 
  CiHome,
  CiGrid41,
  CiSearch,
  CiShoppingCart,
  CiUser
} from "react-icons/ci";

const NavigationBar = ({ pathname, onToggleSearch }) => {
    const router = useRouter();
    const { user } = useUser();

    const isHomePage = pathname === '/';
    const iconSize = 24; // Consistent size for all icons

    const navItems = [
        {
            id: 'home',
            label: 'Home',
            icon: CiHome,
            path: '/',
            active: pathname === '/',
        },
        {
            id: 'products',
            label: 'Products',
            icon: CiGrid41,
            path: '/all-products',
            active: pathname === '/all-products'
        },
        {
            id: 'search',
            label: 'Search',
            icon: CiSearch,
            action: isHomePage ? onToggleSearch : null,
            active: false,
            disabled: !isHomePage
        },
        {
            id: 'cart',
            label: 'Cart',
            icon: CiShoppingCart,
            path: '/cart',
            active: pathname === '/cart'
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: CiUser,
            path: '/my-orders',
            active: pathname === '/my-orders' || pathname === '/add-address',
            isProfile: true
        }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg md:hidden pb-4">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => item.action ? item.action() : item.path && router.push(item.path)}
                            disabled={item.disabled}
                            className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                                item.active 
                                    ? 'text-blue-600' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            } ${
                                item.disabled ? 'opacity-50 pointer-events-none' : ''
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
                                <Icon 
                                    size={iconSize}
                                    className={item.active ? "text-blue-600" : "text-current"}
                                />
                            )}
                            <span className="text-xs font-medium">{item.label}</span>
                            
                            {item.active && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="h-2 bg-white"></div>
        </nav>
    );
};

export default NavigationBar;