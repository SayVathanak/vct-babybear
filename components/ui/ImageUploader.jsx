import React, { useRef } from 'react';
import Image from 'next/image';
import { Upload, Trash2, AlertCircle } from 'lucide-react';

const ImageUploader = ({ previews, error, onImageChange, onRemoveImage }) => {
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onImageChange(files);
        }
        e.target.value = null; // Reset input for re-uploading the same file
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Product Images <span className="text-red-500">*</span></label>
                <span className="text-xs text-gray-500">{previews.length} of 5</span>
            </div>
            <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square bg-white rounded-md border border-gray-200 overflow-hidden">
                            <Image src={preview.url} alt={`Product image ${index + 1}`} className="object-cover" fill />
                            <button
                                type="button"
                                onClick={() => onRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                             {index === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 text-center">Main</div>}
                        </div>
                    ))}
                    {previews.length < 5 && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md bg-white text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                        >
                            <Upload className="h-6 w-6 mb-1" />
                            <span className="text-xs">Add Image</span>
                        </button>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
                {error && <p className="text-red-500 text-xs flex items-center mt-2"><AlertCircle className="h-3 w-3 mr-1" />{error}</p>}
            </div>
        </div>
    );
};

export default ImageUploader;