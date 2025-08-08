import React, { useState, useRef } from 'react';
import { Check, X, Package, EyeIcon, Download } from 'lucide-react';
import Barcode from 'react-barcode';

// Import Hooks & Reusable Components
import { useProductForm } from '@/hooks/useProductForm';
import Modal from '../ui/Modal'; 
import ConfirmationModal from '../ui/ConfirmationModal';
import ImageUploader from '../ui/ImageUploader';
import BarcodeManager from '../ui/BarcodeManager';
import ProductFormFields from '../presentational/ProductFormFields';
import ProductPreview from '../presentational/ProductPreview';

// A local component for the Barcode Preview, which could also be a separate file.
const BarcodePreviewModal = ({ isOpen, onClose, barcodeValue }) => {
    if (!isOpen) return null;
    const barcodeRef = useRef(null);

    // This logic would need to be fully implemented based on the original component
    const handleDownload = () => {
        const svgNode = barcodeRef.current?.querySelector('svg');
        if (!svgNode) return;
        
        const svgData = new XMLSerializer().serializeToString(svgNode);
        const canvas = document.createElement("canvas");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${barcodeValue || 'barcode'}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Product Barcode
                    </h3>
                    {/* Add the close button here */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="transition-colors duration-300 text-gray-400 rounded-md hover:text-gray-800"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div ref={barcodeRef} className="text-center p-4 my-4 bg-white">
                    <Barcode value={barcodeValue || ''} />
                </div>
                <button onClick={handleDownload} className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" /> Download PNG
                </button>
            </div>
        </Modal>
    );
};

// The Main Component
const QuickEditModal = ({ product, onClose, onSubmit, isSubmitting }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    const {
        formData,
        errors,
        isDirty,
        imagePreviews,
        discountPercentage,
        handleInputChange,
        handleSubmit,
        handleImageChange,
        handleRemoveImage,
        handleGenerateBarcode,
    } = useProductForm(product, onSubmit);

    const handleCancel = () => {
        if (isDirty) {
            setShowConfirmModal(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setShowConfirmModal(false);
        onClose();
    };

    const handleCancelClose = () => {
        setShowConfirmModal(false);
    };

    return (
        <>
            <Modal isOpen={true} onClose={handleCancel} maxWidth="max-w-4xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
                    <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-medium">Edit Product</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setShowPreview(!showPreview)} className="text-blue-600 text-sm flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" /> {showPreview ? 'Edit Mode' : 'Preview'}
                        </button>
                        <button onClick={handleCancel}><X className="h-5 w-5" /></button>
                    </div>
                </div>

                {/* Modal Body: Toggle between Form and Preview */}
                {showPreview ? (
                    <ProductPreview
                        formData={formData}
                        imagePreviews={imagePreviews}
                        discountPercentage={discountPercentage}
                    />
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 max-h-[80vh] overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Form Fields */}
                            <div className="flex flex-col gap-4">
                               <ProductFormFields 
                                    formData={formData}
                                    errors={errors}
                                    onInputChange={handleInputChange}
                                    discountPercentage={discountPercentage}
                               />
                            </div>
                            {/* Right Column: Image and Barcode */}
                            <div className="flex flex-col gap-4">
                               <ImageUploader 
                                    previews={imagePreviews}
                                    error={errors.image}
                                    onImageChange={handleImageChange}
                                    onRemoveImage={handleRemoveImage}
                               />
                               <BarcodeManager 
                                    value={formData.barcode}
                                    onChange={handleInputChange}
                                    error={errors.barcode}
                                    onGenerate={handleGenerateBarcode}
                                    onShowPreview={() => setShowBarcodeModal(true)}
                                    isNameEmpty={!formData.name.trim()}
                               />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 border-t pt-4 mt-6">
                            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50">
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Supporting Modals rendered outside the main modal flow */}
            <BarcodePreviewModal 
                isOpen={showBarcodeModal}
                onClose={() => setShowBarcodeModal(false)}
                barcodeValue={formData.barcode}
            />
            <ConfirmationModal
                isOpen={showConfirmModal}
                onConfirm={handleConfirmClose}
                onCancel={handleCancelClose}
                title="Unsaved Changes"
                message="You have unsaved changes. Are you sure you want to discard them?"
                confirmText="Discard"
                cancelText="Keep Editing"
            />
        </>
    );
};

export default QuickEditModal;