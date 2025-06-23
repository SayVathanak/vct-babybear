'use client'
import React, { useEffect, useState } from "react";
import { assets, productsDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import QuickEditModal from "@/components/seller/QuickEditModal";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CiSliderHorizontal } from "react-icons/ci";
import {
  FiExternalLink,
  FiEdit2,
  FiTrash2,
  FiLoader,
  FiCheck,
  FiX
} from 'react-icons/fi';
import ProductGrid from "@/components/ProductGrid";

const ProductList = () => {
  const { router, getToken, user } = useAppContext()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingProductId, setUpdatingProductId] = useState(null)
  const [deletingProductId, setDeletingProductId] = useState(null)
  const [quickEditProduct, setQuickEditProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [viewMode, setViewMode] = useState("cards") // table, cards, grid

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'PowderedMilk', label: 'Formula & Powdered Milk' },
    { value: 'LiquidMilk', label: 'Ready-to-Feed Milk' },
    { value: 'Bottles', label: 'Bottles & Sippy Cups' },
    { value: 'Tumblers', label: 'Toddler Tumblers & Cups' },
    { value: 'FeedingTools', label: 'Feeding Sets & Utensils' },
    { value: 'Accessories', label: 'Baby Essentials & Accessories' },
    { value: 'Vitamins', label: 'Nutrition & Supplements' },
    { value: 'Diapers', label: 'Diapers & Wipes' },
    { value: 'NurseryItems', label: 'Nursery & Sleep Essentials' }
  ];

  const fetchSellerProduct = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const { data } = await axios.get('/api/product/seller-list', { headers: { Authorization: `Bearer ${token}` } })

      if (data.success) {
        setProducts(data.products)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (productId, currentStatus) => {
    try {
      setUpdatingProductId(productId)
      const token = await getToken()
      const { data } = await axios.put(
        '/api/product/update-availability',
        {
          productId,
          isAvailable: !currentStatus
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setProducts(products.map(product =>
          product._id === productId ?
            { ...product, isAvailable: !product.isAvailable } :
            product
        ))
        toast.success(`Product ${!currentStatus ? 'available' : 'unavailable'} now`)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update product availability')
    } finally {
      setUpdatingProductId(null)
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      setDeletingProductId(productId)
      const token = await getToken()

      const { data } = await axios.delete('/api/product/delete', {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId }
      })

      if (data.success) {
        setProducts(products.filter(product => product._id !== productId))
        toast.success('Product deleted successfully')
        setDeleteConfirmation(null)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete product')
    } finally {
      setDeletingProductId(null)
    }
  }

  const confirmDelete = (product) => {
    setDeleteConfirmation(product)
  }

  const cancelDelete = () => {
    setDeleteConfirmation(null)
  }

  const handleQuickEdit = (product) => {
    setQuickEditProduct({
      ...product,
      price: product.price.toString(),
      offerPrice: product.offerPrice.toString(),
      stock: product.stock.toString(), // Add stock for editing
    })
  }

  const closeQuickEdit = () => {
    setQuickEditProduct(null)
  }

  const handleQuickEditSubmit = async (updatedProductData) => {
    try {
      setUpdatingProductId(
        updatedProductData instanceof FormData
          ? updatedProductData.get('_id')
          : updatedProductData._id
      );

      const token = await getToken();

      const { data } = await axios.put(
        '/api/product/update-availability',
        updatedProductData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(updatedProductData instanceof FormData
              ? {}
              : { 'Content-Type': 'application/json' })
          }
        }
      );

      if (data.success) {
        await fetchSellerProduct();
        toast.success('Product updated successfully');
        setQuickEditProduct(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setUpdatingProductId(null);
    }
  }

  const resetFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setSortBy("newest");
  }

  const filteredProducts = products.filter(product => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(lowercasedSearchTerm) ||
      (product.barcode && product.barcode.toLowerCase().includes(lowercasedSearchTerm));
    const matchesCategory = filterCategory === "" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.date) - new Date(a.date);
      case "oldest":
        return new Date(a.date) - new Date(b.date);
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-asc":
        return a.offerPrice - b.offerPrice;
      case "price-desc":
        return b.offerPrice - a.offerPrice;
      // --- INVENTORY: Add sorting options for stock ---
      case "stock-asc":
        return a.stock - b.stock;
      case "stock-desc":
        return b.stock - a.stock;
      default:
        return 0;
    }
  })

  useEffect(() => {
    if (user) {
      fetchSellerProduct();
    }
  }, [user])

  const ViewModeSelector = () => (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setViewMode("table")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        title="Table View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
      </button>
      <button
        onClick={() => setViewMode("cards")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "cards" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        title="Card View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" /></svg>
      </button>
      <button
        onClick={() => setViewMode("grid")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        title="Grid View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      </button>
    </div>
  );

  const ProductCard = ({ product }) => (
    <div className={`relative border-x border-gray-50 rounded-xl overflow-hidden mb-3 transition-all flex flex-col h-full ${!product.isAvailable ? 'bg-gray-50' : 'bg-white'}`}>
      {/* Main Content - Takes up available space */}
      <div className="flex p-4 flex-1">
        {/* Product Image */}
        <div className="bg-white rounded-lg p-2 flex-shrink-0 mr-4">
         <Image
            src={product.image[0]}
            alt={product.name}
            className={`w-20 h-20 object-cover rounded ${!product.isAvailable ? 'opacity-60' : ''}`}
            width={240}
            height={240}
            quality={90}
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Product Name - Fixed height container */}
          <div className="min-h-[3rem] flex items-start mb-2">
            <h3 className="text-md font-medium text-gray-800 line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Category Badge */}
          <div className="mb-3">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {product.category}
            </span>
          </div>

          {/* Price Section */}
          <div className="mb-3">
            <span className="text-xl text-green-600">
              ${product.offerPrice}
            </span>
            {product.price !== product.offerPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ${product.price}
              </span>
            )}
          </div>

          {/* Stock Information - Push to bottom */}
          <div className="mt-auto">
            <p className={`text-sm ${product.stock > 10 ? 'text-gray-600' : product.stock > 0 ? 'text-amber-700' : 'text-red-700'}`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${product.stock > 10 ? 'bg-green-600' : product.stock > 0 ? 'bg-amber-600' : 'bg-red-600'}`}></span>
              {product.stock} units in stock
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar - Fixed at bottom */}
      <div className="flex items-center bg-gray-50 px-4 py-3 mt-auto">
        {/* Left Side - Availability Toggle */}
        <div className="flex-shrink-0 w-32">
          <button
            onClick={() => toggleAvailability(product._id, product.isAvailable)}
            disabled={updatingProductId === product._id}
            className={`w-full px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${product.isAvailable
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
          >
            {updatingProductId === product._id ? (
              'Updating...'
            ) : (
              <span className="whitespace-nowrap">
                {product.isAvailable ? 'Available' : 'Not Available'}
              </span>
            )}
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => router.push(`/product/${product._id}`)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
            aria-label="View product"
          >
            <FiExternalLink className="h-3 w-3" />
            <span>View</span>
          </button>

          <button
            onClick={() => handleQuickEdit(product)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            aria-label="Quick edit"
          >
            <FiEdit2 className="h-3 w-3" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => confirmDelete(product)}
            disabled={deletingProductId === product._id}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete product"
          >
            {deletingProductId === product._id ? (
              <FiLoader className="animate-spin h-3 w-3" />
            ) : (
              <>
                <FiTrash2 className="h-3 w-3" />
                <span className="hidden lg:inline">Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const SellerGridItem = ({ product }) => (
    <div className={`relative rounded-lg overflow-hidden border flex flex-col h-full transition-all ${!product.isAvailable ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
      {/* Image section */}
      <div className="relative w-full pb-[100%] bg-gray-100">
        <Image
          src={product.image[0]}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover"
          layout="fill"
        />
      </div>

      {/* Details section */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 flex-1">
          {product.name}
        </h3>
        <div className="mb-2">
          <span className="text-lg font-bold text-gray-900">${product.offerPrice}</span>
          {product.price !== product.offerPrice && (
            <span className="ml-2 text-xs text-gray-500 line-through">${product.price}</span>
          )}
        </div>
        <p className={`text-xs font-medium ${product.stock > 10 ? 'text-gray-600' : product.stock > 0 ? 'text-amber-700' : 'text-red-700'}`}>
          {product.stock} units in stock
        </p>
      </div>

      {/* Actions section */}
      <div className="p-2 bg-gray-50 border-t space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Status:</span>
          <button
            onClick={() => toggleAvailability(product._id, product.isAvailable)}
            disabled={updatingProductId === product._id}
            className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${product.isAvailable
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
          >
            {updatingProductId === product._id ? '...' : (product.isAvailable ? 'Available' : 'Unavailable')}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => handleQuickEdit(product)}
            className="flex-1 px-2 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
            aria-label="Quick edit"
          >
            <FiEdit2 className="h-3 w-3" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => confirmDelete(product)}
            disabled={deletingProductId === product._id}
            className="flex-1 px-2 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            aria-label="Delete product"
          >
            {deletingProductId === product._id ? <FiLoader className="animate-spin h-3 w-3" /> : <FiTrash2 className="h-3 w-3" />}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );

  // And make sure your parent container gives equal heights:
  const ProductList = ({ products }) => (
    <div className="space-y-0"> {/* Remove mb-3 from individual cards and use space-y-3 here instead */}
      {products.map(product => (
        <div key={product.id} className="h-48"> {/* Set a consistent height for all cards */}
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );

  const DeleteConfirmationModal = ({ product, onConfirm, onCancel, isDeleting }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl max-w-md w-full"><div className="p-6"><div className="flex items-center mb-4"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" /></svg></div></div><div className="text-center"><h3 className="text-lg font-medium text-gray-900 mb-2">Delete Product</h3><p className="text-sm text-gray-500 mb-4">Are you sure you want to delete "<span className="font-medium">{product.name}</span>"? This action cannot be undone.</p></div><div className="flex flex-col sm:flex-row gap-3 sm:gap-2"><button onClick={onCancel} disabled={isDeleting} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button><button onClick={() => onConfirm(product._id)} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">{isDeleting ? 'Deleting...' : 'Delete Product'}</button></div></div></div></div>
  );

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-gray-50">
      {loading ? <Loading /> : (
        <div className="flex-1">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-full">
            <div className="grid grid-cols-[1fr_1.5fr] gap-4 mb-4">
              <h1 className="flex items-center text-lg md:text-3xl text-gray-800 font-medium">Product List</h1>
              <div className="relative"><button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md transition-colors w-full justify-center md:w-auto md:float-right"><CiSliderHorizontal size={16} />Filter and Sort{isFiltersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button></div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <input type="text" placeholder="Search products or barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /><svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white min-w-0 sm:min-w-[200px]">{categories.map(category => (<option key={category.value} value={category.value}>{category.label}</option>))}</select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white min-w-0 sm:min-w-[150px]">
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="price-asc">Price Low-High</option>
                      <option value="price-desc">Price High-Low</option>
                      {/* --- INVENTORY: Add sorting options for stock --- */}
                      <option value="stock-desc">Stock: High to Low</option>
                      <option value="stock-asc">Stock: Low to High</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={resetFilters} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">Reset Filters</button>
                    <ViewModeSelector />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100"><p className="text-sm text-gray-600">Showing {sortedProducts.length} of {products.length} products{searchTerm && ` for "${searchTerm}"`}{filterCategory && ` in ${categories.find(cat => cat.value === filterCategory)?.label}`}</p></div>
              </div>
            </div>
            {sortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center"><div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"><svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg></div><h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3><p className="text-gray-500 mb-4">{products.length === 0 ? "You haven't added any products yet." : "Try adjusting your search or filter criteria."}</p></div>
            ) : (
              <>
                {viewMode === "table" && (
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            {/* --- INVENTORY: Add Stock Header --- */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedProducts.map((product) => (
                            <tr key={product._id} className={`hover:bg-gray-50 ${!product.isAvailable ? 'bg-gray-50' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-12 w-12"><Image src={product.image[0]} alt={product.name} className={`h-12 w-12 rounded-md object-cover ${!product.isAvailable ? 'opacity-60' : ''}`} width={48} height={48} /></div><div className="ml-4"><div className={`text-sm font-medium ${!product.isAvailable ? 'text-gray-400' : 'text-gray-900'}`}>{product.name}</div>{product.barcode && <div className="text-xs text-gray-500">Barcode: {product.barcode}</div>}</div></div></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 inline-flex text-xs font-medium rounded-full bg-blue-100 text-blue-800">{categories.find(cat => cat.value === product.category)?.label || product.category}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><span className="text-sm font-medium text-gray-900">${product.offerPrice}</span>{product.price !== product.offerPrice && <span className="ml-2 text-sm line-through text-gray-400">${product.price}</span>}</div></td>
                              {/* --- INVENTORY: Add Stock Data Cell --- */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-bold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {product.stock}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => toggleAvailability(product._id, product.isAvailable)} disabled={updatingProductId === product._id} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${product.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>{updatingProductId === product._id ? 'Updating...' : (product.isAvailable ? 'Available' : 'Not Available')}</button></td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-end space-x-2"><button onClick={() => router.push(`/product/${product._id}`)} className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors" title="View Product"><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg></button><button onClick={() => handleQuickEdit(product)} className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors" title="Quick Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button><button onClick={() => confirmDelete(product)} disabled={deletingProductId === product._id} className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Product">{deletingProductId === product._id ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}</button></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {viewMode === "cards" && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">{sortedProducts.map((product) => (<ProductCard key={product._id} product={product} />))}</div>)}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sortedProducts.map((product) => (
                      <SellerGridItem key={product._id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {deleteConfirmation && (<DeleteConfirmationModal product={deleteConfirmation} onConfirm={handleDeleteProduct} onCancel={cancelDelete} isDeleting={deletingProductId === deleteConfirmation._id} />)}
      {quickEditProduct && (<QuickEditModal product={quickEditProduct} onClose={closeQuickEdit} onSubmit={handleQuickEditSubmit} categories={categories} isUpdating={updatingProductId === quickEditProduct._id} />)}
      <Footer />
    </div>
  );
};

export default ProductList;