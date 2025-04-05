"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { assets, BagIcon2, BoxIcon, CartIcon } from "@/assets/assets";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs"; // Make sure UserButton is imported
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  BsHouseDoor,
  BsBoxSeam,
  BsInfoCircle,
  BsEnvelope,
  BsShop,
  BsPersonFill,
  BsBoxArrowInRight,
  BsBoxArrowRight,
} from "react-icons/bs";
import {
  FiUser,
  FiMenu,
  FiSearch,
  FiShoppingCart,
  FiX,
  FiChevronRight,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import { CiShop } from "react-icons/ci";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [showCartPanel, setShowCartPanel] = useState(false);

  const pathname = usePathname();
  const isAllProductsPage =
    pathname === "/all-products" || pathname.startsWith("/all-products?");

  const searchInputRef = useRef(null);
  const cartPanelRef = useRef(null);
  const searchResultsRef = useRef(null);

  const {
    isSeller,
    router,
    user,
    currency,
    getCartCount,
    products,
    cart,
    cartItems,
    addToCart,
    increaseQty,
    decreaseQty,
    handlePayClick,
    showCartPopup,
    setShowCartPopup,
  } = useAppContext();

  const { openSignIn, signOut } = useClerk();

  const cartCount = getCartCount();

  // Category data for sidebar menu
  const categories = [
    { id: "All", name: "All Products" },
    { id: "PowderedMilk", name: "Formula & Powdered Milk" },
    { id: "LiquidMilk", name: "Ready-to-Feed Milk" },
    { id: "Bottles", name: "Bottles & Sippy Cups" },
    { id: "Tumblers", name: "Toddler Tumblers & Cups" },
    { id: "FeedingTools", name: "Feeding Sets & Utensils" },
    { id: "Accessories", name: "Baby Essentials & Accessories" },
    { id: "Vitamins", name: "Nutrition & Supplements" },
    { id: "Diapers", name: "Diapers & Wipes" },
    { id: "NurseryItems", name: "Nursery & Sleep Essentials" },
  ];

  // Calculate cart total - using cart items directly from context
  const calculateCartTotal = useCallback(() => {
    if (!cartItems) return 0;

    return Object.entries(cartItems).reduce((sum, [productId, quantity]) => {
      const product = products.find((p) => p._id === productId);
      return (
        sum + (product ? (product.offerPrice || product.price) * quantity : 0)
      );
    }, 0);
  }, [cartItems, products]);

  // Get cart items with product details
  const getCartItemsWithDetails = useCallback(() => {
    if (!cartItems || !products || products.length === 0) return [];

    return Object.entries(cartItems)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p._id === productId);
        return product ? { product, quantity } : null;
      })
      .filter(Boolean);
  }, [cartItems, products]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      setSearchTerm("");
      setFilteredProducts([]);
      setShowAllResults(false);
    } else {
      // Focus the search input after opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  // Enhanced debounce search with useCallback for better performance
  const debouncedSearch = useCallback(
    (value) => {
      if (value.trim()) {
        const filtered = products.filter(
          (p) =>
            p.name.toLowerCase().includes(value.toLowerCase()) ||
            (p.description &&
              p.description.toLowerCase().includes(value.toLowerCase()))
        );
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts([]);
      }
    },
    [products]
  );

  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  // Handle click outside to close search and cart panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close search when clicking outside
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target) &&
        !event.target.closest('button[aria-label="Search"]')
      ) {
        setSearchOpen(false);
      }

      // Close cart panel when clicking outside
      if (
        cartPanelRef.current &&
        !cartPanelRef.current.contains(event.target) &&
        !event.target.closest('div[aria-label="Shopping cart"]')
      ) {
        setShowCartPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleEscKeyPress = (e) => {
      if (e.key === "Escape") {
        if (searchOpen) toggleSearch();
        if (showCartPanel) setShowCartPanel(false);
        if (mobileMenuOpen) toggleMobileMenu();
      }
    };

    window.addEventListener("keydown", handleEscKeyPress);
    return () => window.removeEventListener("keydown", handleEscKeyPress);
  }, [searchOpen, showCartPanel, mobileMenuOpen]);

  // Proceed to checkout - integrated from CartPopup component
  const handleCheckout = () => {
    if (user) {
      setShowCartPanel(false);
      handlePayClick();
    } else {
      openSignIn();
    }
  };

  // Navigate to product page and close search
  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`);
    toggleSearch();
  };

  // Get cart items for display
  const cartItemsWithDetails = getCartItemsWithDetails();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-2 md:px-12 flex items-center justify-between">
      {/* Mobile Menu Icon */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors hover:bg-gray-100"
        >
          <FiMenu size={24} />
        </button>
      </div>

      {/* Centered Logo */}
      <div className="flex-1 flex justify-center">
        {assets.logo ? (
          <Image
            className="cursor-pointer w-28 md:w-32 transition-transform hover:scale-105"
            onClick={() => router.push("/")}
            src={assets.logo}
            alt="logo"
            width={128}
            height={40}
            priority
          />
        ) : (
          <div
            className="text-xl font-bold cursor-pointer transition-colors hover:text-sky-600"
            onClick={() => router.push("/")}
          >
            Baby Bear Store
          </div>
        )}
      </div>

      {/* Icons */}
      <div className="flex items-center gap-5">
        {/* Only show search on non-all-products pages */}
        {!isAllProductsPage && (
          <button
            onClick={toggleSearch}
            aria-label="Search"
            className="focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-md p-1 transition-colors hover:bg-gray-100"
          >
            {searchOpen ? <FiX size={22} /> : <FiSearch size={22} />}
          </button>
        )}
        <div
          className="relative cursor-pointer transition-transform hover:scale-110"
          onClick={() => setShowCartPanel(true)}
          aria-label="Shopping cart"
        >
          <FiShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -bottom-2 -right-2 bg-sky-300/90 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>

        {/* Sign in button or UserButton */}
        {/* Replace the UserButton implementation with this corrected version */}
        {/* {user ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <button
            onClick={() => openSignIn()}
            aria-label="Sign In"
            className="flex items-center gap-1 bg-sky-300/70 hover:bg-sky-600 text-white px-3 py-1.5 rounded-md transition-colors font-medium text-sm"
          >
            <BsBoxArrowInRight size={16} />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )} */}
      </div>

      {/* Search Results - Improved for better responsiveness */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            ref={searchResultsRef}
            className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-40"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="container mx-auto max-w-7xl px-4 py-4">
              <div className="relative mb-4">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
                <FiSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>

              {filteredProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto pt-2 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {(showAllResults
                      ? filteredProducts
                      : filteredProducts.slice(0, 10)
                    ).map((product) => (
                      <div
                        key={product._id}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
                        onClick={() => handleProductClick(product._id)}
                      >
                        {/* Compact product card for search results */}
                        <div className="p-2">
                          <div className="relative aspect-square bg-gray-50 rounded-md mb-2 overflow-hidden">
                            {product.image && product.image[0] ? (
                              <Image
                                src={product.image[0]}
                                alt={product.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 50vw, 20vw"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                                <FiShoppingCart size={24} />
                              </div>
                            )}
                          </div>
                          <h3 className="text-sm font-medium line-clamp-2 h-10">
                            {product.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className="text-sm font-semibold text-sky-700">
                              {currency}
                              {product.offerPrice?.toFixed(2) ||
                                product.price?.toFixed(2)}
                            </span>
                            {product.price &&
                              product.offerPrice &&
                              product.price > product.offerPrice && (
                                <span className="text-xs text-gray-400 line-through ml-2">
                                  {currency}
                                  {product.price?.toFixed(2)}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProducts.length > 10 && !showAllResults && (
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={() => setShowAllResults(true)}
                        className="text-sky-600 hover:text-sky-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-sky-50 transition-colors"
                      >
                        View all {filteredProducts.length} results
                      </button>
                    </div>
                  )}
                </>
              ) : searchTerm ? (
                <div className="text-center py-12">
                  <div className="mb-3 text-gray-400">
                    <FiSearch size={36} className="mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-1">
                    No products found for "{searchTerm}"
                  </p>
                  <p className="text-gray-500 text-sm">
                    Try different keywords or browse categories
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">Start typing to search products</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {categories.slice(0, 5).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          router.push(`/all-products?category=${category.id}`);
                          toggleSearch();
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition-colors"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar - Improved slide animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={toggleMobileMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="fixed top-0 left-0 w-72 h-full bg-white z-50 overflow-hidden flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sidebar Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  {assets.logo ? (
                    <Image
                      className="cursor-pointer w-24"
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
                  <button
                    onClick={toggleMobileMenu}
                    className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    aria-label="Close menu"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>

              {/* Sidebar Content - Scrollable area */}
              <div className="flex-1 overflow-y-auto">
                {/* Main Navigation */}
                <div className="p-5 border-b border-gray-100">
                  {/* <h3 className="text-xs uppercase text-gray-500 font-semibold mb-3">Main Navigation</h3> */}
                  <div className="flex flex-col space-y-2">
                    <Link
                      href="/"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <BsHouseDoor size={18} /> <span>Home</span>
                    </Link>
                    <Link
                      href="/all-products"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <BsShop size={18} /> <span>Shop</span>
                    </Link>
                    <Link
                      href="/my-orders"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <BsBoxSeam size={18} /> <span>Orders</span>
                    </Link>
                    <Link
                      href="/"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <BsInfoCircle size={18} /> <span>About Us</span>
                    </Link>
                    <Link
                      href="/"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-5 text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <BsEnvelope size={18} /> <span>Contact</span>
                    </Link>
                  </div>
                </div>

                {/* Categories Section - Enhanced with icons and better spacing */}
                <div className="p-5 border-b border-gray-100">
                  {/* <h3 className="text-xs uppercase text-gray-500 font-semibold mb-3">Categories</h3> */}
                  <div className="flex flex-col space-y-1">
                    {categories.map((category) => (
                      <Link
                        href={`/all-products?category=${category.id}`}
                        key={category.id}
                        onClick={toggleMobileMenu}
                        className="flex items-center justify-between text-gray-700 hover:text-sky-600 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <span>{category.name}</span>
                        <FiChevronRight size={16} className="text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Account Section - Updated with UserButton and Bootstrap icons */}
              <div className="p-5 mt-auto border-t border-gray-100 bg-gray-50">
                {isSeller && (
                  <button
                    onClick={() => {
                      router.push("/seller");
                      toggleMobileMenu();
                    }}
                    className="flex items-center gap-3 text-gray-700 hover:text-sky-600 py-2 mb-3 w-full"
                  >
                    <BoxIcon /> <span>Seller Dashboard</span>
                  </button>
                )}

                {/* User information section */}
                {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <UserButton afterSignOutUrl="/" />
                    <div>
                      <div className="text-sm font-medium">{user.firstName || "User"}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[180px]">{user.email}</div>
                    </div>
                  </div>

                  {/* Sign Out with Confirmation */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="flex items-center justify-center gap-2 w-full bg-sky-300/70 hover:bg-white text-white hover:text-sky-400 px-3 py-2 rounded-md transition-colors font-medium">
                        <BsBoxArrowRight size={18} /> <span>Sign Out</span>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will log you out and return you to the homepage.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            signOut();
                            toggleMobileMenu();
                          }}
                        >
                          Yes, sign out
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <button
                  onClick={() => {
                    openSignIn();
                    toggleMobileMenu();
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-sky-300/70 hover:bg-white text-white hover:text-sky-400 px-3 py-2 rounded-md transition-colors font-medium"
                >
                  <BsBoxArrowInRight size={18} /> <span>Sign In</span>
                </button>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Slide Panel - Redesigned with receipt style from CartPopup */}
      <AnimatePresence>
        {showCartPanel && (
          <motion.div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setShowCartPanel(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              ref={cartPanelRef}
              className="fixed top-0 right-0 w-80 sm:w-96 max-w-full h-full bg-white shadow-xl flex flex-col overflow-hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cart Header */}
              <div className="p-4 border-b border-dashed border-gray-300 flex justify-between items-center">
                <h2 className="text-lg font-medium font-playfair flex-1 text-center">
                  RECEIPT
                </h2>
                <button
                  onClick={() => setShowCartPanel(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close cart"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Cart Content - Using receipt style from CartPopup */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                {cartCount > 0 ? (
                  <div className="space-y-2">
                    {/* Cart items with receipt style */}
                    <div className="mt-2 space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                      {cartItemsWithDetails.length > 0 ? (
                        cartItemsWithDetails.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-xs border-b border-dashed border-gray-300 pb-2 pt-1"
                          >
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="truncate max-w-[180px]">
                                  {item.product.name}
                                </span>
                                <span className="ml-2">
                                  {currency}
                                  {(
                                    (item.product.offerPrice ||
                                      item.product.price) * item.quantity
                                  ).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    decreaseQty(
                                      item.product._id,
                                      item.quantity
                                    );
                                  }}
                                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                >
                                  <FiMinus size={12} />
                                </button>
                                <span className="mx-2 min-w-[20px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    increaseQty(item.product._id);
                                  }}
                                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                >
                                  <FiPlus size={12} />
                                </button>
                                <span className="ml-2 text-gray-500">
                                  @ {currency}
                                  {(
                                    item.product.offerPrice ||
                                    item.product.price
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Your cart is empty</p>
                        </div>
                      )}
                    </div>

                    {/* Cart summary with total */}
                    <div className="mt-4 border-t border-dashed border-gray-300 pt-3 pb-1">
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>
                          {currency}
                          {calculateCartTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <p>Delivery calculated at checkout</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="mb-4 text-gray-300">
                      <FiShoppingCart size={48} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">
                      Your cart is empty
                    </h3>
                    <p className="text-gray-500 mb-4 text-xs">
                      Discover our quality products for your little ones
                    </p>
                    <button
                      onClick={() => {
                        router.push("/all-products");
                        setShowCartPanel(false);
                      }}
                      className="px-5 py-2.5 bg-sky-300/70 text-white rounded-md hover:bg-sky-400/70 transition-colors font-medium"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>

              {/* Cart Footer with Checkout buttons - styled like CartPopup */}
              {cartCount > 0 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setShowCartPanel(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-center"
                    >
                      View Cart
                    </button>
                    <button
                      onClick={handleCheckout}
                      className="flex-1 px-4 py-2 bg-sky-300/70 text-white rounded-md hover:bg-sky-600 transition-colors text-center"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Popup Notification - Simplified version of CartPopup component */}
      <AnimatePresence>
        {showCartPopup && (
          <motion.div
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-white rounded-lg shadow-lg p-4 max-w-xs w-full z-50 border border-gray-200"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex items-start gap-3">
              <div className="bg-green-50 rounded-full p-2 text-green-500">
                <FiShoppingCart size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Added to cart!</h3>
                <p className="text-gray-500 text-xs mt-0.5 mb-2">
                  Item successfully added to your cart
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowCartPopup(false)}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => {
                      setShowCartPopup(false);
                      setShowCartPanel(true);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-sky-300/70 text-white rounded hover:bg-sky-600 transition-colors"
                  >
                    View Cart
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowCartPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
