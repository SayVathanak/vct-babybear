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
            // Check if required libraries are available
            if (typeof window === 'undefined') {
                throw new Error('PDF generation only works in browser environment');
            }

            // Dynamic imports to ensure libraries are loaded
            const jsPDF = (await import('jspdf')).default;
            const html2canvas = (await import('html2canvas')).default;

            // Create invoice content with improved minimalist design
            const invoiceContent = `
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

            // Create temporary element
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = invoiceContent;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';
            tempDiv.style.width = '800px';
            tempDiv.style.background = 'white';
            
            document.body.appendChild(tempDiv);

            // Wait for fonts to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate canvas
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 800,
                scrollX: 0,
                scrollY: 0,
            });

            // Remove temporary element
            document.body.removeChild(tempDiv);

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
            
            const finalWidth = imgWidth * 0.264583 * ratio;
            const finalHeight = imgHeight * 0.264583 * ratio;
            
            const x = (pdfWidth - finalWidth) / 2;
            const y = 10;

            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

            // Generate filename
            const orderShort = order._id.substring(order._id.length - 6);
            const date = new Date(order.date).toISOString().split('T')[0];
            const filename = `Invoice-${orderShort}-${date}.pdf`;

            // Download
            pdf.save(filename);

        } catch (error) {
            console.error('Error generating PDF:', error);
            
            // Fallback: Generate a simple text-based invoice
            try {
                const fallbackContent = `
INVOICE
=======

Invoice #: ${getInvoiceNumber(order._id, order.date)}
Date: ${formatDate(order.date)}

Bill To:
--------
${order.address.fullName}
${order.address.area}, ${order.address.state}
${order.address.phoneNumber}

Order Details:
--------------
Order ID: #${order._id.substring(order._id.length - 6)}
Status: ${order.status || 'Pending'}
Payment Method: Cash on Delivery

Items:
------
${order.items.map(item => 
    `${item.product.name} - ${currency}${item.product.offerPrice} x ${item.quantity} = ${currency}${(item.product.offerPrice * item.quantity).toFixed(2)}`
).join('\n')}

Summary:
--------
Subtotal: ${currency}${order.subtotal || order.amount}
${order.discount > 0 ? `Discount: -${currency}${order.discount.toFixed(2)}\n` : ''}
${order.deliveryFee !== undefined ? `Delivery Fee: ${order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}\n` : ''}
Total: ${currency}${(order.total || order.amount).toFixed(2)}

Thank you for your business!
                `;

                const blob = new Blob([fallbackContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Invoice-${order._id.substring(order._id.length - 6)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                alert('PDF generation failed, but a text version has been downloaded instead.');
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                alert('Unable to generate invoice. Please check your browser settings and try again.');
            }
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
                                <span>Generating</span>
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