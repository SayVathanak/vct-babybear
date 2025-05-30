'use client';
import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
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
  AlertCircle,
  RefreshCw
} from "lucide-react";

// Memoized OrderItem component to prevent unnecessary re-renders
const OrderItem = memo(({ item, currency }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center flex-1">
      <div className="w-16 h-16 min-w-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
        <Image 
          src={item.product.image?.[0] || assets.box_icon}
          alt={item.product.name}
          className="object-contain w-4/5 h-4/5 transition-transform duration-300 hover:scale-105"
          width={64}
          height={64}
          loading="lazy"
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
));

OrderItem.displayName = 'OrderItem';

// Memoized OrderTimeline component
const OrderTimeline = memo(({ order }) => {
  const timelineSteps = useMemo(() => [
    {
      key: 'placed',
      title: 'Order Placed',
      isActive: true,
      description: `Order placed on ${new Date(order.date).toLocaleDateString()}`
    },
    {
      key: 'processing',
      title: 'Processing',
      isActive: ['processing', 'out for delivery', 'delivered'].includes(order.status?.toLowerCase()),
      description: order.status?.toLowerCase() === 'processing' 
        ? 'Your order is being processed' 
        : (['out for delivery', 'delivered'].includes(order.status?.toLowerCase()) ? 'Processed' : 'Awaiting processing')
    },
    {
      key: 'delivery',
      title: 'Out for Delivery',
      isActive: ['out for delivery', 'delivered'].includes(order.status?.toLowerCase()),
      description: order.status?.toLowerCase() === 'out for delivery' 
        ? 'Your order is on the way' 
        : (order.status?.toLowerCase() === 'delivered' ? 'Delivered successfully' : 'Not yet dispatched')
    },
    {
      key: 'delivered',
      title: 'Delivered',
      isActive: order.status?.toLowerCase() === 'delivered',
      description: order.status?.toLowerCase() === 'delivered' 
        ? 'Order delivered successfully' 
        : 'Awaiting delivery'
    }
  ], [order.status, order.date]);

  return (
    <div className="space-y-4">
      {timelineSteps.map((step, index) => (
        <div key={step.key} className={`flex ${!step.isActive ? 'opacity-50' : ''}`}>
          <div className="flex flex-col items-center mr-4">
            <div className={`rounded-full ${
              step.isActive 
                ? (step.key === 'delivered' ? 'bg-green-500' : 'bg-sky-500')
                : 'bg-gray-300'
            } h-3 w-3`}></div>
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

// Error Boundary Component
class OrderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Order component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600 mb-4">We encountered an error while loading your orders.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Reload Page
          </button>
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [retryCount, setRetryCount] = useState(0);

  // Memoized date formatters
  const formatDate = useCallback((dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  const formatDetailedDate = useCallback((dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Memoized status utilities
  const getStatusColor = useCallback((status) => {
    switch(status?.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-800";
      case "out for delivery": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch(status?.toLowerCase()) {
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      case "out for delivery": return <Truck className="h-4 w-4" />;
      case "processing": return <Clock className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  }, []);

  const getEstimatedDeliveryDate = useCallback((orderDate, status) => {
    const date = new Date(orderDate);
    let daysToAdd = 3;
    
    switch(status?.toLowerCase()) {
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
  }, [formatDate]);

  // Optimized fetch function with retry logic
  // Replace your current fetchOrders function with this:
const fetchOrders = useCallback(async (retryAttempt = 0) => {
  try {
    setError(null);
    if (retryAttempt === 0) setLoading(true);
    
    const token = await getToken();
    if (!token) {
      throw new Error('Authentication token not available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const { data } = await axios.get('/api/order/list', { 
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (data.success) {
      // Sort orders by date to ensure newest first
      const sortedOrders = data.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(sortedOrders);
      
      // Expand the newest order (first in the sorted array)
      if (sortedOrders.length > 0) {
        setExpandedOrder(sortedOrders[0]._id);
      }
      
      setRetryCount(0);
    } else {
      throw new Error(data.message || 'Failed to fetch orders');
    }
  } catch (error) {
    console.error('Fetch orders error:', error);
    
    if (error.name === 'AbortError') {
      setError('Request timed out. Please check your connection.');
    } else if (retryAttempt < 2) {
      // Retry up to 2 times with exponential backoff
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
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, fetchOrders]);

  // Optimized filtered orders with memoization
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];

    let filtered = [...orders];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.address.fullName.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.product.name.toLowerCase().includes(searchLower)) ||
        order._id.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case "newest":
          return new Date(b.date) - new Date(a.date);
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "highest":
          return b.amount - a.amount;
        case "lowest":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [orders, searchTerm, filterStatus, sortBy]);

  const toggleOrderExpansion = useCallback((orderId) => {
    setExpandedOrder(current => current === orderId ? null : orderId);
  }, []);

  const handleRetry = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterStatus("all");
  }, []);

  // Early returns for different states
  if (loading && !orders.length) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen bg-gray-50">
          <div className="flex justify-center items-center py-16">
            <Loading />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error && !orders.length) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto w-full">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-red-100 rounded-full">
                <AlertCircle className="text-red-500 w-10 h-10" />
              </div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">Failed to load orders</h2>
              <p className="text-gray-500 mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={handleRetry}
                  disabled={loading}
                  className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-medium px-6 py-3 rounded-lg transition duration-300 flex items-center"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Try Again
                </button>
                <button 
                  onClick={() => router.push('/')}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition duration-300"
                >
                  Go Shopping
                </button>
              </div>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  Retry attempt: {retryCount}/2
                </p>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <OrderErrorBoundary>
      <Navbar />
      <div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header with filters */}
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
                    placeholder="Search orders, products, or customer..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search orders"
                  />
                </div>
                
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      aria-label="Filter by status"
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
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort orders"
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
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gray-100 rounded-full">
                <Package className="text-gray-400 w-10 h-10" />
              </div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">When you place orders, they will appear here</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-3 rounded-lg transition duration-300"
              >
                Continue Shopping
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gray-100 rounded-full">
                <Search className="text-gray-400 w-10 h-10" />
              </div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">No orders found</h2>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              <button 
                onClick={clearFilters}
                className="text-sky-500 hover:text-sky-600 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div 
                  key={order._id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  <div 
                    className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleOrderExpansion(order._id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleOrderExpansion(order._id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={expandedOrder === order._id}
                    aria-label={`Order #${order._id.substring(order._id.length - 6)}, ${expandedOrder === order._id ? 'collapse' : 'expand'} details`}
                  >
                    <div className="flex items-center mb-4 md:mb-0">
                      <div className="bg-sky-100 p-3 rounded-full">
                        <Package className="h-6 w-6 text-sky-600" />
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
                          <p className="font-semibold text-gray-900">{currency}{order.amount}</p>
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
                    <div className="border-t border-gray-200 bg-gray-50">
                      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Order Items Section */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <Package className="h-5 w-5 mr-2" />
                              Order Items ({order.items.length})
                            </h3>
                            <div className="bg-white rounded-lg p-4 space-y-4">
                              {order.items.map((item, idx) => (
                                <OrderItem key={`${order._id}-${idx}`} item={item} currency={currency} />
                              ))}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <FileText className="h-5 w-5 mr-2" />
                              Order Summary
                            </h3>
                            <div className="bg-white rounded-lg p-4 space-y-3">
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
                              
                              <div className="flex justify-between pt-3 border-t border-gray-200">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-semibold text-gray-900">{currency}{(order.total || order.amount).toFixed(2)}</span>
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
                              <MapPin className="h-5 w-5 mr-2" />
                              Delivery Information
                            </h3>
                            <div className="bg-white rounded-lg p-4">
                              <p className="font-medium text-gray-900 mb-2">{order.address.fullName}</p>
                              <div className="space-y-2 text-gray-600 font-kantumruy">
                                <div className="flex items-start">
                                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm">{order.address.area}, {order.address.state}</p>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                  <p className="text-sm">0{order.address.phoneNumber}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <Truck className="h-5 w-5 mr-2" />
                              Order Timeline
                            </h3>
                            <div className="bg-white rounded-lg p-4">
                              <OrderTimeline order={order} />
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
    </OrderErrorBoundary>
  );
};

export default MyOrders;