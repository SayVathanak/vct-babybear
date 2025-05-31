
// BottomNavbar.jsx - FIXED VERSION
'use client'
import React, { useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { 
  Home, 
  Package, 
  Search, 
  ShoppingCart, 
  User,
  X
} from 'lucide-react';

export default function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Don't show navbar on seller pages
  if (pathname.startsWith('/seller')) {
    return null;
  }

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
      action: () => {
        setShowSearch(true);
        // IMMEDIATE focus for iOS
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.click();
          }
        }, 50);
      },
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/all-products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute top-0 left-0 right-0 bg-white p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
              <div className="flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  inputMode="search"
                  style={{ fontSize: '16px' }} // Prevent iOS zoom
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Search for baby products, brands, categories...</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
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
                    ? 'text-blue-600 bg-blue-50' 
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

      {/* Spacer to prevent content from being hidden behind navbar */}
      <div className="h-20 md:hidden"></div>
    </>
  );
}