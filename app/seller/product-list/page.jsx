'use client'
import React, { useEffect, useState } from "react";
import { assets, productsDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const ProductList = () => {
  const { router, getToken, user } = useAppContext()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingProductId, setUpdatingProductId] = useState(null)

  const fetchSellerProduct = async () => {
    try {
      const token = await getToken()
      const {data} = await axios.get('/api/product/seller-list', {headers:{Authorization:`Bearer ${token}`}})
      
      if (data.success) {
        setProducts(data.products)
        setLoading(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
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

  useEffect(() => {
    if (user) {
      fetchSellerProduct();
    }
  }, [user])

  // For products on smaller screens
  const ProductCard = ({ product }) => (
    <div className={`sm:hidden border-t border-gray-500/20 ${!product.isAvailable ? 'bg-gray-100' : ''} p-3`}>
      <div className="flex items-start space-x-3">
        <div className="bg-gray-500/10 rounded p-2 flex-shrink-0">
          <Image
            src={product.image[0]}
            alt="product Image"
            className={`w-12 h-12 object-cover ${!product.isAvailable ? 'opacity-50' : ''}`}
            width={48}
            height={48}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${!product.isAvailable ? 'line-through text-gray-400' : ''}`}>
            {product.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Category: {product.category}
          </p>
          <p className="text-xs font-medium mt-0.5">
            ${product.offerPrice}
          </p>
          <div className="flex items-center justify-between mt-2">
            <button 
              onClick={() => toggleAvailability(product._id, product.isAvailable)}
              disabled={updatingProductId === product._id}
              className={`px-2 py-0.5 rounded-full text-xs ${
                product.isAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {updatingProductId === product._id ? (
                <span>Updating...</span>
              ) : (
                <span>{product.isAvailable ? 'Available' : 'Not Available'}</span>
              )}
            </button>
            <button 
              onClick={() => router.push(`/product/${product._id}`)} 
              className="flex items-center gap-1 px-2 py-1 bg-green-400 text-white text-xs rounded-md"
            >
              <span>View</span>
              <Image
                className="h-3"
                src={assets.redirect_icon}
                alt="redirect_icon"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? <Loading /> : (
        <div className="w-full md:p-10 p-4">
          <h2 className="pb-4 text-lg font-medium">All Products</h2>
          
          {/* Mobile view - Card Layout */}
          <div className="sm:hidden flex flex-col w-full overflow-hidden rounded-md bg-white border border-gray-500/20 mb-4">
            {products.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
          
          {/* Tablet and Desktop view - Table Layout */}
          <div className="hidden sm:flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full">
                <thead className="text-gray-900 text-sm text-left">
                  <tr>
                    <th className="w-2/5 px-4 py-3 font-medium truncate">Product</th>
                    <th className="px-4 py-3 font-medium truncate">Category</th>
                    <th className="px-4 py-3 font-medium truncate">Price</th>
                    <th className="px-4 py-3 font-medium truncate">Status</th>
                    <th className="px-4 py-3 font-medium truncate">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-500">
                  {products.map((product, index) => (
                    <tr key={index} className={`border-t border-gray-500/20 ${!product.isAvailable ? 'bg-gray-100' : ''}`}>
                      <td className="px-4 py-3 flex items-center space-x-3 truncate">
                        <div className="bg-gray-500/10 rounded p-2">
                          <Image
                            src={product.image[0]}
                            alt="product Image"
                            className={`w-12 h-12 object-cover ${!product.isAvailable ? 'opacity-50' : ''}`}
                            width={48}
                            height={48}
                          />
                        </div>
                        <span className={`truncate w-32 md:w-40 lg:w-full ${!product.isAvailable ? 'line-through text-gray-400' : ''}`}>
                          {product.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">{product.category}</td>
                      <td className="px-4 py-3">${product.offerPrice}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => toggleAvailability(product._id, product.isAvailable)}
                          disabled={updatingProductId === product._id}
                          className={`px-2 md:px-3 py-1 rounded-full text-xs ${
                            product.isAvailable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {updatingProductId === product._id ? (
                            <span>Updating...</span>
                          ) : (
                            <span>{product.isAvailable ? 'Available' : 'Not Available'}</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/product/${product._id}`)} 
                            className="flex items-center gap-1 px-2 md:px-3 py-1.5 bg-green-400 text-white rounded-md"
                          >
                            <span className="text-xs">Visit</span>
                            <Image
                              className="h-3"
                              src={assets.redirect_icon}
                              alt="redirect_icon"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProductList;