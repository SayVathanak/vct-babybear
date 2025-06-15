// components/ProductGrid.jsx
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, isLoading = false, title = "Products" }) => {
    // State to track viewport for better responsiveness
    const [skeletonCount, setSkeletonCount] = useState(10);
    
    // Adjust skeleton count based on viewport size
    useEffect(() => {
        // Handle responsive skeleton count
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) { // Mobile - always 2 columns, show 6 items
                setSkeletonCount(6);
            } else if (width < 1024) { // Tablet - 3 columns
                setSkeletonCount(9);
            } else if (width < 1280) { // Small desktop - 4 columns
                setSkeletonCount(12);
            } else { // Large desktop - 5 columns
                setSkeletonCount(15);
            }
        };
        
        // Set initial value
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="animate-pulse h-7 bg-gray-200 rounded w-1/4"></div>
                    <div className="animate-pulse h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[...Array(skeletonCount)].map((_, index) => (
                        <div key={index} className="animate-pulse flex flex-col rounded-lg overflow-hidden border border-gray-100">
                            {/* Image placeholder with proper aspect ratio */}
                            <div className="relative bg-gray-200 w-full pb-[100%]"></div>
                            
                            <div className="p-2 sm:p-3 space-y-2">
                                {/* Title placeholder */}
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                
                                {/* Price placeholder */}
                                <div className="h-5 bg-gray-300 rounded w-1/3"></div>
                                
                                {/* Rating placeholder */}
                                <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-3 w-3 bg-gray-200 rounded-full"></div>
                                    ))}
                                    <div className="h-3 bg-gray-200 rounded w-8 ml-1"></div>
                                </div>
                                
                                {/* Button placeholder */}
                                <div className="h-8 bg-gray-200 rounded w-full mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-gray-300 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                </svg>
                <h3 className="text-2xl font-medium text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500">Try changing your search or filter criteria</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-medium text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {products.map((product, index) => (
                    <ProductCard key={product._id} product={product} index={index} />
                ))}
            </div>
        </div>
    );
};

export default ProductGrid;