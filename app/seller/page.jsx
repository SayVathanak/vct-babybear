'use client'
import React, { useState, useRef, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import Barcode from 'react-barcode';
import Script from 'next/script';
import { FaUpload, FaBarcode, FaRandom, FaCheckCircle, FaExclamationTriangle, FaTimes, FaDownload, FaTrash } from 'react-icons/fa';
import { CiBarcode, CiRepeat } from "react-icons/ci";

// Barcode Scanner Component
const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
    // SVG Icons
    const IconCamera = (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2-2h-3l-2.5-3z"></path>
            <circle cx="12" cy="13" r="3"></circle>
        </svg>
    );

    const IconTimes = (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );

    const IconSpinner = (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" {...props}>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
    );

    const IconExclamationTriangle = (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    );

    const IconRedo = (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
    );

    const IconLightbulb = (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M15.09 14.37a5 5 0 0 1-6.18 0M12 20v-4M12 4V2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
            <path d="M9 18h6a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4Z"></path>
        </svg>
    );

    const IconPause = (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
    );

    const IconPlay = (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polygon points="5,3 19,12 5,21"></polygon>
        </svg>
    );

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanningIntervalRef = useRef(null);
    const codeReaderRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isZxingLoaded, setIsZxingLoaded] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Camera feature states
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [torchSupported, setTorchSupported] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);

    // Initialize or reinitialize ZXing reader
    const initializeReader = () => {
        if (!window.ZXingBrowser) {
            console.error('ZXing library not loaded');
            return false;
        }

        try {
            // Always create a new reader instance
            codeReaderRef.current = new window.ZXingBrowser.BrowserMultiFormatReader();
            console.log('ZXing BrowserMultiFormatReader initialized/reinitialized');
            return true;
        } catch (err) {
            console.error('Failed to initialize ZXing reader:', err);
            setError('Failed to initialize barcode scanner');
            return false;
        }
    };

    // Clean up function
    const cleanup = (resetReader = false) => {
        if (scanningIntervalRef.current) {
            clearInterval(scanningIntervalRef.current);
            scanningIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        // Only reset reader if explicitly requested (when closing scanner)
        if (resetReader && codeReaderRef.current) {
            try {
                codeReaderRef.current.reset();
                codeReaderRef.current = null;
            } catch (e) {
                console.log('Error resetting code reader:', e);
            }
        }
    };

    const startCamera = async () => {
        setIsLoading(true);
        setError(null);

        // Clean up existing camera stream
        if (scanningIntervalRef.current) {
            clearInterval(scanningIntervalRef.current);
            scanningIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Ensure reader is ready
        if (!codeReaderRef.current) {
            if (!initializeReader()) {
                setIsLoading(false);
                return;
            }
        }

        try {
            // Get available cameras first
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameras(videoDevices);

            // Set up camera constraints
            const constraints = {
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 },
                    facingMode: selectedCameraId ? undefined : { ideal: 'environment' },
                    deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Wait for video to be ready
                await new Promise((resolve, reject) => {
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play()
                            .then(resolve)
                            .catch(reject);
                    };
                    videoRef.current.onerror = reject;
                });

                // Set up torch capability
                const track = stream.getVideoTracks()[0];
                if (track) {
                    const capabilities = track.getCapabilities();
                    setTorchSupported(!!capabilities.torch);

                    // Set camera ID if not already set
                    if (!selectedCameraId) {
                        const settings = track.getSettings();
                        setSelectedCameraId(settings.deviceId || '');
                    }
                }

                setIsLoading(false);
                setIsScanning(true);
                setIsPaused(false);
            }
        } catch (err) {
            console.error("Camera error:", err);
            let errorMessage = 'Failed to access camera.';

            switch (err.name) {
                case 'NotAllowedError':
                    errorMessage = 'Camera permission denied. Please allow camera access and try again.';
                    break;
                case 'NotFoundError':
                    errorMessage = 'No camera found on this device.';
                    break;
                case 'NotReadableError':
                    errorMessage = 'Camera is already in use by another application.';
                    break;
                case 'OverconstrainedError':
                    errorMessage = 'Camera constraints not supported. Trying with basic settings...';
                    // Retry with basic constraints
                    setTimeout(() => {
                        setSelectedCameraId('');
                        startCamera();
                    }, 1000);
                    return;
                default:
                    errorMessage = `Camera error: ${err.message}`;
            }

            setError(errorMessage);
            setIsLoading(false);
        }
    };

    // Check ZXing library status and initialize reader
    useEffect(() => {
        if (window.ZXingBrowser) {
            setIsZxingLoaded(true);
            initializeReader();
        }
    }, []);

    // Initialize camera on mount and when camera changes
    useEffect(() => {
        // Only start camera if ZXing is loaded or will be loaded
        if (isZxingLoaded || window.ZXingBrowser) {
            startCamera();
        }
        return () => cleanup(true); // Full cleanup on unmount
    }, [selectedCameraId, isZxingLoaded]);

    // Barcode scanning logic
    useEffect(() => {
        if (!isScanning || isPaused || !isZxingLoaded || !videoRef.current || !canvasRef.current || !codeReaderRef.current) {
            return;
        }

        // Start scanning with interval-based approach for better reliability
        scanningIntervalRef.current = setInterval(() => {
            try {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
                    return;
                }

                // Set canvas size to match video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                if (canvas.width === 0 || canvas.height === 0) {
                    return;
                }

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Try to decode barcode
                try {
                    const result = codeReaderRef.current.decodeFromCanvas(canvas);

                    if (result && result.getText()) {
                        const now = Date.now();
                        const barcodeText = result.getText().trim();

                        // Prevent duplicate scans within 2 seconds
                        if (now - lastScanTimeRef.current > 2000 && barcodeText) {
                            lastScanTimeRef.current = now;
                            console.log('Barcode detected:', barcodeText);

                            // Show success message briefly
                            setSuccessMessage(`Scanned: ${barcodeText}`);
                            setTimeout(() => setSuccessMessage(''), 2000);

                            // Pause scanning briefly to prevent immediate re-scans
                            setIsPaused(true);
                            setTimeout(() => setIsPaused(false), 1500);

                            // Call the callback and close the scanner
                            onBarcodeDetected(barcodeText);
                            // Auto-close after successful scan
                            setTimeout(() => {
                                cleanup(true);
                                onClose();
                            }, 1000);
                        }
                    }
                } catch (decodeError) {
                    // No barcode found in this frame - this is normal
                }
            } catch (scanError) {
                console.error('Scanning error:', scanError);
            }
        }, 100); // Scan every 100ms

        return () => {
            if (scanningIntervalRef.current) {
                clearInterval(scanningIntervalRef.current);
                scanningIntervalRef.current = null;
            }
        };
    }, [isScanning, isPaused, isZxingLoaded, onBarcodeDetected]);

    // Event handlers
    const handleClose = () => {
        setIsScanning(false);
        cleanup(true); // Full cleanup including reader reset when closing
        onClose();
    };

    const handleRetry = () => {
        // Reinitialize reader if needed before retrying
        if (!codeReaderRef.current) {
            initializeReader();
        }
        startCamera();
    };

    const handleCameraSwitch = (event) => {
        setSelectedCameraId(event.target.value);
    };

    const handleToggleTorch = async () => {
        if (!streamRef.current || !torchSupported) return;

        const track = streamRef.current.getVideoTracks()[0];
        const newTorchState = !isTorchOn;

        try {
            await track.applyConstraints({
                advanced: [{ torch: newTorchState }]
            });
            setIsTorchOn(newTorchState);
        } catch (err) {
            console.error("Failed to toggle torch:", err);
        }
    };

    const handleTogglePause = () => {
        setIsPaused(!isPaused);
    };

    return (
        <>
            <Script
                src="https://unpkg.com/@zxing/browser@0.1.4/umd/zxing-browser.min.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('ZXing library loaded successfully');
                    setIsZxingLoaded(true);
                    // Initialize reader immediately when library loads
                    initializeReader();
                }}
                onError={() => {
                    console.error("Failed to load ZXing script");
                    setError("Could not load barcode scanning library. Please check your internet connection.");
                }}
            />

            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                {/* Header */}
                <header className="bg-black bg-opacity-50 p-3 z-10">
                    <div className="flex items-center justify-between text-white">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <IconCamera />
                            <span>Scan Barcode</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            {torchSupported && (
                                <button
                                    onClick={handleToggleTorch}
                                    className={`p-2 rounded-full transition-colors ${isTorchOn ? 'bg-yellow-400 text-black' : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    title="Toggle Flashlight"
                                >
                                    <IconLightbulb />
                                </button>
                            )}

                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
                                title="Close Scanner"
                            >
                                <IconTimes />
                            </button>
                        </div>
                    </div>

                    {cameras.length > 1 && !isLoading && (
                        <div className="mt-2">
                            <select
                                value={selectedCameraId}
                                onChange={handleCameraSwitch}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2 text-sm"
                            >
                                {cameras.map((camera) => (
                                    <option key={camera.deviceId} value={camera.deviceId}>
                                        {camera.label || `Camera ${camera.deviceId.substring(0, 8)}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </header>

                {/* Main Content Area */}
                <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-4">
                            <IconSpinner className="text-4xl mb-4" />
                            <p className="text-lg">Starting Camera...</p>
                            <p className="text-sm text-gray-300 mt-2">
                                {!isZxingLoaded && "Loading barcode scanner..."}
                            </p>
                        </div>
                    )}

                    {/* Error Overlay */}
                    {error && (
                        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white text-center p-4">
                            <IconExclamationTriangle className="text-red-500 text-4xl mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Scanner Error</h3>
                            <p className="text-gray-300 mb-6 max-w-sm">{error}</p>
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 bg-blue-600 py-2 px-5 rounded-lg hover:bg-blue-700"
                            >
                                <IconRedo />
                                <span>Try Again</span>
                            </button>
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-20 max-w-xs text-center">
                            <p className="font-semibold">{successMessage}</p>
                        </div>
                    )}

                    {/* Scanning Overlay */}
                    {isScanning && !error && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {/* Scanning frame */}
                            <div className="relative w-11/12 max-w-sm h-48">
                                <div className={`w-full h-full border-4 border-dashed rounded-lg transition-colors ${isPaused ? 'border-yellow-500' : 'border-green-500 animate-pulse'
                                    }`} />
                                <div className="absolute -bottom-8 left-0 right-0 text-center">
                                    <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                                        {isPaused ? 'Scanning paused' : 'Point camera at barcode'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Control Panel */}
                {isScanning && !error && !isLoading && (
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-full px-6 py-3">
                            <button
                                onClick={handleTogglePause}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-colors ${isPaused
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                    }`}
                                title={isPaused ? "Resume Scanning" : "Pause Scanning"}
                            >
                                {isPaused ? <IconPlay /> : <IconPause />}
                                <span className="text-sm font-medium">
                                    {isPaused ? 'Resume' : 'Pause'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

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

    // Scanner event handlers
    // const handleScanSuccess = (decodedText) => {
    //     setBarcode(decodedText);
    //     toast.success(`Barcode scanned: ${decodedText}`);
    // };

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
                    <h2 className="text-lg md:text-2xl sm:text-3xl font-semibold text-gray-800">
                        Add New Product
                    </h2>
                    <div className="justify-end flex">
                        <button
                            type="button"
                            onClick={clearForm}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
                        >
                            <FaTrash />
                            Clear Form
                        </button>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">

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

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Regular Price <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Offer Price
                                    <span className="text-sm text-gray-400 ml-1">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
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
                    <div className="space-y-6">

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
                                    {/* <button
                                        type="button"
                                        onClick={generateBarcodeFromName}
                                        disabled={isGeneratingBarcode || !name.trim()}
                                        className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        <FaRandom />
                                        From Name
                                    </button> */}
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