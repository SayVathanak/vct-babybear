'use client';
import React, { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import Loading from "@/components/Loading";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Package, Search, Filter, Calendar, Phone, MapPin, ChevronDown, ChevronUp,
    FileText, Truck, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, Eye
} from "lucide-react";

// Assuming assets are available at this path or you have an assets object
// import { assets } from "@/assets/assets"; // If you have an assets object like in reference

const IMAGE_BASE_URL = null; // User's existing constant

// Memoized OrderItem component (UI improvements: cleaner layout, matches reference)
const OrderItem = memo(({ item, currency }) => (
    <div className="flex items-center justify-between py-2">
        <div className="flex items-center flex-1">
            <div className="w-16 h-16 min-w-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                    src={item.product?.image?.[0] || item.product?.image || "/assets/box_icon.svg"} // Using user's fallback path
                    alt={item.product?.name || "Product Image"}
                    className="object-contain w-4/5 h-4/5 transition-transform duration-300 hover:scale-105"
                    width={64}
                    height={64}
                    loading="lazy"
                />
            </div>
            <div className="ml-4 flex-1">
                <p className="font-medium text-gray-900 line-clamp-2">{item.product?.name || 'Unnamed Product'}</p>
                <p className="text-sm text-gray-500 mt-1">{currency}{(item.product?.offerPrice || item.product?.price || 0).toFixed(2)} each</p>
            </div>
        </div>
        <div className="text-right ml-4">
            <p className="font-medium text-gray-900">x{item.quantity}</p>
            <p className="text-sm text-gray-500">
                {currency}{((item.product?.offerPrice || item.product?.price || 0) * item.quantity).toFixed(2)}
            </p>
        </div>
    </div>
));
OrderItem.displayName = 'OrderItem';

