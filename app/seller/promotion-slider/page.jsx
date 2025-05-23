'use client'
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { Upload, X, Edit2, Trash2, Eye, EyeOff, Save, Plus } from "lucide-react";

const HeaderSliderManager = () => {
    const { getToken } = useAppContext();

    const [sliders, setSliders] = useState([]);
    const [editingSlider, setEditingSlider] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        isActive: true
    });
    const [files, setFiles] = useState({
        imgSrcSm: null,
        imgSrcMd: null
    });
    const [previewUrls, setPreviewUrls] = useState({
        imgSrcSm: null,
        imgSrcMd: null
    });

    const fetchSliders = async () => {
        try {
            const { data } = await axios.get('/api/slider/list');
            if (data.success) {
                setSliders(data.sliders);
            }
        } catch (error) {
            toast.error('Failed to fetch sliders');
        }
    };

    useEffect(() => {
        fetchSliders();
    }, []);

    const handleFileChange = (type, file) => {
        if (file) {
            setFiles(prev => ({ ...prev, [type]: file }));
            setPreviewUrls(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
        }
    };

    const removeFile = (type) => {
        setFiles(prev => ({ ...prev, [type]: null }));
        setPreviewUrls(prev => ({ ...prev, [type]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingSlider && (!files.imgSrcSm || !files.imgSrcMd)) {
            toast.error('Please upload both mobile and desktop images');
            return;
        }

        setIsUploading(true);
        const submitFormData = new FormData();

        submitFormData.append('isActive', formData.isActive);

        if (files.imgSrcSm) submitFormData.append('imgSrcSm', files.imgSrcSm);
        if (files.imgSrcMd) submitFormData.append('imgSrcMd', files.imgSrcMd);

        if (editingSlider) {
            submitFormData.append('sliderId', editingSlider._id);
        }

        try {
            const token = await getToken();
            const endpoint = editingSlider ? '/api/slider/update' : '/api/slider/add';

            const { data } = await axios.post(endpoint, submitFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                resetForm();
                fetchSliders();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (slider) => {
        setEditingSlider(slider);
        setFormData({
            isActive: slider.isActive
        });
        setFiles({ imgSrcSm: null, imgSrcMd: null });
        setPreviewUrls({ imgSrcSm: null, imgSrcMd: null });
        setShowForm(true);
    };

    const handleDelete = async (sliderId) => {
        if (!confirm('Are you sure you want to delete this slider?')) return;

        try {
            const token = await getToken();
            const { data } = await axios.delete(`/api/slider/delete/${sliderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                fetchSliders();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to delete slider');
        }
    };

    const toggleSliderStatus = async (sliderId, currentStatus) => {
        try {
            const token = await getToken();
            const { data } = await axios.patch(`/api/slider/toggle/${sliderId}`,
                { isActive: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(`Slider ${!currentStatus ? 'activated' : 'deactivated'}`);
                fetchSliders();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to update slider status');
        }
    };

    const resetForm = () => {
        setEditingSlider(null);
        setFormData({ isActive: true });
        setFiles({ imgSrcSm: null, imgSrcMd: null });
        setPreviewUrls({ imgSrcSm: null, imgSrcMd: null });
        setShowForm(false);

        // Clear any existing preview URLs to prevent memory leaks
        Object.values(previewUrls).forEach(url => {
            if (url) URL.revokeObjectURL(url);
        });
    };

    const ImageUploadBox = ({ type, label, file, previewUrl, existingImage }) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {!file && !existingImage && (
                <label htmlFor={type} className="cursor-pointer block">
                    <input
                        type="file"
                        id={type}
                        hidden
                        accept="image/*"
                        onChange={(e) => handleFileChange(type, e.target.files[0])}
                    />
                    <div className="w-full h-20 sm:h-24 md:h-32 lg:h-36 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-400 mb-1 md:mb-2" />
                        <p className="text-gray-500 text-xs sm:text-sm md:text-base text-center px-2">
                            Upload {label.toLowerCase()}
                        </p>
                    </div>
                </label>
            )}

            {(file || existingImage) && (
                <div className="relative group">
                    <div className="w-full h-20 sm:h-24 md:h-32 lg:h-36 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                            src={previewUrl || existingImage}
                            alt={`${label} preview`}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeFile(type)}
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white p-1 sm:p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md"
                    >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    {!file && existingImage && (
                        <label htmlFor={type} className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
                            <input
                                type="file"
                                id={type}
                                hidden
                                accept="image/*"
                                onChange={(e) => handleFileChange(type, e.target.files[0])}
                            />
                            <button
                                type="button"
                                className="bg-blue-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm hover:bg-blue-600 transition-colors shadow-md"
                            >
                                Change
                            </button>
                        </label>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex-1 min-h-screen bg-gray-50">
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 space-y-4 sm:space-y-5 lg:space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div>
                            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                                Promotion Sliders
                            </h1>
                            <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1">
                                Manage your website promotion sliders
                            </p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium shadow-md"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden xs:inline">Add Slider</span>
                            <span className="xs:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* Upload Form */}
                {showForm && (
                    <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 md:p-6">
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                                    {editingSlider ? 'Edit Slider' : 'Add New Slider'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>

                            {/* Image Uploads */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                                <ImageUploadBox
                                    type="imgSrcSm"
                                    label="Mobile Image"
                                    file={files.imgSrcSm}
                                    previewUrl={previewUrls.imgSrcSm}
                                    existingImage={editingSlider?.imgSrcSm}
                                />
                                <ImageUploadBox
                                    type="imgSrcMd"
                                    label="Desktop Image"
                                    file={files.imgSrcMd}
                                    previewUrl={previewUrls.imgSrcMd}
                                    existingImage={editingSlider?.imgSrcMd}
                                />
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor="isActive" className="text-sm sm:text-base font-medium text-gray-700 cursor-pointer">
                                    Active (Show on website)
                                </label>
                            </div>

                            {/* Submit Button */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium shadow-md text-sm sm:text-base"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>{editingSlider ? 'Update' : 'Add'} Slider</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Existing Sliders */}
                <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 lg:mb-6 gap-2 sm:gap-3">
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                            Existing Sliders
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                                {sliders.length} total
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                                {sliders.filter(s => s.isActive).length} active
                            </span>
                        </div>
                    </div>

                    {sliders.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 lg:py-16">
                            <Upload className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-500 text-sm sm:text-base lg:text-lg font-medium">No sliders found</p>
                            <p className="text-gray-400 text-xs sm:text-sm lg:text-base mt-1">
                                Add your first slider to get started
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                            {sliders.map((slider) => (
                                <div key={slider._id} className="border rounded-lg p-3 sm:p-4 lg:p-5 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${slider.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {slider.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className="text-xs sm:text-sm text-gray-500">
                                                {new Date(slider.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <button
                                                onClick={() => toggleSliderStatus(slider._id, slider.isActive)}
                                                className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                title={slider.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {slider.isActive ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(slider)}
                                                className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(slider._id)}
                                                className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                        {slider.imgSrcSm && (
                                            <div>
                                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
                                                    Mobile Version
                                                </p>
                                                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
                                                    <Image
                                                        src={slider.imgSrcSm}
                                                        alt="Mobile slider"
                                                        width={300}
                                                        height={169}
                                                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {slider.imgSrcMd && (
                                            <div>
                                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
                                                    Desktop Version
                                                </p>
                                                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
                                                    <Image
                                                        src={slider.imgSrcMd}
                                                        alt="Desktop slider"
                                                        width={300}
                                                        height={169}
                                                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeaderSliderManager;