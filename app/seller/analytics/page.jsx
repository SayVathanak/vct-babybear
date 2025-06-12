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
import * as XLSX from 'xlsx'; // Import xlsx library

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
    salesByState: [] // FIX: Changed from salesByCity to salesByState to match usage
  });

  const fetchSellerOrders = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/order/seller-orders', { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (data.success) {
        const fetchedOrders = data.orders.reverse();
        setOrders(fetchedOrders);
        setFilteredOrders(fetchedOrders);
        processAnalytics(fetchedOrders);
        setLoading(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const processAnalytics = (orders) => {
    // Calculate total sales and average order value
    const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;

    // Process top products
    const productMap = new Map();
    orders.forEach(order => {
      order.items?.forEach(item => { // Defensive check for items
        const productId = item.product?._id;
        if (!productId) return;

        const currentCount = productMap.get(productId) || { 
          name: item.product.name, 
          count: 0, 
          revenue: 0 
        };
        currentCount.count += item.quantity;
        currentCount.revenue += item.product.price * item.quantity;
        productMap.set(productId, currentCount);
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Process sales by date
    let salesByDate;
    
    if (customDateRange) {
      salesByDate = processSalesByCustomDateRange(orders);
    } else {
      salesByDate = processSalesByTimeFrame(orders, selectedTimeFrame);
    }
    
    // Process sales by state
    const stateMap = new Map();
    orders.forEach(order => {
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

  const processSalesByTimeFrame = (orders, timeFrame) => {
    const today = new Date();
    const dateMap = new Map();
    
    // Filter orders based on time frame
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.date);
      if (timeFrame === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return orderDate >= weekAgo;
      } else if (timeFrame === 'monthly') {
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return orderDate >= monthAgo;
      } else {
        return true;
      }
    });
    
    // Group by date
    filtered.forEach(order => {
      const orderDate = new Date(order.date);
      let dateKey;
      
      if (timeFrame === 'weekly') {
        dateKey = orderDate.toLocaleDateString(undefined, {weekday: 'short'});
      } else if (timeFrame === 'monthly') {
        dateKey = orderDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
      } else {
        dateKey = orderDate.toLocaleDateString(undefined, {month: 'short', year: 'numeric'});
      }
      
      const currentAmount = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, currentAmount + order.amount);
    });
    
    // Convert to array suitable for charts
    let salesByDate = Array.from(dateMap.entries()).map(([date, amount]) => ({
      date,
      amount
    }));
    
    // Sort by date
    if (timeFrame === 'weekly') {
      const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      salesByDate.sort((a, b) => dayOrder.indexOf(a.date) - dayOrder.indexOf(b.date));
    } else {
      salesByDate.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
    }
    
    return salesByDate;
  };

  const processSalesByCustomDateRange = (orders) => {
    if (!customDateRange || !customDateRange.startDate || !customDateRange.endDate) {
      return [];
    }

    const { startDate, endDate } = customDateRange;
    const dateMap = new Map();
    
    // Filter orders based on custom date range
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    const rangeDuration = (endDate - startDate) / (1000 * 60 * 60 * 24); // duration in days
    let dateFormat;
    
    if (rangeDuration <= 14) {
      dateFormat = { month: 'short', day: 'numeric' };
    } else if (rangeDuration <= 90) {
      dateFormat = { month: 'short', day: 'numeric' };
    } else {
      dateFormat = { month: 'short', year: 'numeric' };
    }
    
    // Group by date
    filtered.forEach(order => {
      const orderDate = new Date(order.date);
      let dateKey;
      
      if (rangeDuration <= 14) {
        dateKey = orderDate.toLocaleDateString(undefined, dateFormat);
      } else if (rangeDuration <= 90) {
        const weekNumber = getWeekNumber(orderDate);
        dateKey = `Week ${weekNumber}`;
      } else {
        dateKey = orderDate.toLocaleDateString(undefined, dateFormat);
      }
      
      const currentAmount = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, currentAmount + order.amount);
    });
    
    // Convert to array suitable for charts
    let salesByDate = Array.from(dateMap.entries()).map(([date, amount]) => ({
      date,
      amount
    }));
    
    // Sort by date
    salesByDate.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
    
    return salesByDate;
  };

  // Helper function to get week number
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  useEffect(() => {
    if (user) {
      fetchSellerOrders();
    }
  }, [user]);

  useEffect(() => {
    if (orders.length > 0) {
      setLoading(true);
      
      let ordersToProcess;
      
      if (customDateRange && customDateRange.startDate && customDateRange.endDate) {
        ordersToProcess = orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= customDateRange.startDate && orderDate <= customDateRange.endDate;
        });
        setFilteredOrders(ordersToProcess);
      } else {
        const today = new Date();
        
        if (selectedTimeFrame === 'weekly') {
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          
          ordersToProcess = orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= weekAgo;
          });
        } else if (selectedTimeFrame === 'monthly') {
          const monthAgo = new Date();
          monthAgo.setDate(today.getDate() - 30);
          
          ordersToProcess = orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= monthAgo;
          });
        } else {
          ordersToProcess = orders;
        }
        
        setFilteredOrders(ordersToProcess);
      }
      
      setTimeout(() => {
        processAnalytics(ordersToProcess);
        setLoading(false);
      }, 0);
    }
  }, [selectedTimeFrame, customDateRange, orders]);

  const handleTimeFrameChange = (timeFrame) => {
    setCustomDateRange(null);
    setSelectedTimeFrame(timeFrame);
  };

  const handleDateRangeChange = (dateRange) => {
    setCustomDateRange(dateRange);
    setSelectedTimeFrame(null);
  };
  
  // Function to handle exporting data to Excel
  const handleExportToExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ["Analytics Summary"],
      [],
      ["Metric", "Value"],
      ["Total Sales", `${currency}${analytics.totalSales.toFixed(2)}`],
      ["Total Orders", analytics.totalOrders],
      ["Average Order Value", `${currency}${analytics.averageOrderValue}`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // 2. Sales by Date Sheet
    const salesByDateData = [
      ["Date", "Amount"],
      ...analytics.salesByDate.map(item => [item.date, item.amount])
    ];
    const wsSalesByDate = XLSX.utils.aoa_to_sheet(salesByDateData);
    XLSX.utils.book_append_sheet(wb, wsSalesByDate, "Sales by Date");

    // 3. Top Products Sheet
    const topProductsData = [
      ["Product Name", "Quantity Sold", "Revenue"],
      ...analytics.topProducts.map(item => [item.name, item.count, item.revenue])
    ];
    const wsTopProducts = XLSX.utils.aoa_to_sheet(topProductsData);
    XLSX.utils.book_append_sheet(wb, wsTopProducts, "Top Products");

    // 4. Sales by Province Sheet
    const salesByStateData = [
      ["Province", "Total Sales"],
      ...analytics.salesByState.map(item => [item.state, item.sales])
    ];
    const wsSalesByState = XLSX.utils.aoa_to_sheet(salesByStateData);
    XLSX.utils.book_append_sheet(wb, wsSalesByState, "Sales by Province");

    // 5. All Filtered Orders Sheet
    const allOrdersData = [
        ["Date", "Customer", "Items", "Amount", "Status", "Street", "City", "Province", "Postal Code", "Country", "Phone"],
        ...filteredOrders.map(order => [
            new Date(order.date).toLocaleDateString(),
            order.address?.fullName,
            order.items?.map(item => `${item.quantity} x ${item.product?.name}`).join(", ") ?? 'N/A', // FIX: Add optional chaining
            order.amount,
            order.status,
            order.address?.street,
            order.address?.city,
            order.address?.state,
            order.address?.postalCode,
            order.address?.country,
            order.address?.phone,
        ])
    ];
    const wsAllOrders = XLSX.utils.aoa_to_sheet(allOrdersData);
    XLSX.utils.book_append_sheet(wb, wsAllOrders, "All Orders in Range");

    // Generate the Excel file and trigger a download
    XLSX.writeFile(wb, "Sales_Analytics.xlsx");
    toast.success("Successfully exported to Excel!");
  };


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <Loading />
      ) : (
        <div className="px-2 py-4 sm:py-6 sm:px-6 md:px-10 space-y-4 sm:space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-2 sm:gap-x-4">
            <h2 className="text-lg sm:text-3xl font-medium">Sales Analytics</h2>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:gap-3">
              {/* Time Frame and Date Selectors */}
              <div className="flex flex-row justify-between sm:gap-3">
                <TimeFrameSelector 
                  selectedTimeFrame={selectedTimeFrame}
                  onTimeFrameChange={handleTimeFrameChange}
                />
                <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
              </div>
              {/* Export Button */}
              <button
                onClick={handleExportToExcel}
                className="mt-2 sm:mt-0 w-full sm:w-auto px-3 py-2 text-xs sm:text-sm text-black bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center gap-2"
              >
                <Image src={assets.excel_icon} alt="Export" width={16} height={16} />
                Export
              </button>
            </div>
          </div>

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
              <p className="text-xl sm:text-2xl">{currency}{analytics.averageOrderValue}</p>
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
                <LineChart
                  data={analytics.salesByDate}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip formatter={(value) => `${currency}${value}`} />
                  <Legend wrapperStyle={{fontSize: '10px'}} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Sales"
                    stroke="#8884d8"
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                  />
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
                  <BarChart
                    data={analytics.topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{fontSize: 10}} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80} 
                      tick={{fontSize: 9}}
                      tickFormatter={(value) => value && value.length > 12 ? `${value.substring(0, 12)}...` : value}
                    />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? `${currency}${value}` : value,
                      name === 'revenue' ? 'Revenue' : 'Quantity'
                    ]} />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
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
                  <Pie
                    data={analytics.salesByState}
                    dataKey="sales"
                    nameKey="state"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={0}
                    label={(entry) => entry.state && entry.state.length > 10 ? `${entry.state.substring(0, 5)}...` : entry.state}
                    labelLine={false}
                  >
                    {analytics.salesByState?.map((entry, index) => ( // FIX: Add optional chaining
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${currency}${value}`} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}} />
                </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Recent Orders</h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead>
                  <tr>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-md:hidden">
                      Items
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.slice(0, 5).map((order, index) => (
                    <tr key={index}>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap truncate max-w-[100px] sm:max-w-none">
                        {order.address?.fullName}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 max-md:hidden truncate max-w-[100px] md:max-w-[200px] lg:max-w-none">
                        {order.items?.map((item) => item.product?.name).join(", ") ?? 'N/A'}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        {currency}{order.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Analytics;
