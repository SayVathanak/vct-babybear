'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import TimeFrameSelector from "@/components/seller/TimeFrameSelector";
import DateRangeSelector from "@/components/seller/DateRangeSelector";

const Analytics = () => {
  const { currency, getToken, user } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('weekly');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    salesByDate: [],
    salesByState: []
  });

  const fetchSellerOrders = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        return;
      }
      const { data } = await axios.get('/api/order/seller-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        const fetchedOrders = data.orders.reverse();
        setOrders(fetchedOrders);
      } else {
        toast.error(data.message || "Failed to fetch orders.");
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Unauthorized. Your session may have expired. Please log in again.");
        } else {
          toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
        }
      } else if (error.request) {
        toast.error("Network error. Could not connect to the server.");
      } else {
        toast.error(`An error occurred: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (ordersToProcess) => {
    const totalSales = ordersToProcess.reduce((sum, order) => sum + order.amount, 0);
    const totalOrders = ordersToProcess.length;
    const averageOrderValue = totalOrders > 0 ? (totalSales / totalOrders) : 0;

    const productMap = new Map();
    ordersToProcess.forEach(order => {
      order.items?.forEach(item => {
        const productId = item.product?._id;
        if (!productId) return;
        const currentCount = productMap.get(productId) || {
          name: item.product.name,
          count: 0,
          revenue: 0
        };
        currentCount.count += item.quantity;
        currentCount.revenue += (item.product.price || 0) * item.quantity;
        productMap.set(productId, currentCount);
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    let salesByDate;
    if (customDateRange) {
      salesByDate = processSalesByCustomDateRange(ordersToProcess);
    } else {
      salesByDate = processSalesByTimeFrame(ordersToProcess, selectedTimeFrame);
    }

    const stateMap = new Map();
    ordersToProcess.forEach(order => {
      const state = order.address?.state;
      if (!state) return;
      const currentTotal = stateMap.get(state) || 0;
      stateMap.set(state, currentTotal + order.amount);
    });

    const salesByState = Array.from(stateMap.entries()).map(([state, amount]) => ({
      state,
      sales: amount
    })).sort((a, b) => b.sales - a.sales);

    setAnalytics({
      totalSales,
      totalOrders,
      averageOrderValue,
      topProducts,
      salesByDate,
      salesByState
    });
  };

  const processSalesByTimeFrame = (ordersToFilter, timeFrame) => {
    const today = new Date();
    const dateMap = new Map();

    ordersToFilter.forEach(order => {
      const orderDate = new Date(order.date);
      let dateKey;

      if (timeFrame === 'weekly') {
        dateKey = orderDate.toLocaleDateString(undefined, { weekday: 'short' });
      } else if (timeFrame === 'monthly') {
        dateKey = orderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else {
        dateKey = orderDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }

      const currentAmount = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, currentAmount + order.amount);
    });

    let salesByDate = Array.from(dateMap.entries()).map(([date, amount]) => ({ date, amount }));

    if (timeFrame === 'weekly') {
      const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      salesByDate.sort((a, b) => dayOrder.indexOf(a.date) - dayOrder.indexOf(b.date));
    } else {
      salesByDate.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return salesByDate;
  };

  const processSalesByCustomDateRange = (ordersToFilter) => {
    if (!customDateRange || !customDateRange.startDate || !customDateRange.endDate) return [];
    const { startDate, endDate } = customDateRange;
    const dateMap = new Map();
    const rangeDuration = (endDate - startDate) / (1000 * 60 * 60 * 24);
    let dateFormat;
    if (rangeDuration <= 14) dateFormat = { month: 'short', day: 'numeric' };
    else if (rangeDuration <= 90) dateFormat = { month: 'short', day: 'numeric' };
    else dateFormat = { month: 'short', year: 'numeric' };

    ordersToFilter.forEach(order => {
      const orderDate = new Date(order.date);
      let dateKey;
      if (rangeDuration <= 14) dateKey = orderDate.toLocaleDateString(undefined, dateFormat);
      else if (rangeDuration <= 90) dateKey = `Week ${getWeekNumber(orderDate)}`;
      else dateKey = orderDate.toLocaleDateString(undefined, dateFormat);
      const currentAmount = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, currentAmount + order.amount);
    });

    let salesByDate = Array.from(dateMap.entries()).map(([date, amount]) => ({ date, amount }));
    salesByDate.sort((a, b) => new Date(a.date) - new Date(b.date));
    return salesByDate;
  };

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  useEffect(() => {
    if (user) fetchSellerOrders();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    let ordersToProcess = [];
    if (orders.length > 0) {
      setLoading(true);
      if (customDateRange && customDateRange.startDate && customDateRange.endDate) {
        ordersToProcess = orders.filter(o => {
          const orderDate = new Date(o.date);
          return orderDate >= customDateRange.startDate && orderDate <= customDateRange.endDate;
        });
      } else {
        const today = new Date();
        if (selectedTimeFrame === 'weekly') {
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          ordersToProcess = orders.filter(o => new Date(o.date) >= weekAgo);
        } else if (selectedTimeFrame === 'monthly') {
          const monthAgo = new Date();
          monthAgo.setDate(today.getDate() - 30);
          ordersToProcess = orders.filter(o => new Date(o.date) >= monthAgo);
        } else {
          ordersToProcess = orders;
        }
      }
    }
    setFilteredOrders(ordersToProcess);
    processAnalytics(ordersToProcess);
    if (orders.length > 0) setLoading(false);
  }, [selectedTimeFrame, customDateRange, orders]);

  const handleTimeFrameChange = (timeFrame) => {
    setCustomDateRange(null);
    setSelectedTimeFrame(timeFrame);
  };

  const handleDateRangeChange = (dateRange) => {
    setCustomDateRange(dateRange);
    setSelectedTimeFrame(null);
  };

  // --- NEW: handleExportToCSV function ---
  const handleExportToCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const itemHeaders = [
      'Order ID',
      'Order Date',
      'Customer Name',
      'Product Name',
      'Quantity',
      'Price per Item',
      'Line Total',
      'Address',
      'Status'
    ];

    const formatCsvField = (field) => {
      const str = String(field ?? '');
      if (str.includes(',')) {
        return `"${str}"`;
      }
      return str;
    };

    const csvRows = [itemHeaders.join(',')]; // Start with headers

    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const row = [
          formatCsvField(order._id),
          formatCsvField(new Date(order.date).toLocaleDateString()),
          formatCsvField(order.address?.fullName),
          formatCsvField(item.product?.name),
          formatCsvField(item.quantity),
          formatCsvField(item.product?.price?.toFixed(2)),
          formatCsvField((item.quantity * (item.product?.price || 0)).toFixed(2)),
          formatCsvField(`${order.address?.street}, ${order.address?.city}, ${order.address?.state} ${order.address?.postalCode}`.trim()),
          formatCsvField(order.status),
        ];
        csvRows.push(row.join(','));
      });
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Sales_Report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Report successfully exported as CSV!");
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <Loading />
      ) : (
        <div className="px-2 py-4 sm:py-6 sm:px-6 md:px-10 space-y-4 sm:space-y-6 w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title - shrink-0 prevents it from shrinking */}
            <h2 className="text-lg sm:text-3xl font-medium shrink-0">Sales Analytics</h2>

            {/* Controls Container using Grid */}
            {/* This grid has 3 columns. The first two take up equal flexible space, and the last one fits its content. */}
            <div className="grid grid-cols-[6fr_1fr_auto] md:grid-cols-[2fr_1fr_auto] items-center gap-3">
              <TimeFrameSelector
                selectedTimeFrame={selectedTimeFrame}
                onTimeFrameChange={handleTimeFrameChange}
              />
              <DateRangeSelector onDateRangeChange={handleDateRangeChange} />

              <button
                onClick={handleExportToCSV}
                className="px-3 py-2 text-xs sm:text-sm text-black bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center gap-2"
              >
                <Image src={assets.excel_icon} alt="Export" width={16} height={16} />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
          </div>


          {filteredOrders.length > 0 ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-xs sm:text-sm mb-1">Total Sales</h3>
                  <p className="text-xl sm:text-2xl">{currency}{analytics.totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-xs sm:text-sm mb-1">Total Orders</h3>
                  <p className="text-xl sm:text-2xl">{analytics.totalOrders}</p>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-xs sm:text-sm mb-1">Average Order Value</h3>
                  <p className="text-xl sm:text-2xl">{currency}{(analytics.averageOrderValue).toFixed(2)}</p>
                </div>
              </div>

              {/* Sales Trend */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                  Sales Trend
                  {customDateRange && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({new Date(customDateRange.startDate).toLocaleDateString()} - {new Date(customDateRange.endDate).toLocaleDateString()})
                    </span>
                  )}
                </h3>
                <div className="h-48 sm:h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.salesByDate} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => `${currency}${value}`} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="amount" name="Sales" stroke="#8884d8" activeDot={{ r: 6 }} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products and Sales by City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Top Products</h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} tickFormatter={(value) => value && value.length > 12 ? `${value.substring(0, 12)}...` : value} />
                        <Tooltip formatter={(value, name) => [name === 'revenue' ? `${currency}${value.toFixed(2)}` : value, name === 'revenue' ? 'Revenue' : 'Quantity']} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                        <Bar dataKey="count" name="Quantity" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Sales by Province</h3>
                  <div className="h-48 sm:h-64 font-kantumruy">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.salesByState} dataKey="sales" nameKey="state" cx="50%" cy="50%" outerRadius={60} innerRadius={0} label={(entry) => entry.state && entry.state.length > 10 ? `${entry.state.substring(0, 5)}...` : entry.state} labelLine={false}>
                          {analytics.salesByState?.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value) => `${currency}${value.toFixed(2)}`} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Recent Orders</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                    <thead>
                      <tr>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-md:hidden">Items</th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.slice(0, 5).map((order, index) => (
                        <tr key={index}>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap truncate max-w-[100px] sm:max-w-none">{order.address?.fullName}</td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 max-md:hidden truncate max-w-[100px] md:max-w-[200px] lg:max-w-none">{order.items?.map((item) => item.product?.name).join(", ") ?? 'N/A'}</td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">{currency}{order.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No sales data to display for the selected period.</p>
              <p className="text-xs text-gray-400 mt-2">Try selecting a different time frame or date range.</p>
            </div>
          )}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Analytics;