// "use client";
// import { useEffect, useState } from "react";
// import { assets } from "@/assets/assets";
// import ProductCard from "@/components/ProductCard";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import Image from "next/image";
// import { useParams } from "next/navigation";
// import Loading from "@/components/Loading";
// import { useAppContext } from "@/context/AppContext";
// import React from "react";
// import { useClerk } from "@clerk/nextjs";
// import toast from "react-hot-toast";
// import { FaChevronDown, FaChevronUp } from "react-icons/fa";
// import { IoMdCheckmarkCircleOutline } from "react-icons/io";
// import { MdOutlineError } from "react-icons/md";

// const Product = () => {
//     const { id } = useParams();
//     const { products, router, addToCart, user } = useAppContext();

//     const [mainImage, setMainImage] = useState(null);
//     const [productData, setProductData] = useState(null);
//     const [showDirections, setShowDirections] = useState(false);
//     const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);

//     const { openSignIn } = useClerk();

//     const fetchProductData = async () => {
//         const product = products.find(product => product._id === id);
//         setProductData(product);
//         if (product?.image?.length > 0) {
//             setMainImage(product.image[0]);
//         }
//     };

//     useEffect(() => {
//         fetchProductData();
//     }, [id, products.length]);

//     const handleThumbnailClick = (image, index) => {
//         setMainImage(image);
//         setSelectedThumbnailIndex(index);
//     };

//     const handleAddToCart = () => {
//         if (!productData.isAvailable) {
//             toast.error("Sorry, this product is currently unavailable");
//             return;
//         }
//         addToCart(productData._id);
//         toast.success("Added to cart");
//     };

//     const handleBuyNow = () => {
//         if (!user) {
//             toast.error("Please login to continue purchasing");
//             openSignIn();
//             return;
//         }
//         if (!productData.isAvailable) {
//             toast.error("Sorry, this product is currently unavailable");
//             return;
//         }
//         addToCart(productData._id);
//         router.push('/cart');
//     };

//     const calculateDiscount = () => {
//         if (!productData) return 0;
//         const discount = ((productData.price - productData.offerPrice) / productData.price) * 100;
//         return Math.round(discount);
//     };

//     // Format the description text to preserve indentation
//     const formatDescription = (text) => {
//         if (!text) return "";

//         // Split by line breaks
//         const paragraphs = text.split('\n');

//         return paragraphs.map((paragraph, index) => (
//             <React.Fragment key={index}>
//                 {paragraph.trim() === "" ? (
//                     <br />
//                 ) : (
//                     <p className="mb-2 whitespace-pre-wrap">{paragraph}</p>
//                 )}
//             </React.Fragment>
//         ));
//     };

//     return productData ? (
//         <>
//             <Navbar />
//             <div className="px-4 sm:px-6 md:px-16 lg:px-32 pt-10 space-y-6">
//                 {!productData.isAvailable && (
//                     <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2 mb-4">
//                         <MdOutlineError className="text-xl" />
//                         <span>This product is currently unavailable</span>
//                     </div>
//                 )}

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
//                     <div className="px-4 sm:px-6 lg:px-16 xl:px-20">
//                         <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4 relative">
//                             <Image
//                                 src={mainImage || productData.image[0]}
//                                 alt={productData.name}
//                                 className={`w-full h-auto object-cover mix-blend-multiply transition-opacity duration-300 ${!productData.isAvailable ? 'opacity-60' : 'opacity-100'}`}
//                                 width={1280}
//                                 height={720}
//                             />

//                             {calculateDiscount() > 0 && (
//                                 <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
//                                     {calculateDiscount()}% OFF
//                                 </div>
//                             )}

//                             {!productData.isAvailable && (
//                                 <div className="absolute inset-0 flex items-center justify-center">
//                                     <span className="bg-black/70 text-white px-6 py-3 font-medium rounded-md transform rotate-[-20deg] text-lg">
//                                         OUT OF STOCK
//                                     </span>
//                                 </div>
//                             )}
//                         </div>

//                         <div className="grid grid-cols-4 gap-3">
//                             {productData.image.map((image, index) => (
//                                 <div
//                                     key={index}
//                                     onClick={() => handleThumbnailClick(image, index)}
//                                     className={`cursor-pointer rounded-lg overflow-hidden bg-gray-500/10 border-2 transition ${
//                                         (mainImage === image || (!mainImage && index === 0))
//                                             ? 'border-green-500'
//                                             : 'border-transparent'
//                                     }`}
//                                 >
//                                     <Image
//                                         src={image}
//                                         alt={`${productData.name} - view ${index + 1}`}
//                                         className="w-full h-auto object-cover mix-blend-multiply"
//                                         width={1280}
//                                         height={720}
//                                     />
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="flex flex-col">
//                         <h1 className="text-lg md:text-3xl font-medium text-gray-800/90 mb-2">
//                             {productData.name}
//                         </h1>

