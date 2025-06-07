'use client'
import React, { useState, useRef } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import Barcode from 'react-barcode'; // Import the new library

const AddProduct = () => {

  const { getToken } = useAppContext()
  const barcodeRef = useRef(null); // Create a ref for the barcode component

  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PowderedMilk');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // Function to generate a unique barcode
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
    if (!/^\d{12,13}$/.test(code)) {
      return false;
    }
    if (code.length === 13) {
      const calculatedCheckDigit = calculateEAN13CheckDigit(code.slice(0, 12));
      return calculatedCheckDigit === code[12];
    }
    return true;
  };

    // Function to generate barcode based on product name
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
  
    // New function to handle downloading the barcode as a PNG
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
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('category', category)
    formData.append('price', price)
    formData.append('offerPrice', offerPrice)
    formData.append('barcode', barcode)
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i])
    }
    try {
      const token = await getToken()
      const { data } = await axios.post('/api/product/add', formData, { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) {
        toast.success(data.message)
        setFiles([]);
        setName('');
        setDescription('');
        setCategory('PowderedMilk');
        setPrice('');
        setOfferPrice('');
        setBarcode('');
        setShowBarcodeModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message)
    }
  };
  
  // Renamed and updated modal component
  const BarcodeModal = () => {
    if (!showBarcodeModal || !barcode) return null;

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
          
          {/* This div is now used to hold the barcode for download */}
          <div ref={barcodeRef} className="text-center p-4">
             {/* The react-barcode component generates the scannable image */}
            <Barcode value={barcode} />
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
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


  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">

            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input onChange={(e) => {
                  const updatedFiles = [...files];
                  updatedFiles[index] = e.target.files[0];
                  setFiles(updatedFiles);
                }} type="file" id={`image${index}`} hidden />
                <Image
                  key={index}
                  className="max-w-24 cursor-pointer"
                  src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                  alt=""
                  width={100}
                  height={100}
                />
              </label>
            ))}

          </div>
        </div>
        
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>
        
        <div className="flex flex-col gap-1 max-w-md">
          <label
            className="text-base font-medium"
            htmlFor="product-description"
          >
            Product Description
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Type here"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          ></textarea>
        </div>
        
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-barcode">
            Barcode
          </label>
          <div className="flex gap-2">
            <input
              id="product-barcode"
              type="text"
              placeholder="Enter barcode or generate one"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 flex-1"
              onChange={handleBarcodeChange}
              value={barcode}
            />
            <button
              type="button"
              onClick={generateBarcode}
              disabled={isGeneratingBarcode}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {isGeneratingBarcode ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={generateBarcodeFromName}
              disabled={isGeneratingBarcode || !name.trim()}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Generate from Name
            </button>
            {barcode && (
              <>
                <button
                  type="button"
                  onClick={() => setShowBarcodeModal(true)}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  View Barcode
                </button>
                <span className="text-sm text-gray-600 flex items-center">
                  {validateBarcode(barcode) ? '✅ Valid format' : '⚠️ Invalid format'}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Barcode will be used for POS scanning. Leave empty to skip or generate automatically.
          </p>
        </div>
        
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
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
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">
              Product Price
            </label>
            <input
              id="product-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              required
            />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">
              Offer Price
            </label>
            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              required
            />
          </div>
        </div>
        
        <button type="submit" className="px-8 py-2.5 bg-black text-white font-medium rounded">
          ADD
        </button>
      </form>
      
      <BarcodeModal />
      
    </div>
  );
};

export default AddProduct;