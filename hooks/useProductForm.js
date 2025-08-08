import { useState, useEffect, useMemo } from 'react';
import { validateBarcode, generateRandomBarcode, generateBarcodeFromName } from '@/utils/barcodeUtils';

export const useProductForm = (product, onSubmit) => {
    const [formData, setFormData] = useState({
        _id: product._id,
        name: product.name || '',
        price: product.price || 0,
        offerPrice: product.offerPrice || 0,
        category: product.category || 'PowderedMilk',
        isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
        description: product.description || '',
        barcode: product.barcode || '',
        stock: product.stock !== undefined ? product.stock : 0,
    });
    const [errors, setErrors] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [newImages, setNewImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    
    // Initialize image previews
    useEffect(() => {
        if (product.image && product.image.length > 0) {
            setImagePreviews(product.image.map(url => ({ url, isExisting: true })));
        }
    }, [product.image]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            imagePreviews.forEach(preview => {
                if (!preview.isExisting) URL.revokeObjectURL(preview.url);
            });
        };
    }, [imagePreviews]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const newFormData = { ...prev, [name]: newValue };
            // Automatically update availability based on stock
            if (name === 'stock') {
                const stockValue = Number(value);
                if (!isNaN(stockValue) && stockValue >= 0) {
                    newFormData.isAvailable = stockValue > 0;
                }
            }
            return newFormData;
        });

        setIsDirty(true);
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };
    
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
        if (parseFloat(formData.offerPrice) > parseFloat(formData.price)) newErrors.offerPrice = 'Offer price cannot be greater than regular price';
        if (!formData.description.trim()) newErrors.description = 'Product description is required';
        if (imagePreviews.length === 0) newErrors.image = 'At least one product image is required';
        if (formData.barcode && !validateBarcode(formData.barcode)) newErrors.barcode = 'Invalid EAN-13 barcode format.';
        if (formData.stock === '' || isNaN(formData.stock) || parseInt(formData.stock, 10) < 0) newErrors.stock = 'Stock must be a non-negative number.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const dataToSubmit = new FormData();
        Object.keys(formData).forEach(key => dataToSubmit.append(key, formData[key]));
        
        imagePreviews
            .filter(img => img.isExisting)
            .forEach(img => dataToSubmit.append('existingImages', img.url));

        newImages.forEach(file => dataToSubmit.append('newImages', file));

        onSubmit(dataToSubmit);
    };

    const discountPercentage = useMemo(() => {
        return formData.price > 0 && formData.offerPrice < formData.price
            ? Math.round(((formData.price - formData.offerPrice) / formData.price) * 100)
            : 0;
    }, [formData.price, formData.offerPrice]);
    
    // --- Image Handlers ---
    const handleImageChange = (files) => {
        if (imagePreviews.length + files.length > 5) {
            setErrors(p => ({ ...p, image: 'You can upload a maximum of 5 images.' }));
            return;
        }
        const newFilePreviews = files.map(file => ({ url: URL.createObjectURL(file), file, isExisting: false }));
        setNewImages(prev => [...prev, ...files]);
        setImagePreviews(prev => [...prev, ...newFilePreviews]);
        setIsDirty(true);
    };

    const handleRemoveImage = (indexToRemove) => {
        const removed = imagePreviews[indexToRemove];
        if (!removed.isExisting) {
            URL.revokeObjectURL(removed.url);
            setNewImages(prev => prev.filter(file => file !== removed.file));
        }
        setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
        setIsDirty(true);
    };

    // --- Barcode Handlers ---
    const handleGenerateBarcode = (type) => {
        const newBarcode = type === 'random' ? generateRandomBarcode() : generateBarcodeFromName(formData.name);
        if (newBarcode) {
            setFormData(prev => ({ ...prev, barcode: newBarcode }));
            setIsDirty(true);
            if (errors.barcode) setErrors(p => ({...p, barcode: ''}));
        } else {
             setErrors(p => ({...p, barcode: 'Product name is required to generate a barcode.'}));
        }
    };

    return {
        formData,
        setFormData,
        errors,
        isDirty,
        imagePreviews,
        discountPercentage,
        handleInputChange,
        handleSubmit,
        handleImageChange,
        handleRemoveImage,
        handleGenerateBarcode,
    };
};