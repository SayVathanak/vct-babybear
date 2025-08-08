import React from 'react';
import { CATEGORIES } from '@/utils/constants';
import { Box, Check, X, AlertCircle } from 'lucide-react';

const ProductFormFields = ({ formData, errors, onInputChange, discountPercentage }) => (
    <div>
        {/* Name Input */}
        <div className="mb-4">
            <label className="text-sm font-medium" htmlFor="name">Product Name <span className="text-red-500">*</span></label>
            <input id="name" name="name" type="text" className={`w-full mt-1 outline-none py-2 px-3 rounded border ${errors.name ? 'border-red-500' : 'border-gray-300'}`} onChange={onInputChange} value={formData.name} />
            {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1" />{errors.name}</p>}
        </div>

        {/* Category & Price Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                 <label className="text-sm font-medium" htmlFor="price">Regular Price ($) <span className="text-red-500">*</span></label>
                 <input id="price" name="price" type="number" step="0.01" className={`w-full mt-1 outline-none py-2 px-3 rounded border ${errors.price ? 'border-red-500' : 'border-gray-300'}`} onChange={onInputChange} value={formData.price} />
                 {errors.price && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1" />{errors.price}</p>}
            </div>
            <div className="relative">
                <label className="text-sm font-medium" htmlFor="offerPrice">Offer Price ($)</label>
                <input id="offerPrice" name="offerPrice" type="number" step="0.01" className={`w-full mt-1 outline-none py-2 px-3 rounded border ${errors.offerPrice ? 'border-red-500' : 'border-gray-300'}`} onChange={onInputChange} value={formData.offerPrice} />
                {discountPercentage > 0 && <span className="absolute right-2 top-8 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">{discountPercentage}% OFF</span>}
                {errors.offerPrice && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1" />{errors.offerPrice}</p>}
            </div>
        </div>

        {/* Stock and Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
             <div>
                <label className="text-sm font-medium flex items-center" htmlFor="stock"><Box className="h-4 w-4 mr-1" /> Stock Quantity <span className="text-red-500 ml-1">*</span></label>
                <input id="stock" name="stock" type="number" min="0" className={`w-full mt-1 outline-none py-2 px-3 rounded border ${errors.stock ? 'border-red-500' : 'border-gray-300'}`} onChange={onInputChange} value={formData.stock} />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>
             <div className="flex flex-col justify-center">
                 <label className="text-sm font-medium">Status</label>
                 <div className={`mt-2 flex items-center px-3 py-2 rounded-md text-sm font-medium ${formData.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                     {formData.isAvailable ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                     {formData.isAvailable ? 'Available' : 'Out of Stock'}
                 </div>
            </div>
        </div>
        
         {/* Category */}
        <div className="mb-4">
            <label className="text-sm font-medium" htmlFor="category">Category <span className="text-red-500">*</span></label>
            <select id="category" name="category" className="w-full mt-1 outline-none py-2 px-3 rounded border border-gray-300" onChange={onInputChange} value={formData.category}>
                {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
        </div>

        {/* Description */}
        <div>
            <label className="text-sm font-medium" htmlFor="description">Description <span className="text-red-500">*</span></label>
            <textarea id="description" name="description" rows={6} className={`w-full mt-1 outline-none py-2 px-3 rounded border ${errors.description ? 'border-red-500' : 'border-gray-300'}`} onChange={onInputChange} value={formData.description} placeholder="Enter detailed product description..."></textarea>
            {errors.description && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1" />{errors.description}</p>}
        </div>
    </div>
);

export default ProductFormFields;