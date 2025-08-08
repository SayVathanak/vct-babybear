import React from 'react';
import { Hash, RefreshCw, EyeIcon, AlertCircle } from 'lucide-react';

const BarcodeManager = ({ value, onChange, error, onGenerate, onShowPreview, isNameEmpty }) => {
    return (
        <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm font-medium flex items-center" htmlFor="barcode">
                <Hash className="h-4 w-4 mr-1" /> Product Barcode <span className="text-gray-500 text-xs ml-1">(Optional)</span>
            </label>
            <div className="flex">
                <input
                    id="barcode"
                    name="barcode"
                    type="text"
                    placeholder="Enter product barcode/SKU"
                    className={`outline-none py-2 px-3 rounded-l border ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'} flex-1`}
                    onChange={onChange}
                    value={value}
                />
                <button
                    type="button"
                    onClick={() => onGenerate('random')}
                    className="flex items-center justify-center px-3 bg-blue-500 text-white rounded-r border border-blue-500 hover:bg-blue-600"
                    title="Generate unique barcode"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>
            <div className="flex gap-2 mt-1">
                 <button
                    type="button"
                    onClick={() => onGenerate('fromName')}
                    disabled={isNameEmpty}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate from Name
                </button>
                {value && <button type="button" onClick={onShowPreview} className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"><EyeIcon className="h-3 w-3 mr-1" /> View Barcode</button>}
            </div>
             {error && <p className="text-red-500 text-xs flex items-center mt-1"><AlertCircle className="h-3 w-3 mr-1" />{error}</p>}
        </div>
    );
};

export default BarcodeManager;