'use client';
import React, { useEffect, useState, useCallback } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading"; // Assuming you have a generic Loading component
import axios from "axios";
import toast from "react-hot-toast";
import { 
    ChevronDown, ChevronUp, Package, Search, Filter, Calendar, Phone, MapPin, 
    CreditCard, CheckCircle, XCircle, AlertTriangle, Eye, RefreshCw, Edit3, Save // Icons for payment
} from "lucide-react";

const Orders = () => {
    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true); // For initial page load
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [sortBy, setSortBy] = useState("newest");
    
    // For general item status updates (if you have per-item status update)
    // const [updatingItemIdStatus, setUpdatingItemIdStatus] = useState(null);
    // const [newItemStatusForItem, setNewItemStatusForItem] = useState(""); 
    // const [isItemStatusUpdateLoading, setIsItemStatusUpdateLoading] = useState(false);

    // For overall order status update
    const [editingOverallStatusOrderId, setEditingOverallStatusOrderId] = useState(null);
    const [newOverallStatus, setNewOverallStatus] = useState("");
    const [isOverallStatusUpdating, setIsOverallStatusUpdating] = useState(false);


    // For ABA payment confirmation
    const [paymentActionState, setPaymentActionState] = useState({ orderId: null, action: null, isLoading: false });
    
    const [showProofModal, setShowProofModal] = useState(false);
    const [currentProofImage, setCurrentProofImage] = useState("");


    const fetchSellerOrders = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/order/seller-orders', { // Ensure this is your correct endpoint
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                console.log("Fetched seller orders:", data.orders); // Log to inspect data
                setOrders(data.orders);
            } else {
                toast.error(data.message || "Failed to fetch orders.");
            }
        } catch (error) {
            console.error("Error in fetchSellerOrders:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to fetch orders.");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user, fetchSellerOrders]);

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrder(prev => (prev === orderId ? null : orderId));
        setEditingOverallStatusOrderId(null); // Close status editor if open
        setNewOverallStatus("");
    };
    
    // Handles ABA Payment Confirmation / Rejection
    const handlePaymentConfirmation = async (orderId, actionToConfirm) => { // actionToConfirm: 'confirm' or 'reject'
        setPaymentActionState({ orderId, action: actionToConfirm, isLoading: true });
        try {
            const token = await getToken();
            const payload = {
                orderId,
                paymentConfirmationAction: actionToConfirm 
            };
            const { data } = await axios.put('/api/order/update-status', payload, { // This is the immersive id="order_update_api_aba_payment"
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.order) {
                toast.success(`Payment ${actionToConfirm === 'confirm' ? 'confirmed' : 'rejected'} successfully.`);
                setOrders(prevOrders => prevOrders.map(o => (o._id === orderId ? data.order : o)));
            } else {
                toast.error(data.message || `Failed to ${actionToConfirm} payment.`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "An error occurred during payment update.");
        } finally {
            setPaymentActionState({ orderId: null, action: null, isLoading: false });
        }
    };

    // Handles Overall Order Status Update (for all items in the order)
    const handleUpdateOverallOrderStatus = async (orderIdToUpdate) => {
        if (!newOverallStatus) {
            toast.error("Please select a new status for the order.");
            return;
        }
        setIsOverallStatusUpdating(true);
        try {
            const token = await getToken();
            const orderToUpdate = orders.find(o => o._id === orderIdToUpdate);
            if (!orderToUpdate) {
                toast.error("Order not found.");
                return;
            }
            const allItemIds = orderToUpdate.items.map(item => item._id);

            if (allItemIds.length === 0 && newOverallStatus !== 'cancelled') { // Allow cancellation even with no items if that makes sense for your logic
                toast.warn("No items in this order to update status for, unless cancelling.");
                // If you want to allow changing status of an order with no items (e.g. to 'cancelled')
                // then the backend needs to handle itemIds being empty gracefully.
            }

            const { data } = await axios.put(
                '/api/order/update-status', // This is the immersive id="order_update_api_aba_payment"
                { orderId: orderIdToUpdate, itemIds: allItemIds, status: newOverallStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success && data.order) {
                toast.success("Overall order status updated successfully");
                setOrders(prevOrders => prevOrders.map(o => (o._id === orderIdToUpdate ? data.order : o)));
                setEditingOverallStatusOrderId(null); // Close editor
                setNewOverallStatus("");
            } else {
                toast.error(data.message || "Failed to update order status");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "An error occurred while updating order status.");
        } finally {
            setIsOverallStatusUpdating(false);
        }
    };


    const getFilteredOrders = () => {
        let filtered = [...orders];
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(order =>
                (order.address?.fullName?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (order._id?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (order.userId?.toLowerCase() || '').includes(lowerSearchTerm) || // If you want to search by user ID
                order.items.some(item => item.product?.name?.toLowerCase().includes(lowerSearchTerm))
            );
        }
        if (filterStatus !== "all") {
            filtered = filtered.filter(order => (order.status || '').toLowerCase() === filterStatus.toLowerCase());
        }
        filtered.sort((a, b) => {
            if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
            if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
            if (sortBy === "highest") return b.amount - a.amount;
            if (sortBy === "lowest") return a.amount - b.amount;
            return 0;
        });
        return filtered;
    };

    const getStatusColor = (status) => { // For overall order status
        const s = status?.toLowerCase();
        if (s === "delivered") return "bg-green-100 text-green-800";
        if (s === "out for delivery") return "bg-blue-100 text-blue-800";
        if (s === "processing") return "bg-yellow-100 text-yellow-800";
        if (s === "pending" || s === "order placed") return "bg-orange-100 text-orange-800";
        if (s === "cancelled") return "bg-red-100 text-red-800";
        if (s === "payment rejected") return "bg-pink-100 text-pink-800"; // Specific status for rejected payment
        return "bg-gray-100 text-gray-800";
    };
    
    const getPaymentStatusColor = (status) => { // For paymentStatus or paymentConfirmationStatus
        const s = status?.toLowerCase();
        if (s === "paid" || s === "confirmed") return "bg-green-100 text-green-700";
        if (s === "pending_confirmation" || s === "pending_review") return "bg-yellow-100 text-yellow-700";
        if (s === "pending") return "bg-orange-100 text-orange-700"; // General pending if not ABA
        if (s === "rejected" || s === "failed") return "bg-red-100 text-red-700";
        if (s === "na") return "bg-gray-100 text-gray-700";
        return "bg-gray-100 text-gray-700";
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        try {
            return new Date(dateString).toLocaleString(undefined, options);
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const openProofModal = (imageUrl) => {
        // IMPORTANT: This assumes `imageUrl` is the FILENAME for now.
        // In a real app, this should be the FULL URL from your storage service.
        // If it's a filename, you need a way to construct the full URL.
        // For local dev, you might serve static files or use a placeholder.
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            // This is a placeholder. Replace with your actual image serving logic.
            // Option 1: If you have a base URL for images
            // setCurrentProofImage(`YOUR_IMAGE_BASE_URL/${imageUrl}`);
            // Option 2: Placeholder if you can't construct URL yet
             setCurrentProofImage(`https://placehold.co/600x400/eee/ccc?text=Proof:${imageUrl.substring(0,20)}`);
        } else {
            setCurrentProofImage(imageUrl); // Assumes it's already a full URL or data URL
        }
        setShowProofModal(true);
    };
    
    const renderProofModal = () => (
        showProofModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowProofModal(false)}>
                <div className="bg-white p-4 rounded-lg shadow-xl max-w-xl w-full relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => setShowProofModal(false)}
                        className="absolute -top-2 -right-2 text-white bg-red-500 rounded-full p-1 hover:bg-red-700"
                        aria-label="Close image viewer"
                    >
                        <XCircle size={24} />
                    </button>
                    <h3 className="text-lg font-medium mb-3 text-gray-800">Transaction Proof</h3>
                    {currentProofImage ? (
                        <Image 
                            src={currentProofImage} 
                            alt="Transaction Proof" 
                            width={600} height={400} 
                            className="rounded-md object-contain max-h-[75vh] w-full" 
                            onError={(e) => {
                                e.target.onerror = null; // prevent infinite loop if placeholder also fails
                                e.target.src = `https://placehold.co/600x400/eee/ccc?text=Error+Loading+Image`;
                                console.warn("Failed to load proof image:", currentProofImage);
                            }}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-10">
                            <AlertTriangle size={40} className="mx-auto mb-2 text-yellow-500"/>
                            No image to display or image path is incorrect.
                        </div>
                    )}
                </div>
            </div>
        )
    );

    if (loading && orders.length === 0) {
        return <div className="flex justify-center items-center h-screen"><Loading /></div>;
    }

    return (
        <div className="flex-1 min-h-screen overflow-auto flex flex-col bg-gray-100">
            {renderProofModal()}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h1 className="text-3xl font-semibold text-gray-800">Order Management</h1>
                    <button onClick={fetchSellerOrders} className="text-sm text-blue-600 hover:text-blue-800 flex items-center" disabled={loading}>
                        <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Orders
                    </button>
                </div>

                {/* Filters Section */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="search-order" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="search-order"
                                    type="text"
                                    placeholder="Order ID, Customer, Product..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                            <select
                                id="filter-status"
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="Order Placed">Order Placed</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="out for delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="payment rejected">Payment Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                             <select
                                id="sort-by"
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Amount</option>
                                <option value="lowest">Lowest Amount</option>
                            </select>
                        </div>
                    </div>
                </div>

                {getFilteredOrders().length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="mt-2 text-xl font-semibold text-gray-800">No orders found</h3>
                        <p className="mt-2 text-gray-500">
                            {searchTerm || filterStatus !== "all"
                                ? "Try adjusting your search or filter criteria."
                                : "There are no orders to display at the moment."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {getFilteredOrders().map((order) => (
                            <div
                                key={order._id}
                                className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl"
                            >
                                <div
                                    className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleOrderExpansion(order._id)}
                                    onKeyPress={(e) => e.key === 'Enter' && toggleOrderExpansion(order._id)}
                                    tabIndex={0}
                                    role="button"
                                    aria-expanded={expandedOrder === order._id}
                                >
                                    <div className="flex items-center mb-3 md:mb-0">
                                        <div className={`p-3 rounded-full ${getStatusColor(order.status)} bg-opacity-20`}>
                                            <Package className={`h-6 w-6 ${getStatusColor(order.status).replace('bg-', 'text-').replace('-100', '-600')}`} />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-semibold text-gray-800 text-lg">Order #{order._id.slice(-6)}</p>
                                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                                <span>{formatDate(order.date)}</span>
                                                <span className="mx-1.5">•</span>
                                                <span>{order.items.length} item(s)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
                                        <div className="flex items-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                {order.status || "N/A"}
                                            </span>
                                            <p className="ml-4 font-bold text-gray-800 text-lg">{currency}{order.amount.toFixed(2)}</p>
                                        </div>
                                        <div className="ml-4 text-gray-500">
                                            {expandedOrder === order._id ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                                        </div>
                                    </div>
                                </div>

                                {expandedOrder === order._id && (
                                    <div className="border-t border-gray-200 bg-gray-50 p-5 grid grid-cols-1 lg:grid-cols-5 gap-6">
                                        {/* Left Column (3/5): Items & Summary */}
                                        <div className="lg:col-span-3 space-y-6">
                                            <div>
                                                <h4 className="font-semibold text-gray-700 mb-3 text-md">Order Items</h4>
                                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
                                                            <div className="flex items-center">
                                                                <Image
                                                                    src={item.product?.image?.[0] || item.product?.image || assets.box_icon}
                                                                    alt={item.product?.name || "Product"}
                                                                    width={50} height={50} className="rounded object-cover border border-gray-200"
                                                                />
                                                                <div className="ml-3">
                                                                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product?.name}</p>
                                                                    <p className="text-xs text-gray-500">Qty: {item.quantity} × {currency}{(item.product?.offerPrice || item.product?.price || 0).toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-700">{currency}{(item.quantity * (item.product?.offerPrice || item.product?.price || 0)).toFixed(2)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-semibold text-gray-700 mb-3 text-md">Payment & Order Summary</h4>
                                                <div className="bg-white rounded-lg p-4 shadow-sm space-y-2 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Payment Method:</span>
                                                        <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${order.paymentMethod === 'ABA' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                            {order.paymentMethod || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Financial Status:</span>
                                                        <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                            {order.paymentStatus?.replace(/_/g, ' ') || 'N/A'}
                                                        </span>
                                                    </div>
                                                    {order.paymentMethod === 'ABA' && (
                                                        <>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-600">Confirmation:</span>
                                                                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${getPaymentStatusColor(order.paymentConfirmationStatus)}`}>
                                                                    {order.paymentConfirmationStatus?.replace(/_/g, ' ') || 'N/A'}
                                                                </span>
                                                            </div>
                                                            {order.paymentTransactionImage && (
                                                                <div className="flex justify-between items-center pt-1">
                                                                    <span className="text-gray-600">Proof:</span>
                                                                    <button 
                                                                        onClick={() => openProofModal(order.paymentTransactionImage)}
                                                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center underline"
                                                                    >
                                                                        <Eye size={14} className="mr-1"/> View Proof
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {order.paymentConfirmationStatus === 'pending_review' && (
                                                                <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                                                                    <button
                                                                        onClick={() => handlePaymentConfirmation(order._id, 'confirm')}
                                                                        disabled={paymentActionState.isLoading && paymentActionState.orderId === order._id}
                                                                        className="flex-1 bg-green-500 text-white text-xs py-2 px-3 rounded-md hover:bg-green-600 disabled:bg-green-300 flex items-center justify-center transition-colors"
                                                                    >
                                                                        {paymentActionState.isLoading && paymentActionState.orderId === order._id && paymentActionState.action === 'confirm' ? <RefreshCw size={14} className="animate-spin mr-1"/> : <CheckCircle size={14} className="mr-1"/>} Confirm
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handlePaymentConfirmation(order._id, 'reject')}
                                                                        disabled={paymentActionState.isLoading && paymentActionState.orderId === order._id}
                                                                        className="flex-1 bg-red-500 text-white text-xs py-2 px-3 rounded-md hover:bg-red-600 disabled:bg-red-300 flex items-center justify-center transition-colors"
                                                                    >
                                                                        {paymentActionState.isLoading && paymentActionState.orderId === order._id && paymentActionState.action === 'reject' ? <RefreshCw size={14} className="animate-spin mr-1"/> : <XCircle size={14} className="mr-1"/>} Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    <div className="pt-2 border-t border-gray-100 mt-2"></div>
                                                    <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-medium text-gray-800">{currency}{order.subtotal.toFixed(2)}</span></div>
                                                    {order.discount > 0 && (<div className="flex justify-between"><span className="text-gray-600">Discount:</span><span className="font-medium text-green-600">-{currency}{order.discount.toFixed(2)}</span></div>)}
                                                    {order.promoCode?.code && (<div className="flex justify-between"><span className="text-gray-600">Promo:</span><span className="font-medium text-gray-800">{order.promoCode.code}</span></div>)}
                                                    <div className="flex justify-between"><span className="text-gray-600">Delivery:</span><span className="font-medium text-gray-800">{order.deliveryFee === 0 ? "Free" : `${currency}${order.deliveryFee.toFixed(2)}`}</span></div>
                                                    <div className="flex justify-between font-bold text-md pt-1 border-t border-gray-200 mt-1"><span className="text-gray-900">Total:</span><span className="text-gray-900">{currency}{order.amount.toFixed(2)}</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column (2/5): Delivery Info & Status Update */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <div>
                                                <h4 className="font-semibold text-gray-700 mb-3 text-md">Delivery Information</h4>
                                                <div className="bg-white rounded-lg p-4 shadow-sm font-kantumruy text-sm">
                                                    <p className="font-medium text-gray-800">{order.address?.fullName || 'N/A'}</p>
                                                    <div className="mt-2 space-y-1 text-gray-600">
                                                        <div className="flex items-start"><MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" /><p>{order.address?.area}, {order.address?.city}, {order.address?.state || 'N/A'}</p></div>
                                                        <div className="flex items-center"><Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" /><p>{order.address?.phoneNumber || 'N/A'}</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Overall Order Status Update */}
                                            <div>
                                                <h4 className="font-semibold text-gray-700 mb-3 text-md">Update Overall Order Status</h4>
                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                {editingOverallStatusOrderId === order._id ? (
                                                    <>
                                                        <select
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                            value={newOverallStatus}
                                                            onChange={(e) => setNewOverallStatus(e.target.value)}
                                                        >
                                                            <option value="">Select new status...</option>
                                                            <option value="processing">Processing</option>
                                                            <option value="out for delivery">Out for Delivery</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="cancelled">Cancelled</option>
                                                            {/* Add other relevant statuses */}
                                                        </select>
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="flex-1 bg-blue-600 text-white rounded-lg py-2 px-3 text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
                                                                onClick={() => handleUpdateOverallOrderStatus(order._id)}
                                                                disabled={isOverallStatusUpdating || !newOverallStatus}
                                                            >
                                                                {isOverallStatusUpdating ? <RefreshCw size={16} className="animate-spin mr-1"/> : <Save size={16} className="mr-1"/>} Save Status
                                                            </button>
                                                            <button
                                                                className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-2 px-3 text-sm font-medium hover:bg-gray-300 transition-colors"
                                                                onClick={() => { setEditingOverallStatusOrderId(null); setNewOverallStatus("");}}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="w-full bg-gray-100 text-gray-700 rounded-lg py-2 px-4 font-medium hover:bg-gray-200 transition-colors text-sm flex items-center justify-center border border-gray-300"
                                                        onClick={() => {
                                                            setEditingOverallStatusOrderId(order._id);
                                                            setNewOverallStatus(order.status); // Pre-fill with current status
                                                        }}
                                                        // Disable if payment is pending review, as that should be handled first
                                                        disabled={order.paymentMethod === 'ABA' && order.paymentConfirmationStatus === 'pending_review'}
                                                    >
                                                        <Edit3 size={16} className="mr-2"/> Change Order Status
                                                    </button>
                                                )}
                                                {order.paymentMethod === 'ABA' && order.paymentConfirmationStatus === 'pending_review' && (
                                                    <p className="text-xs text-yellow-700 mt-2 text-center">Confirm or reject ABA payment before changing order status.</p>
                                                )}
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
            <Footer />
        </div>
    );
};

export default Orders;

