// ProductGallery.jsx
import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const ProductGallery = ({ images, productName, discount = 0, isAvailable = true }) => {
    const [mainImage, setMainImage] = useState(images?.[0] || '');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleThumbnailClick = (image, index) => {
        setMainImage(image);
        setSelectedIndex(index);
    };

    return (
        <div className="space-y-3">
            {/* Main image container with improved responsive sizing */}
            <div className="relative rounded-lg overflow-hidden bg-white">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mainImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                        style={{
                            height: '400px',
                            maxHeight: 'min(400px, 50vh)'
                        }}
                    >
                        <Image
                            src={mainImage}
                            alt={productName}
                            className={`object-contain mix-blend-multiply ${!isAvailable ? 'opacity-60' : ''}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>

                {discount > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                        {discount}% OFF
                    </div>
                )}

                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/70 text-white px-6 py-3 font-medium rounded transform rotate-[-10deg] text-lg shadow-lg">
                            OUT OF STOCK
                        </span>
                    </div>
                )}
            </div>

            {/* Thumbnails with improved responsive behavior */}
            {images && images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => handleThumbnailClick(image, index)}
                            className={`rounded overflow-hidden border-2 transition ${selectedIndex === index
                                    ? 'border-blue-500 shadow-md'
                                    : 'border-transparent'
                                }`}
                            aria-label={`View product image ${index + 1}`}
                        >
                            <div className="relative h-16 sm:h-20 md:h-24">
                                <Image
                                    src={image}
                                    alt={`${productName} - view ${index + 1}`}
                                    className="object-cover mix-blend-multiply"
                                    fill
                                    sizes="(max-width: 640px) 20vw, (max-width: 768px) 15vw, 10vw"
                                />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductGallery;