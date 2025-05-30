// components/InvoiceGenerator.jsx
'use client';
import React, { useRef } from 'react';
import { Download, FileText, Loader } from 'lucide-react';

const InvoiceGenerator = ({ order, currency, user }) => {
    const invoiceRef = useRef(null);
    const [isGenerating, setIsGenerating] = React.useState(false);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getInvoiceNumber = (orderId, date) => {
        const year = new Date(date).getFullYear();
        const orderShort = orderId.substring(orderId.length - 6).toUpperCase();
        return `INV-${year}-${orderShort}`;
    };

    const generateImage = async () => {
        setIsGenerating(true);

        try {
            // Check browser environment
            if (typeof window === 'undefined') {
                throw new Error('Image generation only works in browser environment');
            }

            // Import html2canvas with timeout
            const loadLibrary = async () => {
                const timeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Library loading timeout')), 10000)
                );
                
                const loadPromise = import('html2canvas');
                
                return Promise.race([loadPromise, timeout]);
            };

            const html2canvasModule = await loadLibrary();
            const html2canvas = html2canvasModule.default;

            // Get device pixel ratio for sharp rendering
            const pixelRatio = window.devicePixelRatio || 1;
            const scaleFactor = Math.max(2, pixelRatio); // Minimum 2x for crisp text

            // Optimized HTML structure with pixel-perfect sizing
            const invoiceHTML = `
                <div id="invoice-content" style="
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    width: 794px;
                    min-height: 1123px;
                    padding: 40px;
                    background: white;
                    color: #000;
                    box-sizing: border-box;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                    font-feature-settings: 'kern' 1;
                    line-height: 1.4;
                ">
                    <!-- Header -->
                    <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.5px;">INVOICE</h1>
                                <div style="font-size: 15px; line-height: 1.5; font-weight: 400;">
                                    <div style="font-weight: 600; margin-bottom: 4px;">Baby Bear</div>
                                    <div>Street 230 Sangkat Beoung Salang</div>
                                    <div>Khan Toul Kork, Phnom Penh</div>
                                    <div>Phone: 078 333 929</div>
                                    <div>Email: vct@babybear.com</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="border: 2px solid #000; padding: 16px; margin-bottom: 12px; background: #f8f9fa;">
                                    <div style="font-size: 13px; margin-bottom: 6px; color: #666; font-weight: 500;">Invoice #</div>
                                    <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">${getInvoiceNumber(order._id, order.date)}</div>
                                </div>
                                <div style="font-size: 15px; font-weight: 500;">
                                    Date: ${formatDate(order.date)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Customer Info -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 32px; gap: 40px;">
                        <div style="flex: 1;">
                            <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">BILL TO</h3>
                            <div style="font-size: 15px; line-height: 1.5;">
                                <div style="font-weight: 600; margin-bottom: 4px;">${order.address.fullName}</div>
                                <div>${order.address.area}, ${order.address.state}</div>
                                <div>Phone: 0${order.address.phoneNumber}</div>
                            </div>
                        </div>
                        
                        <div style="flex: 1;">
                            <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">ORDER DETAILS</h3>
                            <div style="font-size: 15px; line-height: 1.6;">
                                <div style="margin-bottom: 4px;"><span style="font-weight: 600;">Order ID:</span> #${order._id.substring(order._id.length - 6)}</div>
                                <div style="margin-bottom: 4px;"><span style="font-weight: 600;">Date:</span> ${formatDate(order.date)}</div>
                                <div style="margin-bottom: 4px;"><span style="font-weight: 600;">Status:</span> ${order.status || 'Pending'}</div>
                                <div><span style="font-weight: 600;">Payment:</span> Cash on Delivery</div>
                            </div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div style="margin-bottom: 32px;">
                        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 14px;">
                            <thead>
                                <tr style="background-color: #f1f3f4;">
                                    <th style="border: 1px solid #000; padding: 12px 16px; text-align: left; font-weight: 700; font-size: 14px;">Item</th>
                                    <th style="border: 1px solid #000; padding: 12px 16px; text-align: right; font-weight: 700; font-size: 14px;">Unit Price</th>
                                    <th style="border: 1px solid #000; padding: 12px 16px; text-align: right; font-weight: 700; font-size: 14px;">Qty</th>
                                    <th style="border: 1px solid #000; padding: 12px 16px; text-align: right; font-weight: 700; font-size: 14px;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 12px 16px; vertical-align: top;">
                                            <div style="font-weight: 600; margin-bottom: 2px;">${item.product.name}</div>
                                        </td>
                                        <td style="border: 1px solid #000; padding: 12px 16px; text-align: right; font-weight: 500;">
                                            ${currency}${item.product.offerPrice}
                                        </td>
                                        <td style="border: 1px solid #000; padding: 12px 16px; text-align: right; font-weight: 500;">
                                            ${item.quantity}
                                        </td>
                                        <td style="border: 1px solid #000; padding: 12px 16px; text-align: right; font-weight: 700;">
                                            ${currency}${(item.product.offerPrice * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Totals -->
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
                        <div style="width: 320px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                <tr>
                                    <td style="padding: 8px 16px; text-align: right; font-weight: 600;">Subtotal:</td>
                                    <td style="padding: 8px 16px; text-align: right; font-weight: 700;">${currency}${(order.subtotal || order.amount).toFixed(2)}</td>
                                </tr>
                                ${order.promoCode && order.discount > 0 ? `
                                <tr style="color: #059669;">
                                    <td style="padding: 8px 16px; text-align: right; font-weight: 500;">Discount${typeof order.promoCode === 'string' ? ` (${order.promoCode})` : order.promoCode?.code ? ` (${order.promoCode.code})` : ''}:</td>
                                    <td style="padding: 8px 16px; text-align: right; font-weight: 600;">-${currency}${order.discount.toFixed(2)}</td>
                                </tr>
                                ` : ''}
                                ${order.deliveryFee !== undefined ? `
                                <tr>
                                    <td style="padding: 8px 16px; text-align: right; font-weight: 500;">Delivery Fee:</td>
                                    <td style="padding: 8px 16px; text-align: right; font-weight: 600;">
                                        ${order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}
                                    </td>
                                </tr>
                                ` : ''}
                                <tr style="border-top: 2px solid #000; background-color: #f8f9fa;">
                                    <td style="padding: 12px 16px; text-align: right; font-size: 17px; font-weight: 700;">TOTAL:</td>
                                    <td style="padding: 12px 16px; text-align: right; font-size: 17px; font-weight: 700;">${currency}${(order.total || order.amount).toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="border-top: 1px solid #d1d5db; padding-top: 24px; text-align: center; font-size: 13px; color: #6b7280;">
                        <p style="margin: 0 0 8px 0; font-weight: 600;">Thank you for your business!</p>
                        <p style="margin: 0 0 8px 0;">For questions, contact us at vct@babybear.com or 078 333 929</p>
                    </div>
                </div>
            `;

            // Create container with proper positioning
            const container = document.createElement('div');
            container.innerHTML = invoiceHTML;
            container.style.cssText = `
                position: fixed;
                top: -20000px;
                left: -20000px;
                width: 794px;
                background: white;
                z-index: -1000;
                pointer-events: none;
                transform: scale(1);
                transform-origin: top left;
            `;
            
            document.body.appendChild(container);
            const element = container.firstElementChild;

            // Wait for fonts and rendering
            await new Promise(resolve => setTimeout(resolve, 200));

            // High-quality html2canvas options for sharp text
            const canvas = await html2canvas(element, {
                scale: scaleFactor, // Use device pixel ratio or minimum 2x
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: 794,
                height: 1123,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 794,
                windowHeight: 1123,
                removeContainer: false, // Keep container until we're done
                imageTimeout: 8000,
                logging: false,
                letterRendering: true, // Better text rendering
                fontFaces: true, // Include custom fonts
                ignoreElements: (element) => {
                    // Skip elements that might cause issues
                    return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
                }
            });

            // Clean up container
            document.body.removeChild(container);

            // Convert canvas to high-quality PNG
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // Create download link
            const orderShort = order._id.substring(order._id.length - 6);
            const date = new Date(order.date).toISOString().split('T')[0];
            const filename = `Invoice-${orderShort}-${date}.png`;

            // Detect if on mobile/iOS for different download behavior
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                // For mobile devices, open image in new tab/window
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Invoice - ${filename}</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                                body { 
                                    margin: 0; 
                                    padding: 20px; 
                                    background: #f5f5f5; 
                                    text-align: center;
                                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                                }
                                img { 
                                    max-width: 100%; 
                                    height: auto; 
                                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                                    background: white;
                                }
                            </style>
                        </head>
                        <body>
                            <img src="${imgData}" alt="Invoice ${filename}" />
                        </body>
                        </html>
                    `);
                    newWindow.document.close();
                } else {
                    // Fallback if popup blocked
                    alert('Please allow popups for this site to download the invoice, or try the fallback method.');
                    throw new Error('Popup blocked');
                }
            } else {
                // Desktop download - works normally
                const link = document.createElement('a');
                link.href = imgData;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            console.error('PDF generation error:', error);
            
            // Improved fallback with better formatting
            const fallbackContent = `INVOICE
==========================================

Invoice #: ${getInvoiceNumber(order._id, order.date)}
Date: ${formatDate(order.date)}

COMPANY INFORMATION
Baby Bear
Street 230 Sangkat Beoung Salang
Khan Toul Kork, Phnom Penh
Phone: 078 333 929
Email: vct@babybear.com

BILL TO
==========================================
${order.address.fullName}
${order.address.area}, ${order.address.state}
Phone: ${order.address.phoneNumber}

ORDER DETAILS
==========================================
Order ID: #${order._id.substring(order._id.length - 6)}
Order Date: ${formatDate(order.date)}
Status: ${order.status || 'Pending'}
Payment Method: Cash on Delivery

ITEMS
==========================================
${order.items.map((item, index) => 
`${index + 1}. ${item.product.name}
   SKU: ${item.product._id.substring(0, 8)}
   Unit Price: ${currency}${item.product.offerPrice}
   Quantity: ${item.quantity}
   Total: ${currency}${(item.product.offerPrice * item.quantity).toFixed(2)}
`).join('\n')}

SUMMARY
==========================================
Subtotal: ${currency}${(order.subtotal || order.amount).toFixed(2)}
${order.discount > 0 ? `Discount: -${currency}${order.discount.toFixed(2)}\n` : ''}${order.deliveryFee !== undefined ? `Delivery Fee: ${order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}\n` : ''}
TOTAL: ${currency}${(order.total || order.amount).toFixed(2)}

==========================================
Thank you for your business!
For questions, contact: vct@babybear.com
==========================================`;

            const blob = new Blob([fallbackContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${order._id.substring(order._id.length - 6)}-${new Date(order.date).toISOString().split('T')[0]}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Show user-friendly error message
            const errorMsg = error.message.includes('timeout') 
                ? 'Image generation timed out. A text version has been downloaded instead.'
                : 'Image generation failed. A text version has been downloaded instead.';
            
            alert(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />a5
                Invoice
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <p className="font-medium text-gray-900 text-sm">
                            {getInvoiceNumber(order._id, order.date)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {formatDate(order.date)}
                        </p>
                    </div>
                    <button
                        onClick={generateImage}
                        disabled={isGenerating}
                        className="flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors duration-200 font-medium w-full sm:w-auto"
                    >
                        {isGenerating ? (
                            <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                <span>Generating Image...</span>
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                <span>Download Invoice</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceGenerator;