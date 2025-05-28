// components/InvoiceGenerator.jsx
'use client';
import React, { useRef } from 'react';
import { Download, FileText, Calendar, MapPin, Phone, Package } from 'lucide-react';

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

            // Create invoice content
            const invoiceContent = `
                <div style="
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    color: #333;
                    line-height: 1.6;
                ">
                    <!-- Header -->
                    <div style="border-bottom: 3px solid #333; padding-bottom: 30px; margin-bottom: 40px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h1 style="font-size: 36px; font-weight: bold; margin: 0 0 10px 0;">INVOICE</h1>
                                <p style="font-size: 18px; margin: 0 0 10px 0; color: #666;">Your Company Name</p>
                                <div style="font-size: 14px; color: #666; line-height: 1.4;">
                                    123 Business Street<br/>
                                    City, State 12345<br/>
                                    Phone: (555) 123-4567<br/>
                                    Email: orders@yourcompany.com
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="background: #333; color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                                    <div style="font-size: 12px;">Invoice #</div>
                                    <div style="font-size: 20px; font-weight: bold;">${getInvoiceNumber(order._id, order.date)}</div>
                                </div>
                                <div style="font-size: 14px; color: #666;">
                                    Date: ${formatDate(order.date)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Customer & Order Info -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                        <div>
                            <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0; color: #333;">Bill To</h2>
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                                <p style="font-weight: bold; margin: 0 0 10px 0; font-size: 16px;">${order.address.fullName}</p>
                                <div style="color: #666; font-size: 14px;">
                                    📍 ${order.address.area}, ${order.address.state}<br/>
                                    📞 ${order.address.phoneNumber}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0; color: #333;">Order Details</h2>
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                                <div style="margin-bottom: 8px;">
                                    <strong>Order ID:</strong> #${order._id.substring(order._id.length - 6)}
                                </div>
                                <div style="margin-bottom: 8px;">
                                    <strong>Order Date:</strong> ${formatDate(order.date)}
                                </div>
                                <div style="margin-bottom: 8px;">
                                    <strong>Status:</strong> ${order.status || 'Pending'}
                                </div>
                                <div>
                                    <strong>Payment Method:</strong> Cash on Delivery
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div style="margin-bottom: 40px;">
                        <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 20px 0; color: #333;">Order Items</h2>
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;">Item</th>
                                    <th style="padding: 15px; text-align: right; border-bottom: 1px solid #ddd; font-weight: bold;">Unit Price</th>
                                    <th style="padding: 15px; text-align: right; border-bottom: 1px solid #ddd; font-weight: bold;">Qty</th>
                                    <th style="padding: 15px; text-align: right; border-bottom: 1px solid #ddd; font-weight: bold;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map((item, idx) => `
                                    <tr style="background: ${idx % 2 === 0 ? 'white' : '#f8f9fa'};">
                                        <td style="padding: 15px; border-bottom: 1px solid #eee;">
                                            <div style="font-weight: bold;">${item.product.name}</div>
                                            <div style="font-size: 12px; color: #666;">SKU: ${item.product._id.substring(0, 8)}</div>
                                        </td>
                                        <td style="padding: 15px; text-align: right; border-bottom: 1px solid #eee;">
                                            ${currency}${item.product.offerPrice}
                                        </td>
                                        <td style="padding: 15px; text-align: right; border-bottom: 1px solid #eee;">
                                            ${item.quantity}
                                        </td>
                                        <td style="padding: 15px; text-align: right; font-weight: bold; border-bottom: 1px solid #eee;">
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
                            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span>Subtotal:</span>
                                    <span style="font-weight: bold;">${currency}${order.subtotal || order.amount}</span>
                                </div>
                                
                                ${order.promoCode && order.discount > 0 ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #28a745;">
                                    <span>Discount (${typeof order.promoCode === 'string' ? order.promoCode : order.promoCode?.code}):</span>
                                    <span>-${currency}${order.discount.toFixed(2)}</span>
                                </div>
                                ` : ''}
                                
                                ${order.deliveryFee !== undefined ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span>Delivery Fee:</span>
                                    <span style="font-weight: bold;">
                                        ${order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}
                                    </span>
                                </div>
                                ` : ''}
                                
                                <div style="border-top: 2px solid #333; padding-top: 15px; margin-top: 15px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                                        <span>Total:</span>
                                        <span>${currency}${(order.total || order.amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="border-top: 1px solid #ddd; padding-top: 30px; text-align: center; color: #666; font-size: 14px;">
                        <p style="margin: 0 0 10px 0; font-weight: bold;">Thank you for your business!</p>
                        <p style="margin: 0 0 20px 0;">For questions about this invoice, contact us at orders@yourcompany.com or (555) 123-4567</p>
                        <p style="margin: 0; font-size: 12px; color: #999;">This is a computer-generated invoice and does not require a signature.</p>
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
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Invoice
            </h3>
            <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900">
                            Invoice #{getInvoiceNumber(order._id, order.date)}
                        </p>
                        <p className="text-sm text-gray-500">
                            Generated for order placed on {formatDate(order.date)}
                        </p>
                    </div>
                    <button
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Download Invoice
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceGenerator;