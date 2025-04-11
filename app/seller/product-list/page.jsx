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

const ProductList = () => {
  const { router, getToken, user } = useAppContext()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingProductId, setUpdatingProductId] = useState(null)
  const [quickEditProduct, setQuickEditProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

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
      const {data} = await axios.get('/api/product/seller-list', {headers:{Authorization:`Bearer ${token}`}})
      
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
        // Update local state to reflect the change
        setProducts(products.map(product => 
          product._id === productId ? 
          {...product, isAvailable: !product.isAvailable} : 
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

  const handleQuickEdit = (product) => {
    setQuickEditProduct({
      ...product,
      price: product.price.toString(),
      offerPrice: product.offerPrice.toString()
    })
  }

  const closeQuickEdit = () => {
    setQuickEditProduct(null)
  }

  const handleQuickEditSubmit = async (updatedProductData) => {
    try {
      setUpdatingProductId(updatedProductData._id)
      const token = await getToken()
      
      const { data } = await axios.put(
        '/api/product/update-availability',
        updatedProductData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (data.success) {
        // Update products in state
        setProducts(products.map(product => 
          product._id === updatedProductData._id ? 
          {...product, ...updatedProductData} : 
          product
        ))
        toast.success('Product updated successfully')
        setQuickEditProduct(null)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update product')
    } finally {
      setUpdatingProductId(null)
    }
  }

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setSortBy("newest");
  }

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "" || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch(sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt)
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt)
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "name-desc":
        return b.name.localeCompare(a.name)
      case "price-asc":
        return a.offerPrice - b.offerPrice
      case "price-desc":
        return b.offerPrice - a.offerPrice
      default:
        return 0
    }
  })

  useEffect(() => {
    if (user) {
      fetchSellerProduct();
    }
  }, [user])

  // For products on smaller screens
  const ProductCard = ({ product }) => (
    <div className={`relative border rounded-lg overflow-hidden shadow-sm mb-3 ${!product.isAvailable ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex p-3">
        <div className="bg-white rounded-lg shadow-sm p-1 flex-shrink-0 mr-3">
          <Image
            src={product.image[0]}
            alt={product.name}
            className={`w-20 h-20 object-cover rounded ${!product.isAvailable ? 'opacity-60' : ''}`}
            width={80}
            height={80}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium line-clamp-2 ${!product.isAvailable ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {product.name}
          </p>
          <div className="flex items-center mt-1 flex-wrap gap-1">
            <span className="px-2 py-0.5 bg-blue-50 rounded-full text-xs font-medium text-blue-600">
              {product.category}
            </span>
            <span className="text-xs text-gray-500">
              {/* {new Date(product.createdAt).toLocaleDateString()} */}
            </span>
          </div>
          <div className="flex items-center mt-2">
            <p className="text-sm font-medium text-gray-900">
              ${product.offerPrice}
            </p>
            {product.price !== product.offerPrice && (
              <p className="ml-2 text-xs line-through text-gray-400">
                ${product.price}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2">
        <button 
          onClick={() => toggleAvailability(product._id, product.isAvailable)}
          disabled={updatingProductId === product._id}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            product.isAvailable 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {updatingProductId === product._id ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            <span className="whitespace-nowrap">{product.isAvailable ? 'Available' : 'Not Available'}</span>
          )}
        </button>
        <div className="flex space-x-2">
          <button 
            onClick={() => router.push(`/product/${product._id}`)} 
            className="flex items-center justify-center gap-1 px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
            aria-label="View product"
          >
            <span>View</span>
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </button>
          <button 
            onClick={() => handleQuickEdit(product)} 
            className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            aria-label="Quick edit"
          >
            <span>Edit</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-gray-50">
      {loading ? <Loading /> : (
        <div className="flex-1">
          {/* Modified container to take full width */}
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-full">
            <div className="flex flex-col mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <h1 className="text-lg md:text-3xl font-prata font-medium text-gray-800 mb-4 sm:mb-0">All Products</h1>
                <button
                  onClick={() => router.push('/seller')}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Product
                </button>
              </div>
              
              {/* Mobile Filters Toggle */}
              <div className="sm:hidden mb-4">
                <button
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm text-gray-700"
                >
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters & Sort {filteredProducts.length !== products.length && <span className="ml-1 text-indigo-600">({filteredProducts.length})</span>}
                  </span>
                  <svg 
                    className={`h-5 w-5 transform transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Filters Row - Mobile (Collapsible) */}
              <div className={`flex flex-col gap-3 sm:hidden transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-3 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    width="16" height="16" fill="currentColor" viewBox="0 0 16 16"
                  >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <select 
                  className="border border-gray-300 rounded-md py-3 px-3 bg-white focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem"}}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <select 
                  className="border border-gray-300 rounded-md py-3 px-3 bg-white focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem"}}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low-High)</option>
                  <option value="price-desc">Price (High-Low)</option>
                </select>
                <button
                  onClick={resetFilters}
                  className="w-full py-2.5 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors border border-indigo-200 rounded-md bg-indigo-50 hover:bg-indigo-100"
                >
                  Clear Filters
                </button>
              </div>
              
              {/* Filters Row - Desktop */}
              <div className="hidden sm:flex sm:flex-wrap md:flex-nowrap md:items-center gap-3 mt-4">
                <div className="relative flex-1 min-w-[240px]">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-9 py-2.5 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    width="16" height="16" fill="currentColor" viewBox="0 0 16 16"
                  >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <select 
                  className="border border-gray-300 rounded-md py-2.5 px-3 bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm w-full md:w-auto appearance-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem"}}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <select 
                  className="border border-gray-300 rounded-md py-2.5 px-3 bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm w-full md:w-auto appearance-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem"}}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low-High)</option>
                  <option value="price-desc">Price (High-Low)</option>
                </select>
                {(searchTerm || filterCategory !== "" || sortBy !== "newest") && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500 transition-colors whitespace-nowrap"
                  >
                    <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            
            {/* Results count and info */}
            <div className="mb-5 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">
                {sortedProducts.length === 0 
                  ? 'No products found' 
                  : sortedProducts.length === products.length
                    ? `Showing all ${sortedProducts.length} ${sortedProducts.length === 1 ? 'product' : 'products'}`
                    : `Showing ${sortedProducts.length} of ${products.length} ${products.length === 1 ? 'product' : 'products'}`
                }
              </p>
              {filteredProducts.length !== products.length && (
                <span className="text-xs bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full">
                  Filtered
                </span>
              )}
            </div>
            
            {/* Empty state */}
            {sortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-3 text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  {searchTerm || filterCategory ? 
                    'Try changing your filters or search term to find what you\'re looking for.' : 
                    'Get started by adding your first product to your inventory.'}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/seller')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-0.5 mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Product
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {quickEditProduct && (
        <QuickEditModal
          product={quickEditProduct}
          onClose={closeQuickEdit}
          onSubmit={handleQuickEditSubmit}
          isUpdating={updatingProductId === quickEditProduct._id}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default ProductList;