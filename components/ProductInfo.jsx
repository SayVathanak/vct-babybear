// components/ProductInfo.jsx
import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { MdOutlineError } from 'react-icons/md';
import {
    RiTruckLine,
    RiHandCoinLine,
    RiSecurePaymentLine,
    RiVerifiedBadgeLine,
} from "react-icons/ri";

const ProductInfo = ({ product }) => {
    const [showDescription, setShowDescription] = useState(false);
    const [showSpecifications, setShowSpecifications] = useState(false);

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
        { text: "Free delivery for 2 items plus", icon: <RiTruckLine className="text-sky-500 text-xl" /> },
        { text: "Prepaid or Cash on Delivery", icon: <RiHandCoinLine className="text-sky-500 text-xl" /> },
        { text: "100% Secured Payments", icon: <RiSecurePaymentLine className="text-sky-500 text-xl" /> },
        { text: "100% Authentic", icon: <RiVerifiedBadgeLine className="text-sky-500 text-xl" /> },
    ];

    return (
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

            <div className="space-y-3">
                <Accordion
                    title="Product Description"
                    isOpen={showDescription}
                    toggle={() => setShowDescription(!showDescription)}>
                    <div className="prose prose-sm max-w-none">
                        {formatDescription(product.description)}
                    </div>
                </Accordion>

                {/* <Accordion
                    title="Product Specifications"
                    isOpen={showSpecifications}
                    toggle={() => setShowSpecifications(!showSpecifications)}>
                    <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
                            <div className="text-gray-500 col-span-1">Category</div>
                            <div className="col-span-2">{product.category}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
                            <div className="text-gray-500 col-span-1">Age Range</div>
                            <div className="col-span-2">{product.ageRange || 'All ages'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
                            <div className="text-gray-500 col-span-1">Weight</div>
                            <div className="col-span-2">{product.weight || '800g'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2">
                            <div className="text-gray-500 col-span-1">Quantity</div>
                            <div className="col-span-2">{product.quantity || '6 units'}</div>
                        </div>
                    </div>
                </Accordion> */}
            </div>
        </div>
    );
};

const Accordion = ({ title, isOpen, toggle, children }) => {
    return (
        <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
                onClick={toggle}
                className="flex items-center justify-between w-full text-left text-gray-800 py-3 px-4 bg-gray-50 hover:bg-gray-100 transition"
            >
                <span className="font-medium">{title}</span>
                {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            {isOpen && <div className="p-4 text-gray-700 bg-white">{children}</div>}
        </div>
    );
};

export default ProductInfo;