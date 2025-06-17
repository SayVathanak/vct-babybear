// app/product/[id]/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useAppContext } from "@/context/AppContext";

// Components
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import ProductGallery from "@/components/ProductGallery";
import ProductDetail from "@/components/ProductDetails";
import RelatedProducts from "@/components/RelatedProducts";

const Product = () => {
    const { id } = useParams();
    const { products, router, addToCart, user, cartItems } = useAppContext();
    const [productData, setProductData] = useState(null);
    const { openSignIn } = useClerk();

    const fetchProductData = async () => {
        const product = products.find(product => product._id === id);
        setProductData(product);
    };

    useEffect(() => {
        if (products.length > 0) {
            fetchProductData();
        }
    }, [id, products.length]);

    const handleProductClick = (productId) => {
        router.push(`/product/${productId}`);
    };

    if (!productData) {
        return <Loading />;
    }

    const calculateDiscount = () => {
        const discount = ((productData.price - productData.offerPrice) / productData.price) * 100;
        return Math.round(discount);
    };

    return (
        <>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Product Unavailable Notice */}
                {!productData.isAvailable && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>This product is currently unavailable</span>
                    </div>
                )}

                {/* Main Product Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <ProductGallery
                        images={productData.image}
                        productName={productData.name}
                        discount={calculateDiscount()}
                        isAvailable={productData.isAvailable}
                    />

                    <div className="space-y-8">
                        <ProductDetail
                            product={productData}
                            addToCart={addToCart}
                            user={user}
                            openSignIn={openSignIn}
                            cartItems={cartItems}
                        />
                    </div>
                </div>

                {/* Related Products Section */}
                <RelatedProducts
                    currentProduct={productData}
                    allProducts={products}
                    maxProducts={8}
                />
            </div>
            <Footer />
        </>
    );
};

export default Product;