import React, { useState, useRef, useEffect } from 'react';
import { FaCamera, FaStop, FaTimes, FaBarcode, FaExclamationTriangle } from 'react-icons/fa';

const EnhancedBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('unknown');
  const scannerRef = useRef(null);
  const quaggaRef = useRef(null);
  const streamRef = useRef(null);

  // Mock products for demonstration
  const mockProducts = [
    { _id: '1', name: 'Blush 06', barcode: '8901234390023' },
    { _id: '2', name: 'Baby Formula', barcode: '1234567890123' },
    { _id: '3', name: 'Test Product', barcode: '9876543210987' }
  ];

  // Check camera availability
  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasCamera(videoDevices.length > 0);
      setDebugInfo(`Found ${videoDevices.length} camera(s)`);
      
      // Check permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraPermission('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setHasCamera(false);
      setCameraPermission('denied');
      setDebugInfo(`Camera error: ${error.message}`);
    }
  };

  useEffect(() => {
    checkCameraAvailability();
  }, []);

  const loadQuagga = () => {
    return new Promise((resolve, reject) => {
      if (quaggaRef.current) {
        resolve(quaggaRef.current);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js';
      script.onload = () => {
        quaggaRef.current = window.Quagga;
        setDebugInfo('Quagga library loaded successfully');
        resolve(window.Quagga);
      };
      script.onerror = () => {
        const error = 'Failed to load Quagga library';
        setDebugInfo(error);
        reject(new Error(error));
      };
      document.head.appendChild(script);
    });
  };

  const initializeScanner = async () => {
    if (!scannerRef.current) {
      setScannerError('Scanner container not found');
      return;
    }

    try {
      const Quagga = await loadQuagga();
      
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 320, ideal: 640, max: 1920 },
            height: { min: 240, ideal: 480, max: 1080 },
            facingMode: "environment",
            aspectRatio: { min: 1, max: 2 }
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 2,
        frequency: 10,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true,
        debug: {
          showCanvas: true,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showRemainingPatchLabels: false,
          boxFromPatches: {
            showTransformed: true,
            showTransformedBox: true,
            showBB: true
          }
        }
      };

      Quagga.init(config, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          setScannerError(`Scanner initialization failed: ${err.message}`);
          setDebugInfo(`Init error: ${err.message}`);
          return;
        }
        
        setDebugInfo('Scanner initialized successfully');
        Quagga.start();
        setScannerError('');
        
        // Store stream reference for cleanup
        if (Quagga.CameraAccess && Quagga.CameraAccess.getActiveStream) {
          streamRef.current = Quagga.CameraAccess.getActiveStream();
        }
        
        // Listen for successful scans
        Quagga.onDetected(handleBarcodeDetected);
        
        // Listen for processing events for debugging
        Quagga.onProcessed((result) => {
          if (result && result.codeResult) {
            setDebugInfo(`Processing: ${result.codeResult.code || 'No code'}`);
          }
        });
      });
    } catch (error) {
      setScannerError(`Failed to initialize scanner: ${error.message}`);
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  const handleBarcodeDetected = (result) => {
    const code = result.codeResult.code;
    
    // Prevent duplicate scans
    if (code === lastScannedCode) return;
    
    setLastScannedCode(code);
    setDebugInfo(`Scanned: ${code}`);
    
    // Find product by barcode
    const product = mockProducts.find(p => p.barcode === code);
    
    if (product) {
      alert(`✅ Product Found: ${product.name} (${code})`);
    } else {
      alert(`❌ Product not found for barcode: ${code}`);
    }
    
    // Clear after delay to allow re-scanning
    setTimeout(() => setLastScannedCode(''), 2000);
  };

  const startScanning = async () => {
    if (cameraPermission === 'denied') {
      setScannerError('Camera permission denied. Please enable camera access and reload the page.');
      return;
    }
    
    if (!hasCamera) {
      setScannerError('No camera found on this device.');
      return;
    }
    
    setIsScanning(true);
    setScannerError('');
    setLastScannedCode('');
    setDebugInfo('Starting scanner...');
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      initializeScanner();
    }, 100);
  };

  const stopScanning = () => {
    if (quaggaRef.current) {
      try {
        quaggaRef.current.stop();
        setDebugInfo('Scanner stopped');
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsScanning(false);
    setScannerError('');
    setLastScannedCode('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const ScannerModal = () => (
    <div className={`fixed inset-0 z-50 ${isScanning ? 'flex' : 'hidden'} items-center justify-center bg-black bg-opacity-75`}>
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Barcode Scanner</h3>
          <button 
            onClick={stopScanning}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {scannerError ? (
          <div className="text-center py-8">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <div className="text-red-500 mb-4 text-sm">{scannerError}</div>
            <button 
              onClick={() => {
                setScannerError('');
                startScanning();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div 
              ref={scannerRef}
              className="w-full h-64 bg-black rounded-lg mb-4 overflow-hidden relative"
            >
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <FaCamera className="text-4xl mx-auto mb-2" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Point camera at barcode to scan
              </p>
              {debugInfo && (
                <p className="text-xs text-blue-600 mb-4 font-mono bg-blue-50 p-2 rounded">
                  {debugInfo}
                </p>
              )}
              <button 
                onClick={stopScanning}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <FaStop /> Stop Scanning
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Scanner Status</h2>
        <div className="space-y-2 text-sm">
          <p>Camera Available: <span className={hasCamera ? 'text-green-600' : 'text-red-600'}>{hasCamera ? '✅ Yes' : '❌ No'}</span></p>
          <p>Permission: <span className={cameraPermission === 'granted' ? 'text-green-600' : 'text-red-600'}>{cameraPermission}</span></p>
          <p>Scanner Active: <span className={isScanning ? 'text-green-600' : 'text-gray-600'}>{isScanning ? '✅ Yes' : '❌ No'}</span></p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Test Barcodes:</h3>
        <div className="space-y-2 text-sm">
          {mockProducts.map(product => (
            <div key={product._id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <FaBarcode />
              <span className="font-mono">{product.barcode}</span>
              <span className="text-gray-600">({product.name})</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={startScanning}
        disabled={isScanning || !hasCamera || cameraPermission === 'denied'}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <FaCamera /> 
        {isScanning ? 'Scanning...' : 'Start Barcode Scanner'}
      </button>

      {cameraPermission === 'denied' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">
            Camera permission is required. Please enable camera access in your browser settings and reload the page.
          </p>
        </div>
      )}

      <ScannerModal />
    </div>
  );
};

export default EnhancedBarcodeScanner;