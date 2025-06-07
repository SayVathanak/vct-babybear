import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';

const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Initialize ZXing code reader
  useEffect(() => {
    const initializeCodeReader = async () => {
      try {
        // Dynamically import ZXing library
        const ZXing = await import('@zxing/library');
        
        // Create a new code reader instance
        codeReaderRef.current = new ZXing.BrowserMultiFormatReader();
        
        // Optional: Set hints for better performance
        const hints = new Map();
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
          ZXing.BarcodeFormat.CODE_128,
          ZXing.BarcodeFormat.CODE_39,
          ZXing.BarcodeFormat.EAN_13,
          ZXing.BarcodeFormat.EAN_8,
          ZXing.BarcodeFormat.UPC_A,
          ZXing.BarcodeFormat.UPC_E,
          ZXing.BarcodeFormat.QR_CODE,
          ZXing.BarcodeFormat.DATA_MATRIX,
        ]);
        
        codeReaderRef.current.setHints(hints);
      } catch (err) {
        console.error('Failed to initialize barcode reader:', err);
        setError('Failed to initialize barcode scanner. Please make sure @zxing/library is installed.');
      }
    };

    initializeCodeReader();

    return () => {
      // Cleanup code reader
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // Scan for barcodes in the video stream
  const scanBarcode = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current || !canvasRef.current || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Create luminance source from image data
      const ZXing = await import('@zxing/library');
      const luminanceSource = new ZXing.RGBLuminanceSource(
        imageData.data,
        canvas.width,
        canvas.height
      );
      
      const binaryBitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminanceSource));
      
      // Try to decode barcode
      const result = await codeReaderRef.current.decode(binaryBitmap);
      
      if (result && result.getText()) {
        // Barcode detected!
        onBarcodeDetected(result.getText());
        return true; // Success, stop scanning
      }
      
    } catch (err) {
      // No barcode found in this frame - this is expected and normal
      // Only log actual errors, not "not found" exceptions
      if (err.name !== 'NotFoundException') {
        console.warn('Barcode scanning error:', err.message);
      }
    } finally {
      setIsProcessing(false);
    }
    
    return false; // Continue scanning
  }, [onBarcodeDetected, isProcessing]);

  // Start continuous scanning
  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) return;
    
    scanIntervalRef.current = setInterval(async () => {
      const found = await scanBarcode();
      if (found) {
        // Stop scanning when barcode is found
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
      }
    }, 100); // Scan every 100ms
  }, [scanBarcode]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const startCamera = async () => {
      try {
        setError(null);
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported in this browser');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera if available
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!mounted) {
          // Component unmounted, stop the stream
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        
        // Wait for video element to be available
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('muted', 'true');
          
          videoRef.current.onloadedmetadata = () => {
            if (mounted && videoRef.current) {
              videoRef.current.play().then(() => {
                setIsScanning(true);
                // Start scanning after video starts playing
                setTimeout(startScanning, 1000);
              }).catch(err => {
                console.error('Error playing video:', err);
                setError('Failed to start camera preview');
              });
            }
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (mounted) {
          setError(err.message || 'Failed to access camera');
        }
      }
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(startCamera, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanning();
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startScanning, stopScanning]);

  const handleClose = () => {
    stopScanning();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  const handleManualScan = async () => {
    await scanBarcode();
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
                <FaCamera className="text-4xl mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Camera Error</p>
                <p className="text-sm opacity-75 mb-4">{error}</p>
                {error.includes('@zxing/library') && (
                  <div className="text-xs opacity-60 mb-4 p-3 bg-white bg-opacity-10 rounded">
                    <p>To install the required library, run:</p>
                    <code className="block mt-1">npm install @zxing/library</code>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  Close
                </button>
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
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white"></div>
                  
                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <FaSpinner className="animate-spin text-white text-xl" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Instructions and Controls */}
        <div className="p-4 text-center text-white">
          <p className="text-sm mb-4 opacity-75">
            {isScanning ? 'Scanning automatically...' : 'Position the barcode within the frame'}
          </p>
          
          {isScanning && !error && (
            <div className="space-y-2">
              <div className="text-xs opacity-60">
                Auto-scanning every 100ms
              </div>
              <button
                onClick={handleManualScan}
                disabled={isProcessing}
                className="px-6 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-2" />
                    Processing...
                  </>
                ) : (
                  'Manual Scan'
                )}
              </button>
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