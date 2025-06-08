‘use client’
import React, { useState, useEffect, useMemo } from ‘react’;
import axios from ‘axios’;
import toast from ‘react-hot-toast’;
import Image from ‘next/image’;
import { useAppContext } from ‘@/context/AppContext’;
import Loading from ‘@/components/Loading’;
import BarcodeScanner from ‘@/components/seller/BarcodeScanner’;
import { FaSearch, FaShoppingCart, FaTrash, FaPlus, FaMinus, FaTimesCircle, FaCheckCircle, FaBarcode, FaTimes, FaArrowRight, FaCamera, FaExclamationTriangle, FaSpinner } from ‘react-icons/fa’;
import { Transition } from ‘@headlessui/react’;

const POS = () => {
// App context and states
const { getToken, user, currency } = useAppContext();
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [cartItems, setCartItems] = useState({});
const [searchTerm, setSearchTerm] = useState(’’);
const [processingOrder, setProcessingOrder] = useState(false);
const [saleCompleted, setSaleCompleted] = useState(false);
const [completedOrderDetails, setCompletedOrderDetails] = useState(null);
const [isCartOpen, setIsCartOpen] = useState(false);

// Barcode scanner states
const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
const [barcodeLoading, setBarcodeLoading] = useState(false);

// Fetch seller’s products on component mount
useEffect(() => {
const fetchSellerProduct = async () => {
if (!user) return;
try {
setLoading(true);
const token = await getToken();
const { data } = await axios.get(’/api/product/seller-list’, {
headers: { Authorization: `Bearer ${token}` }
});
if (data.success) {
setProducts(data.products.filter(p => p.isAvailable));
} else {
toast.error(data.message);
}
} catch (error) {
toast.error(error.message || ‘Failed to fetch products’);
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

```
try {
  // First, try to find the product locally by barcode
  const localProduct = products.find(p => p.barcode === barcode);
  
  if (localProduct) {
    addToCart(localProduct._id);
    toast.success(`Scanned: ${localProduct.name}`, {
      icon: <FaBarcode className="text-white" />,
      style: {
        borderRadius: '20px',
        background: '#10B981',
        color: '#ffffff',
      },
    });
  } else {
    // If not found locally, try API lookup
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
  }
} catch (error) {
  console.error('Barcode lookup error:', error);
  toast.error(error.response?.data?.message || 'Failed to lookup barcode', {
    icon: <FaBarcode />,
  });
} finally {
  setBarcodeLoading(false);
}
```

};

// Cart management functions
const addToCart = (productId) => {
setCartItems((prev) => ({
…prev,
[productId]: (prev[productId] || 0) + 1,
}));

```
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
```

};

const updateQuantity = (productId, newQuantity) => {
const product = products.find(p => p._id === productId);

```
if (newQuantity <= 0) {
  removeFromCart(productId);
} else if (product && newQuantity > product.stock) {
  toast.error(`Only ${product.stock} items available in stock`, {
    icon: <FaExclamationTriangle />,
  });
} else {
  setCartItems((prev) => ({ ...prev, [productId]: newQuantity }));
}
```

};

const removeFromCart = (productId) => {
setCartItems((prev) => {
const newCart = { …prev };
delete newCart[productId];
return newCart;
});
toast.success(‘Item removed from cart’, {
icon: <FaTrash />,
style: {
borderRadius: ‘20px’,
background: ‘#EF4444’,
color: ‘#ffffff’,
},
});
};

const clearCart = () => {
if (Object.keys(cartItems).length === 0) return;
setCartItems({});
toast.error(‘Sale Cleared’, {
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
return product ? { …product, quantity: cartItems[id] } : null;
}).filter(item => item !== null);

```
const subtotal = items.reduce((total, item) => total + item.offerPrice * item.quantity, 0);
const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
return { items, subtotal, totalItems };
```

}, [cartItems, products]);

// Checkout function
const handleCheckout = async () => {
if (cartDetails.items.length === 0) {
toast.error(“Cart is empty”);
return;
}

```
// Check stock availability before processing
const stockIssues = cartDetails.items.filter(item => item.quantity > item.stock);
if (stockIssues.length > 0) {
  toast.error(`Insufficient stock for: ${stockIssues.map(item => item.name).join(', ')}`);
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
    toast.success('Sale completed successfully!', {
      icon: <FaCheckCircle />,
    });
  } else {
    toast.error(data.message || 'Failed to complete sale');
  }
} catch (error) {
  toast.error(error.response?.data?.message || 'An error occurred during checkout');
} finally {
  setProcessingOrder(false);
}
```

};

const startNewSale = () => {
setSaleCompleted(false);
setCompletedOrderDetails(null);
};

// Render a shared component for the cart’s content
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
<p className="text-xs text-gray-500">Stock: {item.stock}</p>
</div>
<div className="flex items-center gap-2">
<button
onClick={() => updateQuantity(item._id, item.quantity - 1)}
className=“w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center”
>
<FaMinus size={12} />
</button>
<span className="w-8 text-center font-semibold">{item.quantity}</span>
<button
onClick={() => updateQuantity(item._id, item.quantity + 1)}
className=“w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center disabled:opacity-50”
disabled={item.quantity >= item.stock}
>
<FaPlus size={12}/>
</button>
</div>
<button onClick={() => removeFromCart(item._id)} className=“text-gray-400 hover:text-red-500 transition-colors”><FaTimesCircle size={20} /></button>
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

```
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
        className="w-full bg-green-500 text-white font-bold py-3.5 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processingOrder ? (
          <>
            <FaSpinner className="animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Sale'
        )}
      </button>
    </div>
  </div>
</>
```

);

if (loading) return <Loading />;

if (saleCompleted && completedOrderDetails) {
const displayId = completedOrderDetails.orderId
? completedOrderDetails.orderId.slice(-6)
: completedOrderDetails._id.slice(-6);

```
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
```

}

return (
<div className="flex flex-col md:flex-row bg-gray-50 md:h-screen md:overflow-hidden">
{/* Main Product Area */}
<main className="w-full md:w-3/5 lg:w-2/3 flex flex-col pb-28 md:pb-0">
<header className="p-4 md:p-6 border-b border-gray-200 bg-white">
<div className="flex flex-col sm:flex-row gap-4">
<div className="relative flex-1">
<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
<FaSearch />
</span>
<input
type=“text”
placeholder=“Search by product name or scan barcode…”
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
className=“w-full border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500”
/>
</div>
<button
onClick={() => setShowBarcodeScanner(true)}
disabled={barcodeLoading}
className=“px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap”
>
{barcodeLoading ? <FaSpinner className="animate-spin" /> : <FaCamera />}
{barcodeLoading ? ‘Processing…’ : ‘Scan’}
</button>
</div>
</header>

```
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {filteredProducts.map(product => (
          <button
            key={product._id}
            onClick={() => addToCart(product._id)}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center transition-all duration-300 hover:shadow-lg hover:border-indigo-500 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex flex-col justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={processingOrder || product.stock === 0}
          >
            <div className="relative w-full h-28">
              <Image src={product.image[0]} alt={product.name} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" className="object-contain" />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center rounded-lg">
                  <span className="text-red-600 font-bold text-xs">OUT OF STOCK</span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <p className="font-semibold text-gray-800 text-sm line-clamp-2 h-10">{product.name}</p>
              <p className="text-indigo-600 font-bold mt-2 text-lg">{currency}{product.offerPrice.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Stock: {product.stock}</p>
              {product.barcode && (
                <p className="text-xs text-gray-400 mt-1">#{product.barcode}</p>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <FaSearch className="text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p>Try adjusting your search terms or add new products to your inventory.</p>
        </div>
      )}
    </div>
  </main>

  {/* Desktop Cart Sidebar */}
  <aside className="hidden md:flex md:w-2/5 lg:w-1/3 bg-white border-l border-gray-200 flex-col">
    <header className="p-4 md:p-6 border-b border-gray-200 bg-white">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <FaShoppingCart className="text-indigo-600" />
        Cart ({cartDetails.totalItems})
      </h2>
    </header>
    <CartContents />
  </aside>

  {/* Mobile Cart Button */}
  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
    <button
      onClick={() => setIsCartOpen(true)}
      className="w-full bg-indigo-600 text-white font-bold py-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 relative"
    >
      <FaShoppingCart />
      <span>View Cart ({cartDetails.totalItems})</span>
      {cartDetails.totalItems > 0 && (
        <span className="ml-2 text-lg font-bold">
          {currency}{cartDetails.subtotal.toFixed(2)}
        </span>
      )}
    </button>
  </div>

  {/* Mobile Cart Modal */}
  <Transition show={isCartOpen}>
    <div className="md:hidden fixed inset-0 z-50">
      <Transition.Child
        enter="transition-opacity ease-linear duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-linear duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsCartOpen(false)} />
      </Transition.Child>

      <Transition.Child
        enter="transition ease-in-out duration-300 transform"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transition ease-in-out duration-300 transform"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <div className="ml-auto relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
          <header className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaShoppingCart className="text-indigo-600" />
              Cart ({cartDetails.totalItems})
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
          </header>
          <CartContents />
        </div>
      </Transition.Child>
    </div>
  </Transition>

  {/* Barcode Scanner Modal */}
  {showBarcodeScanner && (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Scan Barcode</h3>
          <button
            onClick={() => setShowBarcodeScanner(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
      </div>
    </div>
  )}
</div>
```

);
};

export default POS;