//                         <div className="flex items-center gap-1 text-sm">
//                             <div className="flex items-center gap-0.5">
//                                 <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
//                                 <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
//                                 <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
//                                 <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
//                                 <Image className="h-4 w-4" src={assets.star_dull_icon} alt="star_dull_icon" />
//                             </div>
//                             <p>(4.5)</p>
//                         </div>

//                         <div className="mt-2 flex items-center text-green-600 text-sm">
//                             {productData.isAvailable ? (
//                                 <><IoMdCheckmarkCircleOutline className="mr-1" /> <span>In Stock</span></>
//                             ) : (
//                                 <span className="text-red-500">Out of Stock</span>
//                             )}
//                         </div>

//                         <div className="mt-4 bg-gray-50 p-3 rounded-md">
//                             <p className="text-2xl sm:text-3xl font-medium text-gray-800">
//                                 ${productData.offerPrice}
//                                 {productData.price > productData.offerPrice && (
//                                     <span className="text-base font-normal text-red-400 line-through ml-2">
//                                         ${productData.price}
//                                     </span>
//                                 )}
//                             </p>
//                             {calculateDiscount() > 0 && (
//                                 <p className="text-green-600 text-sm mt-1">
//                                     You save: ${(productData.price - productData.offerPrice).toFixed(2)} ({calculateDiscount()}%)
//                                 </p>
//                             )}
//                         </div>

//                         <p className="mt-2 text-gray-500 text-sm">
//                             Category: <span className="text-gray-700">{productData.category}</span>
//                         </p>

//                         <div className="flex flex-col sm:flex-row items-center mt-6 gap-3">
//                             <button
//                                 onClick={handleAddToCart}
//                                 disabled={!productData.isAvailable}
//                                 className={`w-full py-3 text-sm sm:text-base rounded-md text-gray-800/80 transition ${
//                                     productData.isAvailable
//                                         ? 'bg-gray-100 hover:bg-gray-200'
//                                         : 'bg-gray-100 opacity-60 cursor-not-allowed'
//                                 }`}
//                             >
//                                 Add to Cart
//                             </button>
//                             <button
//                                 onClick={handleBuyNow}
//                                 disabled={!productData.isAvailable}
//                                 className={`w-full py-3 text-sm sm:text-base rounded-md text-white transition duration-300 ${
//                                     productData.isAvailable
//                                         ? 'bg-sky-500 hover:bg-green-500'
//                                         : 'bg-gray-500 cursor-not-allowed'
//                                 }`}
//                             >
//                                 Buy now
//                             </button>
//                         </div>

//                         <hr className="bg-gray-200 my-5" />

//                         <div className="border border-gray-200 rounded-md overflow-hidden">
//                             <button
//                                 onClick={() => setShowDirections(!showDirections)}
//                                 className="flex items-center justify-between w-full text-left text-gray-800 py-3 px-4 bg-gray-50 hover:bg-gray-100 transition"
//                             >
//                                 <span className="font-medium">Product Details</span>
//                                 {showDirections ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
//                             </button>
//                             {showDirections && (
//                                 <div className="p-4 text-gray-700 bg-white">
//                                     <div className="prose prose-sm max-w-none">
//                                         {formatDescription(productData.description)}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 <div className="flex flex-col items-center">
//                     <div className="flex flex-col items-center mb-4">
//                         <p className="text-2xl sm:text-3xl font-medium text-center">Featured <span className="text-black">Products</span></p>
//                         <div className="w-20 h-0.5 bg-black mt-1 mb-4"></div>
//                     </div>
//                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-2 pb-14 w-full">
//                         {products
//                             .filter(product => product._id !== id && product.isAvailable)
//                             .slice(0, 5)
//                             .map((product, index) => (
//                                 <ProductCard key={index} product={product} />
//                             ))}
//                     </div>
//                     <button
//                         onClick={() => router.push('/shop')}
//                         className="px-10 py-2 mb-14 text-sm border rounded text-gray-500/70 hover:bg-slate-50/90 transition"
//                     >
//                         See more
//                     </button>
//                 </div>
//             </div>
//             <Footer />
//         </>
//     ) : <Loading />;
// };

// export default Product;

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