"use client";
import React, { useState } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
// Ensure all assets are properly loaded and not empty strings
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import { BsHouseDoor, BsBoxSeam, BsInfoCircle, BsEnvelope } from 'react-icons/bs';
import { CiShop } from "react-icons/ci";
import { FiUser } from "react-icons/fi";
import { FiShoppingBag } from 'react-icons/fi'; // Changed to outline style shopping bag
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSeller, router, user, getCartCount, setShowCartPopup } = useAppContext();
  const { openSignIn } = useClerk();

  // Get the total items in cart
  const cartCount = getCartCount();

  const handleCartClick = () => {
    if (!user) {
      openSignIn();
    } else {
      router.push('/cart');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300">
      {/* Left section with logo and shopping bag */}
      <div className="flex items-center gap-3">
        {/* Logo now opens the sidebar menu on mobile */}
        {assets.logo ? (
          <Image
            className="cursor-pointer w-28 md:w-32"
            onClick={() => mobileMenuOpen ? router.push('/') : toggleMobileMenu()}
            src={assets.logo}
            alt="logo"
            width={128}
            height={40}
          />
        ) : (
          <div 
            className="cursor-pointer text-xl font-bold"
            onClick={() => mobileMenuOpen ? router.push('/') : toggleMobileMenu()}
          >
            YourStore
          </div>
        )}
        
        {/* Shopping Bag moved to left section */}
        <div className="relative cursor-pointer ml-3" onClick={handleCartClick}>
          <FiShoppingBag size={20} className="text-gray-700" />
          {cartCount > 0 && (
            <span className="absolute -bottom-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      {/* Centered navigation items for desktop */}
      <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 flex-1">
        <Link href="/" className="flex items-center gap-2 hover:text-gray-900 transition">
          <BsHouseDoor />
          <span>Home</span>
        </Link>
        <Link href="/all-products" className="flex items-center gap-2 hover:text-gray-900 transition">
          <BsBoxSeam />
          <span>Shop</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 hover:text-gray-900 transition">
          <BsInfoCircle />
          <span>About Us</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 hover:text-gray-900 transition">
          <BsEnvelope />
          <span>Contact</span>
        </Link>

        {isSeller && (
          <button
            onClick={() => router.push('/seller')}
            className="flex items-center gap-2 text-xs border px-4 py-1.5 rounded-full"
          >
            <span>Seller Dashboard</span>
          </button>
        )}
      </div>

      {/* Right section: Account button (moved to right) */}
      <div>
        {user ? (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push('/cart')} />
            </UserButton.MenuItems>
            <UserButton.MenuItems>
              <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')} />
            </UserButton.MenuItems>
          </UserButton>
        ) : (
          <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 transition">
            {assets.user_icon ? (
              <Image src={assets.user_icon} alt="user icon" width={20} height={20} />
            ) : (
              <FiUser size={20} />
            )}
          </button>
        )}
      </div>

      {/* Mobile Menu - Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-gray-500 bg-opacity-50 z-40"
            onClick={toggleMobileMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="fixed top-0 left-0 w-64 h-full bg-white z-50 shadow-lg p-6"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                {assets.logo ? (
                  <Image
                    className="cursor-pointer w-28"
                    onClick={() => {
                      router.push("/");
                      toggleMobileMenu();
                    }}
                    src={assets.logo}
                    alt="logo"
                    width={112}
                    height={35}
                  />
                ) : (
                  <div 
                    className="cursor-pointer text-xl font-bold"
                    onClick={() => {
                      router.push("/");
                      toggleMobileMenu();
                    }}
                  >
                    YourStore
                  </div>
                )}
                <button onClick={toggleMobileMenu}>
                  {assets.close_icon ? 
                  <Image src={assets.close_icon} alt="close menu" width={24} height={24} /> : 
                  <span className="text-2xl">×</span>
                }
                </button>
              </div>

              <div className="flex flex-col space-y-6">
                <Link
                  href="/"
                  onClick={toggleMobileMenu}
                  className="flex items-center gap-4 text-lg hover:text-gray-900 transition"
                >
                  <BsHouseDoor />
                  Home
                </Link>

                <Link
                  href="/all-products"
                  onClick={toggleMobileMenu}
                  className="flex items-center gap-4 text-lg hover:text-gray-900 transition"
                >
                  <BsBoxSeam />
                  Shop
                </Link>
                
                <Link
                  href="/"
                  onClick={toggleMobileMenu}
                  className="flex items-center gap-4 text-lg hover:text-gray-900 transition"
                >
                  <BsInfoCircle />
                  About Us
                </Link>
                
                <Link
                  href="/"
                  onClick={toggleMobileMenu}
                  className="flex items-center gap-4 text-lg hover:text-gray-900 transition"
                >
                  <BsEnvelope />
                  Contact
                </Link>

                {/* Added Seller Dashboard for mobile */}
                {isSeller && (
                  <button
                    onClick={() => {
                      router.push('/seller');
                      toggleMobileMenu();
                    }}
                    className="flex items-center gap-4 text-lg hover:text-gray-900 transition"
                  >
                    <BoxIcon />
                    Seller Dashboard
                  </button>
                )}

                {!user && (
                  <button
                    onClick={() => {
                      openSignIn();
                      toggleMobileMenu();
                    }}
                    className="flex items-center gap-2 text-lg font-medium hover:text-gray-900 transition"
                  >
                    {assets.user_icon ? (
                      <Image src={assets.user_icon} alt="user icon" width={20} height={20} />
                    ) : (
                      <FiUser size={20} />
                    )}
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;