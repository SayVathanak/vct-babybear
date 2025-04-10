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
import TimeFrameSelector from "@/components/TimeFrameSelector";

const Analytics = () => {
  const { currency, getToken, user } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('weekly');
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    salesByDate: [],
    salesByCity: []
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
      order.items.forEach(item => {
        const productId = item.product._id;
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
    const salesByDate = processSalesByTimeFrame(orders, selectedTimeFrame);
    
    // Process sales by state
    const stateMap = new Map();
    orders.forEach(order => {
      const state = order.address.state;
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
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      if (timeFrame === 'weekly') {
        // Last 7 days
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return orderDate >= weekAgo;
      } else if (timeFrame === 'monthly') {
        // Last 30 days
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return orderDate >= monthAgo;
      } else {
        // All time - no filter
        return true;
      }
    });
    
    // Group by date
    filteredOrders.forEach(order => {
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

  useEffect(() => {
    if (user) {
      fetchSellerOrders();
    }
  }, [user]);

  useEffect(() => {
    if (orders.length > 0) {
      // Add a loading state when changing time frames for better UX
      setLoading(true);
      // Use setTimeout to prevent UI freezing during heavy data processing
      setTimeout(() => {
        processAnalytics(orders);
        setLoading(false);
      }, 0);
    }
  }, [selectedTimeFrame]);

  const handleTimeFrameChange = (timeFrame) => {
    setSelectedTimeFrame(timeFrame);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <Loading />
      ) : (
        <div className="px-2 py-4 sm:px-6 md:px-10 space-y-4 sm:space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-y-3 gap-x-2 sm:gap-x-4">
            <h2 className="text-lg sm:text-xl font-prata font-medium">Sales Analytics</h2>
            
            {/* Use the TimeFrameSelector component */}
            <TimeFrameSelector 
              selectedTimeFrame={selectedTimeFrame}
              onTimeFrameChange={handleTimeFrameChange}
            />
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
            <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Sales Trend</h3>
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
                      tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
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
                    label={(entry) => entry.state.length > 10 ? `${entry.state.substring(0, 5)}...` : entry.state}
                    labelLine={false}
                  >
                    {analytics.salesByState.map((entry, index) => (
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
                  {orders.slice(0, 5).map((order, index) => (
                    <tr key={index}>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap truncate max-w-[100px] sm:max-w-none">
                        {order.address.fullName}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 max-md:hidden truncate max-w-[100px] md:max-w-[200px] lg:max-w-none">
                        {order.items.map((item) => item.product.name).join(", ")}
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