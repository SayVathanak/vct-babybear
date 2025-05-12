// components/ProductActions.jsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const ProductActions = ({ product, addToCart, user, openSignIn }) => {
    const [quantity, setQuantity] = useState(1);
    const router = useRouter();

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const increaseQuantity = () => {
        setQuantity(quantity + 1);
    };

    const handleAddToCart = () => {
        if (!product.isAvailable) {
            toast.error("Sorry, this product is currently unavailable");
            return;
        }
        addToCart(product._id, quantity);
        toast.success(`${quantity} item(s) added to cart`);
    };

    const handleBuyNow = () => {
        if (!user) {
            toast.error("Please login to continue purchasing");
            openSignIn();
            return;
        }
        if (!product.isAvailable) {
            toast.error("Sorry, this product is currently unavailable");
            return;
        }
        addToCart(product._id, quantity);
        router.push('/cart');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center">
                <span className="mr-3 text-gray-700">Quantity:</span>
                <div className="flex border border-gray-300 rounded">
                    <button
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className={`px-3 py-1 ${quantity <= 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
                        aria-label="Decrease quantity"
                    >
                        -
                    </button>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 text-center border-x border-gray-300 py-1 focus:outline-none"
                        aria-label="Quantity"
                    />
                    <button
                        onClick={increaseQuantity}
                        className="px-3 py-1 text-gray-700 hover:bg-gray-100"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleAddToCart}
                    disabled={!product.isAvailable}
                    className={`flex-1 py-3 px-5 text-center rounded-md transition-all duration-300 ${product.isAvailable
                            ? 'border border-blue-500 text-blue-600 hover:text-white hover:bg-blue-500'
                            : 'border border-gray-300 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Add to Cart
                </button>
                <button
                    onClick={handleBuyNow}
                    disabled={!product.isAvailable}
                    className={`flex-1 py-3 px-5 text-center rounded-md text-white transition-all duration-300 ${product.isAvailable
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                >
                    Buy Now
                </button>
            </div>

            {product.isAvailable && (
                <p className="text-sm text-gray-600">
                    Subtotal Price: <span className="font-semibold text-gray-800">${(product.offerPrice * quantity).toFixed(2)}</span>
                </p>
            )}
        </div>
    );
};

export default ProductActions;