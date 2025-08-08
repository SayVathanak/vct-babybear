// components/ABAKHQRManager.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Upload,
  X,
  Save,
  Image as ImageIcon,
  Trash2,
  Eye,
  Copy,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

const ABAKHQRManager = () => {
  const { getToken } = useAppContext();
  
  const [currentKHQR, setCurrentKHQR] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '001 223 344',
    accountName: 'SAY SAKSOPHANNA',
    bankName: 'ABA Bank',
    isActive: true
  });

  useEffect(() => {
    fetchCurrentKHQR();
  }, []);

  const fetchCurrentKHQR = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get('/api/settings/aba-khqr', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setCurrentKHQR(data.khqr);
        if (data.bankDetails) {
          setBankDetails(data.bankDetails);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ABA KHQR:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load current ABA KHQR');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a JPG or PNG image file');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewFile({
        file,
        preview: reader.result,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewFile?.file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('khqr', previewFile.file);
      formData.append('bankDetails', JSON.stringify(bankDetails));

      const token = await getToken();
      const { data } = await axios.post('/api/settings/aba-khqr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (data.success) {
        setCurrentKHQR(data.khqr);
        setPreviewFile(null);
        toast.success('ABA KHQR uploaded successfully!');
        
        const fileInput = document.getElementById('khqr-upload');
        if (fileInput) fileInput.value = '';
      } else {
        toast.error(data.message || 'Failed to upload ABA KHQR');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload ABA KHQR');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentKHQR) return;
    
    if (!confirm('Are you sure you want to delete the current ABA KHQR? This will disable ABA payments.')) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.delete('/api/settings/aba-khqr', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setCurrentKHQR(null);
        toast.success('ABA KHQR deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete ABA KHQR');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete ABA KHQR');
    }
  };

  const handleBankDetailsUpdate = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.put('/api/settings/aba-khqr/details', {
        bankDetails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success('Bank details updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update bank details');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update bank details');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading ABA KHQR settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {/* <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" /> */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">ABA Bank KHQR Management</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Upload and manage your ABA Bank KHQR code for payments</p>
            </div>
          </div>
          {currentKHQR && (
            <div className="flex items-center text-xs sm:text-sm text-green-600 flex-shrink-0 ml-2">
              <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
              Active
            </div>
          )}
        </div>

        <div className="mb-4 sm:mb-6">
          <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-3">Bank Account Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Account Number *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account number"
                />
                <button
                  onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account number')}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Account Name *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                  className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account name"
                />
                <button
                  onClick={() => copyToClipboard(bankDetails.accountName, 'Account name')}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bankDetails.isActive}
                onChange={(e) => setBankDetails(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="ml-2 text-xs sm:text-sm text-gray-700">Enable ABA Bank Transfer payments</span>
            </label>
            <button
              onClick={handleBankDetailsUpdate}
              className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700 text-sm flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Save className="w-4 h-4" />
              Save Details
            </button>
          </div>
        </div>

        {currentKHQR && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 sm:gap-0">
              <h4 className="font-medium text-sm sm:text-base text-gray-900">Current KHQR Code</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Preview'}
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            {showPreview && (
              <div className="mb-4 flex justify-center">
                <div className="max-w-xs">
                  <img
                    src={currentKHQR.url}
                    alt="Current ABA KHQR"
                    className="w-full h-auto rounded-lg border shadow-sm"
                  />
                </div>
              </div>
            )}

            <div className="text-xs sm:text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Uploaded:</span> {new Date(currentKHQR.uploadedAt || Date.now()).toLocaleDateString()}</p>
              <p><span className="font-medium">Format:</span> {currentKHQR.format?.toUpperCase() || 'Unknown'}</p>
              <p><span className="font-medium">Size:</span> {formatFileSize(currentKHQR.size || 0)}</p>
            </div>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6">
          <div className="text-center">
            <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              {currentKHQR ? 'Upload New KHQR Code' : 'Upload ABA KHQR Code'}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Upload your ABA Bank KHQR code image. Supported formats: JPG, PNG (Max: 5MB)
            </p>

            {!previewFile ? (
              <div>
                <label htmlFor="khqr-upload" className="cursor-pointer">
                  <div className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4" />
                    Select KHQR Image
                  </div>
                </label>
                <input
                  id="khqr-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-center mb-3">
                    <img
                      src={previewFile.preview}
                      alt="KHQR Preview"
                      className="max-w-xs h-auto rounded-lg border"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    <p><span className="font-medium">File:</span> {previewFile.name}</p>
                    <p><span className="font-medium">Size:</span> {formatFileSize(previewFile.size)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Upload KHQR
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="bg-gray-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-blue-800">
              <h5 className="font-medium mb-1">Important Notes:</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload a clear, high-quality image of your ABA Bank KHQR code</li>
                <li>Make sure the QR code is fully visible and not cut off</li>
                <li>This KHQR will be displayed to customers during checkout for ABA payments</li>
                <li>Keep your bank account details up-to-date for smooth transactions</li>
                <li>You can update or replace the KHQR anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABAKHQRManager;