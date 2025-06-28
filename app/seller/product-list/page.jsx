'use client'
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import QuickEditModal from "@/components/seller/QuickEditModal";
import { CiSliderHorizontal } from "react-icons/ci";
import { IoTrashOutline , IoPencil, IoExpand } from "react-icons/io5";
import {
  FiMoreVertical,
  FiLoader,
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiColumns,
  FiPackage,
  FiAlertTriangle
} from "react-icons/fi";

// A new component for the "three dots" action menu
const ActionMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="More actions"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <FiMoreVertical className="h-4 w-4 text-gray-600" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-10">
                    <ul className="py-1" onClick={() => setIsOpen(false)}>
                        {children}
                    </ul>
                </div>
            )}
        </div>
    );
};


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
        { productId, isAvailable: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setProducts(products.map(p => p._id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
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
        setProducts(products.filter(p => p._id !== productId))
        toast.success('Product deleted successfully')
        setDeleteConfirmation(null)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product')
    } finally {
      setDeletingProductId(null)
    }
  }

  const confirmDelete = (product) => setDeleteConfirmation(product);
  const cancelDelete = () => setDeleteConfirmation(null);
  const handleQuickEdit = (product) => {
    setQuickEditProduct({
      ...product,
      price: product.price.toString(),
      offerPrice: product.offerPrice.toString(),
      stock: product.stock.toString(),
    })
  }
  const closeQuickEdit = () => setQuickEditProduct(null);

  const handleQuickEditSubmit = async (updatedProductData) => {
    try {
        const id = updatedProductData instanceof FormData ? updatedProductData.get('_id') : updatedProductData._id;
        setUpdatingProductId(id);
        const token = await getToken();
        const { data } = await axios.put('/api/product/update-availability', updatedProductData, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...(updatedProductData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
            }
        });
        if (data.success) {
            await fetchSellerProduct();
            toast.success('Product updated successfully');
            closeQuickEdit();
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

  const filteredProducts = products.filter(product =>
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterCategory === "" || product.category === filterCategory)
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "newest": return new Date(b.date) - new Date(a.date);
      case "oldest": return new Date(a.date) - new Date(b.date);
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      case "price-asc": return a.offerPrice - b.offerPrice;
      case "price-desc": return b.offerPrice - a.offerPrice;
      case "stock-asc": return a.stock - b.stock;
      case "stock-desc": return b.stock - a.stock;
      default: return 0;
    }
  });

  useEffect(() => {
    if (user) fetchSellerProduct();
  }, [user]);

  const ViewModeSelector = () => (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {[{mode: 'table', icon: FiList, title: 'Table View'}, {mode: 'cards', icon: FiColumns, title: 'Card View'}, {mode: 'grid', icon: FiGrid, title: 'Grid View'}].map(item => (
        <button key={item.mode} onClick={() => setViewMode(item.mode)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === item.mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          title={item.title} aria-label={item.title}>
          <item.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );

  const ProductCard = ({ product }) => (
    <div className={`overflow-hidden mb-4 transition-all flex flex-col h-full bg-white`}>
        <div className="flex flex-col sm:flex-row p-3 sm:p-4 flex-1">
            <div className="bg-white rounded-lg p-2 flex-shrink-0 mr-0 sm:mr-4 mb-3 sm:mb-0 text-center">
                <Image src={product.image[0]} alt={product.name} className={`w-24 h-24 sm:w-20 sm:h-20 object-cover rounded mx-auto ${!product.isAvailable ? 'opacity-60' : ''}`} width={120} height={120} quality={90} />
            </div>
            <div className="flex flex-col flex-1 min-h-0">
                <div className="min-h-[2.5rem] mb-2"><h3 className="text-md font-medium text-gray-800 line-clamp-2">{product.name}</h3></div>
                <div className="mb-2"><span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{categories.find(c=>c.value === product.category)?.label || product.category}</span></div>
                <div className="mb-2"><span className="text-xl font-bold text-green-600">${product.offerPrice}</span>{product.price !== product.offerPrice && (<span className="ml-2 text-sm text-gray-500 line-through">${product.price}</span>)}</div>
                <div className="mt-auto"><p className={`text-sm ${product.stock > 10 ? 'text-gray-600' : product.stock > 0 ? 'text-amber-700' : 'text-red-700'}`}><span className={`inline-block w-2 h-2 rounded-full mr-2 ${product.stock > 10 ? 'bg-green-600' : product.stock > 0 ? 'bg-amber-600' : 'bg-red-600'}`}></span>{product.stock} in stock</p></div>
            </div>
        </div>
        <div className="flex items-center justify-between bg-gray-50 px-3 py-2 mt-auto">
            <button onClick={() => toggleAvailability(product._id, product.isAvailable)} disabled={updatingProductId === product._id}
                className={`w-28 px-2 py-1 rounded-full text-xs transition-colors ${product.isAvailable ? 'bg-green-100 text-green-700 h:bg-green-200' : 'bg-red-100 text-red-700 h:bg-red-200'}`}>
                {updatingProductId === product._id ? 'Updating...' : <span className="whitespace-nowrap">{product.isAvailable ? 'Available' : 'Unavailable'}</span>}
            </button>
            <div className="flex items-center gap-1">
                <div className="hidden md:flex items-center">
                    <button onClick={() => router.push(`/product/${product._id}`)} className="flex items-center gap-2 px-3 py-1.5 bg-white text-green-500 text-xs" aria-label="View product"><span>View</span></button>
                    <button onClick={() => handleQuickEdit(product)} className="flex items-center gap-2 px-3 py-1.5 bg-white text-blue-500 text-xs" aria-label="Quick edit"><IoPencil size={16} /><span>Edit</span></button>
                    <button onClick={() => confirmDelete(product)} disabled={deletingProductId === product._id} className="flex items-center gap-2 px-3 py-1.5 bg-white text-red-500 text-xs" aria-label="Delete product">{deletingProductId === product._id ? <FiLoader className="animate-spin h-3 w-3" /> : <><IoTrashOutline   size={16} /><span>Delete</span></>} </button>
                </div>
                <div className="flex md:hidden items-center gap-1">
                    <button onClick={() => handleQuickEdit(product)} className="p-2 bg-blue-100 text-blue-600 rounded-md" aria-label="Quick edit"><IoPencil size={16} /></button>
                    <button onClick={() => confirmDelete(product)} disabled={deletingProductId === product._id} className="p-2 bg-red-100 text-red-600 rounded-md" aria-label="Delete product">{deletingProductId === product._id ? <FiLoader className="animate-spin h-4 w-4" /> : <IoTrashOutline   size={16} />}</button>
                    <ActionMenu>
                        <li><button onClick={() => router.push(`/product/${product._id}`)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><IoExpand size={16} /> View Product</button></li>
                    </ActionMenu>
                </div>
            </div>
        </div>
    </div>
  );

  const SellerGridItem = ({ product }) => (
    <div className={`relative overflow-hidden flex flex-col h-full transition-all bg-white`}>
        <div className="relative w-full pb-[100%] bg-white"><Image src={product.image[0]} alt={product.name} className="absolute top-0 left-0 w-full h-full object-contain p-4" layout="fill" /></div>
        <div className="p-3 flex flex-col flex-1">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 flex-1">{product.name}</h3>
            <div className="mb-2"><span className="text-lg font-bold text-gray-900">${product.offerPrice}</span>{product.price !== product.offerPrice && (<span className="ml-2 text-xs text-gray-500 line-through">${product.price}</span>)}</div>
            <p className={`text-xs font-medium ${product.stock > 10 ? 'text-gray-600' : product.stock > 0 ? 'text-amber-700' : 'text-red-700'}`}>{product.stock} units in stock</p>
        </div>
        <div className="p-2 bg-gray-50 border-t space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs">Status:</span>
                <button onClick={() => toggleAvailability(product._id, product.isAvailable)} disabled={updatingProductId === product._id} className={`px-2 py-0.5 rounded-full text-xs ${product.isAvailable ? 'bg-green-100 text-green-600 h:bg-green-200' : 'bg-red-100 text-red-600 h:bg-red-200'}`}>
                    {updatingProductId === product._id ? '...' : (product.isAvailable ? 'Available' : 'Unavailable')}
                </button>
            </div>
            <div className="flex items-center justify-end gap-2">
                <button onClick={() => handleQuickEdit(product)} className="flex-1 px-2 py-1.5 bg-white text-blue-500 text-xs font-medium rounded-md h:bg-blue-600 flex items-center justify-center gap-2 hover:bg-gray-50" aria-label="Quick edit"><IoPencil size={16} /><span>EDIT</span></button>
                <button onClick={() => confirmDelete(product)} disabled={deletingProductId === product._id} className="flex-1 px-2 py-1.5 bg-white text-red-500 text-xs font-medium rounded-md h:bg-red-600 flex items-center justify-center gap-2 hover:bg-gray-50" aria-label="Delete product">{deletingProductId === product._id ? <FiLoader className="animate-spin h-3 w-3" /> : <IoTrashOutline   size={16} />}<span>DELETE</span></button>
            </div>
        </div>
    </div>
  );

  const DeleteConfirmationModal = ({ product, onConfirm, onCancel, isDeleting }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-center mb-4"><div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><FiAlertTriangle className="h-6 w-6 text-red-600" /></div></div>
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Product</h3>
                <p className="text-sm text-gray-500 mb-4">Are you sure you want to delete "<span className="font-medium">{product.name}</span>"? This action cannot be undone.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button onClick={onCancel} disabled={isDeleting} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md h:bg-gray-200 disabled:opacity-50">Cancel</button>
                <button onClick={() => onConfirm(product._id)} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md h:bg-red-700 disabled:opacity-50 flex items-center justify-center">{isDeleting ? <><FiLoader className="animate-spin mr-2"/> Deleting...</> : 'Delete Product'}</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-gray-50">
      {loading ? <Loading /> : (
        <div className="flex-1">
          <main className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-medium">Product List</h1>
              <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-900 rounded-md border bg-white shadow-sm transition-colors w-full md:w-auto">
                <CiSliderHorizontal size={16} />Filter and Sort{isFiltersOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="relative col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-3">
                        <input type="text" placeholder="Search products or barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white">{categories.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}</select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                      <option value="newest">Newest First</option><option value="oldest">Oldest First</option><option value="name-asc">Name A-Z</option><option value="name-desc">Name Z-A</option><option value="price-asc">Price Low-High</option><option value="price-desc">Price High-Low</option><option value="stock-desc">Stock: High to Low</option><option value="stock-asc">Stock: Low to High</option>
                    </select>
                  </div>
                  <div className="flex items-start justify-between lg:justify-end gap-3">
                    <button onClick={resetFilters} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">Reset</button>
                    <ViewModeSelector />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t"><p className="text-sm text-gray-600">Showing {sortedProducts.length} of {products.length} products.</p></div>
              </div>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center mt-6">
                <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><FiPackage className="w-10 h-10 text-gray-400" /></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4 text-sm">{products.length === 0 ? "You haven't added any products yet." : "Try adjusting your search or filter criteria."}</p>
              </div>
            ) : (
              <>
                {viewMode === "table" && (
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden"><div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Product</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Category</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Price</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Stock</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">Actions</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedProducts.map((product) => (
                            <tr key={product._id} className={`hover:bg-gray-50 ${!product.isAvailable ? 'bg-gray-50' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-12 w-12"><Image src={product.image[0]} alt={product.name} className={`h-12 w-12 rounded-md object-cover ${!product.isAvailable ? 'opacity-60' : ''}`} width={48} height={48} /></div><div className="ml-4"><div className={`text-sm font-medium ${!product.isAvailable ? 'text-gray-400' : 'text-gray-900'}`}>{product.name}</div>{product.barcode && <div className="text-xs text-gray-500">Barcode: {product.barcode}</div>}</div></div></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 inline-flex text-xs font-medium rounded-full bg-blue-100 text-blue-800">{categories.find(c => c.value === product.category)?.label || product.category}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><span className="text-sm font-medium text-gray-900">${product.offerPrice}</span>{product.price !== product.offerPrice && <span className="ml-2 text-sm line-through text-gray-400">${product.price}</span>}</div></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm font-bold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>{product.stock}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => toggleAvailability(product._id, product.isAvailable)} disabled={updatingProductId === product._id} className={`px-3 py-1 rounded-full text-xs ${product.isAvailable ? 'bg-green-100 text-green-700 h:bg-green-200' : 'bg-red-100 text-red-700 h:bg-red-200'}`}>{updatingProductId === product._id ? 'Updating...' : (product.isAvailable ? 'Available' : 'Not Available')}</button></td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-end space-x-2"><button onClick={() => router.push(`/product/${product._id}`)} className="text-green-600 h:text-green-900 p-1 rounded-md h:bg-green-50" title="View Product"><IoExpand size={16} /></button><button onClick={() => handleQuickEdit(product)} className="text-blue-600 h:text-blue-900 p-1 rounded-md h:bg-blue-50" title="Quick Edit"><IoPencil size={16} /></button><button onClick={() => confirmDelete(product)} disabled={deletingProductId === product._id} className="text-red-600 h:text-red-900 p-1 rounded-md h:bg-red-50 disabled:opacity-50" title="Delete Product">{deletingProductId === product._id ? <FiLoader className="animate-spin h-4 w-4" /> : <IoTrashOutline   size={16} />}</button></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div></div>
                )}
                {viewMode === "cards" && (<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-1">{sortedProducts.map((p) => (<ProductCard key={p._id} product={p} />))}</div>)}
                {viewMode === "grid" && (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">{sortedProducts.map((p) => (<SellerGridItem key={p._id} product={p} />))}</div>)}
              </>
            )}
          </main>
        </div>
      )}
      {deleteConfirmation && (<DeleteConfirmationModal product={deleteConfirmation} onConfirm={handleDeleteProduct} onCancel={cancelDelete} isDeleting={deletingProductId === deleteConfirmation?._id} />)}
      {quickEditProduct && (<QuickEditModal product={quickEditProduct} onClose={closeQuickEdit} onSubmit={handleQuickEditSubmit} categories={categories} isUpdating={updatingProductId === quickEditProduct?._id} />)}
      <Footer />
    </div>
  );
};

export default ProductList;