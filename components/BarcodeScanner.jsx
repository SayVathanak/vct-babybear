'use client'
import React, { useState, useRef, useEffect } from "react";
import Script from 'next/script';
import { FaCamera, FaTimes, FaSpinner, FaExclamationTriangle, FaRedo, FaLightbulb, FaPause, FaPlay } from 'react-icons/fa';

const BarcodeScanner = ({ onBarcodeDetected, onClose, autoCloseOnScan = true }) => {
    // Refs for video, canvas, and scanner instances
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanningIntervalRef = useRef(null);
    const codeReaderRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    // Component state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isZxingLoaded, setIsZxingLoaded] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Camera-specific state
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [torchSupported, setTorchSupported] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);

    // Initializes the ZXing barcode reader instance
    const initializeReader = () => {
        if (!window.ZXingBrowser) {
            console.error('ZXing library not loaded');
            return false;
        }
        try {
            codeReaderRef.current = new window.ZXingBrowser.BrowserMultiFormatReader();
            console.log('ZXing BrowserMultiFormatReader initialized/reinitialized');
            return true;
        } catch (err) {
            console.error('Failed to initialize ZXing reader:', err);
            setError('Failed to initialize barcode scanner');
            return false;
        }
    };

    // Stops camera streams and clears intervals
    const cleanup = (resetReader = false) => {
        if (scanningIntervalRef.current) {
            clearInterval(scanningIntervalRef.current);
            scanningIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (resetReader && codeReaderRef.current) {
            try {
                codeReaderRef.current.reset();
                codeReaderRef.current = null;
            } catch (e) {
                console.log('Error resetting code reader:', e);
            }
        }
    };

    // Starts the camera and video stream
    const startCamera = async () => {
        setIsLoading(true);
        setError(null);
        cleanup(); // Soft cleanup before starting

        if (!codeReaderRef.current && !initializeReader()) {
            setIsLoading(false);
            return;
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameras(videoDevices);

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
                await new Promise((resolve, reject) => {
                    videoRef.current.onloadedmetadata = () => videoRef.current.play().then(resolve).catch(reject);
                    videoRef.current.onerror = reject;
                });

                const track = stream.getVideoTracks()[0];
                if (track) {
                    const capabilities = track.getCapabilities();
                    setTorchSupported(!!capabilities.torch);
                    if (!selectedCameraId) {
                        setSelectedCameraId(track.getSettings().deviceId || '');
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
                case 'NotAllowedError': errorMessage = 'Camera permission denied. Please allow camera access and try again.'; break;
                case 'NotFoundError': errorMessage = 'No camera found on this device.'; break;
                case 'NotReadableError': errorMessage = 'Camera is already in use by another application.'; break;
            }
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    // Effect to load the ZXing script
    useEffect(() => {
        if (window.ZXingBrowser) {
            setIsZxingLoaded(true);
            initializeReader();
        }
    }, []);

    // Effect to start the camera once the library is loaded or camera device changes
    useEffect(() => {
        if (isZxingLoaded) {
            startCamera();
        }
        return () => cleanup(true); // Full cleanup on unmount
    }, [selectedCameraId, isZxingLoaded]);

    // Main barcode scanning logic effect
    useEffect(() => {
        if (!isScanning || isPaused || !isZxingLoaded || !videoRef.current || !canvasRef.current || !codeReaderRef.current) {
            return;
        }

        scanningIntervalRef.current = setInterval(() => {
            try {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA || canvas.width === 0) {
                    return;
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

                const result = codeReaderRef.current.decodeFromCanvas(canvas);
                const now = Date.now();
                const barcodeText = result?.getText()?.trim();

                // Throttle scans to prevent duplicates
                if (barcodeText && now - lastScanTimeRef.current > 2000) {
                    lastScanTimeRef.current = now;
                    console.log('Barcode detected:', barcodeText);
                    setSuccessMessage(`Scanned: ${barcodeText}`);
                    
                    // Pause scanning briefly to show feedback and prevent immediate re-scans
                    setIsPaused(true);
                    setTimeout(() => {
                        setSuccessMessage('');
                        setIsPaused(false);
                    }, 1500);

                    // Execute the callback with the detected barcode
                    onBarcodeDetected(barcodeText);

                    // *** KEY CHANGE FOR CONTINUOUS SCANNING ***
                    // Only close the scanner if the autoCloseOnScan prop is true.
                    if (autoCloseOnScan) {
                        setTimeout(() => {
                            cleanup(true);
                            onClose();
                        }, 1000);
                    }
                }
            } catch (decodeError) {
                // This is normal, means no barcode was found in the current frame.
            }
        }, 100); // Scan every 100ms

        return () => {
            if (scanningIntervalRef.current) {
                clearInterval(scanningIntervalRef.current);
            }
        };
    }, [isScanning, isPaused, isZxingLoaded, onBarcodeDetected, onClose, autoCloseOnScan]);


    // --- Event Handlers ---
    const handleClose = () => {
        setIsScanning(false);
        cleanup(true);
        onClose();
    };

    const handleRetry = () => {
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
            await track.applyConstraints({ advanced: [{ torch: newTorchState }] });
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
                            <FaCamera />
                            <span>Scan Barcode</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            {torchSupported && (
                                <button
                                    onClick={handleToggleTorch}
                                    className={`p-2 rounded-full transition-colors ${isTorchOn ? 'bg-yellow-400 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                                    title="Toggle Flashlight"
                                >
                                    <FaLightbulb />
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
                                title="Close Scanner"
                            >
                                <FaTimes />
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

                    {/* Overlays: Loading, Error, Success */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-4">
                            <FaSpinner className="text-4xl mb-4 animate-spin" />
                            <p className="text-lg">Starting Camera...</p>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white text-center p-4">
                            <FaExclamationTriangle className="text-red-500 text-4xl mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Scanner Error</h3>
                            <p className="text-gray-300 mb-6 max-w-sm">{error}</p>
                            <button onClick={handleRetry} className="flex items-center gap-2 bg-blue-600 py-2 px-5 rounded-lg hover:bg-blue-700">
                                <FaRedo />
                                <span>Try Again</span>
                            </button>
                        </div>
                    )}
                    {successMessage && (
                        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-20 max-w-xs text-center">
                            <p className="font-semibold">{successMessage}</p>
                        </div>
                    )}

                    {/* Scanning Overlay */}
                    {isScanning && !error && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="relative w-11/12 max-w-sm h-48">
                                <div className={`w-full h-full border-4 border-dashed rounded-lg transition-colors ${isPaused ? 'border-yellow-500' : 'border-green-500 animate-pulse'}`} />
                                <div className="absolute -bottom-8 left-0 right-0 text-center">
                                    <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                                        {isPaused ? 'Scan successful!' : 'Point camera at barcode'}
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
                                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-colors ${isPaused ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
                                title={isPaused ? "Resume Scanning" : "Pause Scanning"}
                            >
                                {isPaused ? <FaPlay /> : <FaPause />}
                                <span className="text-sm font-medium">{isPaused ? 'Resume' : 'Pause'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default BarcodeScanner;
