'use client'
import React, { useState, useRef, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import Barcode from 'react-barcode';
import { Html5QrcodeScanner } from 'html5-qrcode';

const AddProduct = () => {
    const { getToken } = useAppContext();
    const barcodeRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('PowderedMilk');
    const [price, setPrice] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [barcode, setBarcode] = useState('');
    const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (value && !validateBarcode(value)) {
            console.warn('Invalid barcode format');
        }
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

    const resetForm = () => {
        setFiles([]);
        setName('');
        setDescription('');
        setCategory('PowderedMilk');
        setPrice('');
        setOfferPrice('');
        setBarcode('');
        setShowBarcodeModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (barcode && !validateBarcode(barcode)) {
            toast.error('Please enter a valid barcode format (12-13 digits)');
            return;
        }

        if (files.length === 0) {
            toast.error('Please upload at least one product image');
            return;
        }

        if (parseFloat(offerPrice) >= parseFloat(price)) {
            toast.error('Offer price must be less than regular price');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('price', price);
        formData.append('offerPrice', offerPrice);
        formData.append('barcode', barcode);
        
        for (let i = 0; i < files.length; i++) {
            if (files[i]) {
                formData.append('images', files[i]);
            }
        }

        try {
            const token = await getToken();
            const { data } = await axios.post('/api/product/add', formData, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            if (data.success) {
                toast.success(data.message);
                resetForm();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to add product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const BarcodeModal = () => {
        if (!showBarcodeModal || !barcode) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg max-w-sm sm:max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Product Barcode</h3>
                        <button 
                            onClick={() => setShowBarcodeModal(false)} 
                            className="text-gray-500 hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                        >
                            ×
                        </button>
                    </div>
                    <div ref={barcodeRef} className="text-center p-4 bg-gray-50 rounded">
                        <Barcode value={barcode} width={1} height={50} />
                    </div>
                    <div className="flex flex-col gap-3 mt-4">
                        <button 
                            onClick={handleDownload} 
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            Download as PNG
                        </button>
                        <button 
                            onClick={() => setShowBarcodeModal(false)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const BarcodeScanner = ({ onScanSuccess, onScanFailure }) => {
        useEffect(() => {
            const scanner = new Html5QrcodeScanner(
                "barcode-scanner",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);

            return () => {
                scanner.clear().catch(error => {
                    console.error("Failed to clear scanner.", error);
                });
            };
        }, [onScanSuccess, onScanFailure]);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg max-w-sm sm:max-w-md w-full">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-center">Scan Barcode</h3>
                        <p className="text-sm text-gray-600 text-center mt-1">Position the barcode within the frame</p>
                    </div>
                    <div id="barcode-scanner" className="mb-4"></div>
                    <button 
                        onClick={() => setShowScanner(false)} 
                        className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    };

    const handleScanSuccess = (decodedText, decodedResult) => {
        setBarcode(decodedText);
        setShowScanner(false);
        toast.success(`Barcode scanned: ${decodedText}`);
    };

    const handleScanFailure = (error) => {
        // Silent fail - scanner will keep trying
    };

    const removeImage = (index) => {
        const updatedFiles = [...files];
        updatedFiles[index] = null;
        setFiles(updatedFiles);
    };

    return (
        <div className="flex-1 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Clear Form
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
                    
                    {/* Product Images Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
                            <span className="text-sm text-gray-500">Upload up to 4 images</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, index) => (
                                <div key={index} className="relative group">
                                    <label htmlFor={`image${index}`} className="block">
                                        <input 
                                            onChange={(e) => {
                                                const updatedFiles = [...files];
                                                updatedFiles[index] = e.target.files[0];
                                                setFiles(updatedFiles);
                                            }} 
                                            type="file" 
                                            id={`image${index}`} 
                                            accept="image/*"
                                            hidden 
                                        />
                                        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden">
                                            {files[index] ? (
                                                <Image
                                                    className="w-full h-full object-cover"
                                                    src={URL.createObjectURL(files[index])}
                                                    alt={`Product image ${index + 1}`}
                                                    width={150}
                                                    height={150}
                                                />
                                            ) : (
                                                <Image
                                                    className="w-12 h-12 opacity-40"
                                                    src={assets.upload_area}
                                                    alt="Upload"
                                                    width={48}
                                                    height={48}
                                                />
                                            )}
                                        </div>
                                    </label>
                                    {files[index] && (
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="product-name">
                                    Product Name *
                                </label>
                                <input
                                    id="product-name"
                                    type="text"
                                    placeholder="Enter product name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                    required
                                />
                            </div>

                            {/* Product Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="product-description">
                                    Product Description *
                                </label>
                                <textarea
                                    id="product-description"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-colors"
                                    placeholder="Describe your product..."
                                    onChange={(e) => setDescription(e.target.value)}
                                    value={description}
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="category">
                                    Category *
                                </label>
                                <select
                                    id="category"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                    onChange={(e) => setCategory(e.target.value)}
                                    value={category}
                                >
                                    <option value="PowderedMilk">Formula & Powdered Milk</option>
                                    <option value="LiquidMilk">Ready-to-Feed Milk</option>
                                    <option value="Bottles">Bottles & Sippy Cups</option>
                                    <option value="Tumblers">Toddler Tumblers & Cups</option>
                                    <option value="FeedingTools">Feeding Sets & Utensils</option>
                                    <option value="Accessories">Baby Essentials & Accessories</option>
                                    <option value="Vitamins">Nutrition & Supplements</option>
                                    <option value="Diapers">Diapers & Wipes</option>
                                    <option value="NurseryItems">Nursery & Sleep Essentials</option>
                                </select>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Pricing */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="product-price">
                                        Regular Price *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                        <input
                                            id="product-price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                            onChange={(e) => setPrice(e.target.value)}
                                            value={price}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="offer-price">
                                        Sale Price *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                        <input
                                            id="offer-price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                            onChange={(e) => setOfferPrice(e.target.value)}
                                            value={offerPrice}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Barcode Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="product-barcode">
                                    Barcode
                                </label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            id="product-barcode"
                                            type="text"
                                            placeholder="Enter barcode or generate one"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                            onChange={handleBarcodeChange}
                                            value={barcode}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowScanner(true)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap"
                                        >
                                            Scan
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={generateBarcode}
                                            disabled={isGeneratingBarcode}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                                        >
                                            {isGeneratingBarcode ? 'Generating...' : 'Generate Random'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={generateBarcodeFromName}
                                            disabled={isGeneratingBarcode || !name.trim()}
                                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                                        >
                                            Generate from Name
                                        </button>
                                        {barcode && (
                                            <button
                                                type="button"
                                                onClick={() => setShowBarcodeModal(true)}
                                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                            >
                                                View Barcode
                                            </button>
                                        )}
                                    </div>

                                    {barcode && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className={`${validateBarcode(barcode) ? 'text-green-600' : 'text-red-600'}`}>
                                                {validateBarcode(barcode) ? '✅ Valid format' : '⚠️ Invalid format'}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <p className="text-xs text-gray-500">
                                        Barcode will be used for POS scanning. Leave empty to skip or generate automatically.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                            * Required fields
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Reset
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-8 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Adding...
                                    </>
                                ) : (
                                    'Add Product'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <BarcodeModal />
            {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onScanFailure={handleScanFailure} />}
        </div>
    );
};

export default AddProduct;