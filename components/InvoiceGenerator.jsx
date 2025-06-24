// components/InvoiceGenerator.jsx
'use client';
import React, { useRef } from 'react';
import { Download, FileText, Loader } from 'lucide-react';
import { assets } from '@/assets/assets';

const InvoiceGenerator = ({ order, currency, user, companyLogo }) => {
    const invoiceRef = useRef(null);
    const [isGenerating, setIsGenerating] = React.useState(false);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        const formattedDate = date.toLocaleDateString(undefined, dateOptions);
        const formattedTime = date.toLocaleTimeString(undefined, timeOptions);
        return { date: formattedDate, time: formattedTime };
    };

    const getInvoiceNumber = (orderId, date) => {
        const year = new Date(date).getFullYear();
        const orderShort = orderId.substring(orderId.length - 6).toUpperCase();
        return `INV-${year}-${orderShort}`;
    };

    const generateImage = async () => {
        setIsGenerating(true);

        try {
            if (typeof window === 'undefined') {
                throw new Error('Image generation only works in browser environment');
            }

            const html2canvasModule = await import('html2canvas');
            const html2canvas = html2canvasModule.default;

            const pixelRatio = window.devicePixelRatio || 1;
            const scaleFactor = Math.max(2, pixelRatio);

            const { date: invoiceDate, time: invoiceTime } = formatDateTime(new Date());

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
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; margin-bottom: 30px; border-bottom: 1px solid #eee;">
                        
                        <!-- Left Column - Company Info -->
                        <div style="text-align: left; width: 30%; flex: 0 0 30%;">
                            <div style="font-size: 24px; font-weight: bold;">BABY Bear</div>
                            <div style="font-size: 14px; color: #555;">Serve Baby's Need</div>
                        </div>

                        <!-- Center Column - Logo -->
                        <div style="text-align: center; width: 40%; flex: 0 0 40%; display: flex; justify-content: center; align-items: flex-start;">
                            ${companyLogo ? `
                                <img src="${companyLogo.src}" alt="Company Logo" style="
                                    width: 180px;
                                    height: 180px;
                                    object-fit: contain;
                                " />
                            ` : ''}
                        </div>

                        <!-- Right Column - Invoice Title & Contact -->
                        <div style="text-align: right; width: 30%; flex: 0 0 30%;">
                            <h1 style="font-size: 48px; font-weight: 700; margin: 0 0 20px 0; color: #000;">INVOICE</h1>
                            <div style="font-size: 14px; line-height: 1.4;">
                                078 333 929<br>
                                St 230, Beoung Salang,<br>
                                Toul Kork, Phnom Penh<br>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
                        <div>
                            <h3 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase; color: #888;">BILLED TO:</h3>
                            <div style="font-size: 15px; line-height: 1.5;">
                                <div style="font-weight: 600;">${order.address.fullName}</div>
                                <div>${order.address.area}, ${order.address.state}</div>
                                <div>0${order.address.phoneNumber}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="margin-bottom: 8px;">
                                <span style="font-weight: bold;">Invoice No.</span> ${getInvoiceNumber(order._id, order.date)}
                            </div>
                            <div style="margin-bottom: 4px;">
                                ${formatDate(order.date)}
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 32px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr>
                                    <th style="border-bottom: 2px solid #000; padding: 12px 16px; text-align: left; font-weight: 700;">Product</th>
                                    <th style="border-bottom: 2px solid #000; padding: 12px 16px; text-align: right; font-weight: 700;">Quantity</th>
                                    <th style="border-bottom: 2px solid #000; padding: 12px 16px; text-align: right; font-weight: 700;">Unit Price</th>
                                    <th style="border-bottom: 2px solid #000; padding: 12px 16px; text-align: right; font-weight: 700;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td style="border-bottom: 1px solid #ddd; padding: 12px 16px; vertical-align: top; font-weight: 600;">${item.product.name}</td>
                                        <td style="border-bottom: 1px solid #ddd; padding: 12px 16px; text-align: right;">${item.quantity}</td>
                                        <td style="border-bottom: 1px solid #ddd; padding: 12px 16px; text-align: right;">${currency}${(item.product.offerPrice || 0).toFixed(2)}</td>
                                        <td style="border-bottom: 1px solid #ddd; padding: 12px 16px; text-align: right; font-weight: 700;">${currency}${((item.product.offerPrice || 0) * item.quantity).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="display: flex; justify-content: flex-end; margin-top: 40px;">
                        <div style="width: 280px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                <tr>
                                    <td style="padding: 8px 16px; text-align: right;">Subtotal:</td>
                                    <td style="padding: 8px 16px; text-align: right; font-weight: 700;">${currency}${(order.subtotal || order.amount).toFixed(2)}</td>
                                </tr>
                                ${order.discount > 0 ? `
                                <tr>
                                    <td style="padding: 8px 16px; text-align: right;">Discount:</td>
                                    <td style="padding: 8px 16px; text-align: right;">-${currency}${order.discount.toFixed(2)}</td>
                                </tr>
                                ` : ''}
                                 <tr>
                                    <td style="padding: 8px 16px; text-align: right;">Tax (0%):</td>
                                    <td style="padding: 8px 16px; text-align: right;">${currency}0.00</td>
                                </tr>
                                <tr style="border-top: 2px solid #000;">
                                    <td style="padding: 12px 16px; text-align: right; font-size: 17px; font-weight: 700;">Total:</td>
                                    <td style="padding: 12px 16px; text-align: right; font-size: 17px; font-weight: 700;">${currency}${(order.total || order.amount).toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <div style="position: absolute; bottom: 40px; left: 40px; right: 40px; border-top: 1px solid #d1d5db; padding-top: 24px; text-align: center; font-size: 13px; color: #6b7280;">
                        <p style="margin: 0; font-weight: 600;">Thank you for your Business!</p>
                    </div>
                </div>
            `;

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
            `;

            document.body.appendChild(container);
            const element = container.firstElementChild;

            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = await html2canvas(element, {
                scale: scaleFactor,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                height: element.offsetHeight,
                scrollX: 0,
                scrollY: -window.scrollY,
                windowWidth: 794,
                windowHeight: element.offsetHeight,
                removeContainer: true,
            });

            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png', 1.0);
            const orderShort = order._id.substring(order._id.length - 6);
            const date = new Date(order.date).toISOString().split('T')[0];
            const filename = `Invoice-${orderShort}-${date}.png`;

            const link = document.createElement('a');
            link.href = imgData;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Image generation error:', error);
            alert('Failed to generate invoice image. A text fallback is not yet implemented in this version.');
        } finally {
            setIsGenerating(false);
        }
    };

    const { time: currentTime } = formatDateTime(new Date());

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
                        <p className="text-xs text-gray-400">
                            Created: {currentTime}
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