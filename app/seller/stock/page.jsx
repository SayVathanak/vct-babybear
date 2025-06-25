'use client';
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { Box, Package, AlertTriangle, PackageX, CheckCircle, Search, Download, Filter, Menu, X } from 'lucide-react';
import { CiSliderHorizontal } from "react-icons/ci";

const StockManagementPage = () => {
    const { getToken, user } = useAppContext();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'low', 'out'
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const LOW_STOCK_THRESHOLD = 10;

    // Fetch all products for the seller
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error("Authentication failed.");
                setLoading(false);
                return;
            }
            const { data } = await axios.get('/api/product/seller-list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setProducts(data.products);
                setFilteredProducts(data.products);
            } else {
                toast.error(data.message || "Failed to fetch products.");
            }
        } catch (error) {
            toast.error("An error occurred while fetching products.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProducts();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Handle filtering based on search term and status
    useEffect(() => {
        let tempProducts = [...products];

        // Filter by search term (name or barcode)
        if (searchTerm) {
            tempProducts = tempProducts.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.barcode && p.barcode.includes(searchTerm))
            );
        }

        // Filter by stock status
        if (statusFilter === 'low') {
            tempProducts = tempProducts.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
        } else if (statusFilter === 'out') {
            tempProducts = tempProducts.filter(p => p.stock === 0);
        } else if (statusFilter === 'in_stock') {
            tempProducts = tempProducts.filter(p => p.stock > LOW_STOCK_THRESHOLD);
        }

        setFilteredProducts(tempProducts);
    }, [searchTerm, statusFilter, products]);

    // Calculate stats for the overview cards
    const inventoryStats = products.reduce((acc, product) => {
        acc.totalValue += product.price * product.stock;
        if (product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD) {
            acc.lowStock++;
        } else if (product.stock === 0) {
            acc.outOfStock++;
        } else {
            acc.inStock++;
        }
        return acc;
    }, { totalValue: 0, lowStock: 0, outOfStock: 0, inStock: 0 });

    // Function to handle exporting the reorder list
    const handleExportReorderList = () => {
        const reorderProducts = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD);

        if (reorderProducts.length === 0) {
            toast.error("No products need reordering at this time.");
            return;
        }

        const headers = ['Product Name', 'SKU/Barcode', 'Current Stock', 'Reorder Status'];
        const csvRows = [headers.join(',')];

        reorderProducts.forEach(product => {
            const status = product.stock === 0 ? 'Out of Stock' : 'Low Stock';
            const barcodeAsText = product.barcode ? `="${product.barcode}"` : 'N/A';

            const row = [
                `"${product.name.replace(/"/g, '""')}"`,
                barcodeAsText,
                product.stock,
                status
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'Reorder_List.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Reorder list exported successfully!");
    };
    
    // UI component for stock status badges
    const StockStatusBadge = ({ stock }) => {
        if (stock > LOW_STOCK_THRESHOLD) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>;
        }
        if (stock > 0) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Out of Stock</span>;
    };

    // Mobile Card Component for better mobile display
    const MobileProductCard = ({ product }) => (
        <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <Image 
                        src={product.image[0]} 
                        alt={product.name} 
                        width={60} 
                        height={60} 
                        className="rounded-md object-cover" 
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate pr-2">
                            {product.name}
                        </h3>
                        <StockStatusBadge stock={product.stock} />
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                            <span>SKU/Barcode:</span>
                            <span className="font-medium text-gray-900">{product.barcode || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Category:</span>
                            <span className="font-medium text-gray-900">{product.category}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Stock:</span>
                            <span className="font-semibold text-gray-900">{product.stock}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 min-h-screen bg-gray-50">
            {loading ? (
                <Loading />
            ) : (
                <div className="p-3 sm:p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-4 sm:mb-6">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                Stock Management
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm text-gray-600">
                                Monitor and manage your product inventory levels.
                            </p>
                        </div>

                        {/* Overview Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
                            <div className="bg-white p-3 sm:p-4 lg:p-5 rounded-lg shadow-sm border">
                                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                    <div className="bg-green-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">In Stock</p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                                            {inventoryStats.inStock}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-3 sm:p-4 lg:p-5 rounded-lg shadow-sm border">
                                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                    <div className="bg-yellow-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">Low Stock</p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                                            {inventoryStats.lowStock}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-3 sm:p-4 lg:p-5 rounded-lg shadow-sm border">
                                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                    <div className="bg-red-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                                        <PackageX className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">Out of Stock</p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                                            {inventoryStats.outOfStock}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-3 sm:p-4 lg:p-5 rounded-lg shadow-sm border">
                                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                    <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                                        <Box className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">Total Products</p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                                            {products.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Section */}
                        <div className="bg-white rounded-lg shadow-sm border mb-4">
                            {/* Desktop Search and Filters */}
                            <div className="hidden md:block p-4 border-b">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 max-w-md relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or barcode..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="pl-9 pr-8 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="in_stock">In Stock</option>
                                                <option value="low">Low Stock</option>
                                                <option value="out">Out of Stock</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={handleExportReorderList}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
                                        >
                                            <Download className="h-4 w-4" />
                                            Export Reorder List
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Search and Filter Toggle */}
                            <div className="md:hidden p-3 border-b">
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                                        className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        {showMobileFilters ? <X className="h-4 w-4" /> : <CiSliderHorizontal className="h-4 w-4" />}
                                        Filter & Sort
                                    </button>
                                    <button
                                        onClick={handleExportReorderList}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export
                                    </button>
                                </div>
                                
                                {/* Mobile Filter Panel */}
                                {showMobileFilters && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filter by Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="in_stock">In Stock</option>
                                            <option value="low">Low Stock</option>
                                            <option value="out">Out of Stock</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden p-3">
                                {filteredProducts.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredProducts.map(product => (
                                            <MobileProductCard key={product._id} product={product} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <PackageX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No products match your current filters.</p>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                SKU / Barcode
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Current Stock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredProducts.map(product => (
                                            <tr key={product._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <Image 
                                                                src={product.image[0]} 
                                                                alt={product.name} 
                                                                width={40} 
                                                                height={40} 
                                                                className="h-10 w-10 rounded-md object-cover" 
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {product.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.barcode || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    {product.stock}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StockStatusBadge stock={product.stock} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredProducts.length === 0 && (
                                    <div className="text-center py-12">
                                        <PackageX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No products match your current filters.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default StockManagementPage;