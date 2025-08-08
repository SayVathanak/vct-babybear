import React from 'react';
import Image from 'next/image';
import { CATEGORIES } from '@/utils/constants';
import { Hash, AlertCircle } from 'lucide-react';

const ProductPreview = ({ formData, imagePreviews, discountPercentage }) => {
    return (
        <div className="p-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                    This is a preview. Your changes will be applied once you save.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Images & Barcode */}
                <div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Product Images</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {imagePreviews.map((img, index) => (
                                <div key={index} className="aspect-square relative rounded overflow-hidden border">
                                    <Image src={img.url} alt={`Preview ${index + 1}`} className="object-cover" fill />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Product Details */}
                <div>
                    <h3 className="font-bold text-2xl mb-2">{formData.name}</h3>
                    <div className="flex items-baseline mb-3">
                        <p className="font-semibold text-green-600 text-xl">${parseFloat(formData.offerPrice).toFixed(2)}</p>
                        {discountPercentage > 0 && (
                            <>
                                <p className="text-gray-500 line-through ml-2 text-sm">${parseFloat(formData.price).toFixed(2)}</p>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded ml-2">{discountPercentage}% OFF</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mb-4">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{CATEGORIES.find(c => c.value === formData.category)?.label}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${formData.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {formData.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                        {formData.barcode && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center">
                                <Hash className="h-3 w-3 mr-1" />{formData.barcode}
                            </span>
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-800 whitespace-pre-line">
                            {formData.description}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPreview;