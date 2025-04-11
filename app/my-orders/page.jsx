'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import { Package, Search, Filter, Calendar, Phone, MapPin, ChevronDown, ChevronUp } from "lucide-react";

const MyOrders = () => {
  const { currency, getToken, user, router } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/order/list', { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (data.success) {
        const sortedOrders = data.orders.reverse(); // Most recent first
        setOrders(sortedOrders);
        
        // Set the most recent order to be expanded by default
        if (sortedOrders.length > 0) {
          setExpandedOrder(sortedOrders[0]._id);
        }
        
        setLoading(false);
      } else {
        toast.error(data.message);
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const toggleOrderExpansion = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const getFilteredOrders = () => {
    let filtered = [...orders];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.address.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === "highest") {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === "lowest") {
      filtered.sort((a, b) => a.amount - b.amount);
    }
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-800";
      case "out for delivery": return "bg-blue-100 text-blue-800";
      case "processing": 
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header with filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-2xl font-medium">My Orders</h1>
            {!loading && orders.length > 0 && (
              <div className="hidden mt-4 md:mt-0 sm:flex flex-col sm:flex-row gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none sm:ml-2">
                    <select
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="out for delivery">Out for delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Sort</option>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Amount</option>
                      <option value="lowest">Lowest Amount</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loading />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gray-100 rounded-full">
                <Package className="text-gray-400 w-10 h-10" />
              </div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">When you place orders, they will appear here</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2 rounded-md transition duration-300"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredOrders().map((order) => (
                <div 
                  key={order._id} 
                  className="bg-white rounded-lg shadow overflow-hidden transition-all duration-200"
                >
                  <div 
                    className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleOrderExpansion(order._id)}
                  >
                    <div className="flex items-center mb-4 md:mb-0">
                      <div className="bg-sky-100 p-2 rounded-full">
                        <Package className="h-6 w-6 text-sky-600" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Order #{order._id.substring(order._id.length - 6)}</p>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">{formatDate(order.date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
                      <div className="flex items-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status || "pending")}`}>
                          {order.status || "Pending"}
                        </span>
                        <p className="ml-4 font-medium text-gray-900">{currency}{order.amount}</p>
                      </div>
                      <div className="ml-4">
                        {expandedOrder === order._id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedOrder === order._id && (
                    <div className="border-t border-gray-200 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Order Items ({order.items.length})</h3>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center mb-2 sm:mb-0">
                                <div className="w-14 h-14 min-w-14 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden">
                                  <Image 
                                    src={item.product.image?.[0] || assets.box_icon}
                                    alt={item.product.name}
                                    className="object-contain w-4/5 h-4/5 transition-transform duration-300 hover:scale-105"
                                    width={56}
                                    height={56}
                                  />
                                </div>
                                <div className="ml-3 flex-1">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                                  <div className="flex items-center justify-between sm:justify-start mt-1">
                                    <p className="text-sm text-gray-500">{currency}{item.product.price} each</p>
                                    <p className="text-sm font-medium text-gray-900 sm:hidden">
                                      x{item.quantity}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="font-medium hidden sm:block">
                                <span className="text-gray-900">x{item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">{currency}{order.amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Payment Method</span>
                            <span className="font-medium text-gray-900">COD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Payment Status</span>
                            <span className={`font-medium ${order.status === 'delivered' || order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {order.status === 'delivered' || order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Delivery Information</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="font-medium text-gray-900">{order.address.fullName}</p>
                          <div className="mt-2 space-y-1 text-gray-600">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                              <p className="text-sm font-kantumruy">{order.address.area}, {order.address.state}</p>
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <p className="text-sm">{order.address.phoneNumber}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h3 className="font-medium text-gray-900 mb-3">Order Timeline</h3>
                          <div className="space-y-4">
                            <div className="flex">
                              <div className="flex flex-col items-center mr-4">
                                <div className="rounded-full bg-sky-500 h-3 w-3"></div>
                                <div className="h-full w-0.5 bg-gray-200"></div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Order Placed</p>
                                <p className="text-xs text-gray-500">{formatDate(order.date)}</p>
                              </div>
                            </div>
                            
                            {/* Conditionally show next steps based on order status */}
                            <div className={`flex ${(order.status?.toLowerCase() === "processing" || order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "" : "opacity-50"}`}>
                              <div className="flex flex-col items-center mr-4">
                                <div className={`rounded-full ${(order.status?.toLowerCase() === "processing" || order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "bg-sky-500" : "bg-gray-300"} h-3 w-3`}></div>
                                <div className="h-full w-0.5 bg-gray-200"></div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Processing</p>
                                <p className="text-xs text-gray-500">
                                  {order.status?.toLowerCase() === "processing" ? "Your order is being processed" : 
                                   order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered" ? "Processed on " + formatDate(new Date(new Date(order.date).getTime() + 86400000)) : 
                                   "Awaiting processing"}
                                </p>
                              </div>
                            </div>
                            
                            <div className={`flex ${(order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "" : "opacity-50"}`}>
                              <div className="flex flex-col items-center mr-4">
                                <div className={`rounded-full ${(order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "bg-sky-500" : "bg-gray-300"} h-3 w-3`}></div>
                                <div className="h-full w-0.5 bg-gray-200"></div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Out for delivery</p>
                                <p className="text-xs text-gray-500">
                                  {order.status?.toLowerCase() === "out for delivery" ? "Your order is on the way" : 
                                   order.status?.toLowerCase() === "delivered" ? "Arrived on " + formatDate(new Date(new Date(order.date).getTime() + 172800000)) : 
                                   "Not yet out for delivery"}
                                </p>
                              </div>
                            </div>
                            
                            <div className={`flex ${order.status?.toLowerCase() === "delivered" ? "" : "opacity-50"}`}>
                              <div className="flex flex-col items-center mr-4">
                                <div className={`rounded-full ${order.status?.toLowerCase() === "delivered" ? "bg-sky-500" : "bg-gray-300"} h-3 w-3`}></div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Delivered</p>
                                <p className="text-xs text-gray-500">
                                  {order.status?.toLowerCase() === "delivered" ? "Delivered on " + formatDate(new Date(new Date(order.date).getTime() + 259200000)) : 
                                   "Awaiting delivery"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyOrders;