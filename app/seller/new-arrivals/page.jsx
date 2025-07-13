'use client'
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { FiSearch, FiPlusCircle, FiCheckCircle, FiXCircle, FiLoader, FiPackage, FiChevronRight, FiX, FiArrowLeft, FiGrid, FiList, FiMenu } from 'react-icons/fi';
import { CiBarcode } from "react-icons/ci";
import BarcodeScanner from '@/components/BarcodeScanner';

// Separate component that uses useSearchParams
const NewArrivalsContent = () => {
    const { getToken, router } = useAppContext();
    const searchParams = useSearchParams();

    // State management
    const [searchQuery, setSearchQuery] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [notFoundQuery, setNotFoundQuery] = useState(null);
    
    const [quantityToAdd, setQuantityToAdd] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scannerKey, setScannerKey] = useState(0); // Key to force remount scanner

    // Responsive state
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [showProductList, setShowProductList] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    // Utility function to trim product names with dynamic length based on screen size
    const trimProductName = (name, maxLength) => {
        if (!name) return '';
        if (maxLength === undefined) {
            maxLength = isMobile ? 20 : isTablet ? 25 : 30;
        }
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    };

    // Check screen size
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            const newIsMobile = width < 640; // sm breakpoint
            const newIsTablet = width >= 640 && width < 1024; // sm to lg breakpoint
            
            setIsMobile(newIsMobile);
            setIsTablet(newIsTablet);
            
            // Auto-show product list on larger screens
            if (width >= 1024) {
                setShowProductList(true);
            }
            
            // Switch to list view on mobile for better UX
            if (newIsMobile) {
                setViewMode('list');
            }
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Fetch all seller products on component mount
    useEffect(() => {
        const fetchAllProducts = async () => {
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
                toast.error("Error fetching your products.");
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchAllProducts();
    }, [getToken]);
    
    // Memoized filtering of the product list based on the search query
    const filteredProducts = useMemo(() => {
        if (!searchQuery) {
            return allProducts;
        }
        return allProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [searchQuery, allProducts]);

    // Handler for selecting a product from the list
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setQuantityToAdd('');
        setNotFoundQuery(null);
        
        // On mobile/tablet, show product details when selected
        if (isMobile || isTablet) {
            setShowProductList(false);
        }
    };

    // Handler for clearing the current selection
    const handleClearSelection = () => {
        setSelectedProduct(null);
        setQuantityToAdd('');
        setNotFoundQuery(null);
        setSearchQuery('');
        
        // On mobile/tablet, show product list when cleared
        if (isMobile || isTablet) {
            setShowProductList(true);
        }
    };

    // Handler for going back to product list
    const handleBackToList = () => {
        setShowProductList(true);
    };

    // Handler for updating the stock
    const handleUpdateStock = async (e) => {
        e.preventDefault();
        if (!selectedProduct || Number(quantityToAdd) <= 0) {
            toast.error("Please select a product and enter a valid quantity.");
            return;
        }
        setIsUpdating(true);
        try {
            const token = await getToken();
            const { data } = await axios.put('/api/product/update-stock', {
                productId: selectedProduct._id,
                quantityToAdd: quantityToAdd
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                toast.success(data.message);
                const updatedProduct = data.product;
                setSelectedProduct(updatedProduct);
                setAllProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
                setQuantityToAdd('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update stock.');
        } finally {
            setIsUpdating(false);
        }
    };

    // Handler for barcode scan success - FIXED VERSION
    const handleBarcodeDetected = async (decodedText) => {
        console.log('Barcode detected in New Arrivals:', decodedText);
        
        // Don't close scanner immediately, let the search complete first
        setIsScanning(true);
        setSearchQuery(decodedText);

        try {
            const normalizedBarcode = decodedText.trim();
            
            // First, check if the product exists in the local products array
            const localProduct = allProducts.find(p => p.barcode === normalizedBarcode);
            
            if (localProduct) {
                // Product found locally
                handleSelectProduct(localProduct);
                toast.success(`Product Found: ${localProduct.name}`);
                handleBarcodeScannerClose(); // Close scanner after successful scan
                return;
            }

            // If not found locally, search via API
            const token = await getToken();
            const { data } = await axios.get(`/api/product/search?query=${normalizedBarcode}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.product) {
                // Product found via API
                handleSelectProduct(data.product);
                toast.success(`Product Found: ${data.product.name}`);
                handleBarcodeScannerClose(); // Close scanner after successful scan
            } else {
                // Product not found
                setSelectedProduct(null);
                setNotFoundQuery(normalizedBarcode);
                if (isMobile || isTablet) {
                    setShowProductList(false);
                }
                toast.error(data?.message || 'Product not found in your inventory.');
                handleBarcodeScannerClose(); // Close scanner even if not found
            }
        } catch (error) {
            console.error('Barcode lookup error:', error);
            setSelectedProduct(null);
            setNotFoundQuery(decodedText.trim());
            if (isMobile || isTablet) {
                setShowProductList(false);
            }
            const errorMessage = error.response?.data?.message || `Product not found for barcode: ${decodedText.trim()}`;
            toast.error(errorMessage);
            handleBarcodeScannerClose(); // Close scanner on error
        } finally {
            setIsScanning(false);
        }
    };

    // Function to close the scanner modal
    const handleBarcodeScannerClose = () => {
        setShowScanner(false);
        setIsScanning(false);
        // Increment the key to force remount the scanner component for a fresh state
        setScannerKey(prev => prev + 1);
    };

    // Function to open the scanner modal
    const handleOpenScanner = () => {
        // Check for secure connection and camera support
        if (!window.location.protocol.startsWith('https') && !window.location.hostname.includes('localhost')) {
            toast.error('Camera access requires a secure connection (HTTPS).');
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Camera access is not supported on this device.');
            return;
        }
        setShowScanner(true);
    };

    const handleAddNewProduct = () => {
        router.push('/seller/');
    };

    // Product List Item Component
    const ProductListItem = ({ product }) => (
        <button
            onClick={() => handleSelectProduct(product)}
            className={`
                w-full text-left p-3 sm:p-4 flex items-center gap-3 rounded-lg transition-all duration-200
                ${selectedProduct?._id === product._id 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }
            `}
        >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <Image 
                    src={product.image[0]} 
                    alt={product.name} 
                    fill
                    sizes="(max-width: 640px) 40px, 48px"
                    className="rounded-lg object-cover" 
                    quality={90}
                />
            </div>
            <div className="flex-grow overflow-hidden min-w-0">
                <p className="font-medium text-gray-800 truncate text-sm sm:text-base" title={product.name}>
                    {trimProductName(product.name)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Stock: {product.stock}</p>
                {product.barcode && (
                    <p className="text-xs text-gray-400 font-mono truncate">{product.barcode}</p>
                )}
            </div>
            <FiChevronRight className="text-gray-400 flex-shrink-0" size={isMobile ? 14 : 16} />
        </button>
    );

    // Product Grid Item Component
    const ProductGridItem = ({ product }) => (
        <button
            onClick={() => handleSelectProduct(product)}
            className={`
                p-3 sm:p-4 rounded-lg transition-all duration-200 text-left
                ${selectedProduct?._id === product._id 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }
            `}
        >
            <div className="relative w-full h-32 sm:h-40 mb-2">
                <Image 
                    src={product.image[0]} 
                    alt={product.name} 
                    fill
                    sizes="(max-width: 640px) 150px, 200px"
                    className="rounded-lg object-cover" 
                    quality={90}
                />
            </div>
            <p className="font-medium text-gray-800 truncate text-sm" title={product.name}>
                {trimProductName(product.name, isMobile ? 15 : 20)}
            </p>
            <p className="text-xs text-gray-500">Stock: {product.stock}</p>
        </button>
    );

    // Bottom Barcode Scanner Overlay Component
    const BottomBarcodeButton = () => (
        <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4 safe-area-pb z-40">
            <div className="max-w-md mx-auto">
                <button
                    onClick={handleOpenScanner}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                    <CiBarcode size={24} />
                    <span>Scan Barcode</span>
                </button>
            </div>
        </div>
    );

    // Product List Panel Component
    const ProductListPanel = () => (
        <div className="flex flex-col h-full bg-white">
            <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Products</h2>
                    <div className="flex items-center gap-2">
                        {/* View mode toggle - hidden on mobile */}
                        <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <FiList size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <FiGrid size={16} />
                            </button>
                        </div>
                        
                        <button
                            onClick={handleAddNewProduct}
                            className="bg-blue-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                        >
                            <FiPlusCircle size={16} />
                            <span className="hidden xs:inline">Add</span>
                        </button>
                    </div>
                </div>
                
                {/* Search bar */}
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search by name or barcode..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                    />
                </div>
            </div>
            
            {/* Products container with bottom padding for barcode button */}
            <div className={`flex-1 overflow-y-auto p-3 sm:p-4 ${isMobile || isTablet ? 'pb-20' : ''}`}>
                {isLoadingList ? (
                    <div className="flex items-center justify-center py-12">
                        <FiLoader className="animate-spin h-8 w-8 text-blue-500" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-sm sm:text-base">
                            {searchQuery ? 'No products found matching your search.' : 'No products found.'}
                        </p>
                    </div>
                ) : (
                    <div className={`
                        ${viewMode === 'grid' 
                            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' 
                            : 'space-y-2'
                        }
                    `}>
                        {filteredProducts.map((product) => (
                            viewMode === 'grid' ? (
                                <ProductGridItem key={product._id} product={product} />
                            ) : (
                                <ProductListItem key={product._id} product={product} />
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Product Details Panel Component
    const ProductDetailsPanel = () => (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        {(isMobile || isTablet) && (
                            <button
                                onClick={handleBackToList}
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

            {/* Content with bottom padding for barcode button */}
            <div className={`flex-1 overflow-y-auto p-3 sm:p-4 ${isMobile || isTablet ? 'pb-20' : ''}`}>
                {selectedProduct ? (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Product Info */}
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                <div className="relative w-20 h-20 sm:w-40 sm:h-40 flex-shrink-0">
                                    <Image
                                        src={selectedProduct.image[0]}
                                        alt={selectedProduct.name}
                                        fill
                                        sizes="(max-width: 640px) 64px, 80px"
                                        className="rounded-lg object-cover"
                                        quality={90}
                                    />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base leading-tight" title={selectedProduct.name}>
                                        {trimProductName(selectedProduct.name, isMobile ? 25 : 35)}
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
                        <form onSubmit={handleUpdateStock} className="space-y-4">
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

                        {/* Desktop Barcode Scanner Button */}
                        {!isMobile && !isTablet && (
                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleOpenScanner}
                                    className="w-full bg-gray-100 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-base"
                                >
                                    <CiBarcode size={20} />
                                    Scan Barcode
                                </button>
                            </div>
                        )}
                    </div>
                ) : notFoundQuery ? (
                    <div className="text-center py-12">
                        <FiXCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Product Not Found</h3>
                        <p className="text-gray-500 mb-4 text-sm px-4">
                            No product found with barcode: <span className="font-mono break-all">{notFoundQuery}</span>
                        </p>
                        <button
                            onClick={handleAddNewProduct}
                            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                            <FiPlusCircle size={16} />
                            Add New Product
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Product</h3>
                        <p className="text-gray-500 mb-6 text-sm px-4">
                            Choose a product from the list to update its stock.
                        </p>
                        {/* Desktop scan button in empty state */}
                        {!isMobile && !isTablet && (
                            <button
                                onClick={handleOpenScanner}
                                className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <CiBarcode size={16} />
                                Scan Barcode
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile View */}
            {isMobile && (
                <div className="h-screen flex flex-col">
                    {showProductList ? (
                        <ProductListPanel />
                    ) : (
                        <ProductDetailsPanel />
                    )}
                    <BottomBarcodeButton />
                </div>
            )}

            {/* Tablet View */}
            {isTablet && (
                <div className="h-screen flex flex-col">
                    {showProductList ? (
                        <ProductListPanel />
                    ) : (
                        <ProductDetailsPanel />
                    )}
                    <BottomBarcodeButton />
                </div>
            )}

            {/* Desktop View */}
            {!isMobile && !isTablet && (
                <div className="h-screen flex">
                    {/* Product List - Left Panel */}
                    <div className="w-1/2 border-r border-gray-200">
                        <ProductListPanel />
                    </div>

                    {/* Product Details - Right Panel */}
                    <div className="w-1/2">
                        <ProductDetailsPanel />
                    </div>
                </div>
            )}

            {/* Enhanced Barcode Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        <BarcodeScanner
                            key={scannerKey}
                            onBarcodeDetected={handleBarcodeDetected}
                            onClose={handleBarcodeScannerClose}
                            autoCloseOnScan={false}
                        />
                    </div>
                </div>
            )}

            {/* Loading overlay for scanning */}
            {isScanning && (
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

// Loading component for Suspense fallback
const LoadingPage = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <FiLoader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
        </div>
    </div>
);

// Main component with Suspense wrapper
const NewArrivalsPage = () => {
    return (
        <Suspense fallback={<LoadingPage />}>
            <NewArrivalsContent />
        </Suspense>
    );
};

export default NewArrivalsPage;