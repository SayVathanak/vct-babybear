'use client';

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { FaShoppingCart, FaChevronLeft, FaMapMarkerAlt, FaUser, FaEnvelope, FaPhoneAlt, FaTruck, FaCalendarAlt, FaCreditCard } from "react-icons/fa";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { MdOutlineError } from "react-icons/md";
import { assets } from "@/assets/assets";

const OrderDetails = () => {
  const { orderId } = useParams();
  const { currency, getToken, user, router, addToCart } = useAppContext();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingItemToCart, setAddingItemToCart] = useState(null);

  const fetchOrderDetails = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/order/${orderId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (data.success) {
        setOrder(data.order);
      } else {
        toast.error(data.message || "Failed to load order details");
        router.push('/orders');
      }
    } catch (error) {
      toast.error("Could not load order details");
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
    } else if (!loading) {
      router.push('/login');
    }
  }, [user, orderId]);

  const getStatusColor = (status) => {
    switch(status) {
      case "Delivered":
        return "text-green-600 bg-green-50 border-green-100";
      case "Cancelled":
        return "text-red-500 bg-red-50 border-red-100";
      case "Pending":
      default:
        return "text-amber-500 bg-amber-50 border-amber-100";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Delivered":
        return <IoMdCheckmarkCircleOutline className="mr-2" />;
      case "Cancelled":
        return <MdOutlineError className="mr-2" />;
      case "Pending":
      default:
        return (
          <svg className="animate-pulse mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddItemToCart = async (productId) => {
    setAddingItemToCart(productId);
    
    try {
      // Check if product is still available
      const { data } = await axios.get(`/api/products/${productId}`);
      
      if (data.success && data.product.isAvailable !== false) {
        await addToCart(productId);
        toast.success("Added to cart");
      } else {
        toast.error("This product is no longer available");
      }
    } catch (error) {
      toast.error("Failed to add item to cart");
    } finally {
      setAddingItemToCart(null);
    }
  };

  const handleAddAllToCart = async () => {
    if (!order || !order.items.length) return;
    
    setAddingToCart(true);
    
    try {
      // Add each item to cart with proper quantity
      for (const item of order.items) {
        // Check if product is still available
        const { data } = await axios.get(`/api/products/${item.product._id}`);
        
        if (data.success && data.product.isAvailable !== false) {
          // Add to cart with the same quantity as in the original order
          for (let i = 0; i < item.quantity; i++) {
            await addToCart(item.product._id);
          }
        } else {
          toast.error(`${item.product.name} is no longer available`);
        }
      }
      
      toast.success("All available items added to your cart!");
      
      // Redirect to cart page
      router.push('/cart');
    } catch (error) {
      toast.error("Failed to add items to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewProduct = (productId) => {
    router.push(`/product/${productId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loading />
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <MdOutlineError className="text-red-500 w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md transition duration-300"
          >
            <FaChevronLeft className="mr-2" />
            Back to My Orders
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-6 px-4 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center text-sky-600 hover:text-sky-700 mb-6 transition duration-300"
          >
            <FaChevronLeft className="mr-2" />
            Back to My Orders
          </button>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            {/* Order Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  Order #{orderId.substring(orderId.length - 6)}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  <FaCalendarAlt className="inline mr-2" />
                  Placed on {formatDate(order.date)}
                </p>
              </div>
              
              <div className={`${getStatusColor(order.status || "Pending")} mt-4 md:mt-0 px-4 py-2 rounded-md flex items-center border`}>
                {getStatusIcon(order.status || "Pending")}
                <span className="font-medium">{order.status || "Pending"}</span>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Order Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Shipping Address */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center text-gray-700 font-medium mb-3">
                    <FaMapMarkerAlt className="mr-2 text-gray-500" />
                    Shipping Address
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-800">{order.address.fullName}</p>
                    <p>{order.address.area}</p>
                    <p>{order.address.city}, {order.address.state}</p>
                    <p>{order.address.zipCode}</p>
                    <p className="flex items-center mt-2">
                      <FaPhoneAlt className="mr-2 text-gray-400" />
                      {order.address.phoneNumber}
                    </p>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center text-gray-700 font-medium mb-3">
                    <FaCreditCard className="mr-2 text-gray-500" />
                    Payment Information
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="text-gray-500">Method:</span> Cash on Delivery</p>
                    <p><span className="text-gray-500">Status:</span> {order.paymentStatus || "Pending"}</p>
                    <p><span className="text-gray-500">Subtotal:</span> {currency}{order.amount - (order.shippingCost || 0)}</p>
                    <p><span className="text-gray-500">Shipping:</span> {currency}{order.shippingCost || 0}</p>
                    <p className="font-medium text-gray-800 pt-2 border-t border-gray-100 mt-2">
                      <span className="text-gray-500">Total:</span> {currency}{order.amount}
                    </p>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center text-gray-700 font-medium mb-3">
                    <FaTruck className="mr-2 text-gray-500" />
                    Delivery Information
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="text-gray-500">Status:</span> {order.status || "Pending"}</p>
                    <p><span className="text-gray-500">Estimated:</span> {order.estimatedDelivery || "3-5 Business Days"}</p>
                    {order.trackingNumber && (
                      <p><span className="text-gray-500">Tracking:</span> {order.trackingNumber}</p>
                    )}
                    {order.deliveredAt && (
                      <p><span className="text-gray-500">Delivered:</span> {formatDate(order.deliveredAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-lg font-medium text-gray-800 mb-2 sm:mb-0">Order Items ({order.items.length})</h2>
                <button
                  onClick={handleAddAllToCart}
                  disabled={addingToCart}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-md transition duration-300 flex items-center"
                >
                  {addingToCart ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaShoppingCart className="mr-2" />
                      Add All to Cart
                    </>
                  )}
                </button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 bg-gray-50 p-4 border-b text-sm font-medium text-gray-700">
                  <div className="col-span-7">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                
                {/* Table Body */}
                {order.items.map((item, index) => (
                  <div key={index} className={`md:grid grid-cols-12 p-4 items-center ${index !== order.items.length - 1 ? 'border-b' : ''}`}>
                    {/* Product - Mobile & Desktop */}
                    <div className="col-span-7">
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded flex items-center justify-center overflow-hidden mr-3">
                          <Image
                            src={item.product.image?.[0] || assets.box_icon}
                            alt={item.product.name}
                            width={60}
                            height={60}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-sm font-medium text-gray-800 hover:text-sky-600 cursor-pointer transition line-clamp-2"
                            onClick={() => handleViewProduct(item.product._id)}
                          >
                            {item.product.name}
                          </h3>
                          {item.product.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1 hidden sm:block">
                              {item.product.description}
                            </p>
                          )}
                          
                          {/* Mobile Only Price, Qty, Total */}
                          <div className="grid grid-cols-3 gap-2 mt-2 md:hidden">
                            <div>
                              <span className="text-xs text-gray-500">Price:</span>
                              <p className="text-sm font-medium">{currency}{item.price}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Qty:</span>
                              <p className="text-sm font-medium">{item.quantity}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Total:</span>
                              <p className="text-sm font-medium">{currency}{item.price * item.quantity}</p>
                            </div>
                          </div>
                          
                          {/* Mobile Only Button */}
                          <div className="mt-3 md:hidden">
                            <button
                              onClick={() => handleAddItemToCart(item.product._id)}
                              disabled={addingItemToCart === item.product._id}
                              className={`text-xs bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-md transition flex items-center ${
                                addingItemToCart === item.product._id ? 'opacity-70' : ''
                              }`}
                            >
                              {addingItemToCart === item.product._id ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <FaShoppingCart className="mr-1" size={10} />
                                  Add to Cart
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Only - Price, Qty, Total */}
                    <div className="col-span-2 text-center hidden md:block">
                      {currency}{item.price}
                    </div>
                    <div className="col-span-1 text-center hidden md:block">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 hidden md:flex justify-between items-center">
                      <span className="font-medium text-right flex-1">{currency}{item.price * item.quantity}</span>
                      <button
                        onClick={() => handleAddItemToCart(item.product._id)}
                        disabled={addingItemToCart === item.product._id}
                        className={`ml-4 text-xs bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-md transition flex items-center ${
                          addingItemToCart === item.product._id ? 'opacity-70' : ''
                        }`}
                      >
                        {addingItemToCart === item.product._id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : (
                          <>
                            <FaShoppingCart className="mr-1" size={10} />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Order Totals */}
                <div className="bg-gray-50 p-4 border-t">
                  <div className="flex flex-col space-y-1 sm:space-y-2 ml-auto max-w-xs">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{currency}{order.amount - (order.shippingCost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">{currency}{order.shippingCost || 0}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-red-500">-{currency}{order.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200 mt-1">
                      <span className="font-medium text-gray-700">Total:</span>
                      <span className="font-bold text-lg">{currency}{order.amount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-800">Order Timeline</h2>
            </div>
            <div className="p-6">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px sm:before:mx-8.5 before:h-full before:w-0.5 before:bg-gray-100">
                <div className="relative flex items-start">
                  <div className="absolute left-0 flex items-center justify-center w-10 sm:w-16">
                    <div className="bg-green-100 text-green-600 h-7 w-7 rounded-full flex items-center justify-center">
                      <IoMdCheckmarkCircleOutline className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="ml-12 sm:ml-20 pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Order Placed</h3>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(order.date)}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Your order has been received and is being processed.</p>
                    </div>
                  </div>
                </div>
                
                {/* Payment Status */}
                <div className="relative flex items-start">
                  <div className="absolute left-0 flex items-center justify-center w-10 sm:w-16">
                    <div className={`${
                      order.paymentStatus === "Paid" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                    } h-7 w-7 rounded-full flex items-center justify-center`}>
                      {order.paymentStatus === "Paid" ? (
                        <IoMdCheckmarkCircleOutline className="w-5 h-5" />
                      ) : (
                        <svg className="animate-pulse h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-12 sm:ml-20 pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Payment {order.paymentStatus || "Pending"}</h3>
                        <p className="text-xs text-gray-500 mt-1">Cash on Delivery</p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        {order.paymentStatus === "Paid" 
                          ? "Your payment has been completed successfully." 
                          : "Payment will be collected at the time of delivery."}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Order Status */}
                <div className="relative flex items-start">
                  <div className="absolute left-0 flex items-center justify-center w-10 sm:w-16">
                    <div className={`${
                      order.status === "Delivered" 
                        ? "bg-green-100 text-green-600" 
                        : order.status === "Cancelled" 
                          ? "bg-red-100 text-red-600" 
                          : "bg-amber-100 text-amber-600"
                    } h-7 w-7 rounded-full flex items-center justify-center`}>
                      {getStatusIcon(order.status || "Pending")}
                    </div>
                  </div>
                  <div className="ml-12 sm:ml-20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {order.status === "Delivered" 
                            ? "Order Delivered" 
                            : order.status === "Cancelled" 
                              ? "Order Cancelled" 
                              : "Order Processing"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.status === "Delivered" && order.deliveredAt 
                            ? formatDate(order.deliveredAt) 
                            : order.status === "Cancelled" && order.cancelledAt 
                              ? formatDate(order.cancelledAt)
                              : "Estimated delivery: 3-5 business days"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        {order.status === "Delivered" 
                          ? "Your order has been delivered successfully." 
                          : order.status === "Cancelled" 
                            ? "Your order has been cancelled."
                            : "Your order is being prepared for shipping."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-12">
            <button
              onClick={() => router.push('/orders')}
              className="flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-md transition duration-300"
            >
              <FaChevronLeft className="mr-2" />
              Back to My Orders
            </button>
            <div className="flex gap-4">
              <button
                onClick={handleAddAllToCart}
                disabled={addingToCart}
                className="flex-1 sm:flex-none flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white px-5 py-3 rounded-md transition duration-300"
              >
                {addingToCart ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="mr-2" />
                    Reorder
                  </>
                )}
              </button>
              {order.status !== "Cancelled" && order.status !== "Delivered" && (
                <button
                  onClick={() => {
                    toast.success("Contact support feature coming soon!");
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-md transition duration-300"
                >
                  Contact Support
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderDetails;