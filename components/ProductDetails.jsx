// components/ProductDetail.jsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { MdOutlineError } from 'react-icons/md';
import {
    CiBadgeDollar,
    CiCreditCard1,
    CiDeliveryTruck,
    CiCircleCheck
} from "react-icons/ci";
import {
    RiTruckLine,
    RiHandCoinLine,
    RiSecurePaymentLine,
    RiVerifiedBadgeLine,
} from "react-icons/ri";

const ProductDetail = ({ product, addToCart, user, openSignIn }) => {
    const [showDescription, setShowDescription] = useState(false);
    const [showSpecifications, setShowSpecifications] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [inputValue, setInputValue] = useState("1"); // New state for input value
    const router = useRouter();

    const calculateDiscount = () => {
        if (!product) return 0;
        const discount = ((product.price - product.offerPrice) / product.price) * 100;
        return Math.round(discount);
    };

    const formatDescription = (text) => {
        if (!text) return "";
        const paragraphs = text.split('\n');
        return paragraphs.map((paragraph, index) => (
            <p key={index} className={`${paragraph.trim() === "" ? 'my-3' : 'mb-3 last:mb-0'} whitespace-pre-wrap`}>
                {paragraph}
            </p>
        ));
    };

    const benefits = [
        { text: "Free delivery for 2 items plus", icon: <CiDeliveryTruck className="text-sky-500 text-xl" /> },
        { text: "Prepaid or Cash on Delivery", icon: <CiBadgeDollar className="text-sky-500 text-xl" /> },
        { text: "100% Secured Payments", icon: <CiCreditCard1 className="text-sky-500 text-xl" /> },
        { text: "100% Authentic", icon: <CiCircleCheck className="text-sky-500 text-xl" /> },
    ];

    const decreaseQuantity = () => {
        if (quantity > 1) {
            const newQuantity = quantity - 1;
            setQuantity(newQuantity);
            setInputValue(newQuantity.toString());
        }
    };

    const increaseQuantity = () => {
        const newQuantity = quantity + 1;
        setQuantity(newQuantity);
        setInputValue(newQuantity.toString());
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);

        // Only update quantity if the value is a valid number
        if (value === "" || value === "0") {
            // Allow empty field for better UX, but don't update actual quantity yet
        } else {
            const parsedValue = parseInt(value);
            if (!isNaN(parsedValue)) {
                setQuantity(parsedValue);
            }
        }
    };

    const handleInputBlur = () => {
        // On blur, ensure we have a valid quantity (minimum 1)
        if (inputValue === "" || inputValue === "0" || isNaN(parseInt(inputValue))) {
            setQuantity(1);
            setInputValue("1");
        } else {
            const parsedValue = parseInt(inputValue);
            setQuantity(parsedValue);
            setInputValue(parsedValue.toString());
        }
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
            {/* Product Information Section */}
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl md:text-2xl font-medium text-gray-800 mb-2">
                        {product.name}
                    </h1>

                    <div className="mt-2 flex items-center text-sm">
                        {product.isAvailable ? (
                            <div className="flex items-center text-green-600">
                                <IoMdCheckmarkCircleOutline className="mr-1" /> <span>In Stock</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-red-500">
                                <MdOutlineError className="mr-1" /> <span>Out of Stock</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-baseline">
                        <span className="text-xl md:text-2xl text-gray-800">${product.offerPrice}</span>
                        {product.price > product.offerPrice && (
                            <span className="ml-2 text-lg text-gray-400 line-through">${product.price}</span>
                        )}
                    </div>
                    {calculateDiscount() > 0 && (
                        <p className="text-green-600 text-sm mt-1">
                            You save: ${(product.price - product.offerPrice).toFixed(2)} ({calculateDiscount()}%)
                        </p>
                    )}
                </div>



                {/* Product Actions Section */}
                <div className="space-y-6 pt-2">
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
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
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
                            Subtotal Price: <span className="text-gray-800">${(product.offerPrice * quantity).toFixed(2)}</span>
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <Accordion
                        title="Product Description"
                        isOpen={showDescription}
                        toggle={() => setShowDescription(!showDescription)}>
                        <div className="prose prose-sm max-w-none">
                            {formatDescription(product.description)}
                        </div>
                    </Accordion>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {benefits.map((benefit, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 text-sky-600 text-sm font-kantumruy"
                            >
                                {benefit.icon}
                                <span>{benefit.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const Accordion = ({ title, isOpen, toggle, children }) => {
    return (
        <div className="rounded-md overflow-hidden">
            <button
                onClick={toggle}
                className="flex items-center justify-between w-full text-left text-gray-800 py-3 px-4 bg-gray-50 hover:bg-gray-100 transition"
            >
                <span className="font-normal">{title}</span>
                {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            {isOpen && <div className="p-4 text-gray-700 bg-white">{children}</div>}
        </div>
    );
};

export default ProductDetail;