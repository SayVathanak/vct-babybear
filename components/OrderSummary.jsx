import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Telegram bot configuration should be moved to environment variables
const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || "8036566068:AAHGH_Bv6IhRyq6BeH2vLaOFh8R-qlWSDu4";
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || "653719559";

const OrderSummary = () => {
  const {
    currency,
    router,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    cartItems,
    setCartItems,
    products
  } = useAppContext();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Determine if delivery is free (more than 1 item)
  const isFreeDelivery = getCartCount() > 1;
  const deliveryFee = isFreeDelivery ? 0 : 1.5;

  // const sendOrderNotifications = async (orderDetails) => {
  //   try {
  //     // TELEGRAM NOTIFICATION
  //     const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
  //     // Format the order items for better readability
  //     const itemsList = orderDetails.items
  //       .map(item => `- ${item.productName} x${item.quantity} (${orderDetails.currency}${item.price} each)`)
  //       .join('\n');
    
  //     // Create a well-formatted message
  //     const message = `🐻 *BABY BEAR*\n\n` +
  //       `*Order ID:* ${orderDetails.orderId}\n` +
  //       `*Date:* ${new Date().toLocaleString()}\n\n` +
  //       `*Delivery Address:*\n` +
  //       `${orderDetails.address.fullName}\n` +
  //       `${orderDetails.address.phoneNumber}\n` +
  //       `${orderDetails.address.area}\n` +
  //       `${orderDetails.address.state}${orderDetails.address.city ? ', ' + orderDetails.address.city : ''}\n\n` +
  //       `*Order Items:*\n${itemsList}\n\n` +
  //       `*Subtotal:* ${orderDetails.currency}${orderDetails.subtotal}\n` +
  //       `*Delivery:* ${orderDetails.deliveryFee === 0 ? 'Free' : `${orderDetails.currency}${orderDetails.deliveryFee}`}\n` +
  //       `*Total Amount:* ${orderDetails.currency}${orderDetails.total}\n` +
  //       `*Thanks for shopping with us! 📦*`;
    
  //     // Send message to Telegram
  //     const telegramResponse = await axios.post(telegramApiUrl, {
  //       chat_id: TELEGRAM_CHAT_ID,
  //       text: message,
  //       parse_mode: 'Markdown'
  //     });
    
  //     console.log("Telegram notification sent successfully:", telegramResponse.data);
    
  //     // EMAIL NOTIFICATION - Only if user email exists
  //     if (user?.email) {
  //       try {
  //         console.log("Attempting to send email notification to:", user.email);
  //         const token = await getToken();
          
  //         const emailResponse = await axios.post('/api/send-order-email', {
  //           user: {
  //             name: user?.name || 'Customer',
  //             email: user.email // This is critical - make sure email exists
  //           },
  //           orderDetails: {
  //             orderId: orderDetails.orderId,
  //             address: orderDetails.address,
  //             items: orderDetails.items,
  //             currency: orderDetails.currency,
  //             subtotal: orderDetails.subtotal,
  //             deliveryFee: orderDetails.deliveryFee,
  //             total: orderDetails.total
  //           }
  //         }, {
  //           headers: { Authorization: `Bearer ${token}` }
  //         });
          
  //         console.log("Email notification response:", emailResponse.data);
  //         if (emailResponse.data.message === 'Email sent successfully') {
  //           console.log("Email notification sent successfully");
  //         } else {
  //           console.error("Email notification failed:", emailResponse.data);
  //         }
  //       } catch (emailError) {
  //         console.error("Error sending email notification:", emailError.response?.data || emailError.message);
  //         // Don't throw the error so the order process can continue
  //       }
  //     } else {
  //       console.log("No user email found, skipping email notification");
  //     }
    
  //     return { success: true };
  //   } catch (error) {
  //     console.error("Error sending notifications:", error);
  //     // Don't throw the error so the order process can continue even if notifications fail
  //     return { success: false, error };
  //   }
  // };

  const sendOrderNotifications = async (orderDetails) => {
    try {
      // TELEGRAM NOTIFICATION
      const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
      // Format the order items for better readability
      const itemsList = orderDetails.items
        .map(item => `- ${item.productName} x${item.quantity} (${orderDetails.currency}${item.price} each)`)
        .join('\n');
    
      // Create a well-formatted message
      const message = `🐻 *BABY BEAR*\n\n` +
        `*Order ID:* ${orderDetails.orderId}\n` +
        `*Date:* ${new Date().toLocaleString()}\n\n` +
        `*Delivery Address:*\n` +
        `${orderDetails.address.fullName}\n` +
        `${orderDetails.address.phoneNumber}\n` +
        `${orderDetails.address.area}\n` +
        `${orderDetails.address.state}${orderDetails.address.city ? ', ' + orderDetails.address.city : ''}\n\n` +
        `*Order Items:*\n${itemsList}\n\n` +
        `*Subtotal:* ${orderDetails.currency}${orderDetails.subtotal}\n` +
        `*Delivery:* ${orderDetails.deliveryFee === 0 ? 'Free' : `${orderDetails.currency}${orderDetails.deliveryFee}`}\n` +
        `*Total Amount:* ${orderDetails.currency}${orderDetails.total}\n` +
        `*Thanks for shopping with us! 📦*`;
    
      // Send message to Telegram
      try {
        const telegramResponse = await axios.post(telegramApiUrl, {
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        });
      
        console.log("Telegram notification sent successfully");
      } catch (telegramError) {
        console.error("Failed to send Telegram notification:", telegramError);
        // Continue with other notifications
      }
    
      // EMAIL NOTIFICATION - Only if user email exists
      if (user?.email) {
        try {
          console.log("Attempting to send email notification to:", user.email);
          const token = await getToken();
          
          const emailResponse = await axios.post('/api/send-order-email', {
            user: {
              name: user?.name || 'Customer',
              email: user.email
            },
            orderDetails: {
              orderId: orderDetails.orderId,
              address: orderDetails.address,
              items: orderDetails.items,
              currency: orderDetails.currency,
              subtotal: orderDetails.subtotal,
              deliveryFee: orderDetails.deliveryFee,
              total: orderDetails.total
            }
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (emailResponse.data.success) {
            console.log("Email notification sent successfully");
          } else {
            console.error("Email notification failed:", emailResponse.data.message);
          }
        } catch (emailError) {
          console.error("Error sending email notification:", emailError.response?.data?.message || emailError.message);
          // Don't throw the error so the order process can continue
        }
      } else {
        console.log("No user email found, skipping email notification");
      }
    
      return { success: true };
    } catch (error) {
      console.error("Error sending notifications:", error);
      // Don't throw the error so the order process can continue even if notifications fail
      return { success: false, error };
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/get-address', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch addresses");
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  // Function to validate if all required fields are filled
  const validateOrderForm = () => {
    // Check if address is selected
    if (!selectedAddress) {
      return false;
    }

    // Check if cart has items
    const cartItemsCount = getCartCount();
    if (cartItemsCount <= 0) {
      return false;
    }

    return true;
  };

  const createOrder = async () => {
    try {
      setLoading(true);

      if (!selectedAddress) {
        setLoading(false);
        return toast.error('Please select an address');
      }

      let cartItemsArray = Object.keys(cartItems).map((key) => ({
        product: key,
        quantity: cartItems[key]
      }));
      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0);

      if (cartItemsArray.length === 0) {
        setLoading(false);
        return toast.error("Cart is empty");
      }

      const token = await getToken();

      // Create order in your system
      const { data } = await axios.post('/api/order/create', {
        address: selectedAddress._id,
        items: cartItemsArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        try {
          // Use existing product data from the context
          const productsDetails = cartItemsArray.map(item => {
            const product = products.find(p => p._id === item.product);
            return {
              productName: product ? product.name : `Product ID: ${item.product}`,
              quantity: item.quantity,
              price: product ? (product.offerPrice || product.price) : 0
            };
          });

          // Calculate totals
          const subtotal = getCartAmount();
          const total = subtotal + deliveryFee;

          // Send notifications
          await sendOrderNotifications({
            orderId: data.orderId || `ORD-${Date.now()}`,
            address: selectedAddress,
            items: productsDetails,
            currency,
            subtotal,
            deliveryFee,
            total
          });
        } catch (notificationError) {
          // Log the error but don't fail the order process
          console.error("Failed to send notifications:", notificationError);
        }

        toast.success(data.message || "Order placed successfully!");
        setCartItems({});
        setLoading(false);
        router.push('/order-placed');
      } else {
        setLoading(false);
        toast.error(data.message || "Failed to place order");
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "An error occurred");
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user]);

  // Dynamic button class based on form validation
  const buttonClassName = `w-full py-3 mt-5 transition duration-300 ${validateOrderForm() && !loading
    ? "bg-black text-white hover:bg-green-500 cursor-pointer"
    : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`;

  // Calculate total amount
  const subtotal = getCartAmount();
  const totalAmount = subtotal + deliveryFee;

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700 font-prata">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Select Address
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              type="button"
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city || ''}, ${selectedAddress.state}`
                  : "Select Address"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                {userAddresses.length > 0 ? userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city || ''}, {address.state}
                  </li>
                )) : (
                  <li className="px-4 py-2 text-gray-500">No addresses found</li>
                )}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Promo Code
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              placeholder="Enter promo code"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 border cursor-not-allowed"
              disabled
            />
            <button 
              className="bg-black text-white px-9 py-2 hover:bg-black cursor-not-allowed"
              disabled
              type="button"
            >
              Apply
            </button>
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Items {getCartCount()}</p>
            <p className="text-gray-800">{currency}{getCartAmount()}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Delivery Fee</p>
            {isFreeDelivery ? (
              <p className="font-medium text-gray-800">
                <span className="line-through text-gray-500 mr-2">{currency}1.5</span>
                Free
              </p>
            ) : (
              <p className="font-medium text-gray-800">{currency}1.5</p>
            )}
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>{currency}{totalAmount}</p>
          </div>
        </div>
      </div>

      <button
        onClick={validateOrderForm() ? createOrder : () => toast.error("Please complete all required fields")}
        className={buttonClassName}
        disabled={!validateOrderForm() || loading}
        type="button"
      >
        {loading ? "Processing..." : "Place Order"}
      </button>
    </div>
  );
};

export default OrderSummary;