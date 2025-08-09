'use client'
import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { FiSearch, FiPlusCircle, FiCheckCircle, FiXCircle, FiLoader, FiPackage, FiChevronRight, FiX, FiArrowLeft, FiGrid, FiList } from 'react-icons/fi';
import { CiBarcode } from "react-icons/ci";
import BarcodeScanner from '@/components/BarcodeScanner';

// Constants
const SCREEN_BREAKPOINTS = {
  mobile: 640,
  tablet: 1024
};

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

const PRODUCT_NAME_LIMITS = {
  mobile: { default: 20, short: 15, long: 25 },
  tablet: { default: 25, short: 20, long: 30 },
  desktop: { default: 30, short: 20, long: 35 }
};

// Custom hooks
const useScreenSize = () => {
  const [screenInfo, setScreenInfo] = useState({
    isMobile: false,
    isTablet: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 0
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setScreenInfo({
        isMobile: width < SCREEN_BREAKPOINTS.mobile,
        isTablet: width >= SCREEN_BREAKPOINTS.mobile && width < SCREEN_BREAKPOINTS.tablet,
        width
      });
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenInfo;
};

const useProducts = (getToken) => {
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const fetchAllProducts = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/product/seller-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setAllProducts(data.products);
      } else {
        toast.error("Could not fetch product list.");
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error("Error fetching your products.");
    } finally {
      setIsLoadingList(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const updateProduct = useCallback((updatedProduct) => {
    setAllProducts(prev => 
      prev.map(p => p._id === updatedProduct._id ? updatedProduct : p)
    );
  }, []);

  return { allProducts, isLoadingList, updateProduct, refetchProducts: fetchAllProducts };
};

const useBarcodeScanner = (allProducts, getToken, onProductFound, onProductNotFound, setSearchQuery) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const handleBarcodeDetected = useCallback(async (decodedText) => {
    console.log('Barcode detected:', decodedText);
    setIsScanning(true);
    
    // Set the search query to match original behavior
    setSearchQuery(decodedText);

    try {
      const normalizedBarcode = decodedText.trim();
      
      // Check local products first
      const localProduct = allProducts.find(p => p.barcode === normalizedBarcode);
      
      if (localProduct) {
        onProductFound(localProduct);
        toast.success(`Product Found: ${localProduct.name}`);
        handleClose();
        return;
      }

      // Search via API if not found locally
      const token = await getToken();
      const { data } = await axios.get(`/api/product/search?query=${normalizedBarcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success && data.product) {
        onProductFound(data.product);
        toast.success(`Product Found: ${data.product.name}`);
      } else {
        onProductNotFound(normalizedBarcode);
        toast.error(data?.message || 'Product not found in your inventory.');
      }
      handleClose();
    } catch (error) {
      console.error('Barcode lookup error:', error);
      onProductNotFound(decodedText.trim());
      const errorMessage = error.response?.data?.message || `Product not found for barcode: ${decodedText.trim()}`;
      toast.error(errorMessage);
      handleClose();
    } finally {
      setIsScanning(false);
    }
  }, [allProducts, getToken, onProductFound, onProductNotFound, setSearchQuery]);

  const handleOpen = useCallback(() => {
    // Security and capability checks
    if (!window.location.protocol.startsWith('https') && !window.location.hostname.includes('localhost')) {
      toast.error('Camera access requires a secure connection (HTTPS).');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera access is not supported on this device.');
      return;
    }
    setShowScanner(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowScanner(false);
    setIsScanning(false);
    setScannerKey(prev => prev + 1);
  }, []);

  return {
    isScanning,
    showScanner,
    scannerKey,
    handleBarcodeDetected,
    handleOpen,
    handleClose
  };
};

// Utility functions
const getProductNameLimit = (screenInfo, variant = 'default') => {
  if (screenInfo.isMobile) return PRODUCT_NAME_LIMITS.mobile[variant];
  if (screenInfo.isTablet) return PRODUCT_NAME_LIMITS.tablet[variant];
  return PRODUCT_NAME_LIMITS.desktop[variant];
};

const trimProductName = (name, maxLength) => {
  if (!name) return '';
  return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
};

// UI Components
const LoadingSpinner = ({ size = 8, className = "" }) => (
  <div className={`flex items-center justify-center py-12 ${className}`}>
    <FiLoader className={`animate-spin h-${size} w-${size} text-blue-500`} />
  </div>
);

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12">
    <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm sm:text-base px-4 mb-4">{description}</p>
    {action}
  </div>
);

const ProductImage = ({ src, alt, size = "default" }) => {
  const sizeClasses = {
    small: "w-10 h-10 sm:w-12 sm:h-12",
    default: "w-20 h-20 sm:w-40 sm:h-40",
    grid: "w-full h-32 sm:h-40"
  };

  const sizes = {
    small: "(max-width: 640px) 40px, 48px",
    default: "(max-width: 640px) 64px, 80px",
    grid: "(max-width: 640px) 150px, 200px"
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
      <Image 
        src={src} 
        alt={alt} 
        fill
        sizes={sizes[size]}
        className="rounded-lg object-cover" 
        quality={90}
      />
    </div>
  );
};

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative">
    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
    />
  </div>
);

const ViewModeToggle = ({ viewMode, onViewModeChange }) => (
  <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
    <button
      onClick={() => onViewModeChange(VIEW_MODES.LIST)}
      className={`p-1 rounded transition-colors ${viewMode === VIEW_MODES.LIST ? 'bg-white shadow-sm' : ''}`}
    >
      <FiList size={16} />
    </button>
    <button
      onClick={() => onViewModeChange(VIEW_MODES.GRID)}
      className={`p-1 rounded transition-colors ${viewMode === VIEW_MODES.GRID ? 'bg-white shadow-sm' : ''}`}
    >
      <FiGrid size={16} />
    </button>
  </div>
);

const ProductListItem = ({ product, isSelected, onSelect, screenInfo }) => (
  <button
    onClick={() => onSelect(product)}
    className={`
      w-full text-left p-3 sm:p-4 flex items-center gap-3 rounded-lg transition-all duration-200
      ${isSelected 
        ? 'bg-blue-50 border-l-4 border-blue-500' 
        : 'hover:bg-gray-50 border-l-4 border-transparent'
      }
    `}
  >
    <ProductImage src={product.image[0]} alt={product.name} size="small" />
    <div className="flex-grow overflow-hidden min-w-0">
      <p className="font-medium text-gray-800 truncate text-sm sm:text-base" title={product.name}>
        {trimProductName(product.name, getProductNameLimit(screenInfo))}
      </p>
      <p className="text-xs sm:text-sm text-gray-500">Stock: {product.stock}</p>
      {product.barcode && (
        <p className="text-xs text-gray-400 font-mono truncate">{product.barcode}</p>
      )}
    </div>
    <FiChevronRight className="text-gray-400 flex-shrink-0" size={screenInfo.isMobile ? 14 : 16} />
  </button>
);

const ProductGridItem = ({ product, isSelected, onSelect, screenInfo }) => (
  <button
    onClick={() => onSelect(product)}
    className={`
      p-3 sm:p-4 rounded-lg transition-all duration-200 text-left
      ${isSelected 
        ? 'bg-blue-50 border-2 border-blue-500' 
        : 'hover:bg-gray-50 border-2 border-transparent'
      }
    `}
  >
    <ProductImage src={product.image[0]} alt={product.name} size="grid" />
    <p className="font-medium text-gray-800 truncate text-sm mt-2" title={product.name}>
      {trimProductName(product.name, getProductNameLimit(screenInfo, 'short'))}
    </p>
    <p className="text-xs text-gray-500">Stock: {product.stock}</p>
  </button>
);

const StockUpdateForm = ({ product, isUpdating, onUpdate }) => {
  const [quantityToAdd, setQuantityToAdd] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product || Number(quantityToAdd) <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    await onUpdate(product._id, quantityToAdd);
    setQuantityToAdd('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity to Add
        </label>
        <input
          type="number"
          value={quantityToAdd}
          onChange={(e) => setQuantityToAdd(e.target.value)}
          min="1"
          placeholder="Enter quantity"
          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isUpdating || !quantityToAdd || Number(quantityToAdd) <= 0}
        className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base"
      >
        {isUpdating ? (
          <>
            <FiLoader className="animate-spin" size={16} />
            Updating...
          </>
        ) : (
          <>
            <FiCheckCircle size={16} />
            Update Stock
          </>
        )}
      </button>
    </form>
  );
};

// Main Content Component
const NewArrivalsContent = () => {
  const { getToken, router } = useAppContext();
  const searchParams = useSearchParams();
  const screenInfo = useScreenSize();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [notFoundQuery, setNotFoundQuery] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showProductList, setShowProductList] = useState(true);
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);

  // Custom hooks
  const { allProducts, isLoadingList, updateProduct } = useProducts(getToken);

  // Handlers
  const handleProductFound = useCallback((product) => {
    setSelectedProduct(product);
    setNotFoundQuery(null);
    if (screenInfo.isMobile || screenInfo.isTablet) {
      setShowProductList(false);
    }
  }, [screenInfo.isMobile, screenInfo.isTablet]);

  const handleProductNotFound = useCallback((query) => {
    setSelectedProduct(null);
    setNotFoundQuery(query);
    if (screenInfo.isMobile || screenInfo.isTablet) {
      setShowProductList(false);
    }
  }, [screenInfo.isMobile, screenInfo.isTablet]);

  const scanner = useBarcodeScanner(allProducts, getToken, handleProductFound, handleProductNotFound, setSearchQuery);

  // Handle screen size changes
  useEffect(() => {
    if (screenInfo.width >= SCREEN_BREAKPOINTS.tablet) {
      setShowProductList(true);
    }
    if (screenInfo.isMobile) {
      setViewMode(VIEW_MODES.LIST);
    }
  }, [screenInfo.width, screenInfo.isMobile]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return allProducts;
    const query = searchQuery.toLowerCase();
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  }, [searchQuery, allProducts]);

  // Event handlers
  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setNotFoundQuery(null);
    // Don't clear search query when selecting from list manually
    if (screenInfo.isMobile || screenInfo.isTablet) {
      setShowProductList(false);
    }
  }, [screenInfo.isMobile, screenInfo.isTablet]);

  const handleClearSelection = useCallback(() => {
    setSelectedProduct(null);
    setNotFoundQuery(null);
    setSearchQuery('');
    if (screenInfo.isMobile || screenInfo.isTablet) {
      setShowProductList(true);
    }
  }, [screenInfo.isMobile, screenInfo.isTablet]);

  const handleUpdateStock = useCallback(async (productId, quantityToAdd) => {
    setIsUpdating(true);
    try {
      const token = await getToken();
      const { data } = await axios.put('/api/product/update-stock', {
        productId,
        quantityToAdd: Number(quantityToAdd) // Ensure it's a number
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (data.success) {
        toast.success(data.message);
        const updatedProduct = data.product;
        setSelectedProduct(updatedProduct);
        updateProduct(updatedProduct);
      } else {
        toast.error(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Stock update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update stock.');
    } finally {
      setIsUpdating(false);
    }
  }, [getToken, updateProduct]);

  const handleAddNewProduct = useCallback(() => {
    router.push('/seller/');
  }, [router]);

  // Component renderers
  const renderProductList = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Products</h2>
          <div className="flex items-center gap-2">
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <button
              onClick={handleAddNewProduct}
              className="bg-blue-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
            >
              <FiPlusCircle size={16} />
              <span className="hidden xs:inline">Add</span>
            </button>
          </div>
        </div>
        
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or barcode..."
        />
      </div>
      
      {/* Products Container */}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-4 ${(screenInfo.isMobile || screenInfo.isTablet) ? 'pb-20' : ''}`}>
        {isLoadingList ? (
          <LoadingSpinner />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={FiPackage}
            title={searchQuery ? 'No products found' : 'No products found'}
            description={searchQuery ? 'No products found matching your search.' : 'No products found.'}
          />
        ) : (
          <div className={viewMode === VIEW_MODES.GRID 
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' 
            : 'space-y-2'
          }>
            {filteredProducts.map((product) => 
              viewMode === VIEW_MODES.GRID ? (
                <ProductGridItem
                  key={product._id}
                  product={product}
                  isSelected={selectedProduct?._id === product._id}
                  onSelect={handleSelectProduct}
                  screenInfo={screenInfo}
                />
              ) : (
                <ProductListItem
                  key={product._id}
                  product={product}
                  isSelected={selectedProduct?._id === product._id}
                  onSelect={handleSelectProduct}
                  screenInfo={screenInfo}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderProductDetails = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {(screenInfo.isMobile || screenInfo.isTablet) && (
              <button
                onClick={() => setShowProductList(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {selectedProduct ? 'Update Stock' : 'Select Product'}
            </h2>
          </div>
          {selectedProduct && (
            <button
              onClick={handleClearSelection}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiX size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-4 ${(screenInfo.isMobile || screenInfo.isTablet) ? 'pb-20' : ''}`}>
        {selectedProduct ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <ProductImage src={selectedProduct.image[0]} alt={selectedProduct.name} />
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base leading-tight" title={selectedProduct.name}>
                    {trimProductName(selectedProduct.name, getProductNameLimit(screenInfo, 'long'))}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Current Stock: <span className="font-medium">{selectedProduct.stock}</span>
                  </p>
                  {selectedProduct.barcode && (
                    <p className="text-xs text-gray-500 font-mono truncate">{selectedProduct.barcode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Update Form */}
            <StockUpdateForm
              product={selectedProduct}
              isUpdating={isUpdating}
              onUpdate={handleUpdateStock}
            />

            {/* Desktop Scanner Button */}
            {!screenInfo.isMobile && !screenInfo.isTablet && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={scanner.handleOpen}
                  className="w-full bg-gray-100 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-base"
                >
                  <CiBarcode size={20} />
                  Scan Barcode
                </button>
              </div>
            )}
          </div>
        ) : notFoundQuery ? (
          <EmptyState
            icon={FiXCircle}
            title="Product Not Found"
            description={`No product found with barcode: ${notFoundQuery}`}
            action={
              <button
                onClick={handleAddNewProduct}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <FiPlusCircle size={16} />
                Add New Product
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={FiPackage}
            title="Select a Product"
            description="Choose a product from the list to update its stock."
            action={!screenInfo.isMobile && !screenInfo.isTablet && (
              <button
                onClick={scanner.handleOpen}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <CiBarcode size={16} />
                Scan Barcode
              </button>
            )}
          />
        )}
      </div>
    </div>
  );

  const renderBottomBarcodeButton = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4 safe-area-pb z-40">
      <div className="max-w-md mx-auto">
        <button
          onClick={scanner.handleOpen}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95"
        >
          <CiBarcode size={24} />
          <span>Scan Barcode</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile & Tablet View */}
      {(screenInfo.isMobile || screenInfo.isTablet) && (
        <div className="h-screen flex flex-col">
          {showProductList ? renderProductList() : renderProductDetails()}
          {renderBottomBarcodeButton()}
        </div>
      )}

      {/* Desktop View */}
      {!screenInfo.isMobile && !screenInfo.isTablet && (
        <div className="h-screen flex">
          <div className="w-1/2 border-r border-gray-200">
            {renderProductList()}
          </div>
          <div className="w-1/2">
            {renderProductDetails()}
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {scanner.showScanner && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full">
            <BarcodeScanner
              key={scanner.scannerKey}
              onBarcodeDetected={scanner.handleBarcodeDetected}
              onClose={scanner.handleClose}
              autoCloseOnScan={false}
            />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {scanner.isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 flex items-center gap-4 mx-4 max-w-sm w-full">
            <div className="relative">
              <FiLoader className="animate-spin h-6 w-6 text-blue-500" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-100"></div>
            </div>
            <span className="text-gray-700 font-medium">Searching for product...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Loading Component
const LoadingPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <FiLoader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main Component with Suspense
const NewArrivalsPage = () => {
  return (
    <Suspense fallback={<LoadingPage />}>
      <NewArrivalsContent />
    </Suspense>
  );
};

export default NewArrivalsPage;