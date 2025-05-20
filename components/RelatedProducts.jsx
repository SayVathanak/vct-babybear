// components/RelatedProducts.jsx
"use client";
import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

const RelatedProducts = ({ 
    currentProduct, 
    allProducts,
    maxProducts = 8 
}) => {
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentProduct && allProducts.length > 0) {
            findRelatedProducts();
        }
    }, [currentProduct, allProducts]);

    // Function to calculate text similarity using Jaccard similarity
    const calculateNameSimilarity = (name1, name2) => {
        // Normalize text: lowercase, remove special chars, split into words
        const normalize = (text) => text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2); // Filter out small words

        const words1 = new Set(normalize(name1));
        const words2 = new Set(normalize(name2));

        // Jaccard similarity: intersection / union
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        if (union.size === 0) return 0;
        return intersection.size / union.size;
    };

    // Function to calculate overall product similarity score
    const calculateSimilarityScore = (product) => {
        let score = 0;
        const weights = {
            category: 0.6,      // 60% weight for category
            nameSimilarity: 0.4 // 40% weight for name similarity
        };

        // Category similarity (binary: same category = 1, different = 0)
        if (product.category === currentProduct.category) {
            score += weights.category;
        }

        // Name similarity (0 to 1 based on text similarity)
        const nameSimilarity = calculateNameSimilarity(
            currentProduct.name || currentProduct.title || '',
            product.name || product.title || ''
        );
        score += nameSimilarity * weights.nameSimilarity;

        return score;
    };

    const findRelatedProducts = () => {
        setLoading(true);
        
        // Filter available products (excluding current product)
        const availableProducts = allProducts.filter(product => 
            product._id !== currentProduct._id && 
            product.isAvailable
        );

        // Calculate similarity scores for all products
        const productsWithScores = availableProducts.map(product => ({
            ...product,
            similarityScore: calculateSimilarityScore(product)
        }));

        // Sort by similarity score (highest first)
        const sortedProducts = productsWithScores.sort((a, b) => 
            b.similarityScore - a.similarityScore
        );

        // Group products by similarity categories for better variety
        const highSimilarity = sortedProducts.filter(p => p.similarityScore >= 0.6);
        const mediumSimilarity = sortedProducts.filter(p => p.similarityScore >= 0.3 && p.similarityScore < 0.6);
        const lowSimilarity = sortedProducts.filter(p => p.similarityScore < 0.3);

        // Create a balanced selection
        const selectedProducts = [];
        
        // Add high similarity products (prioritize these)
        const highCount = Math.min(highSimilarity.length, Math.ceil(maxProducts * 0.6));
        selectedProducts.push(...highSimilarity.slice(0, highCount));
        
        // Add medium similarity products
        const remainingSlots = maxProducts - selectedProducts.length;
        const mediumCount = Math.min(mediumSimilarity.length, Math.ceil(remainingSlots * 0.7));
        selectedProducts.push(...mediumSimilarity.slice(0, mediumCount));
        
        // Fill remaining slots with low similarity products
        const finalRemainingSlots = maxProducts - selectedProducts.length;
        selectedProducts.push(...lowSimilarity.slice(0, finalRemainingSlots));

        // Sort by similarity score first, then alphabetically by name
        const finalProducts = selectedProducts
            .sort((a, b) => {
                // First sort by similarity score (highest first)
                if (a.similarityScore !== b.similarityScore) {
                    return b.similarityScore - a.similarityScore;
                }
                // If similarity scores are equal, sort alphabetically by name
                const nameA = (a.name || a.title || '').toLowerCase();
                const nameB = (b.name || b.title || '').toLowerCase();
                return nameA.localeCompare(nameB);
            })
            .slice(0, maxProducts);
        
        setRelatedProducts(finalProducts);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="mt-16 mb-12">
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-center text-gray-800">
                        You might also like
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="bg-gray-200 rounded-lg aspect-square mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <div className="mt-16 mb-12">
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                        Related Products
                    </h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {relatedProducts.map((product, index) => (
                        <ProductCard
                            key={product._id}
                            product={product}
                            priority={index < 4} // Load first 4 images with priority
                            showQuickActions={true}
                        />
                    ))}
                </div>

                {relatedProducts.length >= maxProducts && (
                    <div className="text-center mt-6">
                        <button 
                            onClick={() => window.location.href = `/category/${currentProduct.category}`}
                            className="inline-flex items-center px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                        >
                            View more in {currentProduct.category}
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelatedProducts;