'use client';
import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import {
    CiCircleChevDown, CiCircleChevUp, CiBookmark, CiShoppingBasket, CiFolderOn, CiLocationArrow1, CiSearch, CiFilter, CiCalendar, CiPhone, CiMap ,
    CiCreditCard1, CiCircleCheck, CiMinimize1, CiCircleRemove, CiWarning,CiMaximize1, CiImageOn, // CiImageOn for Eye
    CiRepeat, CiEdit, CiFloppyDisk, CiUser, CiReceipt , CiChat1, CiFileOn, CiDeliveryTruck, CiClock1,
    CiCircleAlert // For AlertCircle used in renderProofModal
} from "react-icons/ci";

// This constant is a fallback if paymentTransactionImage is NOT a full URL.
const IMAGE_BASE_URL = null; // Example: 'https://your-image-server.com/proofs/'; Set to null if images are full URLs

// Memoized SellerOrderItem component
const SellerOrderItem = memo(({ item, currency }) => (
    <div className="flex items-center justify-between p-3 rounded-md bg-white shadow-sm border border-gray-100">
        <div className="flex items-center flex-1 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 min-w-[3rem] sm:min-w-[4rem] bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                    src={item.product?.image?.[0] || item.product?.image || "/assets/box_icon.svg"} // Fallback image
                    alt={item.product?.name || "Product Image"}
                    className="object-contain w-4/5 h-4/5 transition-transform duration-300 hover:scale-105"
                    width={64}
                    height={64}
                    loading="lazy" // Lazy load images for performance
                    onError={(e) => { e.target.src = "/assets/box_icon.svg"; }} // Fallback on error
                />
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2">{item.product?.name || "Unknown Product"}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Qty: {item.quantity} × {currency}{(item.product?.offerPrice || item.product?.price || 0).toFixed(2)}</p>
            </div>
        </div>
        <p className="text-sm sm:text-base font-medium text-gray-900 ml-2 sm:ml-4">
            {currency}{((item.quantity || 0) * (item.product?.offerPrice || item.product?.price || 0)).toFixed(2)}
        </p>
    </div>
));
SellerOrderItem.displayName = 'SellerOrderItem';

// Error Boundary component to catch rendering errors in its children
class OrderErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error('Seller Orders page error caught by ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center my-10">
                    <CiWarning className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
                    <p className="text-red-600 mb-4">We encountered an error while displaying this section. Please try refreshing the page.</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })} // Allow user to try to re-render
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors mr-2"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// Main Orders component
const Orders = () => {
    const { currency, getToken, user } = useAppContext();

    // State variables for orders, loading, filters, and UI interactions
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [expandedOrder, setExpandedOrder] = useState(null); // Tracks which order's details are expanded
    const [sortBy, setSortBy] = useState("newest");
    const [retryCount, setRetryCount] = useState(0);

    const [editingOverallStatusOrderId, setEditingOverallStatusOrderId] = useState(null); // Order ID being edited
    const [newOverallStatus, setNewOverallStatus] = useState(""); // New status for the order
    const [isOverallStatusUpdating, setIsOverallStatusUpdating] = useState(false); // Loading state for status update

    const [paymentActionState, setPaymentActionState] = useState({ orderId: null, action: null, isLoading: false }); // For payment confirmation/rejection

    const [showProofModal, setShowProofModal] = useState(false); // Controls visibility of the proof image modal
    const [currentProofImageUrl, setCurrentProofImageUrl] = useState(""); // URL of the proof image to display

    const [filtersVisible, setFiltersVisible] = useState(false); // State for collapsible filter section

    // Fetches seller orders from the API
    const fetchSellerOrders = useCallback(async (retryAttempt = 0) => {
        let currentError = null; // To store error within the scope for finally block
        try {
            if (retryAttempt === 0) setLoading(true); // Show main loading only on first attempt
            
            const token = await getToken();
            if (!token) {
                toast.error('Authentication token not available. Please log in.');
                setLoading(false); // Stop loading if no token
                return;
            }

            const controller = new AbortController(); // For request timeout
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

            const { data } = await axios.get('/api/order/seller-orders', {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // Clear timeout if request succeeds

            if (data.success) {
                // Sort orders by date by default (newest first)
                const sortedOrders = (data.orders || []).sort((a, b) => new Date(b.date) - new Date(a.date));
                setOrders(sortedOrders);
                setRetryCount(0); // Reset retry count on success
            } else {
                throw new Error(data.message || "Failed to fetch seller orders.");
            }
        } catch (error) {
            currentError = error; // Store error for use in finally block
            console.error("Error in fetchSellerOrders:", error);
            
            if (error.name === 'AbortError') {
                toast.error('Request timed out. Please check your connection and try again.');
            } else if (error.response?.status === 401) {
                toast.error('Authentication failed. Please log in again.');
            } else if (retryAttempt < 2) { // Retry up to 2 times (total 3 attempts)
                toast.error(`Error fetching orders. Retrying (${retryAttempt + 1})...`);
                setTimeout(() => {
                    setRetryCount(prev => prev + 1); // Update state for retry count
                    fetchSellerOrders(retryAttempt + 1);
                }, Math.pow(2, retryAttempt) * 1500); // Exponential backoff
                return; // Important: return to prevent setLoading(false) in finally block too early
            } else {
                toast.error(error.response?.data?.message || error.message || "An error occurred while fetching orders. Please try again later.");
                setOrders([]); // Clear orders on final failure
            }
        } finally {
            // Ensure loading is set to false only after all retries or on non-retryable errors
             if (retryAttempt >= 2 || (currentError && currentError.name === 'AbortError') || (currentError && currentError.response?.status === 401) || (!currentError && retryAttempt === 0) || (currentError && retryAttempt === 0 && !(currentError.name === 'AbortError' || currentError.response?.status === 401))) {
                setLoading(false);
            }
        }
    }, [getToken]); // getToken is a dependency

    // Effect to fetch orders when the component mounts or user changes
    useEffect(() => {
        if (user) { // Only fetch if user is available
            fetchSellerOrders();
        } else {
            setLoading(false); // If no user, stop loading
            // Optionally, redirect to login or show a message
            // toast.info("Please log in to view your orders.");
        }
    }, [user, fetchSellerOrders]); // fetchSellerOrders is now stable due to useCallback

    // Toggles the expanded view of an order
    const toggleOrderExpansion = useCallback((orderId) => {
        setExpandedOrder(prev => (prev === orderId ? null : orderId));
        setEditingOverallStatusOrderId(null); // Reset editing state when collapsing/expanding
        setNewOverallStatus("");
    }, []);

    // Handles payment confirmation (confirm or reject)
    const handlePaymentConfirmation = async (orderId, actionToConfirm) => {
        setPaymentActionState({ orderId, action: actionToConfirm, isLoading: true });
        try {
            const token = await getToken();
            if (!token) {
                 toast.error("Authentication error. Please log in again.");
                 setPaymentActionState({ orderId: null, action: null, isLoading: false });
                 return;
            }
            const payload = { orderId, paymentConfirmationAction: actionToConfirm };
            const { data } = await axios.put('/api/order/update-status', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.order) {
                toast.success(`Payment ${actionToConfirm === 'confirm' ? 'confirmed' : 'rejected'} successfully.`);
                // Update the specific order in the local state
                setOrders(prevOrders => prevOrders.map(o => (o._id === orderId ? { ...o, ...data.order } : o)));
            } else {
                toast.error(data.message || `Failed to ${actionToConfirm} payment.`);
            }
        } catch (error) {
            console.error("Error updating payment confirmation:", error);
            toast.error(error.response?.data?.message || error.message || "An error occurred during payment update.");
        } finally {
            setPaymentActionState({ orderId: null, action: null, isLoading: false });
        }
    };

    // Handles updating the overall status of an order
    const handleUpdateOverallOrderStatus = async (orderIdToUpdate) => {
        if (!newOverallStatus) {
            toast.error("Please select a new status for the order.");
            return;
        }
        setIsOverallStatusUpdating(true);
        try {
            const token = await getToken();
             if (!token) {
                 toast.error("Authentication error. Please log in again.");
                 setIsOverallStatusUpdating(false);
                 return;
            }
            const orderToUpdate = orders.find(o => o._id === orderIdToUpdate);
            if (!orderToUpdate) {
                toast.error("Order not found.");
                setIsOverallStatusUpdating(false);
                return;
            }
            // Assuming status update applies to all items if it's an "overall" status.
            // If item-specific status updates are needed, the API and payload would differ.
            const allItemIds = orderToUpdate.items.map(item => item._id); 

            const { data } = await axios.put(
                '/api/order/update-status',
                { orderId: orderIdToUpdate, itemIds: allItemIds, status: newOverallStatus }, // API might expect itemIds or handle overall status differently
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success && data.order) {
                toast.success("Overall order status updated successfully!");
                setOrders(prevOrders => prevOrders.map(o => (o._id === orderIdToUpdate ? { ...o, ...data.order } : o)));
                setEditingOverallStatusOrderId(null); // Close editing UI
                setNewOverallStatus("");
            } else {
                toast.error(data.message || "Failed to update order status.");
            }
        } catch (error) {
            console.error("Error updating overall order status:", error);
            toast.error(error.response?.data?.message || error.message || "An error occurred while updating order status.");
        } finally {
            setIsOverallStatusUpdating(false);
        }
    };
    
    // Memoized calculation for filtered and sorted orders
    const filteredOrders = useMemo(() => {
        if (!Array.isArray(orders)) return []; // Ensure orders is an array
        let filtered = [...orders]; // Create a new array to avoid mutating state

        // Apply search term filter
        if (searchTerm.trim()) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(order =>
                order.address?.fullName?.toLowerCase().includes(lowerSearchTerm) ||
                order._id?.toLowerCase().includes(lowerSearchTerm) || // Search by full Order ID
                order._id?.slice(-6).toLowerCase().includes(lowerSearchTerm) || // Search by last 6 digits of Order ID
                order.userId?.toLowerCase().includes(lowerSearchTerm) || // Search by User ID
                order.items?.some(item => item.product?.name?.toLowerCase().includes(lowerSearchTerm))
            );
        }

        // Apply status filter
        if (filterStatus !== "all") {
            filtered = filtered.filter(order => order.status?.toLowerCase() === filterStatus.toLowerCase());
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
            if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
            if (sortBy === "highest") return (b.amount || 0) - (a.amount || 0);
            if (sortBy === "lowest") return (a.amount || 0) - (b.amount || 0);
            return 0; // Default no sort change
        });
        return filtered;
    }, [orders, searchTerm, filterStatus, sortBy]);


    // Utility to get Tailwind CSS classes for status badges
    const getStatusColor = useCallback((status) => {
        const s = status?.toLowerCase();
        if (s === "delivered") return "bg-green-100 text-green-800";
        if (s === "out for delivery") return "bg-blue-100 text-blue-800";
        if (s === "processing") return "bg-yellow-100 text-yellow-800";
        if (s === "pending" || s === "order placed") return "bg-orange-100 text-orange-800";
        if (s === "cancelled") return "bg-red-100 text-red-800";
        if (s === "payment rejected") return "bg-pink-100 text-pink-800"; // Specific to seller view
        return "bg-gray-100 text-gray-800"; // Default
    }, []);
    
    // Utility to get an icon component based on order status
    const getStatusIcon = useCallback((status) => {
        const iconClass = "h-4 w-4"; // Consistent icon size
        switch (status?.toLowerCase()) {
            case "delivered": return <CiCircleCheck className={iconClass} />;
            case "out for delivery": return <CiDeliveryTruck className={iconClass} />;
            case "processing": return <CiClock1 className={iconClass} />;
            case "pending": case "order placed": return <CiClock1 className={iconClass} />; // Using CiClock1 for pending states
            case "cancelled": return <CiCircleRemove className={iconClass} />;
            case "payment rejected": return <CiWarning className={iconClass} />;
            default: return <CiBookmark  className={iconClass} />; // Default package icon
        }
    }, []);
    
    // Utility to get text color for payment status
    const getPaymentStatusColorText = useCallback((status) => {
        const s = status?.toLowerCase();
        if (s === "paid" || s === "confirmed") return "text-green-700";
        if (s === "pending_confirmation" || s === "pending_review") return "text-yellow-700 font-semibold";
        if (s === "pending") return "text-orange-700";
        if (s === "rejected" || s === "failed") return "text-red-700 font-semibold";
        if (s === "na") return "text-gray-700";
        return "text-gray-700"; // Default
    }, []);

    // Formats a date string into a readable format
    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
        try {
            return new Date(dateString).toLocaleString(undefined, options); // Use browser's default locale
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid Date';
        }
    }, []);

    // Opens the modal to display the payment proof image
    const openProofModal = (imageIdentifier) => {
        if (!imageIdentifier) {
            setCurrentProofImageUrl("/assets/no-image.png"); // Default placeholder if no image
            setShowProofModal(true);
            return;
        }
        // Check if it's a full URL (http, https, or data URI)
        if (imageIdentifier.startsWith('http://') || imageIdentifier.startsWith('https://') || imageIdentifier.startsWith('data:')) {
            setCurrentProofImageUrl(imageIdentifier);
        } else if (IMAGE_BASE_URL) { // If it's a relative path and base URL is defined
            setCurrentProofImageUrl(`${IMAGE_BASE_URL}${imageIdentifier}`);
        } else { // Fallback if it's a relative path but no base URL
            console.warn("SellerOrders: IMAGE_BASE_URL not defined or imageIdentifier not a full URL. Displaying placeholder for:", imageIdentifier);
            setCurrentProofImageUrl("/assets/no-image.png");
        }
        setShowProofModal(true);
    };

    // Renders the modal for displaying payment proof
    const renderProofModal = () => (
        showProofModal && (
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity duration-300" 
                onClick={() => setShowProofModal(false)} // Close modal on backdrop click
                role="dialog"
                aria-modal="true"
                aria-labelledby="proof-modal-title"
            >
                <div 
                    className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto overflow-hidden" 
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
                >
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <h3 id="proof-modal-title" className="text-lg font-semibold text-gray-900">Transaction Proof</h3>
                        <button
                            onClick={() => setShowProofModal(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close image viewer"
                        >
                            <CiMinimize1 size={28} />
                        </button>
                    </div>
                    <div className="p-4 sm:p-6">
                        {currentProofImageUrl && currentProofImageUrl !== "/assets/no-image.png" ? (
                            <Image
                                src={currentProofImageUrl}
                                alt="Transaction Proof"
                                width={800} // Max width, will scale down
                                height={600} // Max height, will scale down
                                className="rounded-md object-contain w-full max-h-[75vh]" // Ensure image fits within viewport height
                                onError={() => {
                                    console.warn("Failed to load proof image from URL:", currentProofImageUrl);
                                    toast.error("Could not load proof image.");
                                    setCurrentProofImageUrl("/assets/no-image.png"); // Fallback on error
                                }}
                            />
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <CiCircleAlert className="mx-auto h-12 w-12 mb-3 text-yellow-500" />
                                <p className="text-base">No proof available or image could not be loaded.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    );
    
    // Loading state: displayed when fetching orders for the first time
    if (loading && orders.length === 0 && retryCount === 0) { // Show full page loading only on initial load
        return (
            <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
                <div className="flex-grow flex justify-center items-center py-16">
                    <Loading text="Fetching your orders..." />
                </div>
                <Footer />
            </div>
        );
    }
    
    // "No orders yet" state: displayed if there are no orders after initial load
    if (!loading && orders.length === 0 && !searchTerm && filterStatus === "all" && retryCount === 0) {
        return (
            <OrderErrorBoundary>
                <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
                    <div className="max-w-7xl mx-auto w-full px-4 md:px-12 lg:px-24 py-6">
                         <header className="mb-6 pb-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div>
                                    <h1 className="text-2xl text-gray-900">Order Dashboard</h1>
                                    <p className="text-sm text-gray-500 mt-1">Manage and track all customer orders.</p>
                                </div>
                                 <button 
                                    onClick={() => fetchSellerOrders(0)} 
                                    className="mt-3 sm:mt-0 bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-2 rounded-lg transition duration-300 flex items-center text-sm self-start sm:self-center" 
                                    disabled={loading}
                                >
                                    <CiRepeat size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh Orders
                                </button>
                            </div>
                        </header>
                        <div className="bg-white rounded-lg shadow-sm p-10 sm:p-12 text-center flex-grow flex flex-col justify-center items-center min-h-[50vh]">
                            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6 flex items-center justify-center bg-sky-50 rounded-full">
                                <CiBookmark  className="text-sky-500 w-10 h-10 sm:w-12 sm:h-12" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">No Orders Yet</h2>
                            <p className="text-gray-500 mb-6 text-sm sm:text-base">When new orders are placed by customers, they will appear here.</p>
                        </div>
                    </div>
                    <Footer />
                </div>
            </OrderErrorBoundary>
        );
    }

    // Main content: order list and filters
    return (
        <OrderErrorBoundary>
            <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
                {renderProofModal()} {/* Modal for viewing proof images */}
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6">
                    {/* Header: Title, Filter Toggle, Refresh Button */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3 md:gap-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">Order Dashboard</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {orders.length > 0 ? `${filteredOrders.length} of ${orders.length} orders shown` : "No orders to display"}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setFiltersVisible(!filtersVisible)}
                                className="text-sm font-medium py-2 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 flex items-center transition-colors"
                                aria-expanded={filtersVisible}
                                aria-controls="filter-controls-section"
                            >
                                <CiFilter size={18} className="mr-1.5 text-gray-600" />
                                {filtersVisible ? 'Hide' : 'Show'} Filters
                                {filtersVisible ? <CiCircleChevUp size={18} className="ml-1.5 text-gray-600" /> : <CiCircleChevDown size={18} className="ml-1.5 text-gray-600" />}
                            </button>
                            <button 
                                onClick={() => fetchSellerOrders(0)} 
                                className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-3 sm:px-4 py-2 rounded-lg transition duration-300 flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50" 
                                disabled={loading && !paymentActionState.isLoading && !isOverallStatusUpdating} // Disable only if global loading is active
                                title="Refresh order list"
                            >
                                <CiRepeat size={18} className={`mr-1.5 ${loading && !paymentActionState.isLoading && !isOverallStatusUpdating ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Collapsible Filter Controls Section */}
                    {filtersVisible && (
                        <div id="filter-controls-section" className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
                            {/* Search Input */}
                            <div className="relative md:col-span-1">
                                <label htmlFor="order-search" className="sr-only">Search orders</label>
                                <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                                <input
                                    id="order-search"
                                    type="text"
                                    placeholder="Search ID, Customer, Product..."
                                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full text-sm transition-colors"
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    aria-label="Search orders by ID, customer name, or product name"
                                />
                            </div>
                            
                            {/* Filter and Sort Selects */}
                            <div className="relative md:col-span-1">
                                 <label htmlFor="filter-status-select" className="sr-only">Filter by status</label>
                                <select
                                    id="filter-status-select"
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm w-full transition-colors"
                                    value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                                    aria-label="Filter orders by status"
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
                                <CiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                            </div>
                            
                            <div className="relative md:col-span-1">
                                <label htmlFor="sort-by-select" className="sr-only">Sort orders</label>
                                <select
                                    id="sort-by-select"
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm w-full transition-colors"
                                    value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                    aria-label="Sort orders"
                                >
                                    <option value="newest">Date: Newest First</option>
                                    <option value="oldest">Date: Oldest First</option>
                                    <option value="highest">Amount: Highest First</option>
                                    <option value="lowest">Amount: Lowest First</option>
                                </select>
                                <CiCircleChevDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Orders List or "No Orders Found" Message */}
                    {loading && filteredOrders.length === 0 && retryCount > 0 ? ( // Show loading spinner if retrying and list is empty
                         <div className="flex-grow flex justify-center items-center py-16">
                            <Loading text={`Retrying to fetch orders (${retryCount})...`} />
                         </div>
                    ) : !loading && filteredOrders.length === 0 ? ( // No orders found after loading/filtering
                        <div className="bg-white rounded-lg shadow-sm p-10 sm:p-12 text-center min-h-[40vh] flex flex-col justify-center items-center">
                            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6 flex items-center justify-center bg-gray-100 rounded-full">
                                <CiSearch className="text-gray-400 w-10 h-10 sm:w-12 sm:h-12" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700">No Orders Found</h3>
                            <p className="mt-2 text-gray-500 text-sm sm:text-base">
                                {searchTerm || filterStatus !== "all" ? "Try adjusting your search or filter criteria, or " : "There are currently no orders matching your criteria. "}
                                <button onClick={() => { setSearchTerm(""); setFilterStatus("all"); setSortBy("newest");}} className="text-sky-600 hover:text-sky-700 font-medium underline">
                                    clear all filters
                                </button>.
                            </p>
                        </div>
                    ) : ( // Display list of orders
                        <div className="space-y-4">
                            {filteredOrders.map((order) => (
                                <div key={order._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg">
                                    {/* Clickable header to expand/collapse order details */}
                                    <div
                                        className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50/70 transition-colors duration-150"
                                        onClick={() => toggleOrderExpansion(order._id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOrderExpansion(order._id); }}}
                                        tabIndex={0} role="button" aria-expanded={expandedOrder === order._id}
                                        aria-controls={`order-details-${order._id}`}
                                        aria-label={`Order ID ending in ${order._id?.slice(-6) || 'N/A'}, dated ${formatDate(order.date)}. Click to ${expandedOrder === order._id ? 'collapse' : 'expand'} details.`}
                                    >
                                        {/* Order ID, Date, Customer Name */}
                                        <div className="flex items-center mb-3 md:mb-0 flex-1 min-w-0">
                                            <div className="bg-sky-100 p-2.5 sm:p-3 rounded-full mr-3 sm:mr-4">
                                                <CiBookmark  className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">Order #{order._id?.slice(-6) || 'N/A'}</p>
                                                <div className="flex items-center text-xs text-gray-500 mt-1 flex-wrap gap-x-2 gap-y-0.5">
                                                    <span className="flex items-center"><CiCalendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />{formatDate(order.date)}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span className="flex items-center truncate max-w-[150px] sm:max-w-[200px]"><CiUser className="h-3.5 w-3.5 mr-1 flex-shrink-0" />{order.address?.fullName || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Order Amount, Status, Expansion Chevron */}
                                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto mt-2 md:mt-0">
                                            <div className="flex items-center space-x-2 sm:space-x-3">
                                                <p className="text-sm sm:text-base font-semibold text-gray-800">{currency}{(order.amount || 0).toFixed(2)}</p>
                                                <div className={`flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="ml-1.5 hidden sm:inline">{order.status?.replace(/_/g, ' ') || "N/A"}</span>
                                                    <span className="ml-1 sm:hidden truncate max-w-[70px]">{order.status?.replace(/_/g, ' ') || "N/A"}</span>
                                                </div>
                                            </div>
                                            <div className="ml-3 sm:ml-4 text-gray-400 hover:text-sky-600 transition-colors">
                                                {expandedOrder === order._id ? <CiCircleChevUp className="h-5 w-5 sm:h-6 sm:w-6" /> : <CiCircleChevDown className="h-5 w-5 sm:h-6 sm:w-6" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded order details section */}
                                    {expandedOrder === order._id && (
                                        <div className="border-t border-gray-200 bg-gray-50/50" id={`order-details-${order._id}`}>
                                            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-5">
                                                {/* Column 1: Order Items & Payment Summary */}
                                                <div className="space-y-5">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 mb-2.5 flex items-center text-sm"><CiFolderOn   size={18} className="mr-2 text-sky-600" />Order Items ({order.items?.length || 0})</h4>
                                                        <div className="bg-white rounded-md p-3 space-y-2.5 shadow-sm border border-gray-200 max-h-80 overflow-y-auto">
                                                            {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                                                                <SellerOrderItem key={item._id || `item-${idx}`} item={item} currency={currency} />
                                                            )) : <p className="text-xs text-gray-500 p-2">No items found in this order.</p>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 mb-2.5 flex items-center text-sm"><CiReceipt  size={18} className="mr-2 text-sky-600" />Payment & Summary</h4>
                                                        <div className="bg-white rounded-md p-3 shadow-sm border border-gray-200 space-y-1.5 text-xs sm:text-sm">
                                                            <div className="flex justify-between items-center"><span className="text-gray-600">Payment Method:</span><span className={`font-medium px-1.5 py-0.5 rounded-full text-xs ${order.paymentMethod === 'ABA' ? 'bg-sky-100 text-sky-700' : 'bg-green-100 text-green-700'}`}>{order.paymentMethod || 'N/A'}</span></div>
                                                            <div className="flex justify-between items-center"><span className="text-gray-600">Payment Status:</span><span className={`font-medium ${getPaymentStatusColorText(order.paymentStatus)}`}>{order.paymentStatus?.replace(/_/g, ' ') || 'N/A'}</span></div>
                                                            {order.paymentMethod === 'ABA' && (
                                                                <>
                                                                    <div className="flex justify-between items-center"><span className="text-gray-600">Confirmation:</span><span className={`font-medium ${getPaymentStatusColorText(order.paymentConfirmationStatus)}`}>{order.paymentConfirmationStatus?.replace(/_/g, ' ') || 'N/A'}</span></div>
                                                                    {order.paymentTransactionImage && (
                                                                        <div className="flex justify-between items-center pt-1">
                                                                            <span className="text-gray-600">Payment Transaction:</span>
                                                                            <button onClick={() => openProofModal(order.paymentTransactionImage)} className="text-sky-600 hover:text-sky-700 text-xs font-medium flex items-center underline hover:no-underline">
                                                                                <CiMaximize1 size={16} className="mr-1" /> View Payment
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {order.paymentConfirmationStatus === 'pending_review' && (
                                                                        <div className="mt-2.5 pt-2.5 border-t border-gray-200 flex gap-2">
                                                                            <button 
                                                                                onClick={() => handlePaymentConfirmation(order._id, 'confirm')} 
                                                                                disabled={paymentActionState.isLoading && paymentActionState.orderId === order._id} 
                                                                                className="flex-1 bg-green-500 text-white text-xs py-1.5 px-2.5 rounded-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                                                                            >
                                                                                {paymentActionState.isLoading && paymentActionState.orderId === order._id && paymentActionState.action === 'confirm' ? <CiRepeat size={16} className="animate-spin mr-1" /> : <CiCircleCheck size={16} className="mr-1" />} Confirm
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handlePaymentConfirmation(order._id, 'reject')} 
                                                                                disabled={paymentActionState.isLoading && paymentActionState.orderId === order._id} 
                                                                                className="flex-1 bg-red-500 text-white text-xs py-1.5 px-2.5 rounded-md hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                                            >
                                                                                {paymentActionState.isLoading && paymentActionState.orderId === order._id && paymentActionState.action === 'reject' ? <CiRepeat size={16} className="animate-spin mr-1" /> : <CiCircleRemove size={16} className="mr-1" />} Reject
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                            <div className="pt-1.5 border-t border-gray-200 mt-1.5"></div>
                                                            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-medium text-gray-700">{currency}{(order.subtotal || 0).toFixed(2)}</span></div>
                                                            {order.discount > 0 && (<div className="flex justify-between"><span className="text-gray-500">Discount:</span><span className="font-medium text-green-600">-{currency}{(order.discount || 0).toFixed(2)}</span></div>)}
                                                            {order.promoCode?.code && (<div className="flex justify-between"><span className="text-gray-500">Promo Code:</span><span className="font-medium text-gray-700">{order.promoCode.code}</span></div>)}
                                                            <div className="flex justify-between"><span className="text-gray-500">Delivery Fee:</span><span className="font-medium text-gray-700">{order.deliveryFee === 0 ? "Free" : `${currency}${(order.deliveryFee || 0).toFixed(2)}`}</span></div>
                                                            <div className="flex justify-between font-semibold text-sm sm:text-base pt-1 border-t border-gray-200 mt-1"><span className="text-gray-900">Total Amount:</span><span className="text-gray-900">{currency}{(order.amount || 0).toFixed(2)}</span></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: Delivery Info & Status Update */}
                                                <div className="space-y-5">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 mb-2.5 flex items-center text-sm"><CiLocationArrow1   size={18} className="mr-2 text-sky-600" />Delivery Information</h4>
                                                        <div className="bg-white rounded-md p-3 shadow-sm border border-gray-200 text-xs sm:text-sm font-kantumruy">
                                                            {order.address ? (
                                                                <>
                                                                    <p className="font-medium text-gray-800">{order.address.fullName || 'N/A'}</p>
                                                                    <div className="mt-1 space-y-0.5 text-gray-600">
                                                                        <div className="flex items-start"><CiMap  className="h-4 w-4 text-gray-400 mr-1.5 mt-0.5 flex-shrink-0" /><p>{order.address.area || 'N/A'}{order.address.city ? `, ${order.address.city}` : ''}{order.address.state ? `, ${order.address.state}` : ''}</p></div>
                                                                        <div className="flex items-center"><CiPhone className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" /><p>0{order.address.phoneNumber || 'N/A'}</p></div>
                                                                        {order.address.mapsLink && (
                                                                            <div className="flex items-center">
                                                                                <CiLink className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                                                                                <a href={order.address.mapsLink} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 underline hover:no-underline">
                                                                                    View on Map
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <p className="text-gray-500 italic">Address information not available.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 mb-2.5 flex items-center text-sm"><CiChat1 size={18} className="mr-2 text-sky-600" />Update Overall Status</h4>
                                                        <div className="bg-white rounded-md p-3 shadow-sm border border-gray-200">
                                                            {editingOverallStatusOrderId === order._id ? (
                                                                <>
                                                                    <label htmlFor={`status-select-${order._id}`} className="sr-only">Select new order status</label>
                                                                    <select 
                                                                        id={`status-select-${order._id}`}
                                                                        value={newOverallStatus} 
                                                                        onChange={(e) => setNewOverallStatus(e.target.value)}
                                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm appearance-none bg-white transition-colors"
                                                                    >
                                                                        <option value="">Select new status...</option>
                                                                        <option value="processing">Processing</option>
                                                                        <option value="out for delivery">Out for Delivery</option>
                                                                        <option value="delivered">Delivered</option>
                                                                        <option value="cancelled">Cancelled</option>
                                                                    </select>
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => handleUpdateOverallOrderStatus(order._id)} 
                                                                            disabled={isOverallStatusUpdating || !newOverallStatus}
                                                                            className="flex-1 bg-sky-600 text-white rounded-lg py-1.5 px-3 text-sm font-medium hover:bg-sky-700 transition-colors disabled:bg-sky-300 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
                                                                        >
                                                                            {isOverallStatusUpdating ? <CiRepeat size={18} className="animate-spin mr-1" /> : <CiFloppyDisk size={18} className="mr-1" />} Save
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => { setEditingOverallStatusOrderId(null); setNewOverallStatus(""); }}
                                                                            className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-1.5 px-3 text-sm font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => { setEditingOverallStatusOrderId(order._id); setNewOverallStatus(order.status || ""); }}
                                                                    disabled={(order.paymentMethod === 'ABA' && order.paymentConfirmationStatus === 'pending_review') || isOverallStatusUpdating}
                                                                    className="w-full bg-gray-100 text-gray-700 rounded-lg py-2 px-3 font-medium hover:bg-gray-200 transition-colors text-sm flex items-center justify-center border border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                                                                >
                                                                    <CiEdit size={18} className="mr-2" /> Change Status
                                                                </button>
                                                            )}
                                                            {order.paymentMethod === 'ABA' && order.paymentConfirmationStatus === 'pending_review' && editingOverallStatusOrderId !== order._id && (
                                                                <p className="text-xs text-yellow-600 mt-2 text-center">Confirm/reject ABA payment before changing order status.</p>
                                                            )}
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
                <Footer /> {/* Seller-specific footer */}
            </div>
        </OrderErrorBoundary>
    );
};

export default Orders;
