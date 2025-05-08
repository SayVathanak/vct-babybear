'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp, Package, Search, Filter, Calendar, Phone, MapPin } from "lucide-react";
import OrderDetails from "@/components/OrderDetails";

const Orders = () => {
    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [sortBy, setSortBy] = useState("newest");
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [updating, setUpdating] = useState(false);

    const fetchSellerOrders = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/order/seller-orders', { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            if (data.success) {
                setOrders(data.orders);
                setLoading(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    const toggleOrderExpansion = (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
          setUpdating(true);
          const token = await getToken();
      
          const order = orders.find(o => (o._id || o.id || o.orderId) === orderId);
          if (!order) {
            toast.error("Order not found");
            return;
          }
      
          const itemIds = order.items.map(item => item._id || item.id);
      
          const { data } = await axios.put(
            '/api/order/update-status',
            { orderId, status, itemIds },
            { headers: { Authorization: `Bearer ${token}` } }
          );
      
          if (data.success) {
            toast.success("Order status updated successfully");
            setOrders(orders.map(order =>
              (order._id || order.id || order.orderId) === orderId
                ? data.order
                : order
            ));
            setUpdatingOrderId(null);
            setNewStatus("");
          } else {
            toast.error(data.message || "Failed to update order status");
          }
        } catch (error) {
          toast.error(error.response?.data?.message || error.message || "An error occurred");
        } finally {
          setUpdating(false);
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
        <div className="flex-1 h-screen overflow-auto flex flex-col bg-gray-50">
            {loading ? (
                <Loading />
            ) : (
                <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <h1 className="text-2xl font-medium">Orders</h1>
                        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-none sm:ml-2">
                                    <select
                                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
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
                                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
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
                    </div>

                    {getFilteredOrders().length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
                            <p className="mt-2 text-gray-500">
                                {searchTerm || filterStatus !== "all" 
                                    ? "Try adjusting your search or filter criteria" 
                                    : "You don't have any orders yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {getFilteredOrders().map((order) => (
                                <div 
                                    key={order._id || order.id || order.orderId} 
                                    className="bg-white rounded-lg shadow overflow-hidden transition-all duration-200"
                                >
                                    <div 
                                        className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50"
                                        onClick={() => toggleOrderExpansion(order._id || order.id || order.orderId)}
                                    >
                                        <div className="flex items-center mb-4 md:mb-0">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <Package className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="font-medium text-gray-900">Order #{(order._id || order.id || order.orderId).slice(-6)}</p>
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
                                                {expandedOrder === (order._id || order.id || order.orderId) ? (
                                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedOrder === (order._id || order.id || order.orderId) && (
                                        <div className="border-t border-gray-200 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="font-medium text-gray-900 mb-3">Order Items ({order.items.length})</h3>
                                                <div className="space-y-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex items-center mb-2 sm:mb-0">
                                                                <div className="w-14 h-14 min-w-14 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden">
                                                                    <Image 
                                                                        src={item.product.image?.[0] || item.product.image || assets.box_icon}
                                                                        alt={item.product.name || "Product Image"}
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
                                                <div className="bg-gray-50 rounded-lg p-4 font-kantumruy">
                                                    <p className="font-medium text-gray-900">{order.address.fullName}</p>
                                                    <div className="mt-2 space-y-1 text-gray-600">
                                                        <div className="flex items-start">
                                                            <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                                            <p className="text-sm">{order.address.area}, {order.address.city}, {order.address.state}</p>
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
                                                                <div className="rounded-full bg-blue-500 h-3 w-3"></div>
                                                                <div className="h-full w-0.5 bg-gray-200"></div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Order Placed</p>
                                                                <p className="text-xs text-gray-500">{formatDate(order.date)}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Conditionally show processing step based on status */}
                                                        <div className={`flex ${(order.status?.toLowerCase() === "processing" || order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "" : "opacity-50"}`}>
                                                            <div className="flex flex-col items-center mr-4">
                                                                <div className={`rounded-full ${(order.status?.toLowerCase() === "processing" || order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "bg-blue-500" : "bg-gray-300"} h-3 w-3`}></div>
                                                                <div className="h-full w-0.5 bg-gray-200"></div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Processing</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {order.status?.toLowerCase() === "processing" ? "Order is being processed" : 
                                                                    order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered" ? "Processed" : 
                                                                    "Awaiting processing"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Conditionally show out for delivery step based on status */}
                                                        <div className={`flex ${(order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "" : "opacity-50"}`}>
                                                            <div className="flex flex-col items-center mr-4">
                                                                <div className={`rounded-full ${(order.status?.toLowerCase() === "out for delivery" || order.status?.toLowerCase() === "delivered") ? "bg-blue-500" : "bg-gray-300"} h-3 w-3`}></div>
                                                                <div className="h-full w-0.5 bg-gray-200"></div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Out for delivery</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {order.status?.toLowerCase() === "out for delivery" ? "Order is on the way" : 
                                                                    order.status?.toLowerCase() === "delivered" ? "Arrived" : 
                                                                    "Not yet out for delivery"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Conditionally show delivered step based on status */}
                                                        <div className={`flex ${order.status?.toLowerCase() === "delivered" ? "" : "opacity-50"}`}>
                                                            <div className="flex flex-col items-center mr-4">
                                                                <div className={`rounded-full ${order.status?.toLowerCase() === "delivered" ? "bg-blue-500" : "bg-gray-300"} h-3 w-3`}></div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Delivered</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {order.status?.toLowerCase() === "delivered" ? "Order has been delivered" : 
                                                                    "Awaiting delivery"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-gray-200">
                                                    {updatingOrderId === (order._id || order.id || order.orderId) ? (
                                                        <div className="space-y-2">
                                                            <select
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                value={newStatus}
                                                                onChange={(e) => setNewStatus(e.target.value)}
                                                            >
                                                                <option value="">Select new status</option>
                                                                <option value="pending">Pending</option>
                                                                <option value="processing">Processing</option>
                                                                <option value="out for delivery">Out for delivery</option>
                                                                <option value="delivered">Delivered</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    className="flex-1 bg-blue-600 text-white rounded-lg py-2 px-4 font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                                                                    onClick={() => updateOrderStatus(order._id || order.id || order.orderId, newStatus)}
                                                                    disabled={!newStatus || updating}
                                                                >
                                                                    {updating ? "Updating..." : "Save"}
                                                                </button>
                                                                <button 
                                                                    className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 px-4 font-medium hover:bg-gray-200 transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setUpdatingOrderId(null);
                                                                        setNewStatus("");
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            className="w-full bg-blue-600 text-white rounded-lg py-2 px-4 font-medium hover:bg-blue-700 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent order expansion toggle
                                                                setUpdatingOrderId(order._id || order.id || order.orderId);
                                                                setNewStatus(order.status || "");
                                                            }}
                                                        >
                                                            Update Order Status
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Orders;