// Memoized OrderTimeline component (UI improvements: cleaner visualization, matches reference)
const OrderTimeline = memo(({ order }) => {
    const timelineSteps = useMemo(() => [
        { key: 'placed', title: 'Order Placed', isActive: true, description: `Order placed on ${new Date(order.date).toLocaleDateString()}` },
        { key: 'processing', title: 'Processing', isActive: ['processing', 'out for delivery', 'delivered'].includes(order.status?.toLowerCase()), description: order.status?.toLowerCase() === 'processing' ? 'Your order is being processed' : (['out for delivery', 'delivered'].includes(order.status?.toLowerCase()) ? 'Processed' : 'Awaiting processing') },
        { key: 'delivery', title: 'Out for Delivery', isActive: ['out for delivery', 'delivered'].includes(order.status?.toLowerCase()), description: order.status?.toLowerCase() === 'out for delivery' ? 'Your order is on the way' : (order.status?.toLowerCase() === 'delivered' ? 'Delivered successfully' : 'Not yet dispatched') },
        { key: 'delivered', title: 'Delivered', isActive: order.status?.toLowerCase() === 'delivered', description: order.status?.toLowerCase() === 'delivered' ? 'Order delivered successfully' : 'Awaiting delivery' }
    ], [order.status, order.date]);

    return (
        <div className="space-y-4">
            {timelineSteps.map((step, index) => (
                <div key={step.key} className={`flex ${!step.isActive ? 'opacity-50' : ''}`}> {/* opacity-50 from reference */}
                    <div className="flex flex-col items-center mr-4">
                        <div className={`rounded-full ${step.isActive ? (step.key === 'delivered' ? 'bg-green-500' : 'bg-sky-500') : 'bg-gray-300'} h-3 w-3`}></div>
                        {index < timelineSteps.length - 1 && <div className="h-8 w-0.5 bg-gray-300"></div>}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{step.title}</p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
});
OrderTimeline.displayName = 'OrderTimeline';

// Error Boundary Component (as provided by user, good for robustness)
class OrderErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error('MyOrders page error:', error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
                    <p className="text-red-600 mb-4">We encountered an error while loading your orders.</p>
                    <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"> Reload Page </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const MyOrders = () => {
    const { currency, getToken, user, router } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // User's filter options are more extensive
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [sortBy, setSortBy] = useState("newest");
    const [retryCount, setRetryCount] = useState(0);
    const initialLoadComplete = useRef(false);

    const [showProofModal, setShowProofModal] = useState(false);
    const [currentProofImageUrl, setCurrentProofImageUrl] = useState("");

    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }, []);

    // Using user's getStatusColor for more comprehensive status handling
    const getStatusColor = useCallback((status) => {
        const s = status?.toLowerCase();
        if (s === "delivered") return "bg-green-100 text-green-800";
        if (s === "out for delivery") return "bg-blue-100 text-blue-800";
        if (s === "processing") return "bg-yellow-100 text-yellow-800";
        if (s === "pending" || s === "order placed") return "bg-orange-100 text-orange-800";
        if (s === "cancelled") return "bg-red-100 text-red-800";
        if (s === "payment rejected") return "bg-pink-100 text-pink-800";
        return "bg-gray-100 text-gray-800";
    }, []);

    // Using user's getStatusIcon for more comprehensive status handling
    const getStatusIcon = useCallback((status) => {
        switch (status?.toLowerCase()) {
            case "delivered": return <CheckCircle className="h-4 w-4" />;
            case "out for delivery": return <Truck className="h-4 w-4" />;
            case "processing": return <Clock className="h-4 w-4" />;
            case "pending": case "order placed": return <Clock className="h-4 w-4" />;
            case "cancelled": return <XCircle className="h-4 w-4" />;
            // "payment rejected" could have a specific icon if desired, e.g., AlertCircle
            default: return <Package className="h-4 w-4" />;
        }
    }, []);

    const getPaymentStatusColorText = useCallback((status) => {
        const s = status?.toLowerCase();
        if (s === "paid" || s === "confirmed") return "text-green-700";
        if (s === "pending_confirmation" || s === "pending_review") return "text-yellow-700";
        if (s === "pending") return "text-orange-700";
        if (s === "rejected" || s === "failed") return "text-red-700";
        if (s === "na") return "text-gray-700";
        return "text-gray-700";
    }, []);

    const getEstimatedDeliveryDate = useCallback((orderDate, status) => {
        const date = new Date(orderDate);
        let daysToAdd = 3;
        switch (status?.toLowerCase()) {
            case "processing": daysToAdd = 2; break;
            case "out for delivery": daysToAdd = 1; break;
            case "delivered": return "Delivered";
            case "cancelled": return "Cancelled";
            case "payment rejected": return "Payment Issue";
            default: daysToAdd = 3;
        }
        date.setDate(date.getDate() + daysToAdd);
        return `Est. ${formatDate(date)}`;
    }, [formatDate]);

    const fetchOrders = useCallback(async (retryAttempt = 0) => {
        try {
            setError(null);
            if (retryAttempt === 0) setLoading(true);

            const token = await getToken();
            if (!token) throw new Error('Authentication token not available');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const { data } = await axios.get('/api/order/list', {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (data.success) {
                const sortedOrders = data.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
                setOrders(sortedOrders);
                setRetryCount(0);
            } else {
                throw new Error(data.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Fetch MyOrders error:', error);

            if (error.name === 'AbortError') {
                setError('Request timed out. Please check your connection.');
            } else if (retryAttempt < 2) {
                setTimeout(() => {
                    setRetryCount(retryAttempt + 1);
                    fetchOrders(retryAttempt + 1);
                }, Math.pow(2, retryAttempt) * 1000);
                return;
            } else {
                setError(error.message || 'Failed to load orders');
                toast.error(error.message || 'Failed to load orders');
            }
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (user) fetchOrders();
        else setLoading(false);
    }, [user, fetchOrders]);

    useEffect(() => {
        // Expand the first order on the initial load, and only once.
        if (orders.length > 0 && !initialLoadComplete.current) {
            setExpandedOrder(orders[0]?._id);
            initialLoadComplete.current = true;
        }
    }, [orders]);

    const filteredOrders = useMemo(() => {
        if (!orders.length) return [];
        let filtered = [...orders];
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(order =>
                order.address?.fullName?.toLowerCase().includes(searchLower) ||
                order.items.some(item => item.product?.name?.toLowerCase().includes(searchLower)) ||
                order._id?.toLowerCase().includes(searchLower)
            );
        }
        if (filterStatus !== "all") {
            // Ensuring case-insensitive comparison for status filter
            filtered = filtered.filter(order => order.status?.toLowerCase() === filterStatus.toLowerCase());
        }
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest": return new Date(b.date) - new Date(a.date);
                case "oldest": return new Date(a.date) - new Date(b.date);
                case "highest": return b.amount - a.amount;
                case "lowest": return a.amount - b.amount;
                default: return 0;
            }
        });
        return filtered;
    }, [orders, searchTerm, filterStatus, sortBy]);

    const toggleOrderExpansion = useCallback((orderId) => {
        setExpandedOrder(current => current === orderId ? null : orderId);
    }, []);

    const handleRetry = useCallback(() => { fetchOrders(); }, [fetchOrders]);
    const clearFilters = useCallback(() => { setSearchTerm(""); setFilterStatus("all"); setSortBy("newest"); }, []);


    const openProofModal = (imageIdentifier) => {
        if (!imageIdentifier) {
            setCurrentProofImageUrl("/assets/no-image.png"); // User's fallback
            setShowProofModal(true);
            return;
        }
        if (imageIdentifier.startsWith('http://') || imageIdentifier.startsWith('https://') || imageIdentifier.startsWith('data:')) {
            setCurrentProofImageUrl(imageIdentifier);
        } else if (IMAGE_BASE_URL) { // Kept user's logic for IMAGE_BASE_URL
            setCurrentProofImageUrl(`${IMAGE_BASE_URL}${imageIdentifier}`);
        } else {
            console.warn("MyOrders: IMAGE_BASE_URL not defined or imageIdentifier not a URL:", imageIdentifier);
            setCurrentProofImageUrl("/assets/no-image.png"); // User's fallback
        }
        setShowProofModal(true);
    };

    const renderProofModal = () => ( // User's modal functionality
        showProofModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
                    <button onClick={() => setShowProofModal(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                        <XCircle size={24} />
                    </button>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Proof</h3>
                        {currentProofImageUrl ? (
                            <Image
                                src={currentProofImageUrl}
                                alt="Transaction Proof"
                                width={800}
                                height={600}
                                className="rounded-md object-contain w-full max-h-[75vh]"
                                onError={() => setCurrentProofImageUrl("/assets/no-image.png")} // User's fallback
                            />
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <AlertCircle className="mx-auto h-10 w-10 mb-2" />
                                <p>No proof available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    );

    if (loading && !orders.length) { // Style matched with reference
        return (<><Navbar /><div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen bg-gray-50"><div className="flex justify-center items-center py-16"><Loading /></div></div><Footer /></>);
    }
    if (error && !orders.length) { // Style matched with reference
        return (<><Navbar /><div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen bg-gray-50"><div className="max-w-6xl mx-auto w-full"><div className="bg-white rounded-lg shadow-sm p-12 text-center"> {/* shadow-sm from reference */} <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-red-100 rounded-full"><AlertCircle className="text-red-500 w-10 h-10" /></div><h2 className="text-xl font-medium text-gray-700 mb-2">Failed to load orders</h2><p className="text-gray-500 mb-6">{error}</p><div className="flex gap-4 justify-center"><button onClick={handleRetry} disabled={loading} className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-medium px-6 py-3 rounded-lg transition duration-300 flex items-center"><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Try Again</button><button onClick={() => router.push('/')} className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition duration-300">Go Shopping</button></div>{retryCount > 0 && (<p className="text-sm text-gray-500 mt-4">Retry attempt: {retryCount}/2</p>)}</div></div></div><Footer /></>);
    }

    return (
        <OrderErrorBoundary>
            <Navbar />
            {renderProofModal()} {/* User's modal */}
            <div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen bg-gray-50"> {/* Main div styled as reference */}
                <div className="max-w-6xl mx-auto w-full">
                    {/* Header with filters - matches reference structure */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-medium text-gray-900">My Orders</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {orders.length > 0 ? `${filteredOrders.length} of ${orders.length} orders` : "No orders found"}
                            </p>
                        </div>

                        {!loading && orders.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Search orders, products..." // Simplified placeholder
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full sm:w-64 text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        aria-label="Search orders"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative">
                                        <select
                                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            aria-label="Filter by status"
                                        >
                                            <option value="all">All Statuses</option> {/* User's extensive options */}
                                            <option value="Order Placed">Order Placed</option>
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="out for delivery">Out for Delivery</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="payment rejected">Payment Rejected</option>
                                        </select>
                                        <Filter className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                                    </div>

                                    <div className="relative">
                                        <select
                                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            aria-label="Sort orders"
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="highest">Highest Amount</option>
                                            <option value="lowest">Lowest Amount</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                                    </div>
                                    {(searchTerm || filterStatus !== "all" || sortBy !== "newest") && ( // User's clear condition
                                        <button onClick={clearFilters} className="text-sky-500 hover:text-sky-700 text-sm px-3 py-2 rounded-lg hover:bg-sky-100 transition-colors">Clear</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content - matches reference structure */}
                    {orders.length === 0 && !loading ? ( // Adjusted "No orders yet" state
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gray-100 rounded-full">
                                <Package className="text-gray-400 w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-medium text-gray-700 mb-2">No orders yet</h2>
                            <p className="text-gray-500 mb-6">When you place orders, they will appear here</p>
                            <button onClick={() => router.push('/')} className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-3 rounded-lg transition duration-300">Continue Shopping</button>
                        </div>
                    ) : filteredOrders.length === 0 && !loading ? ( // "No orders found" after filtering
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gray-100 rounded-full">
                                <Search className="text-gray-400 w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-medium text-gray-700 mb-2">No orders found</h2>
                            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                            <button onClick={clearFilters} className="text-sky-500 hover:text-sky-600 font-medium">Clear filters</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => (
                                <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
                                    <div
                                        className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleOrderExpansion(order._id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOrderExpansion(order._id); } }}
                                        tabIndex={0}
                                        role="button"
                                        aria-expanded={expandedOrder === order._id}
                                        aria-controls={`order-details-${order._id}`}
                                        aria-label={`Order #${order._id.slice(-6)}, ${expandedOrder === order._id ? 'collapse' : 'expand'} details`}
                                    >
                                        <div className="flex items-center mb-4 md:mb-0">
                                            <div className="bg-sky-100 p-3 rounded-full"> {/* Icon style from reference */}
                                                <Package className="h-6 w-6 text-sky-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="font-semibold text-gray-900">Order #{order._id.slice(-6)}</p>
                                                <div className="flex items-center mt-1 space-x-4">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1" />
                                                        <span className="text-sm text-gray-500">{formatDate(order.date)}</span>
                                                    </div>
                                                    <span className="text-sm text-gray-400">•</span>
                                                    <span className="text-sm text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
                                            <div className="flex items-center space-x-2 sm:space-x-4"> {/* Adjusted spacing for smaller screens */}
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">{currency}{(order.amount || 0).toFixed(2)}</p>
                                                    <p className="text-xs text-gray-500">{getEstimatedDeliveryDate(order.date, order.status)}</p>
                                                </div>
                                                <div className={`flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}> {/* Using user's getStatusColor */}
                                                    {getStatusIcon(order.status)} {/* Using user's getStatusIcon */}
                                                    <span className="ml-1.5 hidden sm:inline">{order.status?.replace(/_/g, ' ') || "N/A"}</span> {/* Show full status text on sm+ */}
                                                    <span className="ml-1.5 sm:hidden">{(order.status?.replace(/_/g, ' ') || "N/A").substring(0, 7)}..</span> {/* Abbreviate on xs */}
                                                </div>
                                            </div>
                                            <div className="ml-3 sm:ml-4"> {/* Adjusted spacing */}
                                                {expandedOrder === order._id ? (<ChevronUp className="h-5 w-5 text-gray-500" />) : (<ChevronDown className="h-5 w-5 text-gray-500" />)}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedOrder === order._id && (
                                        <div className="border-t border-gray-200 bg-gray-50">
                                            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8"> {/* Adjusted gap */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center"> {/* Adjusted mb */}
                                                            <Package className="h-5 w-5 mr-2 text-sky-600" /> Order Items ({order.items.length})
                                                        </h3>
                                                        <div className="bg-white rounded-lg p-4 space-y-3 shadow-sm border border-gray-100"> {/* Added card styling */}
                                                            {order.items.map((item) => (
                                                                <OrderItem key={item._id || item.product?._id} item={item} currency={currency} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div> {/* User's Payment Summary with "View Proof" button integration */}
                                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                            <FileText className="h-5 w-5 mr-2 text-sky-600" /> Payment Summary
                                                        </h3>
                                                        <div className="bg-white rounded-lg p-4 space-y-2 shadow-sm border border-gray-100"> {/* Added card styling, adjusted spacing */}
                                                            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal:</span><span className="font-medium text-gray-800">{currency}{(order.subtotal || order.amount || 0).toFixed(2)}</span></div>
                                                            {order.discount > 0 && (
                                                                <div className="flex justify-between text-sm text-green-600"><span>Discount:</span><span className="font-medium">-{currency}{(order.discount || 0).toFixed(2)}</span></div>
                                                            )}
                                                            {order.deliveryFee !== undefined && ( // Check for undefined to show free delivery if 0
                                                                <div className="flex justify-between text-sm text-gray-600"><span>Delivery Fee:</span><span className="font-medium text-gray-800">{order.deliveryFee === 0 ? "Free" : `${currency}${(order.deliveryFee || 0).toFixed(2)}`}</span></div>
                                                            )}
                                                            <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200 mt-2"><span>Total:</span><span>{currency}{(order.total || order.amount || 0).toFixed(2)}</span></div>

                                                            <div className="mt-2 border-t border-gray-200 pt-2 space-y-1">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-600">Payment Method:</span>
                                                                    <span className={`font-medium ${order.paymentMethod === 'ABA' ? 'text-blue-600' : (order.paymentMethod === 'Cash on Delivery' ? 'text-green-600' : 'text-gray-800')}`}>
                                                                        {order.paymentMethod || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-600">Payment Status:</span>
                                                                    <span className={`font-medium ${getPaymentStatusColorText(order.paymentStatus)}`}>
                                                                        {order.paymentStatus?.replace(/_/g, ' ') || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                {order.paymentMethod === 'ABA' && order.paymentTransactionImage && (
                                                                    <div className="pt-1 text-right">
                                                                        <button onClick={() => openProofModal(order.paymentTransactionImage)} className="inline-flex items-center text-sky-500 hover:text-sky-700 hover:underline text-sm font-medium">
                                                                            <Eye className="mr-1.5" size={14} /> View
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                            <MapPin className="h-5 w-5 mr-2 text-sky-600" /> Delivery Information
                                                        </h3>
                                                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"> {/* Added card styling */}
                                                            <p className="font-medium text-gray-900 mb-1.5">{order.address?.fullName || 'N/A'}</p>
                                                            <div className="space-y-1.5 text-gray-600 font-kantumruy"> {/* font-kantumruy from reference */}
                                                                <div className="flex items-start">
                                                                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                    <p className="text-sm">{order.address?.area || 'N/A'}, {order.address?.state || 'N/A'}</p>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                                                    <p className="text-sm">0{order.address?.phoneNumber || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                            <Truck className="h-5 w-5 mr-2 text-sky-600" /> Order Timeline
                                                        </h3>
                                                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"> {/* Added card styling */}
                                                            <OrderTimeline order={order} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Invoice Generator - Placed at the bottom of the expanded view, spanning if needed or as a separate card */}
                                                <div className="lg:col-span-2 mt-2"> {/* Spans two columns on large screens */}
                                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                        <FileText className="h-5 w-5 mr-2 text-sky-600" /> Invoice
                                                    </h3>
                                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                                        {/* <InvoiceGenerator order={order} currency={currency} user={user} /> */}
                                                        <InvoiceGenerator
                                                            order={order}
                                                            currency={currency}
                                                            user={user}
                                                            companyLogo={assets.logo_2}
                                                        />
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
        </OrderErrorBoundary>
    );
};

export default MyOrders;