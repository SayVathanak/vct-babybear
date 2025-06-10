'use client'
import React, { useState, useRef, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import Barcode from 'react-barcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FaUpload, FaBarcode, FaRandom, FaCheckCircle, FaExclamationTriangle, FaTimes, FaDownload, FaTrash } from 'react-icons/fa';

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

    // Clear form function
    const clearForm = () => {
        setFiles([]);
        setName('');
        setDescription('');
        setCategory('PowderedMilk');
        setPrice('');
        setOfferPrice('');
        setBarcode('');
        setShowBarcodeModal(false);
        setShowScanner(false);
        toast.success('Form cleared successfully!');
    };

    // --- BARCODE LOGIC (unchanged) ---
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
        
        // If offer price is empty, use the regular price
        const finalOfferPrice = offerPrice.trim() === '' ? price : offerPrice;
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('price', price);
        formData.append('offerPrice', finalOfferPrice);
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

    // --- UI COMPONENTS ---
    const BarcodeModal = () => {
        if (!showBarcodeModal || !barcode) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full mx-auto">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Product Barcode</h3>
                        <button onClick={() => setShowBarcodeModal(false)} className="text-gray-400 hover:text-gray-700 p-1">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>
                    <div ref={barcodeRef} className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg overflow-x-auto">
                        <Barcode value={barcode} width={1} height={40} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <button onClick={handleDownload} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                            <FaDownload /> Download
                        </button>
                        <button onClick={() => setShowBarcodeModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
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
                { fps: 10, qrbox: { width: 200, height: 200 } },
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
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full mx-auto">
                    <div id="barcode-scanner" className="w-full"></div>
                    <button onClick={() => setShowScanner(false)} className="w-full mt-3 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                        Cancel Scan
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

    const handleScanFailure = (error) => {};

    // --- MAIN RENDER ---
    return (
        // Responsive container with proper padding and margins
        <div className="flex-1 bg-gray-50 min-h-screen">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-4xl">
                {/* Responsive Header */}
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Add New Product</h1>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">Fill in the details below to add a new product to your inventory.</p>
                </div>

                {/* Responsive Form Card */}
                <form onSubmit={handleSubmit} className="bg-white p-3 sm:p-5 lg:p-6 rounded-xl shadow-lg space-y-4 sm:space-y-6">
                    
                    {/* Responsive Image Upload Section */}
                    <div>
                        <label className="text-sm sm:text-base font-semibold text-gray-700 block mb-2">Product Images</label>
                        <p className="text-xs text-gray-500 mb-3">Upload up to 4 images. First image will be primary.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            {[...Array(4)].map((_, index) => (
                                <label key={index} htmlFor={`image${index}`} className="cursor-pointer">
                                    <input onChange={(e) => {
                                        const updatedFiles = [...files];
                                        updatedFiles[index] = e.target.files[0];
                                        setFiles(updatedFiles);
                                    }} type="file" id={`image${index}`} hidden accept="image/*" />
                                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 min-h-[80px] sm:min-h-[100px]">
                                        {files[index] ? (
                                            <Image
                                                src={URL.createObjectURL(files[index])}
                                                alt={`Product image ${index + 1}`}
                                                width={80}
                                                height={80}
                                                className="object-cover w-full h-full rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <FaUpload className="mx-auto text-lg sm:text-xl" />
                                                <span className="text-xs mt-1 block">Upload</span>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Responsive Product Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <label className="font-semibold text-gray-700 text-sm" htmlFor="product-name">Product Name</label>
                            <input
                                id="product-name"
                                type="text"
                                placeholder="e.g., Organic Baby Formula"
                                className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                onChange={(e) => setName(e.target.value)}
                                value={name}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <label className="font-semibold text-gray-700 text-sm" htmlFor="category">Category</label>
                            <select
                                id="category"
                                className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
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

                    {/* Responsive Description */}
                    <div className="flex flex-col gap-1 sm:gap-2">
                        <label className="font-semibold text-gray-700 text-sm" htmlFor="product-description">Product Description</label>
                        <textarea
                            id="product-description"
                            rows={3}
                            className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            placeholder="Describe the product, its features, and benefits."
                            onChange={(e) => setDescription(e.target.value)}
                            value={description}
                            required
                        ></textarea>
                    </div>
                    
                    {/* Responsive Barcode Section */}
                    <div className="flex flex-col gap-1 sm:gap-2">
                        <label className="font-semibold text-gray-700 text-sm" htmlFor="product-barcode">Barcode (EAN-13)</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                id="product-barcode"
                                type="text"
                                placeholder="Enter 12 or 13-digit barcode"
                                className="flex-1 p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                onChange={handleBarcodeChange}
                                value={barcode}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    className="flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap flex-1 sm:flex-initial"
                                >
                                    <FaBarcode /> <span className="hidden xs:inline">Scan</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={generateBarcode}
                                    disabled={isGeneratingBarcode}
                                    className="flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap flex-1 sm:flex-initial"
                                >
                                    <FaRandom /> <span className="hidden xs:inline">{isGeneratingBarcode ? 'Gen...' : 'Generate'}</span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Responsive Barcode Actions */}
                        <div className="flex flex-wrap gap-2 mt-2 items-center">
                            <button
                                type="button"
                                onClick={generateBarcodeFromName}
                                disabled={isGeneratingBarcode || !name.trim()}
                                className="px-2 sm:px-2.5 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:bg-gray-100 transition-colors"
                            >
                                Generate From Name
                            </button>
                            {barcode && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowBarcodeModal(true)}
                                        className="px-2 sm:px-2.5 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors"
                                    >
                                        View Barcode
                                    </button>
                                    <span className={`text-xs flex items-center gap-1 ${validateBarcode(barcode) ? 'text-green-600' : 'text-red-600'}`}>
                                        {validateBarcode(barcode) ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                        {validateBarcode(barcode) ? 'Valid' : 'Invalid'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Responsive Pricing Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <label className="font-semibold text-gray-700 text-sm" htmlFor="product-price">Product Price</label>
                            <input
                                id="product-price"
                                type="number"
                                placeholder="$0.00"
                                className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                onChange={(e) => setPrice(e.target.value)}
                                value={price}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <label className="font-semibold text-gray-700 text-sm" htmlFor="offer-price">
                                Offer Price 
                                <span className="text-xs text-gray-500 font-normal ml-1">(Optional - defaults to regular price)</span>
                            </label>
                            <input
                                id="offer-price"
                                type="number"
                                placeholder="$0.00 (Leave empty to use regular price)"
                                className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                onChange={(e) => setOfferPrice(e.target.value)}
                                value={offerPrice}
                            />
                        </div>
                    </div>
                    
                    {/* Responsive Action Buttons */}
                    <div className="pt-3 sm:pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
                        <button 
                            type="button" 
                            onClick={clearForm}
                            className="flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                        >
                            <FaTrash className="text-sm" /> Clear Form
                        </button>
                        <button 
                            type="submit"
                            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 order-1 sm:order-2"
                        >
                            ADD PRODUCT
                        </button>
                    </div>
                </form>

                <BarcodeModal />
                {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onScanFailure={handleScanFailure} />}
            </div>
        </div>
    );
};

export default AddProduct;
