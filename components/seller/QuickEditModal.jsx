import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, X, AlertCircle, EyeIcon } from 'lucide-react';

const QuickEditModal = ({ product, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    _id: product._id,
    name: product.name,
    price: product.price,
    offerPrice: product.offerPrice,
    category: product.category,
    isAvailable: product.isAvailable
  });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Categories for the dropdown
  const categories = [
    { value: 'PowderedMilk', label: 'Formula & Powdered Milk' },
    { value: 'LiquidMilk', label: 'Ready-to-Feed Milk' },
    { value: 'Bottles', label: 'Bottles & Sippy Cups' },
    { value: 'Tumblers', label: 'Toddler Tumblers & Cups' },
    { value: 'FeedingTools', label: 'Feeding Sets & Utensils' },
    { value: 'Accessories', label: 'Baby Essentials & Accessories' },
    { value: 'Vitamins', label: 'Nutrition & Supplements' },
    { value: 'Diapers', label: 'Diapers & Wipes' },
    { value: 'NurseryItems', label: 'Nursery & Sleep Essentials' }
  ];

  // Calculate discount percentage
  const discountPercentage = formData.price > 0 && formData.offerPrice < formData.price
    ? Math.round(((formData.price - formData.offerPrice) / formData.price) * 100)
    : 0;

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });

    setIsDirty(true);
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validateForm(formData);
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form data
    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      offerPrice: parseFloat(formData.offerPrice)
    });
  };

  // Form validation
  const validateForm = (data) => {
    const newErrors = {};
    
    if (!data.name || data.name.trim() === '') {
      newErrors.name = 'Product name is required';
    }
    
    if (!data.price || isNaN(data.price) || parseFloat(data.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (data.offerPrice === '' || isNaN(data.offerPrice) || parseFloat(data.offerPrice) < 0) {
      newErrors.offerPrice = 'Valid offer price is required';
    }
    
    if (parseFloat(data.offerPrice) > parseFloat(data.price)) {
      newErrors.offerPrice = 'Offer price cannot be greater than regular price';
    }
    
    return newErrors;
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleCancel();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isDirty]);

  // Handle cancel with unsaved changes
  const handleCancel = () => {
    if (isDirty) {
      const modal = document.getElementById('confirmCloseModal');
      if (modal) {
        modal.classList.remove('hidden');
      }
    } else {
      onClose();
    }
  };

  // Handle confirm close
  const handleConfirmClose = () => {
    const modal = document.getElementById('confirmCloseModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    onClose();
  };

  // Handle cancel close
  const handleCancelClose = () => {
    const modal = document.getElementById('confirmCloseModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
        
        {/* Modal content */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto z-10">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium">Quick Edit Product</h3>
            <div className="flex items-center space-x-2">
              {showPreview ? (
                <button 
                  type="button" 
                  onClick={() => setShowPreview(false)} 
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <span>Edit Mode</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setShowPreview(true)} 
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  <span>Preview</span>
                </button>
              )}
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {showPreview ? (
            <div className="p-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Preview mode. This is how the product will appear after saving changes.
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-gray-100 rounded p-2 flex-shrink-0">
                  <Image
                    src={product.image[0]}
                    alt="Product Image"
                    className="w-16 h-16 object-cover rounded"
                    width={64}
                    height={64}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{formData.name}</h3>
                  <div className="flex items-center mt-1">
                    <p className="font-medium text-green-600">${parseFloat(formData.offerPrice).toFixed(2)}</p>
                    {formData.offerPrice < formData.price && (
                      <>
                        <p className="text-gray-500 line-through ml-2 text-sm">${parseFloat(formData.price).toFixed(2)}</p>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded ml-2">
                          {discountPercentage}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{categories.find(c => c.value === formData.category)?.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ml-2 ${formData.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {formData.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back to Editing
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-gray-100 rounded p-2 flex-shrink-0">
                  <Image
                    src={product.image[0]}
                    alt="Product Image"
                    className="w-16 h-16 object-cover rounded"
                    width={64}
                    height={64}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" htmlFor="product-name">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="product-name"
                      name="name"
                      type="text"
                      className={`outline-none py-2 px-3 rounded border ${
                        errors.name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      }`}
                      onChange={handleInputChange}
                      value={formData.name}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="outline-none py-2 px-3 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    onChange={handleInputChange}
                    value={formData.category}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" htmlFor="isAvailable">
                    Availability
                  </label>
                  <div className="flex items-center h-10">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm">Available in stock</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" htmlFor="price">
                    Regular Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    className={`outline-none py-2 px-3 rounded border ${
                      errors.price ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                    onChange={handleInputChange}
                    value={formData.price}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.price}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" htmlFor="offerPrice">
                    Offer Price ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="offerPrice"
                      name="offerPrice"
                      type="number"
                      step="0.01"
                      className={`outline-none py-2 px-3 rounded border w-full ${
                        errors.offerPrice ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      }`}
                      onChange={handleInputChange}
                      value={formData.offerPrice}
                    />
                    {discountPercentage > 0 && (
                      <span className="absolute right-2 top-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                        {discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  {errors.offerPrice && (
                    <p className="text-red-500 text-xs flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.offerPrice}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {/* Confirmation Modal */}
          <div id="confirmCloseModal" className="fixed inset-0 z-50 overflow-y-auto hidden">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
              <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-auto z-10 p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Discard changes?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    You have unsaved changes. Are you sure you want to discard them?
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelClose}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Continue Editing
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClose}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEditModal;