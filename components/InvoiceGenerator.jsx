// components/InvoiceGenerator.jsx
'use client';
import React, { useRef } from 'react';
import { Download, FileText, Loader, Eye, Printer } from 'lucide-react';

const InvoiceGenerator = ({ order, currency, user, companyLogo }) => {
    const invoiceRef = useRef(null);
    const hiddenInvoiceRef = useRef(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [showPreview, setShowPreview] = React.useState(false);

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

    // Invoice content component to avoid duplication
    const InvoiceContent = ({ ref: contentRef, isHidden = false }) => (
        <div
            ref={contentRef}
            className={`invoice-print-area bg-white max-w-[210mm] mx-auto ${isHidden ? 'fixed -top-[9999px] left-0 opacity-0 pointer-events-none' : ''}`}
            style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                width: '794px',
                minHeight: '1123px',
                padding: '40px',
                background: 'white',
                color: '#000',
                boxSizing: 'border-box',
                position: isHidden ? 'fixed' : 'relative',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', marginBottom: '30px', borderBottom: '1px solid #eee' }}>
                {/* Left Column - Company Info */}
                <div style={{ textAlign: 'left', width: '30%', flex: '0 0 30%' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>BABY Bear</div>
                    <div style={{ fontSize: '14px', color: '#555' }}>Serve Baby's Need</div>
                </div>

                {/* Center Column - Logo */}
                <div style={{ textAlign: 'center', width: '40%', flex: '0 0 40%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    {companyLogo && (
                        <img 
                            src={companyLogo.src} 
                            alt="Company Logo" 
                            style={{
                                width: '180px',
                                height: '180px',
                                objectFit: 'contain',
                                printColorAdjust: 'exact',
                                WebkitPrintColorAdjust: 'exact'
                            }} 
                        />
                    )}
                </div>

                {/* Right Column - Invoice Title & Contact */}
                <div style={{ textAlign: 'right', width: '30%', flex: '0 0 30%' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '700', margin: '0 0 20px 0', color: '#000' }}>INVOICE</h1>
                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                        078 333 929<br />
                        St 230, Beoung Salang,<br />
                        Toul Kork, Phnom Penh<br />
                    </div>
                </div>
            </div>

            {/* Bill To & Invoice Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', color: '#888' }}>BILLED TO:</h3>
                    <div style={{ fontSize: '15px', lineHeight: '1.5' }}>
                        <div style={{ fontWeight: '600' }}>{order.address?.fullName || 'N/A'}</div>
                        <div>{order.address?.area || 'N/A'}, {order.address?.state || 'N/A'}</div>
                        <div>0{order.address?.phoneNumber || 'N/A'}</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>Invoice No.</span> {getInvoiceNumber(order._id, order.date)}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                        {formatDate(order.date)}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr>
                            <th style={{ borderBottom: '2px solid #000', padding: '12px 16px', textAlign: 'left', fontWeight: '700' }}>Product</th>
                            <th style={{ borderBottom: '2px solid #000', padding: '12px 16px', textAlign: 'right', fontWeight: '700' }}>Quantity</th>
                            <th style={{ borderBottom: '2px solid #000', padding: '12px 16px', textAlign: 'right', fontWeight: '700' }}>Unit Price</th>
                            <th style={{ borderBottom: '2px solid #000', padding: '12px 16px', textAlign: 'right', fontWeight: '700' }}>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item, index) => (
                            <tr key={index}>
                                <td style={{ borderBottom: '1px solid #ddd', padding: '12px 16px', verticalAlign: 'top', fontWeight: '600' }}>{item.product?.name || 'N/A'}</td>
                                <td style={{ borderBottom: '1px solid #ddd', padding: '12px 16px', textAlign: 'right' }}>{item.quantity || 0}</td>
                                <td style={{ borderBottom: '1px solid #ddd', padding: '12px 16px', textAlign: 'right' }}>{currency}{(item.product?.offerPrice || 0).toFixed(2)}</td>
                                <td style={{ borderBottom: '1px solid #ddd', padding: '12px 16px', textAlign: 'right', fontWeight: '700' }}>{currency}{((item.product?.offerPrice || 0) * (item.quantity || 0)).toFixed(2)}</td>
                            </tr>
                        )) || []}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
                <div style={{ width: '280px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 16px', textAlign: 'right' }}>Subtotal:</td>
                                <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: '700' }}>{currency}{(order.subtotal || order.amount || 0).toFixed(2)}</td>
                            </tr>
                            {(order.discount || 0) > 0 && (
                                <tr>
                                    <td style={{ padding: '8px 16px', textAlign: 'right' }}>Discount:</td>
                                    <td style={{ padding: '8px 16px', textAlign: 'right' }}>-{currency}{(order.discount || 0).toFixed(2)}</td>
                                </tr>
                            )}
                            <tr>
                                <td style={{ padding: '8px 16px', textAlign: 'right' }}>Tax (0%):</td>
                                <td style={{ padding: '8px 16px', textAlign: 'right' }}>{currency}0.00</td>
                            </tr>
                            <tr style={{ borderTop: '2px solid #000' }}>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '17px', fontWeight: '700' }}>Total:</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '17px', fontWeight: '700' }}>{currency}{(order.total || order.amount || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', borderTop: '1px solid #d1d5db', paddingTop: '24px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                <p style={{ margin: '0', fontWeight: '600' }}>Thank you for your Business!</p>
            </div>
        </div>
    );

    // Generate PDF function with improved error handling
    const generatePDF = async () => {
        const element = hiddenInvoiceRef.current;
        if (!element) {
            alert('Invoice content not found. Please try again.');
            return;
        }

        setIsGenerating(true);
        try {
            // Dynamic import for better compatibility
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: element.scrollWidth,
                height: element.scrollHeight,
                onclone: (clonedDoc) => {
                    // Ensure all styles are applied to the cloned document
                    const clonedElement = clonedDoc.querySelector('.invoice-print-area');
                    if (clonedElement) {
                        clonedElement.style.transform = 'scale(1)';
                        clonedElement.style.transformOrigin = 'top left';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.top = '0';
                        clonedElement.style.left = '0';
                        clonedElement.style.opacity = '1';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = 190; // A4 width minus margins
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            const pdfHeight = pdfWidth / ratio;

            // Handle pagination for tall content
            if (pdfHeight > 270) { // A4 height minus margins
                const scaledHeight = 270;
                const scaledWidth = scaledHeight * ratio;
                pdf.addImage(imgData, 'PNG', 10, 10, scaledWidth, scaledHeight);
            } else {
                pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
            }

            const orderShort = order._id.substring(order._id.length - 6);
            const date = new Date(order.date).toISOString().split('T')[0];
            const filename = `Invoice-${orderShort}-${date}.pdf`;
            
            pdf.save(filename);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert(`Failed to generate PDF: ${error.message}. Please try again or use the print option.`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Generate Image function with improved error handling
    const generateImage = async () => {
        setIsGenerating(true);
        try {
            if (typeof window === 'undefined') {
                throw new Error('Image generation only works in browser environment');
            }

            const element = hiddenInvoiceRef.current;
            if (!element) {
                throw new Error('Invoice content not found. Please try again.');
            }

            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                allowTaint: true,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('.invoice-print-area');
                    if (clonedElement) {
                        clonedElement.style.transform = 'scale(1)';
                        clonedElement.style.transformOrigin = 'top left';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.top = '0';
                        clonedElement.style.left = '0';
                        clonedElement.style.opacity = '1';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const orderShort = order._id.substring(order._id.length - 6);
            const date = new Date(order.date).toISOString().split('T')[0];
            const filename = `Invoice-${orderShort}-${date}.png`;

            // Create download link
            const link = document.createElement('a');
            link.href = imgData;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);

        } catch (error) {
            console.error('Image generation error:', error);
            alert(`Failed to generate invoice image: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Improved print function
    const handlePrint = () => {
        try {
            // Focus on the invoice content before printing
            const printContent = invoiceRef.current || hiddenInvoiceRef.current;
            if (printContent) {
                // Create a new window for printing
                const printWindow = window.open('', '_blank');
                const printDocument = printWindow.document;
                
                printDocument.write(`
                    <html>
                        <head>
                            <title>Invoice - ${getInvoiceNumber(order._id, order.date)}</title>
                            <style>
                                @page {
                                    size: A4;
                                    margin: 0.5in;
                                }
                                body {
                                    margin: 0;
                                    padding: 0;
                                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                                    background: white;
                                    color: black;
                                }
                                img {
                                    print-color-adjust: exact;
                                    -webkit-print-color-adjust: exact;
                                }
                                * {
                                    box-sizing: border-box;
                                }
                                .invoice-print-area {
                                    position: relative !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    opacity: 1 !important;
                                }
                            </style>
                        </head>
                        <body>
                            ${printContent.innerHTML}
                        </body>
                    </html>
                `);
                
                printDocument.close();
                
                // Wait for content to load, then print
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                    }, 250);
                };
            } else {
                // Fallback to regular print
                window.print();
            }
        } catch (error) {
            console.error('Print error:', error);
            // Fallback to regular print
            window.print();
        }
    };

    const { time: currentTime } = formatDateTime(new Date());

    return (
        <>
            {/* Enhanced Print styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0.5in;
                    }
                    
                    body * { 
                        visibility: hidden; 
                    }
                    
                    .invoice-print-area, 
                    .invoice-print-area * { 
                        visibility: visible; 
                    }
                    
                    .invoice-print-area { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important;
                        background: white !important;
                        color: black !important;
                        transform: none !important;
                    }
                    
                    .no-print { 
                        display: none !important; 
                    }
                    
                    img {
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    table {
                        border-collapse: collapse !important;
                    }
                    
                    th, td {
                        border-color: black !important;
                    }
                }
            `}</style>

            {/* Hidden invoice content for PDF/Image generation */}
            <InvoiceContent ref={hiddenInvoiceRef} isHidden={true} />

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
                        
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200 font-medium"
                                disabled={isGenerating}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </button>
                            
                            <button
                                onClick={generatePDF}
                                disabled={isGenerating}
                                className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors duration-200 font-medium"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        PDF
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={generateImage}
                                disabled={isGenerating}
                                className="flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors duration-200 font-medium"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Image
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="no-print p-4 flex justify-between items-center border-b">
                            <h2 className="text-lg font-bold text-gray-800">Invoice Preview</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md"
                                    disabled={isGenerating}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 text-xl font-bold"
                                    disabled={isGenerating}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <InvoiceContent ref={invoiceRef} isHidden={false} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InvoiceGenerator;