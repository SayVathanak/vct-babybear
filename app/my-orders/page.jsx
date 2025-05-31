'use client';
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import Loading from "@/components/Loading";
import OrderDetails from "@/components/OrderDetails";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  Package, 
  Search, 
  Filter, 
  ChevronDown,
  AlertCircle,
  RefreshCw
} from "lucide-react";

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

  // Memoized utility functions
  const formatDate = useCallback((dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

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
    const iconClass = "h-4 w-4";
    switch(status?.toLowerCase()) {
      case "delivered": return <CheckCircle className={iconClass} />;
      case "out for delivery": return <Truck className={iconClass} />;
      case "processing": return <Clock className={iconClass} />;
      case "pending": return <Clock className={iconClass} />;
      case "cancelled": return <XCircle className={iconClass} />;
      default: return <Package className={iconClass} />;
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

  // Fetch orders function
  const fetchOrders = useCallback(async (retryAttempt = 0) => {
    try {
      setError(null);
      if (retryAttempt === 0) setLoading(true);
      
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

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

  // Filtered orders with memoization
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];

    let filtered = [...orders];
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.address.fullName.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.product.name.toLowerCase().includes(searchLower)) ||
        order._id.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
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

  // Loading state
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

  // Error state
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
      <div className="flex flex-col justify-between px-4 md:px-12 lg:px-24 py-6 min-h-screen