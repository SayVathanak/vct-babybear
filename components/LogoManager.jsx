import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Upload, X, Trash2, Save } from 'lucide-react';

const LogoManager = () => {
    const { getToken } = useAppContext();
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Fetch current logo on component mount
    useEffect(() => {
        fetchCurrentLogo();
    }, []);

    const fetchCurrentLogo = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/settings/logo');
            
            if (data.success && data.logo) {
                setCurrentLogo(data.logo);
            }
        } catch (error) {
            console.error('Error fetching logo:', error);
            // Don't show error toast for missing logo (it's normal)
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload only JPG, PNG, or SVG files');
                return;
            }

            // Validate file size (2MB)
            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.error('File size too large. Maximum size is 2MB');
                return;
            }

            setLogoFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile) {
            toast.error('Please select a logo file first');
            return;
        }

        try {
            setUploading(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append('logo', logoFile);

            const { data } = await axios.post('/api/settings/logo', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (data.success) {
                toast.success(data.message);
                setCurrentLogo(data.logo);
                setLogoFile(null);
                setLogoPreview(null);
                
                // Clear file input
                const fileInput = document.getElementById('logo-upload');
                if (fileInput) fileInput.value = '';
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Logo upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    const handleLogoDelete = async () => {
        if (!currentLogo) return;
        
        if (!confirm('Are you sure you want to delete the current logo?')) return;

        try {
            setLoading(true);
            const token = await getToken();
            
            const { data } = await axios.delete('/api/settings/logo', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                setCurrentLogo(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Logo deletion error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete logo');
        } finally {
            setLoading(false);
        }
    };

    const cancelUpload = () => {
        setLogoFile(null);
        setLogoPreview(null);
        const fileInput = document.getElementById('logo-upload');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Logo */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Logo</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center min-h-[120px] flex items-center justify-center">
                            {loading ? (
                                <div className="text-gray-500">
                                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p>Loading...</p>
                                </div>
                            ) : currentLogo ? (
                                <div className="relative">
                                    <Image
                                        src={currentLogo.url}
                                        alt="Current logo"
                                        width={currentLogo.width || 150}
                                        height={currentLogo.height || 50}
                                        className="max-w-full max-h-20 object-contain"
                                    />
                                    <button
                                        onClick={handleLogoDelete}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        title="Delete logo"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <Upload className="w-12 h-12 mx-auto mb-2" />
                                    <p>No logo uploaded</p>
                                </div>
                            )}
                        </div>
                        
                        {currentLogo && (
                            <div className="mt-2 text-xs text-gray-500">
                                <p>Size: {currentLogo.width}x{currentLogo.height}px</p>
                                <p>Format: {currentLogo.format?.toUpperCase()}</p>
                                <p>File size: {(currentLogo.size / 1024).toFixed(1)} KB</p>
                            </div>
                        )}
                    </div>

                    {/* Upload New Logo */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Upload New Logo</h4>
                        <div className="space-y-4">
                            {logoPreview && (
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Preview</span>
                                        <button
                                            onClick={cancelUpload}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-center">
                                        <Image
                                            src={logoPreview}
                                            alt="Logo preview"
                                            width={150}
                                            height={50}
                                            className="max-w-full max-h-20 object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="logo-upload" className="block">
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="sr-only"
                                    />
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm text-gray-600">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            PNG, JPG, SVG up to 2MB
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {logoFile && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleLogoUpload}
                                        disabled={uploading}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Upload Logo
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={cancelUpload}
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h5 className="text-sm font-medium text-yellow-800 mb-1">Logo Guidelines</h5>
                    <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• Recommended size: 200x60 pixels (will be auto-resized if larger)</li>
                        <li>• Use transparent background (PNG) for best results</li>
                        <li>• Keep text readable at smaller sizes</li>
                        <li>• Maximum file size: 2MB</li>
                        <li>• Supported formats: PNG, JPG, SVG</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LogoManager;