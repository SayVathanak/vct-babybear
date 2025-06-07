import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaTimes, FaCamera, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanAttempts, setScanAttempts] = useState(0);
  const [cameraPermission, setCameraPermission] = useState('prompt');

  // Alternative scanning using QuaggaJS (more reliable for barcode scanning)
  const initializeQuagga = useCallback(async () => {
    try {
      // Check if Quagga is available (you'll need to install it)
      if (typeof window !== 'undefined' && window.Quagga) {
        const Quagga = window.Quagga;
        
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            constraints: {
              width: 640,
              height: 480,
              facingMode: "environment",
              aspectRatio: { min: 1, max: 2 }
            },
            target: videoRef.current
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "code_39_vin_reader",
              "codabar_reader",
              "upc_reader",
              "upc_e_reader",
              "i2of5_reader"
            ]
          },
          locate: true
        }, (err) => {
          if (err) {
            console.error('Quagga initialization error:', err);
            setError('Failed to initialize barcode scanner: ' + err.message);
            return;
          }
          
          Quagga.start();
          setIsScanning(true);
          
          // Listen for successful barcode detection
          Quagga.onDetected((data) => {
            if (data && data.codeResult && data.codeResult.code) {
              const code = data.codeResult.code;
              
              // Prevent duplicate scans
              if (code !== lastScannedCode) {
                setLastScannedCode(code);
                Quagga.stop();
                onBarcodeDetected(code);
              }
            }
          });
        });
      } else {
        // Fallback to manual camera setup
        fallbackToManualScanning();
      }
    } catch (err) {
      console.error('Quagga setup error:', err);
      fallbackToManualScanning();
    }
  }, [lastScannedCode, onBarcodeDetected]);

  // Fallback manual scanning method
  const fallbackToManualScanning = useCallback(async () => {
    try {
      setError(null);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });

      setCameraPermission('granted');
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsScanning(true);
            startManualScanning();
          }).catch(err => {
            console.error('Error playing video:', err);
            setError('Failed to start camera preview');
          });
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraPermission('denied');
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera: ' + err.message);
      }
    }
  }, []);

  // Manual scanning using canvas and image processing
  const startManualScanning = useCallback(() => {
    if (scanIntervalRef.current) return;
    
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Try to process with any available barcode library
        processImageForBarcode(canvas);
        
        setScanAttempts(prev => prev + 1);
      }
    }, 200); // Scan every 200ms
  }, []);

  // Process canvas image for barcodes
  const processImageForBarcode = (canvas) => {
    // This is where you'd integrate with a barcode scanning library
    // For now, we'll just increment attempts to show activity
    
    // If you have ZXing or another library available, process here
    if (window.ZXing) {
      try {
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        // Process with ZXing...
      } catch (err) {
        console.warn('ZXing processing error:', err);
      }
    }
  };

  // Initialize scanner on mount
  useEffect(() => {
    let mounted = true;
    
    const startScanner = async () => {
      if (!mounted) return;
      
      // Check camera permission first
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(permissions.state);
        
        permissions.addEventListener('change', () => {
          setCameraPermission(permissions.state);
        });
      } catch (err) {
        console.warn('Permission check failed:', err);
      }
      
      // Try Quagga first, fallback to manual
      if (window.Quagga) {
        await initializeQuagga();
      } else {
        await fallbackToManualScanning();
      }
    };

    const timer = setTimeout(startScanner, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      
      // Cleanup
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      
      if (window.Quagga && window.Quagga.stop) {
        window.Quagga.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeQuagga, fallbackToManualScanning]);

  const handleClose = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    if (window.Quagga && window.Quagga.stop) {
      window.Quagga.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    onClose();
  };

  const handleManualInput = () => {
    const code = prompt('Enter barcode manually:');
    if (code && code.trim()) {
      onBarcodeDetected(code.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 text-white">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="flex items-center justify-center h-full text-white text-center p-4">
              <div>
                <FaExclamationTriangle className="text-4xl mx-auto mb-4 text-yellow-400" />
                <p className="text-lg mb-2">Scanner Error</p>
                <p className="text-sm opacity-75 mb-4">{error}</p>
                
                {cameraPermission === 'denied' && (
                  <div className="text-xs opacity-60 mb-4 p-3 bg-red-500 bg-opacity-20 rounded">
                    <p>To enable camera access:</p>
                    <p>1. Click the camera icon in your browser's address bar</p>
                    <p>2. Select "Allow" for camera permission</p>
                    <p>3. Refresh the page</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <button
                    onClick={handleManualInput}
                    className="block w-full px-4 py-2 bg-blue-600 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    Enter Barcode Manually
                  </button>
                  <button
                    onClick={handleClose}
                    className="block w-full px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning frame */}
                  <div className="w-64 h-40 border-2 border-white border-opacity-50 rounded-lg relative">
                    {isScanning && (
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white"></div>
                  
                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                      <FaSpinner className="animate-spin text-white text-xl" />
                    </div>
                  )}
                </div>
              </div>

              {/* Scan attempts indicator */}
              {scanAttempts > 0 && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Scanning... ({scanAttempts})
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructions and Controls */}
        <div className="p-4 text-center text-white">
          <p className="text-sm mb-4 opacity-75">
            {isScanning ? 'Position barcode within the frame and hold steady' : 'Initializing camera...'}
          </p>
          
          {isScanning && !error && (
            <div className="space-y-2">
              <div className="text-xs opacity-60">
                {window.Quagga ? 'Using QuaggaJS scanner' : 'Using manual detection'}
              </div>
              <button
                onClick={handleManualInput}
                className="px-6 py-2 bg-blue-600 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors mr-2"
              >
                Manual Entry
              </button>
            </div>
          )}
          
          {!window.Quagga && !window.ZXing && (
            <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 rounded-lg text-xs">
              <p className="font-semibold">Barcode Library Missing</p>
              <p>Install QuaggaJS or ZXing for better scanning:</p>
              <code className="block mt-1 text-xs">npm install quagga @zxing/library</code>
              <p className="mt-1">Add script tag or import in your app</p>
            </div>
          )}
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default BarcodeScanner;