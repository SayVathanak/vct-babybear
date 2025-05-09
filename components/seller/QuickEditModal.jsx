import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Check, X, AlertCircle, EyeIcon, Upload, Trash2 } from 'lucide-react';

const QuickEditModal = ({ product, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    _id: product._id,
    name: product.name,
    price: product.price,
    offerPrice: product.offerPrice,
    category: product.category,
    isAvailable: product.isAvailable,
    description: product.description, // Add description
    image: product.image // Add image array
  });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newImages, setNewImages] = useState([]); // For storing new image files
  const [imagePreviews, setImagePreviews] = useState([]); // For storing image previews
  const fileInputRef = useRef(null);

  // Initialize image previews from existing product images
  useEffect(() => {
    if (product.image && product.image.length > 0) {
      setImagePreviews(product.image.map(img => ({
        url: img,
        isExisting: true
      })));
    }
  }, [product.image]);

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

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsDirty(true);

    // Create preview URLs
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      file: file,
      isExisting: false
    }));

    // Add new files to state
    setNewImages([...newImages, ...files]);

    // Add new previews to existing previews
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // Handle removing an image
  const handleRemoveImage = (index) => {
    setIsDirty(true);

    const newPreviews = [...imagePreviews];
    const removedPreview = newPreviews.splice(index, 1)[0];
    setImagePreviews(newPreviews);

    // If it's a new image (not an existing one), revoke the object URL
    if (!removedPreview.isExisting && removedPreview.url) {
      URL.revokeObjectURL(removedPreview.url);

      // Remove from newImages array if it's a newly added image
      if (removedPreview.file) {
        const newImagesUpdated = newImages.filter(img => img !== removedPreview.file);
        setNewImages(newImagesUpdated);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = validateForm(formData);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare final image array combining existing and new images
    const finalImageUrls = imagePreviews
      .filter(img => img.isExisting)
      .map(img => img.url);

    // Create FormData object for file uploads
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('_id', formData._id);
    formDataToSubmit.append('name', formData.name);
    formDataToSubmit.append('price', parseFloat(formData.price));
    formDataToSubmit.append('offerPrice', parseFloat(formData.offerPrice));
    formDataToSubmit.append('category', formData.category);
    formDataToSubmit.append('isAvailable', formData.isAvailable);
    formDataToSubmit.append('description', formData.description);

    // Add existing image URLs
    finalImageUrls.forEach(url => {
      formDataToSubmit.append('existingImages', url);
    });

    // Add new image files
    newImages.forEach(file => {
      formDataToSubmit.append('newImages', file);
    });

    // Submit form data
    onSubmit(formDataToSubmit);
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

    if (!data.description || data.description.trim() === '') {
      newErrors.description = 'Product description is required';
    }

    if (imagePreviews.length === 0) {
      newErrors.image = 'At least one product image is required';
    }

    return newErrors;
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleCancel();
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      // Cleanup any created object URLs
      imagePreviews.forEach(preview => {
        if (!preview.isExisting && preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [isDirty, imagePreviews]);

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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto z-10">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium">Edit Product Details</h3>
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
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Preview mode. This is how the product will appear after saving changes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  {/* Image gallery preview */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Product Images</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.map((img, index) => (
                        <div key={index} className="aspect-square relative rounded overflow-hidden border border-gray-200">
                          <Image
                            src={img.url}
                            alt={`Product image ${index + 1}`}
                            className="object-cover"
                            fill
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex flex-col">
                    <h3 className="font-medium text-lg">{formData.name}</h3>
                    <div className="flex items-center mt-2">
                      <p className="font-medium text-green-600 text-xl">${parseFloat(formData.offerPrice).toFixed(2)}</p>
                      {formData.offerPrice < formData.price && (
                        <>
                          <p className="text-gray-500 line-through ml-2 text-sm">${parseFloat(formData.price).toFixed(2)}</p>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded ml-2">
                            {discountPercentage}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{categories.find(c => c.value === formData.category)?.label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ml-2 ${formData.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {formData.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{formData.description}</p>
                      </div>
                    </div>
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
            <form onSubmit={handleSubmit} className="p-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Product Info */}
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-gray-100 rounded p-2 flex-shrink-0">
                      <Image
                        src={imagePreviews.length > 0 ? imagePreviews[0].url : '/placeholder-image.jpg'}
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
                          className={`outline-none py-2 px-3 rounded border ${errors.name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
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
                        className={`outline-none py-2 px-3 rounded border ${errors.price ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
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
                          className={`outline-none py-2 px-3 rounded border w-full ${errors.offerPrice ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
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

                  {/* Product Description */}
                  <div className="flex flex-col gap-1 mb-6">
                    <label className="text-sm font-medium" htmlFor="description">
                      Product Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={6}
                      className={`outline-none py-2 px-3 rounded border ${errors.description ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                      onChange={handleInputChange}
                      value={formData.description}
                      placeholder="Enter detailed product description..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Images Management */}
                <div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">
                        Product Images <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {imagePreviews.length} of 5 images
                      </span>
                    </div>

                    <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                      {/* Image gallery */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group aspect-square bg-white rounded-md border border-gray-200 overflow-hidden">
                            <Image
                              src={preview.url}
                              alt={`Product image ${index + 1}`}
                              className="object-cover"
                              fill
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 text-center">
                                Main Image
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add image button (only show if less than 5 images) */}
                        {imagePreviews.length < 5 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md bg-white text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                          >
                            <Upload className="h-6 w-6 mb-1" />
                            <span className="text-xs">Add Image</span>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              className="hidden"
                              accept="image/*"
                              multiple={imagePreviews.length < 4}
                            />
                          </button>
                        )}
                      </div>

                      {/* Image upload instructions */}
                      <div className="text-xs text-gray-500 flex items-start">
                        <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>Upload up to 5 images in JPG, PNG or WEBP format.</p>
                          <p>First image will be used as the main product image.</p>
                        </div>
                      </div>

                      {errors.image && (
                        <p className="text-red-500 text-xs flex items-center mt-2">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.image}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Image Management Tip */}
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Image Management Tips:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Drag to reorder images (first image is primary)</li>
                          <li>Use high-quality, well-lit images</li>
                          <li>Show product from multiple angles</li>
                          <li>Include size reference if relevant</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4 mt-6">
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