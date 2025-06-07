import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Check, X, AlertCircle, EyeIcon, Upload, Trash2, Package, Hash, RefreshCw, Copy, Download } from 'lucide-react';
import Barcode from 'react-barcode'; // Import the barcode library

const QuickEditModal = ({ product, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    _id: product._id,
    name: product.name,
    price: product.price,
    offerPrice: product.offerPrice,
    category: product.category,
    isAvailable: product.isAvailable,
    description: product.description,
    barcode: product.barcode || '',
    image: product.image
  });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showBarcodePreview, setShowBarcodePreview] = useState(false);
  const [barcodeCopied, setBarcodeCopied] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const fileInputRef = useRef(null);
  const barcodeRef = useRef(null);

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

  // Function to calculate EAN-13 check digit
  const calculateEAN13CheckDigit = (barcode) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    return ((10 - (sum % 10)) % 10).toString();
  };

  // Function to validate barcode format
  const validateBarcode = (code) => {
    if (!code) return true; // Empty is valid (optional field)
    if (!/^\d{12,13}$/.test(code)) {
      return false;
    }
    if (code.length === 13) {
      const calculatedCheckDigit = calculateEAN13CheckDigit(code.slice(0, 12));
      return calculatedCheckDigit === code[12];
    }
    return true;
  };

  // Generate a random barcode
  const generateBarcode = () => {
    setIsGeneratingBarcode(true);
    
    const countryCode = '890';
    const companyCode = '1234';
    const productCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const partialBarcode = countryCode + companyCode + productCode;
    const checkDigit = calculateEAN13CheckDigit(partialBarcode);
    const fullBarcode = partialBarcode + checkDigit;
    
    setFormData({
      ...formData,
      barcode: fullBarcode
    });
    
    setIsDirty(true);
    setIsGeneratingBarcode(false);
    setShowBarcodePreview(true);
    
    // Clear any barcode error
    if (errors.barcode) {
      setErrors({
        ...errors,
        barcode: ''
      });
    }
  };

  // Generate barcode from product name
  const generateBarcodeFromName = () => {
    if (!formData.name.trim()) {
      setErrors({
        ...errors,
        barcode: 'Please enter a product name first'
      });
      return;
    }
    
    setIsGeneratingBarcode(true);
    
    let hash = 0;
    for (let i = 0; i < formData.name.length; i++) {
      const char = formData.name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const positiveHash = Math.abs(hash);
    const productCode = (positiveHash % 100000).toString().padStart(5, '0');
    
    const countryCode = '890';
    const companyCode = '1234';
    const partialBarcode = countryCode + companyCode + productCode;
    const checkDigit = calculateEAN13CheckDigit(partialBarcode);
    const fullBarcode = partialBarcode + checkDigit;
    
    setFormData({
      ...formData,
      barcode: fullBarcode
    });
    
    setIsDirty(true);
    setIsGeneratingBarcode(false);
    setShowBarcodePreview(true);
    
    // Clear any barcode error
    if (errors.barcode) {
      setErrors({
        ...errors,
        barcode: ''
      });
    }
  };

  // Copy barcode to clipboard
  const copyBarcode = () => {
    if (formData.barcode) {
      navigator.clipboard.writeText(formData.barcode)
        .then(() => {
          setBarcodeCopied(true);
          setTimeout(() => setBarcodeCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy barcode: ', err);
        });
    }
  };

  // Download barcode as PNG
  const handleDownloadBarcode = () => {
    const svgNode = barcodeRef.current?.querySelector('svg');
    if (!svgNode) {
      setErrors({
        ...errors,
        barcode: "Could not find barcode to download."
      });
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgNode);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = document.createElement("img");

    img.onload = () => {
      // Set canvas dimensions to match image dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Fill background with white
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0);

      // Trigger download
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${formData.barcode}-barcode.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // Clear barcode
  const clearBarcode = () => {
    setFormData({
      ...formData,
      barcode: ''
    });
    setIsDirty(true);
    setShowBarcodePreview(false);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (imagePreviews.length + files.length > 5) {
      setErrors({
        ...errors,
        image: `Cannot upload ${files.length} images. Maximum 5 images allowed (currently have ${imagePreviews.length})`
      });
      return;
    }

    setIsDirty(true);

    // Clear any previous image errors
    if (errors.image) {
      setErrors({
        ...errors,
        image: ''
      });
    }

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

    // Clear image error if we now have images
    if (errors.image && newPreviews.length > 0) {
      setErrors({
        ...errors,
        image: ''
      });
    }
  };

  // Barcode modal component
  const BarcodeModal = () => {
    if (!showBarcodeModal || !formData.barcode) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Product Barcode</h3>
            <button 
              onClick={() => setShowBarcodeModal(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          
          {/* This div is used to hold the barcode for download */}
          <div ref={barcodeRef} className="text-center p-4 bg-white">
            {/* The react-barcode component generates the scannable image */}
            <Barcode value={formData.barcode} />
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleDownloadBarcode}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download as PNG
            </button>
            <button
              onClick={() => setShowBarcodeModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render barcode display
  const renderBarcodeDisplay = () => {
    if (!formData.barcode) return null;
    
    return (
      <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-500">BARCODE PREVIEW</span>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={copyBarcode}
              className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
              title="Copy barcode"
            >
              <Copy className="h-3 w-3 mr-1" />
              {barcodeCopied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => setShowBarcodeModal(true)}
              className="text-green-600 hover:text-green-800 text-xs flex items-center"
              title="View & download barcode"
            >
              <EyeIcon className="h-3 w-3 mr-1" />
              View
            </button>
            <button
              type="button"
              onClick={clearBarcode}
              className="text-red-600 hover:text-red-800 text-xs flex items-center"
              title="Clear barcode"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </button>
          </div>
        </div>
        
        {/* Simplified barcode visualization */}
        <div className="flex flex-col items-center">
          {/* Display barcode-like pattern */}
          <div className="w-full h-12 flex items-center justify-center space-x-0.5 mb-1">
            {formData.barcode.split('').map((char, index) => {
              // Generate a pseudo-random height based on the character
              const height = 30 + (char.charCodeAt(0) % 5) * 8;
              return (
                <div 
                  key={index}
                  className="bg-black w-0.5"
                  style={{ height: `${height}px` }}
                ></div>
              );
            })}
          </div>
          <div className="text-center font-mono text-sm mt-1">{formData.barcode}</div>
          {validateBarcode(formData.barcode) ? (
            <span className="text-xs text-green-600 flex items-center mt-1">
              <Check className="h-3 w-3 mr-1" /> Valid barcode format
            </span>
          ) : (
            <span className="text-xs text-red-600 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1" /> Invalid barcode format
            </span>
          )}
        </div>
      </div>
    );
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
    formDataToSubmit.append('barcode', formData.barcode);

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

    // Barcode validation (optional field, but if provided should be valid)
    if (data.barcode && data.barcode.trim()) {
      if (!validateBarcode(data.barcode.trim())) {
        newErrors.barcode = 'Invalid barcode format. Must be a valid 12 or 13 digit EAN format';
      }
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto z-10">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Edit Product Details</h3>
            </div>
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
                  
                  {/* Barcode preview in preview mode */}
                  {formData.barcode && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Product Barcode</h4>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex flex-col items-center">
                          {/* Display barcode-like pattern */}
                          <div className="w-full h-12 flex items-center justify-center space-x-0.5 mb-1">
                            {formData.barcode.split('').map((char, index) => {
                              const height = 30 + (char.charCodeAt(0) % 5) * 8;
                              return (
                                <div 
                                  key={index}
                                  className="bg-black w-0.5"
                                  style={{ height: `${height}px` }}
                                ></div>
                              );
                            })}
                          </div>
                          <div className="text-center font-mono text-sm mt-1">{formData.barcode}</div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    <div className="flex items-center mt-2 flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{categories.find(c => c.value === formData.category)?.label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${formData.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {formData.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                      {formData.barcode && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center">
                          <Hash className="h-3 w-3 mr-1" />
                          {formData.barcode}
                        </span>
                      )}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

                  {/* Enhanced Barcode Field with Generator */}
                  <div className="flex flex-col gap-1 mb-4">
                    <label className="text-sm font-medium flex items-center" htmlFor="barcode">
                      <Hash className="h-4 w-4 mr-1" />
                      Product Barcode <span className="text-gray-500 text-xs ml-1">(Optional)</span>
                    </label>
                    <div className="flex">
                      <input
                        id="barcode"
                        name="barcode"
                        type="text"
                        placeholder="Enter product barcode/SKU"
                        className={`outline-none py-2 px-3 rounded-l border ${errors.barcode ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          } flex-1`}
                        onChange={handleInputChange}
                        value={formData.barcode}
                      />
                      <button
                        type="button"
                        onClick={generateBarcode}
                        disabled={isGeneratingBarcode}
                        className="flex items-center justify-center px-3 bg-blue-500 text-white rounded-r border border-blue-500 hover:bg-blue-600 transition-colors"
                        title="Generate unique barcode"
                      >
                        <RefreshCw className={`h-4 w-4 ${isGeneratingBarcode ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={generateBarcodeFromName}
                        disabled={isGeneratingBarcode || !formData.name.trim()}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isGeneratingBarcode ? 'animate-spin' : ''}`} />
                        Generate from Name
                      </button>
                      {formData.barcode && (
                        <button
                          type="button"
                          onClick={() => setShowBarcodeModal(true)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View Barcode
                        </button>
                      )}
                    </div>
                    
                    {errors.barcode && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.barcode}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Used for inventory tracking and quick product lookup. For EAN-13 format, use 12-13 digits.
                    </p>
                    
                    {/* Barcode preview */}
                    {showBarcodePreview && formData.barcode && renderBarcodeDisplay()}
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
                            onClick={() => fileInputRef.current?.click()}
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

                  {/* Product Management Tips */}
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Product Management Tips:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Use high-quality, well-lit images</li>
                          <li>Show product from multiple angles</li>
                          <li>Add barcode for easy inventory tracking</li>
                          <li>Include size reference if relevant</li>
                          <li>Write detailed, accurate descriptions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Barcode Information Box */}
                  <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mt-4">
                    <div className="flex items-start">
                      <Hash className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">About Barcodes:</p>
                        <p className="mb-2">Barcodes help you track inventory and quickly look up products during checkout.</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Each product can have a unique barcode</li>
                          <li>You can scan or enter the barcode during checkout</li>
                          <li>Generate a unique barcode or use your existing system</li>
                          <li>For EAN-13 format, use 12-13 digits</li>
                          <li>Leave empty if you don't need barcode tracking</li>
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
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Barcode Modal */}
      <BarcodeModal />

      {/* Confirmation modal for unsaved changes */}
      <div id="confirmCloseModal" className="hidden fixed inset-0 z-60 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto z-10">
            <div className="p-6">
              <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    Unsaved Changes
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You have unsaved changes that will be lost if you close this modal. Are you sure you want to continue?
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancelClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Keep Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEditModal;