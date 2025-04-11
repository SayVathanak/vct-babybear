/**
 * Improved function to process sales data by time frame with more accurate date handling
 */
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
    
    // Group by date with improved date formatting
    filteredOrders.forEach(order => {
      const orderDate = new Date(order.date);
      let dateKey;
      
      if (timeFrame === 'weekly') {
        // Include year-month-day in the key to prevent grouping different weeks together
        const dayName = orderDate.toLocaleDateString('en-US', {weekday: 'short'});
        const fullDate = orderDate.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric'});
        dateKey = `${dayName} ${fullDate}`;
      } else if (timeFrame === 'monthly') {
        dateKey = orderDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
      } else {
        dateKey = orderDate.toLocaleDateString('en-US', {month: 'short', year: 'numeric'});
      }
      
      const currentAmount = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, currentAmount + order.amount);
    });
    
    // Convert to array suitable for charts
    let salesByDate = Array.from(dateMap.entries()).map(([date, amount]) => ({
      date,
      amount,
      // Store original date for sorting
      originalDate: getOriginalDateFromKey(date, timeFrame)
    }));
    
    // Sort by actual date chronologically
    salesByDate.sort((a, b) => a.originalDate - b.originalDate);
    
    // Clean up before returning (remove the temporary sorting field)
    return salesByDate.map(({date, amount}) => ({date, amount}));
  };
  
  /**
   * Helper function to extract original date from formatted key for sorting
   */
  const getOriginalDateFromKey = (dateKey, timeFrame) => {
    const today = new Date();
    
    if (timeFrame === 'weekly') {
      // Format: "Mon 4/15"
      const parts = dateKey.split(' ');
      if (parts.length === 2) {
        const dateParts = parts[1].split('/');
        if (dateParts.length === 2) {
          const month = parseInt(dateParts[0]) - 1; // JS months are 0-indexed
          const day = parseInt(dateParts[1]);
          return new Date(today.getFullYear(), month, day);
        }
      }
    } else if (timeFrame === 'monthly') {
      // Format: "Apr 15"
      const parts = dateKey.split(' ');
      if (parts.length === 2) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames.indexOf(parts[0]);
        const day = parseInt(parts[1]);
        return new Date(today.getFullYear(), month, day);
      }
    } else {
      // Format: "Apr 2024"
      const parts = dateKey.split(' ');
      if (parts.length === 2) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames.indexOf(parts[0]);
        const year = parseInt(parts[1]);
        return new Date(year, month, 1);
      }
    }
    
    // Fallback to current date if parsing fails
    return today;
  };
  
  /**
   * Improved UI component for time frame selection
   */
  const TimeFrameSelector = ({ selectedTimeFrame, onTimeFrameChange }) => {
    return (
      <div className="flex flex-wrap gap-1 sm:gap-3">
        <button
          onClick={() => onTimeFrameChange('weekly')}
          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded whitespace-nowrap transition-colors duration-200 ${
            selectedTimeFrame === 'weekly' ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => onTimeFrameChange('monthly')}
          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded whitespace-nowrap transition-colors duration-200 ${
            selectedTimeFrame === 'monthly' ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => onTimeFrameChange('all')}
          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded whitespace-nowrap transition-colors duration-200 ${
            selectedTimeFrame === 'all' ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          All Time
        </button>
      </div>
    );
  };
  
  export default TimeFrameSelector;