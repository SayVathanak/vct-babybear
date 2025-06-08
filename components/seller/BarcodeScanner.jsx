'use client'
import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaCamera, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let currentStream = null;

    const initializeCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Request camera permission
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }

        // Import ZXing library dynamically
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        const codeReader = new BrowserMultiFormatReader();

        // Wait for video to be ready
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            setIsScanning(true);
            startScanning(codeReader);
          };
        }

      } catch (err) {
        console.error('Failed to initialize camera:', err);
        if (mounted) {
          let errorMessage = 'Failed to access camera';
          if (err.name === 'NotAllowedError') {
            errorMessage = 'Camera permission denied. Please allow camera access and try again.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'No camera found on this device.';
          } else if (err.name === 'NotSupportedError') {
            errorMessage = 'Camera not supported on this device.';
          }
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    const startScanning = (codeReader) => {
      if (!videoRef.current || !canvasRef.current) return;

      const scanCode = () => {
        if (!isScanning || !videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          // Try to decode barcode from canvas
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const result = codeReader.decodeFromImageData(imageData);
          
          if (result) {
            onBarcodeDetected(result.text);
            setIsScanning(false);
            return;
          }
        } catch (err) {
          // No barcode found, continue scanning
        }

        // Continue scanning
        if (mounted && isScanning) {
          scanIntervalRef.current = setTimeout(scanCode, 100);
        }
      };

      // Start scanning
      scanCode();
    };

    initializeCamera();

    return () => {
      mounted = false;
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current);
      }
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onBarcodeDetected, isScanning]);

  const handleClose = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  const retryInitialization = () => {
    setError(null);
    setIsLoading(true);
    // The useEffect will re-run and reinitialize
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaCamera />
            Scan Barcode
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Scanner Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Video element for camera feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Hidden canvas for processing */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Scanning overlay */}
        {isScanning && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-green-500 border-dashed rounded-lg w-64 h-40 flex items-center justify-center">
              <div className="text-green-500 text-center">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Scanning...</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center text-white">
              <FaSpinner className="animate-spin text-4xl mx-auto mb-4" />
              <p className="text-lg">Initializing camera...</p>
              <p className="text-sm text-gray-300 mt-2">Please allow camera access</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center text-white p-8">
              <FaExclamationTriangle className="text-4xl mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">Scanner Error</h3>
              <p className="text-gray-300 mb-6 max-w-md">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={retryInitialization}
                  className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="block w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close Scanner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isScanning && !isLoading && !error && (
        <div className="absolute bottom-8 left-4 right-4 z-10">
          <div className="bg-black bg-opacity-70 rounded-lg p-4 text-center text-white">
            <p className="text-sm">
              Point your camera at a barcode to scan it automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;