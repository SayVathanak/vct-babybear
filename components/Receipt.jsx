'use client'
import React, { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';
import { Download, Share2, Printer, X, CheckCircle } from 'lucide-react';

// Default store details - in a real app, this would come from a database or context
const defaultStoreDetails = {
  name: "Baby Bear",
  address: "St 230, Toul Kork, Phnom Penh",
  phone: "078 223 444",
  logo: "/icons/logo.svg",
  website: "vct-babybear.vercel.app"
};

const Receipt = ({ order, user, currency, onClose, storeDetails = defaultStoreDetails }) => {
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('');
  const receiptRef = useRef(null);

  // Generate Barcode on mount
  useEffect(() => {
    if (order?.orderId) {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, order.orderId, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: false
      });
      setBarcodeDataUrl(canvas.toDataURL("image/png"));
    }
  }, [order?.orderId]);

  // --- Action Handlers ---

  const handleDownloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null // Use element's background
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // A4 page is 210mm wide. We'll use 190mm for content with margins.
    const pdfWidth = 190;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const pdfHeight = pdfWidth / ratio;

    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
    pdf.save(`receipt-${order.orderId}.pdf`);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href; // In a real app, this would be a dedicated receipt page URL
    const shareData = {
      title: `Your Receipt from ${storeDetails.name}`,
      text: `View your receipt for order #${order.orderId.slice(-6)}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Sharing failed:", error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert("Receipt link copied to clipboard!"))
        .catch(() => alert("Could not copy link."));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Render Logic ---

  if (!order) return null;

  // Calculations
  const subtotal = order.items.reduce((sum, item) => sum + (item.product.originalPrice * item.quantity), 0);
  const totalDiscount = subtotal - order.amount; // A simple way to show discount if offerPrice was used

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
            /* This rule encourages the browser to print images and colors precisely */
            img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact; /* For older Chrome/Safari browsers */
            }
            
            body * { visibility: hidden; }
            .receipt-print-area, .receipt-print-area * { visibility: visible; }
            .receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-100 rounded-2xl w-full max-w-md max-h-[95vh] flex flex-col">
          {/* Header & Close Button */}
          <header className="no-print p-4 flex justify-between items-center text-gray-500">
             <h2 className="text-lg font-bold text-gray-800">Sale Completed</h2>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
               <X size={24} />
             </button>
          </header>

          {/* Receipt Content */}
          <div ref={receiptRef} className="receipt-print-area flex-1 overflow-y-auto bg-white p-6 font-mono">
            {/* Store Header */}
            <div className="text-center mb-6">
              {storeDetails.logo && <img src={storeDetails.logo} alt="Store Logo" className="w-16 h-16 mx-auto mb-2" />}
              <h2 className="text-2xl font-semibold">{storeDetails.name}</h2>
              <p className="text-sm text-gray-600">{storeDetails.address}</p>
              <p className="text-sm text-gray-600">{storeDetails.phone}</p>
            </div>

            {/* Barcode */}
            {barcodeDataUrl && (
              <div className="mb-6">
                <img src={barcodeDataUrl} alt="Receipt Barcode" className="mx-auto h-16"/>
              </div>
            )}

            {/* Order Info */}
            <div className="text-xs text-gray-700 mb-4">
              <div className="flex justify-between">
                <span>Date: {new Date(order.date).toLocaleDateString()}</span>
                <span>Time: {new Date(order.date).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Receipt #: {order.orderId.slice(-8)}</span>
                <span>Cashier: {user?.name || 'Baby Bear'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-b border-dashed border-gray-400 py-4">
              <h3 className="font-semibold text-center mb-2">ITEMS PURCHASED</h3>
              {order.items.map(item => (
                <div key={item.product._id} className="text-xs mb-2">
                  <p className="font-semibold">{item.product.name}</p>
                  <div className="flex justify-between">
                    <span>{item.quantity} x {currency}{item.product.offerPrice.toFixed(2)}</span>
                    <span>{currency}{(item.quantity * item.product.offerPrice).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{currency}{order.amount.toFixed(2)}</span>
              </div>
              {totalDiscount > 0.01 && (
                <div className="flex justify-between text-green-600">
                  <span >Discount:</span>
                  <span>-{currency}{totalDiscount.toFixed(2)}</span>
                </div>
              )}
               <div className="flex justify-between">
                <span className="text-gray-600">Tax (incl.):</span>
                <span>{currency}0.00</span>
              </div>
              <div className="border-t border-gray-300 my-2"></div>
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL:</span>
                <span>{currency}{order.amount.toFixed(2)}</span>
              </div>
            </div>
             
             {/* Payment Info */}
             <div className="border-t border-dashed border-gray-400 py-4 text-center">
                 <div className="flex items-center justify-center gap-2 font-bold text-green-600 text-2xl mb-2">
                     <CheckCircle size={28}/>
                     <span>PAID</span>
                 </div>
                 <p className="text-xs text-gray-600">Thank you for your purchase!</p>
             </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-4">
              <p>{storeDetails.returnPolicy}</p>
              <p>Visit us online at {storeDetails.website}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <footer className="no-print bg-gray-100 p-4 grid grid-cols-3 gap-3">
            <button onClick={handleDownloadPDF} className="flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow hover:bg-gray-50">
              <Download size={20} className="text-blue-600"/>
              <span className="text-xs mt-1 font-semibold">Download</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow hover:bg-gray-50">
              <Share2 size={20} className="text-green-600"/>
              <span className="text-xs mt-1 font-semibold">Share</span>
            </button>
            <button onClick={handlePrint} className="flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow hover:bg-gray-50">
              <Printer size={20} className="text-gray-700"/>
              <span className="text-xs mt-1 font-semibold">Print</span>
            </button>
          </footer>
           <div className="no-print p-4">
             <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Start New Sale</button>
           </div>
        </div>
      </div>
    </>
  );
};

export default Receipt;