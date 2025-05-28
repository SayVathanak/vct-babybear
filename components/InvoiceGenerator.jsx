'use client';
import React, { useRef, useState } from 'react';
import { Download, FileText, Calendar, MapPin, Phone, Package, Heart, Baby } from 'lucide-react';

const InvoiceGenerator = ({ order, currency, user }) => {
    const invoiceRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getInvoiceNumber = (orderId, date) => {
        const year = new Date(date).getFullYear();
        const orderShort = orderId.substring(orderId.length - 6).toUpperCase();
        return `BST-${year}-${orderShort}`;
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            // For this demo, we'll create a downloadable HTML version
            // In a real implementation, you'd use jsPDF + html2canvas
            const invoiceContent = createInvoiceHTML();

            // Create blob and download
            const blob = new Blob([invoiceContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${getInvoiceNumber(order._id, order.date)}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating invoice. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const createInvoiceHTML = () => {
        const invoiceNumber = getInvoiceNumber(order._id, order.date);
        const orderDate = formatDate(order.date);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Comic Neue', 'Comic Sans MS', cursive, Arial, sans-serif;
            background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #dbeafe 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
            color: white;
            padding: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -10px;
            right: -10px;
            width: 100px;
            height: 100px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -20px;
            left: -20px;
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
            z-index: 1;
        }
        
        .company-info h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .company-info p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .invoice-info {
            text-align: right;
        }
        
        .invoice-info h2 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .invoice-info p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .billing-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .billing-info {
            background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%);
            padding: 20px;
            border-radius: 15px;
            border: 2px solid #f9a8d4;
        }
        
        .billing-info h3 {
            color: #ec4899;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .billing-info p {
            margin-bottom: 5px;
            color: #374151;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .items-table thead {
            background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
            color: white;
        }
        
        .items-table th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .items-table tbody tr:hover {
            background: #fdf2f8;
        }
        
        .items-table tbody tr:last-child td {
            border-bottom: none;
        }
        
        .summary-section {
            background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%);
            padding: 25px;
            border-radius: 15px;
            border: 2px solid #f9a8d4;
            margin-bottom: 30px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(236, 72, 153, 0.2);
        }
        
        .summary-row:last-child {
            border-bottom: none;
            font-weight: 700;
            font-size: 18px;
            color: #ec4899;
            padding-top: 15px;
            margin-top: 10px;
            border-top: 2px solid #ec4899;
        }
        
        .footer {
            background: linear-gradient(135deg, #f3e8ff 0%, #dbeafe 100%);
            padding: 25px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 2px solid #f9a8d4;
        }
        
        .thank-you {
            color: #ec4899;
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 10px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="header-content">
                <div class="company-info">
                    <h1>
                        👶 Baby Store Treasures
                    </h1>
                    <p>Your one-stop shop for baby essentials</p>
                    <p>📧 hello@babystoretreasures.com | 📞 +1 (555) 123-BABY</p>
                </div>
                <div class="invoice-info">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
                    <p><strong>Date:</strong> ${orderDate}</p>
                    <p><strong>Order ID:</strong> #${order._id.substring(order._id.length - 6)}</p>
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="billing-section">
                <div class="billing-info">
                    <h3>
                        🏠 Bill To
                    </h3>
                    <p><strong>${order.address.fullName}</strong></p>
                    <p>${order.address.area}</p>
                    <p>${order.address.state}</p>
                    <p>📞 ${order.address.phoneNumber}</p>
                </div>
                
                <div class="billing-info">
                    <h3>
                        💝 Order Details
                    </h3>
                    <p><strong>Payment Method:</strong> Cash on Delivery</p>
                    <p><strong>Order Status:</strong> ${order.status || 'Pending'}</p>
                    <p><strong>Items Count:</strong> ${order.items.length} item${order.items.length > 1 ? 's' : ''}</p>
                    ${order.promoCode ? `<p><strong>Promo Code:</strong> ${typeof order.promoCode === 'string' ? order.promoCode : order.promoCode?.code}</p>` : ''}
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>
                                <strong>${item.product.name}</strong>
                            </td>
                            <td>${item.quantity}</td>
                            <td>${currency}${item.product.offerPrice}</td>
                            <td>${currency}${(item.product.offerPrice * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="summary-section">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>${currency}${order.subtotal || order.amount}</span>
                </div>
                ${order.promoCode && order.discount > 0 ? `
                <div class="summary-row">
                    <span>Discount (${typeof order.promoCode === 'string' ? order.promoCode : order.promoCode?.code}):</span>
                    <span>-${currency}${order.discount.toFixed(2)}</span>
                </div>
                ` : ''}
                ${order.deliveryFee !== undefined ? `
                <div class="summary-row">
                    <span>Delivery Fee:</span>
                    <span>${order.deliveryFee === 0 ? 'Free' : `${currency}${order.deliveryFee.toFixed(2)}`}</span>
                </div>
                ` : ''}
                <div class="summary-row">
                    <span>Total Amount:</span>
                    <span>${currency}${(order.total || order.amount).toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="thank-you">
                Thank you for choosing Baby Store Treasures! 💕
            </div>
            <p>We hope you and your little one love your new treasures!</p>
            <p>Questions? Contact us at hello@babystoretreasures.com</p>
            <p style="margin-top: 15px; font-size: 12px;">
                This invoice was generated on ${new Date().toLocaleDateString()}
            </p>
        </div>
    </div>
</body>
</html>`;
    };

    return (
        <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-pink-500" />
                Invoice
            </h3>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900 mb-1">
                            Invoice #{getInvoiceNumber(order._id, order.date)}
                        </p>
                        <p className="text-sm text-gray-500">
                            Generated for Order #{order._id.substring(order._id.length - 6)}
                        </p>
                    </div>

                    <button
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium px-4 py-2 rounded-lg transition duration-300 shadow-lg disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Download Invoice
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-pink-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Invoice Date:</span>
                            <span className="ml-2 font-medium text-gray-900">{formatDate(order.date)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Amount:</span>
                            <span className="ml-2 font-medium text-pink-600">{currency}{(order.total || order.amount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceGenerator;