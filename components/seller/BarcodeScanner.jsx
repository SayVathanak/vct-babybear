import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaCamera } from 'react-icons/fa';

const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

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
          
          // Fix the typo: setAttribute instead of setAtrribute
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('muted', 'true');
          
          videoRef.current.onloadedmetadata = () => {
            if (mounted && videoRef.current) {
              videoRef.current.play().catch(err => {
                console.error('Error playing video:', err);
                setError('Failed to start camera preview');
              });
              setIsScanning(true);
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
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Mock barcode detection (replace with actual barcode library like QuaggaJS or ZXing)
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // For demo purposes, generate a mock barcode
      // In real implementation, use a barcode detection library here
      const mockBarcode = Math.random().toString().substr(2, 12);
      onBarcodeDetected(mockBarcode);
      
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Failed to capture image');
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
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
                <p className="text-sm opacity-75">{error}</p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
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
                  <div className="w-64 h-40 border-2 border-white border-opacity-50 rounded-lg"></div>
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white"></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Instructions and Controls */}
        <div className="p-4 text-center text-white">
          <p className="text-sm mb-4 opacity-75">
            Position the barcode within the frame to scan
          </p>
          
          {isScanning && !error && (
            <button
              onClick={handleCapture}
              className="px-6 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              Capture & Scan
            </button>
          )}
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default BarcodeScanner;