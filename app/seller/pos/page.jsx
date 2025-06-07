'use client'
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import Loading from '@/components/Loading';
import BarcodeScanner from '@/components/seller/BarcodeScanner';
import { FaSearch, FaShoppingCart, FaTrash, FaPlus, FaMinus, FaTimesCircle, FaCheckCircle, FaBarcode, FaTimes, FaArrowRight, FaCamera } from 'react-icons/fa';
import { Transition } from '@headlessui/react';

const POS = () => {
  // App context and states
  const { getToken, user, currency } = useAppContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [completedOrderDetails, setCompletedOrderDetails] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Barcode scanner states
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // Fetch seller's products on component mount
  useEffect(() => {
    const fetchSellerProduct = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await getToken();
        const { data } = await axios.get('/api/product/seller-list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setProducts(data.products.filter(p => p.isAvailable));
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchSellerProduct();
  }, [user, getToken]);

  // Handle barcode detection from scanner
  const handleBarcodeDetected = async (barcode) => {
    setBarcodeLoading(true);
    setShowBarcodeScanner(false);
    
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/product/barcode/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        // Check if product is in the seller's current inventory
        const sellerProduct = products.find(p => p._id === data.product._id);
        
        if (sellerProduct) {
          addToCart(data.product._id);
          toast.success(`Scanned: ${data.product.name}`, {
            icon: <FaBarcode className="text-white" />,
            style: {
              borderRadius: '20px',
              background: '#10B981',
              color: '#ffffff',
            },
          });
        } else {
          toast.error('Product not found in your inventory', {
            icon: <FaBarcode />,
          });
        }
      } else {
        toast.error(data.message || `Product not found for barcode: ${barcode}`, {
          icon: <FaBarcode />,
        });
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      toast.error(error.response?.data?.message || 'Failed to lookup barcode', {
        icon: <FaBarcode />,
      });
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Cart management functions
  const addToCart = (productId) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
    
    // Don't show toast if called from barcode scanner (it shows its own toast)
    if (!showBarcodeScanner && !barcodeLoading) {
      toast.success('Added to cart', {
        icon: <FaPlus className="text-white" />,
        style: {
          borderRadius: '20px',
          background: '#10B981',
          color: '#ffffff',
        },
      });
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems((prev) => ({ ...prev, [productId]: newQuantity }));
    }
  };
  
  const removeFromCart = (productId) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const clearCart = () => {
    if (Object.keys(cartItems).length === 0) return;
    setCartItems({});
    toast.error('Sale Cleared', {
      icon: <FaTrash />,
    });
  };

  // Memoized calculations for performance
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedSearchTerm) ||
      (product.barcode && product.barcode.toLowerCase().includes(lowercasedSearchTerm))
    );
  }, [products, searchTerm]);

  const cartDetails = useMemo(() => {
    const items = Object.keys(cartItems).map(id => {
      const product = products.find(p => p._id === id);
      return product ? { ...product, quantity: cartItems[id] } : null;
    }).filter(item => item !== null);

    const subtotal = items.reduce((total, item) => total + item.offerPrice * item.quantity, 0);
    const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
    return { items, subtotal, totalItems };
  }, [cartItems, products]);

  // Checkout function
  const handleCheckout = async () => {
    if (cartDetails.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setProcessingOrder(true);
    try {
      const token = await getToken();
      const orderPayload = {
        items: cartDetails.items.map(item => ({ product: item._id, quantity: item.quantity })),
        amount: cartDetails.subtotal,
      };
      const { data } = await axios.post('/api/order/create-pos', orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setSaleCompleted(true);
        setCompletedOrderDetails(data.order);
        setCartItems({});
        setSearchTerm('');
        setIsCartOpen(false);
      } else {
        toast.error(data.message || 'Failed to complete sale');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred during checkout');
    } finally {
      setProcessingOrder(false);
    }
  };

  const startNewSale = () => {
    setSaleCompleted(false);
    setCompletedOrderDetails(null);
  };

  // Render a shared component for the cart's content
  const CartContents = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {cartDetails.items.length > 0 ? (
          <div className="space-y-4">
            {cartDetails.items.map(item => (
              <div key={item._id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                <Image src={item.image[0]} alt={item.name} width={60} height={60} className="rounded-md object-cover flex-shrink-0 bg-white p-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                  <p className="text-sm text-gray-500">{currency}{item.offerPrice.toFixed(2)} x {item.quantity}</p>
                  {item.barcode && (
                    <p className="text-xs text-gray-400">#{item.barcode}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"><FaMinus size={12} /></button>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"><FaPlus size={12}/></button>
                </div>
                <button onClick={() => removeFromCart(item._id)} className="text-gray-400 hover:text-red-500 transition-colors"><FaTimesCircle size={20} /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center justify-center h-full text-gray-400">
            <FaShoppingCart className="text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Your cart is empty</h3>
            <p>Click on products or scan barcodes to add items to the sale.</p>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-200">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold text-gray-800">{currency}{cartDetails.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Tax</span>
            <span className="font-semibold text-gray-800">{currency}0.00</span>
          </div>
          <div className="flex justify-between items-center text-2xl font-bold border-t-2 border-dashed border-gray-300 pt-4 mt-4">
            <span className="text-gray-900">Total</span>
            <span className="text-indigo-600">{currency}{cartDetails.subtotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={clearCart}
            disabled={processingOrder || cartDetails.items.length === 0}
            className="w-full bg-red-100 text-red-600 font-bold py-3.5 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleCheckout}
            disabled={processingOrder || cartDetails.items.length === 0}
            className="w-full bg-green-500 text-white font-bold py-3.5 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {processingOrder ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </>
  );

  if (loading) return <Loading />;
  
  if (saleCompleted && completedOrderDetails) {
    const displayId = completedOrderDetails.orderId 
      ? completedOrderDetails.orderId.slice(-6) 
      : completedOrderDetails._id.slice(-6);

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all scale-100">
            <FaCheckCircle className="text-green-500 text-7xl mx-auto mb-5" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sale Completed!</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Order <span className="font-semibold text-indigo-600">#{displayId}</span> created.
            </p>
            <div className="bg-gray-100 rounded-xl p-4 mb-8 border border-gray-200">
                <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                    <span>Total Amount:</span>
                    <span className="text-2xl text-indigo-600">{currency}{completedOrderDetails.amount.toFixed(2)}</span>
                </div>
            </div>
            <button
                onClick={startNewSale}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all text-lg"
            >
                Start New Sale
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 md:h-screen md:overflow-hidden">
      
      <main className="w-full md:w-3/5 lg:w-2/3 flex flex-col pb-28 md:pb-0">
        <header className="p-4 md:p-6 border-b border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search by product name or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowBarcodeScanner(true)}
              disabled={barcodeLoading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FaCamera /> {barcodeLoading ? 'Processing...' : 'Scan'}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {filteredProducts.map(product => (
              <button
                key={product._id}
                onClick={() => addToCart(product._id)}
                className="bg-white rounded-xl border border-gray-200 p-4 text-center transition-all duration-300 hover:shadow-lg hover:border-indigo-500 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex flex-col justify-between group"
                disabled={processingOrder}
              >
                <div className="relative w-full h-28">
                  <Image src={product.image[0]} alt={product.name} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" className="object-contain" />
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-gray-800 text-sm line-clamp-2 h-10">{product.name}</p>
                  <p className="text-indigo-600 font-bold mt-2 text-lg">{currency}{product.offerPrice.toFixed(2)}</p>
                  {product.barcode && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                      <FaBarcode size={10} /> {product.barcode}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 text-gray-500">
                <FaBarcode className="text-6xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No Products Found</h3>
                <p>Try adjusting your search or adding new products to your inventory.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- Desktop Cart --- */}
      <aside className="hidden md:flex w-full md:w-2/5 lg:w-1/3 bg-white border-l border-gray-200 flex-col">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center justify-between">
              <div className="flex items-center">
                <FaShoppingCart className="mr-3 text-indigo-500" />
                Current Order
              </div>
              <span className="text-lg font-bold text-indigo-500 bg-indigo-100 rounded-full px-3 py-1">
                {cartDetails.totalItems}
              </span>
            </h2>
          </div>
        <CartContents />
      </aside>

      {/* --- Mobile Cart --- */}
      <div className="md:hidden">
        {/* Sticky bottom bar */}
        {cartDetails.items.length > 0 &&
            <div 
                onClick={() => setIsCartOpen(true)}
                className="fixed bottom-0 left-0 right-0 bg-indigo-600 text-white p-4 shadow-lg-top cursor-pointer transition-transform duration-300 hover:bg-indigo-700"
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="bg-white text-indigo-600 rounded-full h-7 w-7 flex items-center justify-center font-bold mr-3">{cartDetails.totalItems}</span>
                        <span className="font-semibold text-lg">View Order</span>
                    </div>
                    <div className="flex items-center font-bold text-lg">
                        <span>{currency}{cartDetails.subtotal.toFixed(2)}</span>
                        <FaArrowRight className="ml-3" />
                    </div>
                </div>
            </div>
        }

        {/* Cart Modal */}
        <Transition show={isCartOpen} as={React.Fragment}>
             <div className="fixed inset-0 z-40 flex flex-col" >
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
                </Transition.Child>
                <Transition.Child
                    as="div"
                    className="relative z-50 bg-white h-full flex flex-col"
                    enter="transform transition ease-in-out duration-300"
                    enterFrom="translate-y-full"
                    enterTo="translate-y-0"
                    leave="transform transition ease-in-out duration-300"
                    leaveFrom="translate-y-0"
                    leaveTo="translate-y-full"
                >
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Current Order ({cartDetails.totalItems})</h2>
                        <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-500 hover:text-gray-800"><FaTimes size={24}/></button>
                    </div>
                    <CartContents />
                </Transition.Child>
             </div>
        </Transition>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  );
};

export default POS;