'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Package,
  Search,
  Filter,
  Calendar,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Heart
} from "lucide-react";

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
        order.items.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase())
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
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-800 border border-green-200";
      case "out for delivery": return "bg-blue-100 text-blue-800 border border-blue-200";
      case "processing": return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "pending": return "bg-orange-100 text-orange-800 border border-orange-200";
      case "cancelled": return "bg-red-100 text-red-800 border border-red-200";
      default: return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      case "out for delivery": return <Truck className="h-4 w-4" />;
      case "processing": return <Clock className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDetailedDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEstimatedDeliveryDate = (orderDate, status) => {
    const date = new Date(orderDate);
    let daysToAdd = 3; // Default delivery time

    switch (status?.toLowerCase()) {
      case "processing":
        daysToAdd = 2;
        break;
      case "out for delivery":
        daysToAdd = 1;
        break;
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        daysToAdd = 3;
    }

    date.setDate(date.getDate() + daysToAdd);
    return `Est. ${formatDate(date)}`;
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header with filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Heart className="h-8 w-8 text-pink-500 mr-3" />
                My Orders
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                {orders.length > 0 ? `${getFilteredOrders().length} of ${orders.length} orders` : "No orders found"}
              </p>
            </div>

            {!loading && orders.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search orders, products..."
                    className="pl-10 pr-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 w-full sm:w-64 bg-white/80 backdrop-blur-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      className="appearance-none bg-white/80 backdrop-blur-sm border border-pink-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="out for delivery">Out for delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      className="appearance-none bg-white/80 backdrop-blur-sm border border-pink-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-pink-100">
              <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gradient-to-r from-pink-100 to-blue-100 rounded-full">
                <Package className="text-pink-500 w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">When you place orders, they will appear here</p>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-lg transition duration-300 shadow-lg"
              >
                Continue Shopping
              </button>
            </div>
          ) : getFilteredOrders().length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-pink-100">
              <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gradient-to-r from-pink-100 to-blue-100 rounded-full">
                <Search className="text-pink-500 w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h2>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                }}
                className="text-pink-500 hover:text-pink-600 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredOrders().map((order) => (
                <div
                  key={order._id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden transition-all duration-200 hover:shadow-xl"
                >
                  <div
                    className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-pink-25 transition-colors"
                    onClick={() => toggleOrderExpansion(order._id)}
                  >
                    <div className="flex items-center mb-4 md:mb-0">
                      <div className="bg-gradient-to-r from-pink-100 to-blue-100 p-3 rounded-full">
                        <Package className="h-6 w-6 text-pink-600" />
                      </div>
                      <div className="ml-4">
                        <p className="font-semibold text-gray-900">
                          Order #{order._id.substring(order._id.length - 6)}
                        </p>
                        <div className="flex items-center mt-1 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-500">{formatDate(order.date)}</span>
                          </div>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{currency}{order.amount}</p>
                          <p className="text-xs text-gray-500">{getEstimatedDeliveryDate(order.date, order.status)}</p>
                        </div>
                        <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status || "pending")}`}>
                          {getStatusIcon(order.status || "pending")}
                          <span className="ml-1.5">{order.status || "Pending"}</span>
                        </div>
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
                    <div className="border-t border-pink-200 bg-gradient-to-r from-pink-25 to-blue-25">
                      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Order Items Section */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <Package className="h-5 w-5 mr-2 text-pink-500" />
                              Order Items ({order.items.length})
                            </h3>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 space-y-4 border border-pink-100">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2">
                                  <div className="flex items-center flex-1">
                                    <div className="w-16 h-16 min-w-16 bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg flex items-center justify-center overflow-hidden border border-pink-100">
                                      <Image
                                        src={item.product.image?.[0] || assets.box_icon}
                                        alt={item.product.name}
                                        className="object-contain w-4/5 h-4/5 transition-transform duration-300 hover:scale-105"
                                        width={64}
                                        height={64}
                                      />
                                    </div>
                                    <div className="ml-4 flex-1">
                                      <p className="font-medium text-gray-900 line-clamp-2">{item.product.name}</p>
                                      <p className="text-sm text-gray-500 mt-1">{currency}{item.product.offerPrice} each</p>
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="font-medium text-gray-900">x{item.quantity}</p>
                                    <p className="text-sm text-gray-500">
                                      {currency}{(item.product.offerPrice * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-pink-500" />
                              Order Summary
                            </h3>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 space-y-3 border border-pink-100">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-gray-900">{currency}{order.subtotal || order.amount}</span>
                              </div>

                              {order.promoCode && order.discount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Discount ({typeof order.promoCode === 'string' ? order.promoCode : order.promoCode?.code})
                                  </span>
                                  <span className="font-medium text-green-600">-{currency}{order.discount.toFixed(2)}</span>
                                </div>
                              )}

                              {order.deliveryFee !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Delivery Fee</span>
                                  <span className="font-medium text-gray-900">
                                    {order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between pt-3 border-t border-pink-200">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-bold text-pink-600">{currency}{(order.total || order.amount).toFixed(2)}</span>
                              </div>

                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-medium text-gray-900">Cash on Delivery</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment Status</span>
                                <span className={`font-medium ${order.status === 'delivered' || order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {order.status === 'delivered' || order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Invoice Generator */}
                          <InvoiceGenerator order={order} currency={currency} user={user} />
                        </div>

                        {/* Delivery & Timeline Section */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <MapPin className="h-5 w-5 mr-2 text-pink-500" />
                              Delivery Information
                            </h3>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-100">
                              <p className="font-medium text-gray-900 mb-2">{order.address.fullName}</p>
                              <div className="space-y-2 text-gray-600">
                                <div className="flex items-start">
                                  <MapPin className="h-4 w-4 text-pink-400 mr-2 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm">{order.address.area}, {order.address.state}</p>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 text-pink-400 mr-2 flex-shrink-0" />
                                  <p className="text-sm">{order.address.phoneNumber}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <Truck className="h-5 w-5 mr-2 text-pink-500" />
                              Order Timeline
                            </h3>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-100">
                              <div className="space-y-4">
                                <div className="flex">
                                  <div className="flex flex-col items-center mr-4">
                                    <div className="rounded-full bg-pink-500 h-3 w-3"></div>
                                    <div className="h-8 w-0.5 bg-pink-200"></div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                                    <p className="text-xs text-gray-500">{formatDetailedDate(order.date)}</p>
                                  </div>
                                </div>

                                <div className={`flex ${(order.status?.toLowerCase() === "processing" || order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "" : "opacity-50"}`}>
                                  <div className="flex flex-col items-center mr-4">
                                    <div className={`rounded-full ${(order.status?.toLowerCase() === "processing" || order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "bg-pink-500" : "bg-pink-200"} h-3 w-3`}></div>
                                    <div className="h-8 w-0.5 bg-pink-200"></div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Processing</p>
                                    <p className="text-xs text-gray-500">
                                      {order.status?.toLowerCase() === "processing" ? "Your order is being processed" :
                                        (order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "Processed" :
                                          "Awaiting processing"}
                                    </p>
                                  </div>
                                </div>

                                <div className={`flex ${(order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "" : "opacity-50"}`}>
                                  <div className="flex flex-col items-center mr-4">
                                    <div className={`rounded-full ${(order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "bg-pink-500" : "bg-pink-200"} h-3 w-3`}></div>
                                    <div className="h-8 w-0.5 bg-pink-200"></div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Out for Delivery</p>
                                    <p className="text-xs text-gray-500">
                                      {order.status?.toLowerCase() === "out for delivery" ? "Your order is on the way" :
                                        order.status?.toLowerCase() === "delivered" ? "Delivered successfully" :
                                          "Not yet dispatched"}
                                    </p>
                                  </div>
                                </div>

                                <div className={`flex ${order.status?.toLowerCase() === "delivered" ? "" : "opacity-50"}`}>
                                  <div className="flex flex-col items-center mr-4">
                                    <div className={`rounded-full ${order.status?.toLowerCase() === "delivered" ? "bg-green-500" : "bg-pink-200"} h-3 w-3`}></div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Delivered</p>
                                    <p className="text-xs text-gray-500">
                                      {order.status?.toLowerCase() === "delivered" ? "Order delivered successfully" :
                                        "Awaiting delivery"}
                                    </p>
                                  </div>
                                </div>
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