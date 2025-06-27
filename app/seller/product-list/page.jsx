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
      stock: product.stock.toString(),
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
    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
      <button
        onClick={() => setViewMode("table")}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "table"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600"
          }`}
        title="Table View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode("cards")}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "cards"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600"
          }`}
        title="Card View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode("grid")}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "grid"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600"
          }`}
        title="Grid View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
    </div>
  );

  const ProductCard = ({ product }) => (
    <div className={`bg-white rounded-xl overflow-hidden shadow-sm ${!product.isAvailable ? 'opacity-70' : ''
      }`}>
      {/* Image Section */}
      <div className="relative">
        <div className="aspect-square bg-white p-4">
          <Image
            src={product.image[0]}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
            width={240}
            height={240}
            quality={90}
          />
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isAvailable
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}>
            {product.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-medium text-gray-900 text-sm leading-5 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Category */}
        <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
          {categories.find(cat => cat.value === product.category)?.label || product.category}
        </span>

        {/* Price Section */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ${product.offerPrice}
          </span>
          {product.price !== product.offerPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${product.price}
            </span>
          )}
        </div>

        {/* Stock Info */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' :
              product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          <span className={`text-sm font-medium ${product.stock > 10 ? 'text-green-700' :
              product.stock > 0 ? 'text-yellow-700' : 'text-red-700'
            }`}>
            {product.stock} units
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => toggleAvailability(product._id, product.isAvailable)}
            disabled={updatingProductId === product._id}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${product.isAvailable
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
              } disabled:opacity-50`}
          >
            {updatingProductId === product._id ? 'Updating...' :
              `Mark as ${product.isAvailable ? 'Unavailable' : 'Available'}`}
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => router.push(`/product/${product._id}`)}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 transition-colors"
            >
              <FiExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">View</span>
            </button>

            <button
              onClick={() => handleQuickEdit(product)}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium border border-yellow-200 transition-colors"
            >
              <FiEdit2 className="w-3 h-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              onClick={() => confirmDelete(product)}
              disabled={deletingProductId === product._id}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200 transition-colors disabled:opacity-50"
            >
              {deletingProductId === product._id ? (
                <FiLoader className="animate-spin w-3 h-3" />
              ) : (
                <>
                  <FiTrash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const SellerGridItem = ({ product }) => (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${!product.isAvailable ? 'opacity-70' : ''
      }`}>
      {/* Image */}
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={product.image[0]}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* Status Badge */}
        <div className="absolute top-1 right-1">
          <div className={`w-3 h-3 rounded-full ${product.isAvailable ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="text-xs font-medium text-gray-900 line-clamp-2 min-h-[2rem]">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">${product.offerPrice}</span>
          <span className={`text-xs font-medium ${product.stock > 10 ? 'text-green-600' :
              product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
            }`}>
            {product.stock}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1 pt-1">
          <button
            onClick={() => handleQuickEdit(product)}
            className="py-1.5 px-2 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200"
          >
            <FiEdit2 className="w-3 h-3 mx-auto" />
          </button>

          <button
            onClick={() => confirmDelete(product)}
            disabled={deletingProductId === product._id}
            className="py-1.5 px-2 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-200 disabled:opacity-50"
          >
            {deletingProductId === product._id ? (
              <FiLoader className="animate-spin w-3 h-3 mx-auto" />
            ) : (
              <FiTrash2 className="w-3 h-3 mx-auto" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const DeleteConfirmationModal = ({ product, onConfirm, onCancel, isDeleting }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FiTrash2 className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete
            </p>
            <p className="text-sm font-medium text-gray-900 mb-2">
              "{product.name}"?
            </p>
            <p className="text-xs text-gray-500">
              This action cannot be undone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(product._id)}
              disabled={isDeleting}
              className="py-2 px-4 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <FiLoader className="animate-spin w-4 h-4 mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-gray-50">
      {loading ? <Loading /> : (
        <div className="flex-1">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl sm:text-3xl font-medium">
                Product List
              </h1>

              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 font-medium"
              >
                <CiSliderHorizontal size={18} />
                Filters
                {isFiltersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Filters Panel */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFiltersOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'
              }`}>
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products or barcode..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    />
                    <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Filters Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="price-asc">Price Low-High</option>
                      <option value="price-desc">Price High-Low</option>
                      <option value="stock-desc">Stock: High to Low</option>
                      <option value="stock-asc">Stock: Low to High</option>
                    </select>

                    <ViewModeSelector />
                  </div>

                  {/* Results & Reset */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Showing {sortedProducts.length} of {products.length} products
                      {searchTerm && ` for "${searchTerm}"`}
                      {filterCategory && ` in ${categories.find(cat => cat.value === filterCategory)?.label}`}
                    </p>

                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg font-medium"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            {sortedProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {products.length === 0
                    ? "You haven't added any products yet."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Table View */}
                {viewMode === "table" && (
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {sortedProducts.map((product) => (
                            <tr key={product._id} className={`${!product.isAvailable ? 'bg-gray-50 opacity-70' : ''}`}>
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={product.image[0]}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      width={48}
                                      height={48}
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-2 max-w-xs">
                                      {product.name}
                                    </div>
                                    {product.barcode && (
                                      <div className="text-xs text-gray-500">
                                        Barcode: {product.barcode}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                                  {categories.find(cat => cat.value === product.category)?.label || product.category}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">${product.offerPrice}</span>
                                  {product.price !== product.offerPrice && (
                                    <span className="text-gray-400 line-through text-xs">${product.price}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' :
                                      product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></div>
                                  <span className={`font-medium ${product.stock > 10 ? 'text-green-700' :
                                      product.stock > 0 ? 'text-yellow-700' : 'text-red-700'
                                    }`}>
                                    {product.stock} units
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => toggleAvailability(product._id, product.isAvailable)}
                                  disabled={updatingProductId === product._id}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${product.isAvailable
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    } disabled:opacity-50`}
                                >
                                  {updatingProductId === product._id ? (
                                    <>
                                      <FiLoader className="animate-spin w-3 h-3 mr-1" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      {product.isAvailable ? (
                                        <FiCheck className="w-3 h-3 mr-1" />
                                      ) : (
                                        <FiX className="w-3 h-3 mr-1" />
                                      )}
                                      {product.isAvailable ? 'Available' : 'Unavailable'}
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => router.push(`/product/${product._id}`)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Product"
                                  >
                                    <FiExternalLink className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleQuickEdit(product)}
                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                    title="Quick Edit"
                                  >
                                    <FiEdit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => confirmDelete(product)}
                                    disabled={deletingProductId === product._id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete Product"
                                  >
                                    {deletingProductId === product._id ? (
                                      <FiLoader className="animate-spin w-4 h-4" />
                                    ) : (
                                      <FiTrash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Card View */}
                {viewMode === "cards" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                    {sortedProducts.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                )}

                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
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

      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <QuickEditModal
          product={quickEditProduct}
          onClose={closeQuickEdit}
          onSubmit={handleQuickEditSubmit}
          categories={categories}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <DeleteConfirmationModal
          product={deleteConfirmation}
          onConfirm={handleDeleteProduct}
          onCancel={cancelDelete}
          isDeleting={deletingProductId === deleteConfirmation._id}
        />
      )}

      <Footer />
    </div>
  )
}

export default ProductList