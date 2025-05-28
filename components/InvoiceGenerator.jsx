import React, { useState, useCallback, useMemo } from 'react';
import { Download, FileText, Loader, AlertCircle } from 'lucide-react';

const InvoiceGenerator = ({ order, currency, user }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Memoized formatters to prevent recreation on every render
    const formatDate = useCallback((dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }, []);

    const getInvoiceNumber = useCallback((orderId, date) => {
        const year = new Date(date).getFullYear();
        const orderShort = orderId.substring(orderId.length - 6).toUpperCase();
        return `INV-${year}-${orderShort}`;
    }, []);

    // Memoized invoice content to prevent HTML regeneration
    const invoiceContent = useMemo(() => {
        return `
            <div style="
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                background: white;
                color: #111827;
                line-height: 1.6;
            ">
                <!-- Header -->
                <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 30px; margin-bottom: 40px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h1 style="font-size: 32px; font-weight: 600; margin: 0 0 10px 0; letter-spacing: -0.025em;">INVOICE</h1>
                            <p style="font-size: 16px; margin: 0 0 10px 0; color: #4b5563;">Baby Bear</p>
                            <div style="font-size: 14px; color: #6b7280; line-height: 1.4;">
                                Street 230 Sangkat Beoung Salang<br/>
                                Khan Toul Kork, Phnom Penh<br/>
                                Phone: 078 333 929<br/>
                                Email: vct@babybear.com
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 10px;">
                                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Invoice #</div>
                                <div style="font-size: 18px; font-weight: 600;">${getInvoiceNumber(order._id, order.date)}</div>
                            </div>
                            <div style="font-size: 14px; color: #6b7280;">
                                Date: ${formatDate(order.date)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Customer & Order Info -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
                    <div>
                        <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #374151;">Bill To</h2>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <p style="font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">${order.address.fullName}</p>
                            <div style="color: #6b7280; font-size: 14px;">
                                ${order.address.area}, ${order.address.state}<br/>
                                ${order.address.phoneNumber}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #374151;">Order Details</h2>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px;">
                                <div style="color: #6b7280;">Order ID:</div>
                                <div style="font-weight: 500;">#${order._id.substring(order._id.length - 6)}</div>
                                
                                <div style="color: #6b7280;">Order Date:</div>
                                <div style="font-weight: 500;">${formatDate(order.date)}</div>
                                
                                <div style="color: #6b7280;">Status:</div>
                                <div style="font-weight: 500;">${order.status || 'Pending'}</div>
                                
                                <div style="color: #6b7280;">Payment:</div>
                                <div style="font-weight: 500;">Cash on Delivery</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Items Table -->
                <div style="margin-bottom: 40px;">
                    <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: #374151;">Order Items</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 14px;">Item</th>
                                <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #4b5563; font-size: 14px;">Unit Price</th>
                                <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #4b5563; font-size: 14px;">Qty</th>
                                <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #4b5563; font-size: 14px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map((item, idx) => `
                                <tr style="border-bottom: 1px solid #f3f4f6;">
                                    <td style="padding: 16px; color: #111827;">
                                        <div style="font-weight: 500;">${item.product.name}</div>
                                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">SKU: ${item.product._id.substring(0, 8)}</div>
                                    </td>
                                    <td style="padding: 16px; text-align: right; color: #374151;">
                                        ${currency}${item.product.offerPrice}
                                    </td>
                                    <td style="padding: 16px; text-align: right; color: #374151;">
                                        ${item.quantity}
                                    </td>
                                    <td style="padding: 16px; text-align: right; font-weight: 500; color: #111827;">
                                        ${currency}${(item.product.offerPrice * item.quantity).toFixed(2)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Totals -->
                <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
                    <div style="width: 300px;">
                        <div style="background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #4b5563;">
                                <span>Subtotal</span>
                                <span style="font-weight: 500; color: #111827;">${currency}${order.subtotal || order.amount}</span>
                            </div>
                            
                            ${order.promoCode && order.discount > 0 ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #10b981;">
                                <span>Discount${typeof order.promoCode === 'string' ? ` (${order.promoCode})` : order.promoCode?.code ? ` (${order.promoCode.code})` : ''}</span>
                                <span>-${currency}${order.discount.toFixed(2)}</span>
                            </div>
                            ` : ''}
                            
                            ${order.deliveryFee !== undefined ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #4b5563;">
                                <span>Delivery Fee</span>
                                <span style="color: #111827;">
                                    ${order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}
                                </span>
                            </div>
                            ` : ''}
                            
                            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; color: #111827;">
                                    <span>Total</span>
                                    <span>${currency}${(order.total || order.amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center; color: #6b7280; font-size: 14px;">
                    <p style="margin: 0 0 8px 0; font-weight: 500; color: #4b5563;">Thank you for your business!</p>
                    <p style="margin: 0 0 16px 0;">For questions about this invoice, contact us at orders@babybear.com or 078 333 929</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is a computer-generated invoice and does not require a signature.</p>
                </div>
            </div>
        `;
    }, [order, currency, formatDate, getInvoiceNumber]);

    // Check if PDF generation is supported
    const isPDFSupported = useCallback(() => {
        return typeof window !== 'undefined' && 
               typeof document !== 'undefined' &&
               window.navigator &&
               !window.navigator.userAgent.includes('jsdom');
    }, []);

    // Enhanced fallback text generator with better formatting
    const generateTextFallback = useCallback(() => {
        try {
            const textContent = `
INVOICE
=======

Invoice #: ${getInvoiceNumber(order._id, order.date)}
Date: ${formatDate(order.date)}

BILL TO:
--------
${order.address.fullName}
${order.address.area}, ${order.address.state}
${order.address.phoneNumber}

ORDER DETAILS:
--------------
Order ID: #${order._id.substring(order._id.length - 6)}
Order Date: ${formatDate(order.date)}
Status: ${order.status || 'Pending'}
Payment Method: Cash on Delivery

ITEMS ORDERED:
--------------
${order.items.map((item, idx) => 
    `${idx + 1}. ${item.product.name}
   Unit Price: ${currency}${item.product.offerPrice}
   Quantity: ${item.quantity}
   Total: ${currency}${(item.product.offerPrice * item.quantity).toFixed(2)}
   SKU: ${item.product._id.substring(0, 8)}
`).join('\n')}

SUMMARY:
--------
Subtotal: ${currency}${order.subtotal || order.amount}
${order.discount > 0 ? `Discount: -${currency}${order.discount.toFixed(2)}\n` : ''}${order.deliveryFee !== undefined ? `Delivery Fee: ${order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}\n` : ''}Total: ${currency}${(order.total || order.amount).toFixed(2)}

COMPANY INFORMATION:
--------------------
Baby Bear
Street 230 Sangkat Beoung Salang
Khan Toul Kork, Phnom Penh
Phone: 078 333 929
Email: vct@babybear.com

Thank you for your business!
For questions about this invoice, contact us at orders@babybear.com

---
This is a computer-generated invoice.
Generated on: ${new Date().toLocaleString()}
            `.trim();

            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice-${order._id.substring(order._id.length - 6)}-${new Date(order.date).toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Text fallback generation failed:', error);
            return false;
        }
    }, [order, currency, formatDate, getInvoiceNumber]);

    // Enhanced PDF generation with proper error handling and cleanup
    const generatePDF = useCallback(async () => {
        if (isGenerating) return;
        
        setIsGenerating(true);
        setError(null);

        // Early browser environment check
        if (!isPDFSupported()) {
            setError('PDF generation is not supported in this environment');
            if (generateTextFallback()) {
                setError('PDF not supported - text version downloaded instead');
            }
            setIsGenerating(false);
            return;
        }

        let tempDiv = null;
        let timeoutId = null;

        try {
            // Set timeout to prevent hanging
            timeoutId = setTimeout(() => {
                throw new Error('PDF generation timeout - please try again');
            }, 30000);

            // Dynamic imports with proper error handling
            const [jsPDFModule, html2canvasModule] = await Promise.allSettled([
                import('jspdf'),
                import('html2canvas')
            ]);

            if (jsPDFModule.status === 'rejected' || html2canvasModule.status === 'rejected') {
                throw new Error('Required PDF libraries are not available');
            }

            const jsPDF = jsPDFModule.value.default || jsPDFModule.value;
            const html2canvas = html2canvasModule.value.default || html2canvasModule.value;

            if (!jsPDF || !html2canvas) {
                throw new Error('PDF libraries failed to load properly');
            }

            // Create and configure temporary element
            tempDiv = document.createElement('div');
            tempDiv.innerHTML = invoiceContent;
            tempDiv.style.cssText = `
                position: absolute;
                left: -9999px;
                top: 0;
                width: 800px;
                background: white;
                visibility: hidden;
                pointer-events: none;
            `;
            
            document.body.appendChild(tempDiv);

            // Wait for fonts and images to load
            await new Promise(resolve => {
                const timer = setTimeout(resolve, 1000);
                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(() => {
                        clearTimeout(timer);
                        resolve();
                    });
                }
            });

            // Generate canvas with optimized settings
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: 800,
                height: tempDiv.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure consistent styling in cloned document
                    const clonedElement = clonedDoc.querySelector('div');
                    if (clonedElement) {
                        clonedElement.style.width = '800px';
                        clonedElement.style.backgroundColor = 'white';
                    }
                }
            });

            // Validate canvas
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error('Failed to generate canvas from content');
            }

            // Create PDF with proper dimensions
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Calculate scaling to fit content
            const ratio = Math.min(
                (pdfWidth - 20) / (imgWidth * 0.264583), // 20mm margins
                (pdfHeight - 20) / (imgHeight * 0.264583)
            );
            
            const finalWidth = imgWidth * 0.264583 * ratio;
            const finalHeight = imgHeight * 0.264583 * ratio;
            
            const x = (pdfWidth - finalWidth) / 2;
            const y = 10; // 10mm top margin

            // Convert canvas to image and add to PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);

            // Generate filename with date
            const orderShort = order._id.substring(order._id.length - 6);
            const date = new Date(order.date).toISOString().split('T')[0];
            const filename = `Invoice-${orderShort}-${date}.pdf`;

            // Save PDF
            pdf.save(filename);

            // Clear timeout if successful
            clearTimeout(timeoutId);

        } catch (error) {
            console.error('PDF generation error:', error);
            
            // Clear timeout on error
            if (timeoutId) clearTimeout(timeoutId);
            
            setError(error.message || 'Failed to generate PDF');
            
            // Try text fallback
            if (generateTextFallback()) {
                setError(prev => prev + ' - text version downloaded instead');
            }
        } finally {
            // Cleanup
            if (tempDiv && document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
            setIsGenerating(false);
        }
    }, [isGenerating, isPDFSupported, invoiceContent, generateTextFallback, order._id, order.date]);

    // Clear error after some time
    React.useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
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
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={generatePDF}
                            disabled={isGenerating}
                            className="flex items-center justify-center px-4 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors duration-200 font-medium w-full sm:w-auto"
                            aria-label={`Download invoice ${getInvoiceNumber(order._id, order.date)}`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    <span>Download Invoice</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={generateTextFallback}
                            className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors duration-200 font-medium w-full sm:w-auto"
                            aria-label="Download text version of invoice"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Text Version</span>
                        </button>
                    </div>
                </div>
                
                {error && (
                    <div className="border-t border-gray-200 bg-yellow-50 p-4">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-yellow-800">
                                    Notice
                                </p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceGenerator;