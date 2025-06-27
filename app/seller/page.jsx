'use client'
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import Barcode from 'react-barcode';
import Script from 'next/script';
import { FaUpload, FaCheckCircle, FaExclamationTriangle, FaTimes, FaDownload, FaTrash } from 'react-icons/fa';
import { CiBarcode, CiRepeat } from "react-icons/ci";
import BarcodeScanner from "@/components/BarcodeScanner";

const AddProduct = () => {
    const { getToken } = useAppContext();
    const barcodeRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('PowderedMilk');
    const [price, setPrice] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [stock, setStock] = useState('');
    const [barcode, setBarcode] = useState('');
    const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    // Clear form function
    const clearForm = () => {
        setFiles([]);
        setName('');
        setDescription('');
        setCategory('PowderedMilk');
        setPrice('');
        setOfferPrice('');
        setBarcode('');
        setStock(''); // --- INVENTORY: Clear stock state
        setShowBarcodeModal(false);
        setShowScanner(false);
        toast.success('Form cleared successfully!');
    };

    // --- BARCODE LOGIC ---
    const generateBarcode = () => {
        setIsGeneratingBarcode(true);
        const countryCode = '890';
        const companyCode = '1234';
        const productCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const partialBarcode = countryCode + companyCode + productCode;
        const checkDigit = calculateEAN13CheckDigit(partialBarcode);
        const fullBarcode = partialBarcode + checkDigit;
        setBarcode(fullBarcode);
        setIsGeneratingBarcode(false);
        toast.success('Barcode generated successfully!');
    };

    const calculateEAN13CheckDigit = (barcode) => {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode[i]);
            sum += i % 2 === 0 ? digit : digit * 3;
        }
        return ((10 - (sum % 10)) % 10).toString();
    };

    const validateBarcode = (code) => {
        if (!/^\d{12,13}$/.test(code)) {
            return false;
        }
        if (code.length === 13) {
            const calculatedCheckDigit = calculateEAN13CheckDigit(code.slice(0, 12));
            return calculatedCheckDigit === code[12];
        }
        return true;
    };

    const generateBarcodeFromName = () => {
        if (!name.trim()) {
            toast.error('Please enter a product name first');
            return;
        }
        setIsGeneratingBarcode(true);
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            const char = name.charCodeAt(i);
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
        setBarcode(fullBarcode);
        setIsGeneratingBarcode(false);
        toast.success('Barcode generated from product name!');
    };

    const handleBarcodeChange = (e) => {
        const value = e.target.value;
        setBarcode(value);
    };

    const handleDownload = () => {
        const svgNode = barcodeRef.current?.querySelector('svg');
        if (!svgNode) {
            toast.error("Could not find barcode to download.");
            return;
        }
        const svgData = new XMLSerializer().serializeToString(svgNode);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = document.createElement("img");
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${barcode}-barcode.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            toast.success("Barcode downloaded!");
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (barcode && !validateBarcode(barcode)) {
            toast.error('Please enter a valid barcode format (12-13 digits)');
            return;
        }

        // --- INVENTORY: Validate stock input ---
        if (stock.trim() === '' || Number(stock) < 0) {
            toast.error('Please enter a valid stock quantity (0 or more)');
            return;
        }

        // If offer price is empty, use the regular price
        const finalOfferPrice = offerPrice.trim() === '' ? price : offerPrice;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('price', price);
        formData.append('offerPrice', finalOfferPrice);
        formData.append('stock', stock); // --- INVENTORY: Append stock to form data
        formData.append('barcode', barcode);
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/product/add', formData, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                toast.success(data.message);
                clearForm();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleScanSuccess = async (decodedText) => {
        setBarcode(decodedText);
        toast.success(`Barcode scanned: ${decodedText}`);

        // Show loading indicator
        toast.loading('Searching for product information...');

        try {
            // Make an API call to a product database using the barcode
            const response = await axios.get(`/api/product/lookup/${decodedText}`);

            if (response.data && response.data.success) {
                // Auto-populate fields with retrieved data
                setName(response.data.product.name || '');
                setDescription(response.data.product.description || '');

                // If there's an image URL, you could create a File object from it
                if (response.data.product.imageUrl) {
                    const imageResponse = await fetch(response.data.product.imageUrl);
                    const blob = await imageResponse.blob();
                    const file = new File([blob], "product-image.jpg", { type: blob.type });
                    setFiles([file]);
                }

                // Leave price, offer price, and category empty as specified
                toast.dismiss();
                toast.success('Product information retrieved successfully');
            } else {
                toast.dismiss();
                toast.warning('Product not found in database. Please enter details manually.');
            }
        } catch (error) {
            toast.dismiss();
            toast.error('Error retrieving product information');
            console.error('Product lookup error:', error);
        }
    };

    const handleCloseScanner = () => {
        setShowScanner(false);
    };

    // --- UI COMPONENTS ---
    const BarcodeModal = () => {
        if (!showBarcodeModal || !barcode) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Generated Barcode</h3>
                        <button
                            onClick={() => setShowBarcodeModal(false)}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                    <div className="text-center mb-4">
                        <div ref={barcodeRef} className="inline-block bg-white p-2 border border-gray-200 rounded">
                            <Barcode value={barcode} width={2} height={60} fontSize={12} />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Barcode: {barcode}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={handleDownload}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <FaDownload />
                            Download
                        </button>
                        <button
                            onClick={() => setShowBarcodeModal(false)}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="max-w-4xl md:mx-auto p-4 sm:p-6">
                <div className="grid grid-cols-2 items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-lg md:text-2xl sm:text-3xl font-medium text-gray-800">
                        Add Product
                    </h2>
                    <div className="justify-end flex">
                        <button
                            type="button"
                            onClick={clearForm}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
                        >
                            <FaTrash />
                            Clear
                        </button>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">

                        {/* Image Upload */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Product Images</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        if (newFiles.length > 0) {
                                            // Append new files to existing files
                                            setFiles(prevFiles => [...prevFiles, ...newFiles]);
                                            // Clear the input so the same files can be selected again if needed
                                            e.target.value = '';
                                        }
                                    }}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <FaUpload className="mx-auto text-gray-400 text-2xl mb-2" />
                                    <p className="text-gray-600 text-sm">Click to upload images</p>
                                    <p className="text-xs text-gray-500">Multiple files supported</p>
                                </label>

                                {files.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-sm text-green-600 font-medium">
                                                {files.length} file(s) selected
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setFiles([])}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            {files.map((file, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`preview ${index}`}
                                                        className="w-20 h-20 object-cover rounded-lg border"
                                                    />
                                                    {/* Delete button for individual image */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Remove image"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Product Name */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Product Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        {/* --- INVENTORY: Pricing and Stock Section --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Regular Price <span className="text-red-500">*</span></label>
                                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="0.00" min="0" step="0.01" required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Offer Price</label>
                                <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="0.00" min="0" step="0.01" />
                            </div>
                            {/* --- INVENTORY: New Stock Quantity Input --- */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Stock Qty <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 50"
                                    min="0"
                                    step="1"
                                    required
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Category <span className="text-red-500">*</span></label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="PowderedMilk">Formula & Powdered Milk</option>
                                <option value="LiquidMilk">Ready-to-Feed Milk</option>
                                <option value="Bottles">Bottles & Sippy Cups</option>
                                <option value="Tumblers">Toddler Tumblers & Cups</option>
                                <option value="FeedingTools">Feeding Sets & Utensils</option>
                                <option value="Accessories">Baby Essentials & Accessories</option>
                                <option value="Vitamins">Nutrition & Supplements</option>
                                <option value="BathBodyCare">Bath & Body Care</option>
                                <option value="Diapers">Diapers & Wipes</option>
                                <option value="NurseryItems">Nursery & Sleep Essentials</option>
                                <option value="Toys">Play & Learn</option>
                            </select>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">

                        {/* Description */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                                placeholder="Enter product description"
                            />
                        </div>

                        {/* Barcode Section */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Barcode
                                <span className="text-sm text-gray-400 ml-1">(optional)</span>
                            </label>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={barcode}
                                    onChange={handleBarcodeChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter or scan barcode"
                                />

                                {/* Barcode Action Buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowScanner(true)}
                                        className="flex items-center justify-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                                    >
                                        <CiBarcode size={24} />
                                        Scan Barcode
                                    </button>
                                    <button
                                        type="button"
                                        onClick={generateBarcode}
                                        disabled={isGeneratingBarcode}
                                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        <CiRepeat size={24} />
                                        {isGeneratingBarcode ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>


                                {/* Barcode Display */}
                                {barcode && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Current Barcode:</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowBarcodeModal(true)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                View Full Size
                                            </button>
                                        </div>
                                        <div className="text-center">
                                            <div className="inline-block bg-white p-2 border border-gray-200 rounded">
                                                <Barcode value={barcode} width={1.5} height={40} fontSize={10} />
                                            </div>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            {validateBarcode(barcode) ? (
                                                <div className="flex items-center text-green-600 text-sm">
                                                    <FaCheckCircle className="mr-1" />
                                                    Valid barcode format
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-red-600 text-sm">
                                                    <FaExclamationTriangle className="mr-1" />
                                                    Invalid barcode format
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8">
                    <button
                        type="submit"
                        className="w-full text-white py-3 px-6 rounded-lg bg-blue-600 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Add Product
                    </button>
                </div>
            </form>

            {/* Barcode Modal */}
            <BarcodeModal />

            {/* Barcode Scanner */}
            {showScanner && (
                <BarcodeScanner
                    onBarcodeDetected={handleScanSuccess}
                    onClose={handleCloseScanner}
                />
            )}
        </>
    );
};

export default AddProduct;