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

    const generatePDF = async () => {
        setIsGenerating(true);

        try {
            // Check browser environment
            if (typeof window === 'undefined') {
                throw new Error('PDF generation only works in browser environment');
            }

            // Import libraries with timeout
            const loadLibraries = async () => {
                const timeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Library loading timeout')), 10000)
                );
                
                const loadPromise = Promise.all([
                    import('jspdf'),
                    import('html2canvas')
                ]);
                
                return Promise.race([loadPromise, timeout]);
            };

            const [jsPDFModule, html2canvasModule] = await loadLibraries();
            const jsPDF = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            // Simplified HTML structure with better performance
            const invoiceHTML = `
                <div id="invoice-content" style="
                    font-family: Arial, sans-serif;
                    width: 794px;
                    min-height: 1123px;
                    padding: 40px;
                    background: white;
                    color: #000;
                    box-sizing: border-box;
                ">
                    <!-- Header -->
                    <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">INVOICE</h1>
                                <div style="font-size: 14px; line-height: 1.4;">
                                    <strong>Baby Bear</strong><br/>
                                    Street 230 Sangkat Beoung Salang<br/>
                                    Khan Toul Kork, Phnom Penh<br/>
                                    Phone: 078 333 929<br/>
                                    Email: vct@babybear.com
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="border: 1px solid #000; padding: 15px; margin-bottom: 10px;">
                                    <div style="font-size: 12px; margin-bottom: 5px;">Invoice #</div>
                                    <div style="font-size: 16px; font-weight: bold;">${getInvoiceNumber(order._id, order.date)}</div>
                                </div>
                                <div style="font-size: 14px;">
                                    Date: ${formatDate(order.date)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Customer Info -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                        <div style="width: 48%;">
                            <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px;">BILL TO</h3>
                            <div>
                                <strong>${order.address.fullName}</strong><br/>
                                ${order.address.area}, ${order.address.state}<br/>
                                Phone: ${order.address.phoneNumber}
                            </div>
                        </div>
                        
                        <div style="width: 48%;">
                            <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ORDER DETAILS</h3>
                            <div style="font-size: 14px; line-height: 1.6;">
                                <strong>Order ID:</strong> #${order._id.substring(order._id.length - 6)}<br/>
                                <strong>Date:</strong> ${formatDate(order.date)}<br/>
                                <strong>Status:</strong> ${order.status || 'Pending'}<br/>
                                <strong>Payment:</strong> Cash on Delivery
                            </div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div style="margin-bottom: 30px;">
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                            <thead>
                                <tr style="background-color: #f0f0f0;">
                                    <th style="border: 1px solid #000; padding: 10px; text-align: left; font-weight: bold;">Item</th>
                                    <th style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">Unit Price</th>
                                    <th style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">Qty</th>
                                    <th style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 10px;">
                                            <strong>${item.product.name}</strong><br/>
                                            <small>SKU: ${item.product._id.substring(0, 8)}</small>
                                        </td>
                                        <td style="border: 1px solid #000; padding: 10px; text-align: right;">
                                            ${currency}${item.product.offerPrice}
                                        </td>
                                        <td style="border: 1px solid #000; padding: 10px; text-align: right;">
                                            ${item.quantity}
                                        </td>
                                        <td style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">
                                            ${currency}${(item.product.offerPrice * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Totals -->
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                        <div style="width: 300px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 5px 10px; text-align: right;"><strong>Subtotal:</strong></td>
                                    <td style="padding: 5px 10px; text-align: right; font-weight: bold;">${currency}${order.subtotal || order.amount}</td>
                                </tr>
                                ${order.promoCode && order.discount > 0 ? `
                                <tr style="color: green;">
                                    <td style="padding: 5px 10px; text-align: right;">Discount${typeof order.promoCode === 'string' ? ` (${order.promoCode})` : order.promoCode?.code ? ` (${order.promoCode.code})` : ''}:</td>
                                    <td style="padding: 5px 10px; text-align: right;">-${currency}${order.discount.toFixed(2)}</td>
                                </tr>
                                ` : ''}
                                ${order.deliveryFee !== undefined ? `
                                <tr>
                                    <td style="padding: 5px 10px; text-align: right;">Delivery Fee:</td>
                                    <td style="padding: 5px 10px; text-align: right;">
                                        ${order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}
                                    </td>
                                </tr>
                                ` : ''}
                                <tr style="border-top: 2px solid #000;">
                                    <td style="padding: 10px; text-align: right; font-size: 16px;"><strong>TOTAL:</strong></td>
                                    <td style="padding: 10px; text-align: right; font-size: 16px; font-weight: bold;">${currency}${(order.total || order.amount).toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="border-top: 1px solid #ccc; padding-top: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p style="margin: 0 0 10px 0; font-weight: bold;">Thank you for your business!</p>
                        <p style="margin: 0 0 10px 0;">For questions, contact us at orders@babybear.com or 078 333 929</p>
                        <p style="margin: 0;">This is a computer-generated invoice.</p>
                    </div>
                </div>
            `;

            // Create and append element more efficiently
            const container = document.createElement('div');
            container.innerHTML = invoiceHTML;
            container.style.cssText = `
                position: fixed;
                top: -10000px;
                left: 0;
                width: 794px;
                background: white;
                z-index: -1;
            `;
            
            document.body.appendChild(container);
            const element = container.firstElementChild;

            // Short delay for rendering
            await new Promise(resolve => setTimeout(resolve, 100));

            // Optimized html2canvas options
            const canvas = await html2canvas(element, {
                scale: 1.5, // Reduced from 2 for better performance
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: 794,
                height: 1123,
                scrollX: 0,
                scrollY: 0,
                removeContainer: true,
                imageTimeout: 5000 // 5 second timeout
            });

            // Clean up immediately
            document.body.removeChild(container);

            // Create PDF efficiently
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with compression
            
            // Calculate dimensions
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgAspectRatio = canvas.height / canvas.width;
            const pdfAspectRatio = pdfHeight / pdfWidth;

            let imgWidth, imgHeight, x, y;

            if (imgAspectRatio > pdfAspectRatio) {
                // Image is taller, fit to height
                imgHeight = pdfHeight - 20; // 10mm margin
                imgWidth = imgHeight / imgAspectRatio;
                x = (pdfWidth - imgWidth) / 2;
                y = 10;
            } else {
                // Image is wider, fit to width
                imgWidth = pdfWidth - 20; // 10mm margin
                imgHeight = imgWidth * imgAspectRatio;
                x = 10;
                y = (pdfHeight - imgHeight) / 2;
            }

            pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

            // Generate filename and download
            const orderShort = order._id.substring(order._id.length - 6);
            const date = new Date(order.date).toISOString().split('T')[0];
            const filename = `Invoice-${orderShort}-${date}.pdf`;

            pdf.save(filename);

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
For questions, contact: orders@babybear.com
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
                ? 'PDF generation timed out. A text version has been downloaded instead.'
                : 'PDF generation failed. A text version has been downloaded instead.';
            
            alert(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };

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
                    <button
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className="flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors duration-200 font-medium w-full sm:w-auto"
                    >
                        {isGenerating ? (
                            <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                <span>Generating PDF...</span>
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