'use client';
import React, { useRef } from 'react';
import { FileText, Eye, Printer } from 'lucide-react';

const InvoiceGenerator = ({ order, currency, user, companyLogo }) => {
    const invoiceRef = useRef(null);
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
    // IMPORTANT: Inline styles are harder to make responsive. Consider moving more styles to CSS classes.
    const InvoiceContent = ({ ref: contentRef }) => (
        <div
            ref={contentRef}
            // Removed fixed width here. max-w-[210mm] and mx-auto are handled by Tailwind/global styles
            // The `minHeight` is primarily for print layout, doesn't need to be responsive
            className="invoice-print-area bg-white mx-auto p-4 md:p-10 lg:p-[40px]" // Use Tailwind for responsive padding
            style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                minHeight: '1123px', // Keep for print layout consistency
                background: 'white',
                color: '#000',
                boxSizing: 'border-box',
                position: 'relative',
            }}
        >
            {/* Header */}
            <div className="invoice-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', marginBottom: '30px', borderBottom: '1px solid #eee' }}>
                <div className="header-left-text" style={{ textAlign: 'left', width: '30%', flex: '0 0 30%' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>BABY Bear</div>
                    <div style={{ fontSize: '14px', color: '#555' }}>Serve Baby's Need</div>
                </div>
                <div className="header-logo-container" style={{ textAlign: 'center', width: '40%', flex: '0 0 40%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    {companyLogo && (
                        <img
                            src={companyLogo.src}
                            alt="Company Logo"
                            style={{ width: '180px', height: '180px', objectFit: 'contain', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                            className="company-logo" // Add a class for responsive image styling
                        />
                    )}
                </div>
                <div className="header-right-address" style={{ textAlign: 'right', width: '30%', flex: '0 0 30%' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '700', margin: '0 0 20px 0', color: '#000' }}>INVOICE</h1>
                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                        078 333 929<br />
                        St 230, Beoung Salang,<br />
                        Toul Kork, Phnom Penh<br />
                    </div>
                </div>
            </div>

            {/* Bill To & Invoice Details */}
            <div className="invoice-details-flex" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div className="bill-to-section">
                    <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', color: '#888' }}>BILLED TO:</h3>
                    <div style={{ fontSize: '15px', lineHeight: '1.5' }}>
                        <div style={{ fontWeight: '600' }}>{order.address?.fullName || 'N/A'}</div>
                        <div>{order.address?.area || 'N/A'}, {order.address?.state || 'N/A'}</div>
                        <div>{order.address?.phoneNumber || 'N/A'}</div>
                    </div>
                </div>
                <div className="invoice-meta-section" style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>Invoice No.</span> {getInvoiceNumber(order._id, order.date)}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                        {formatDate(order.date)}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="table-responsive-container" style={{ marginBottom: '32px' }}>
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
            <div className="totals-container-flex" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
                <div className="totals-table-wrapper" style={{ width: '280px' }}>
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

    // Improved print function
    const handlePrint = () => {
        try {
            const printContent = invoiceRef.current;
            if (printContent) {
                const printWindow = window.open('', '_blank');
                const printDocument = printWindow.document;
                printDocument.write(`
                    <html>
                        <head>
                            <title>Invoice - ${getInvoiceNumber(order._id, order.date)}</title>
                            <style>
                                @page { size: A4; margin: 0.5in; }
                                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: white; color: black; }
                                img { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                                * { box-sizing: border-box; }
                                /* Add responsive styles for print as well if needed, but typically print is fixed A4 */
                            </style>
                        </head>
                        <body>
                            ${printContent.innerHTML}
                        </body>
                    </html>
                `);
                printDocument.close();
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                    }, 250);
                };
            } else {
                window.print();
            }
        } catch (error) {
            console.error('Print error:', error);
            window.print();
        }
    };

    const { time: currentTime } = formatDateTime(new Date());

    return (
        <>
            {/* GLOBAL STYLES FOR RESPONSIVENESS AND PRINTING */}
            <style jsx global>{`
                /* Base styles for the invoice preview area */
                .invoice-print-area {
                    width: 100%; /* Make it fluid by default */
                    max-width: 210mm; /* Limit max width for desktop view */
                    box-shadow: 0 0 10px rgba(0,0,0,0.1); /* Add a subtle shadow for preview */
                }

                /* Mobile-specific styles (e.g., for screens smaller than 768px) */
                @media (max-width: 767px) {
                    .invoice-print-area {
                        padding: 15px; /* Reduce padding on small screens */
                    }

                    /* Header Layout */
                    .invoice-header-flex {
                        flex-direction: column; /* Stack logo and address vertically */
                        align-items: center !important; /* Center items for a stacked look */
                        text-align: center !important;
                    }

                    .header-left-text,
                    .header-logo-container,
                    .header-right-address {
                        width: 100% !important; /* Make each section take full width */
                        flex: 0 0 100% !important; /* Override flex basis */
                        text-align: center !important; /* Center text */
                        margin-bottom: 20px; /* Add space between stacked sections */
                    }

                    .company-logo {
                        width: 120px !important; /* Smaller logo on mobile */
                        height: 120px !important;
                    }

                    .header-right-address h1 {
                        font-size: 36px !important; /* Smaller INVOICE text */
                        margin-bottom: 10px !important;
                    }
                    .header-right-address div {
                        font-size: 13px !important; /* Smaller address text */
                    }

                    /* Bill To & Invoice Details Layout */
                    .invoice-details-flex {
                        flex-direction: column; /* Stack Bill To and Invoice Meta */
                        align-items: flex-start; /* Align text to the left */
                        margin-bottom: 20px;
                    }
                    .invoice-details-flex > div { /* Target bill-to-section and invoice-meta-section */
                        width: 100% !important; /* Full width for each section */
                        text-align: left !important; /* Ensure left alignment */
                        margin-bottom: 15px; /* Add space between sections */
                    }
                    .invoice-meta-section {
                        margin-top: 15px; /* Space from bill-to when stacked */
                    }

                    /* Table Responsiveness */
                    .table-responsive-container {
                        overflow-x: auto; /* Enable horizontal scrolling for the table */
                        -webkit-overflow-scrolling: touch; /* Smoother scrolling on iOS */
                        margin-bottom: 20px;
                    }
                    table {
                        min-width: 600px; /* Ensure table has a minimum width to enable scroll if content is wide */
                        /* You could also implement the "card" layout for tables here
                           as demonstrated in the previous detailed response, if horizontal scroll isn't enough */
                    }
                    .product-table th, .product-table td {
                        padding: 8px 10px !important; /* Slightly less padding */
                        font-size: 13px !important; /* Smaller font for table content */
                    }

                    /* Totals Section */
                    .totals-container-flex {
                        justify-content: center !important; /* Center totals on mobile */
                        margin-top: 20px !important;
                    }
                    .totals-table-wrapper {
                        width: 90% !important; /* Make totals table take more width */
                        max-width: 300px; /* But don't make it too wide */
                    }
                    .totals-table-wrapper td {
                        font-size: 14px !important; /* Smaller font for totals */
                    }

                    /* Footer */
                    .invoice-print-area > div:last-child { /* Targets the footer div */
                        position: static !important; /* Remove absolute positioning */
                        padding-top: 15px !important;
                        left: auto !important;
                        right: auto !important;
                        bottom: auto !important;
                    }
                }

                /* Print styles - Keep these separate as they are for physical paper */
                @media print {
                    @page { size: A4; margin: 0.5in; }
                    body * { visibility: hidden; }
                    .invoice-print-area, .invoice-print-area * { visibility: visible; }
                    /* Make sure .invoice-print-area is not restricted by max-width for print */
                    .invoice-print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        color: black !important;
                        transform: none !important;
                        box-shadow: none !important; /* Remove shadow for print */
                        padding: 0.5in !important; /* Set print margins here */
                        max-width: none !important; /* Crucial for print to expand */
                    }
                    .no-print { display: none !important; }
                    img { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    table { border-collapse: collapse !important; }
                    th, td { border-color: black !important; }

                    /* Reset any mobile-specific flex-direction changes for print */
                    .invoice-header-flex, .invoice-details-flex {
                        flex-direction: row !important; /* Back to row for print */
                        align-items: flex-start !important;
                        text-align: left !important;
                    }
                    .header-left-text, .header-logo-container, .header-right-address {
                        width: 30% !important; /* Restore desktop widths for print */
                        flex: 0 0 30% !important;
                        text-align: left !important;
                        margin-bottom: 0 !important;
                    }
                    .header-right-address {
                        text-align: right !important;
                    }
                     .header-logo-container {
                        text-align: center !important;
                    }
                    .company-logo {
                        width: 180px !important; /* Restore desktop logo size for print */
                        height: 180px !important;
                    }
                    .header-right-address h1 {
                        font-size: 48px !important;
                    }
                    .header-right-address div {
                        font-size: 14px !important;
                    }
                    .bill-to-section, .invoice-meta-section {
                        width: auto !important; /* Let content dictate width for print */
                        text-align: left !important;
                        margin-bottom: 0 !important;
                    }
                     .invoice-meta-section {
                        margin-top: 0 !important;
                    }
                    .table-responsive-container {
                        overflow-x: visible !important; /* No horizontal scroll on print */
                        margin-bottom: 32px !important;
                    }
                    .totals-container-flex {
                        justify-content: flex-end !important; /* Back to right for print */
                        margin-top: 40px !important;
                    }
                    .totals-table-wrapper {
                        width: 280px !important; /* Restore desktop width for print */
                    }
                    .totals-table-wrapper td {
                        font-size: 15px !important;
                    }
                }
            `}</style>

            {/* Viewport meta tag is typically in your main layout/html file.
                If not, you'd add it here, but Next.js usually handles this. */}
            {/* If you were adding it here, it would look like this:
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            But it's better placed in `pages/_document.js` or your main `layout.js` if using App Router.
            For 'use client' component, it's assumed the parent document handles it.
            */}

            <div className="mt-4">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 sm:p-5 flex flex-row items-center justify-between gap-4">
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

                        <div className="flex">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200 font-medium"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
                        <div className="no-print p-4 flex justify-between items-center border-b">
                            <h2 className="text-lg font-bold text-gray-800">Invoice Preview</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 text-xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* The InvoiceContent is here, its responsiveness is now handled by the global styles */}
                            <InvoiceContent ref={invoiceRef} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InvoiceGenerator;