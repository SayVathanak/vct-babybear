'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const TelegramPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Set isMounted to true when component mounts on the client side
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Only run on client side after mounting
        if (isMounted) {
            // Check if the popup has been shown before
            const hasSeenPopup = localStorage.getItem('telegramPopupSeen');

            if (!hasSeenPopup) {
                // Show popup after 3 seconds
                const timer = setTimeout(() => {
                    setIsOpen(true);
                }, 3000);

                return () => clearTimeout(timer);
            }
        }
    }, [isMounted]);

    const closePopup = () => {
        setIsOpen(false);
        // Set that user has seen the popup
        if (typeof window !== 'undefined') {
            localStorage.setItem('telegramPopupSeen', 'true');
        }
    };

    const handleTelegramJoin = () => {
        // Open Telegram channel in a new tab
        window.open('https://t.me/BabyBearVCT', '_blank');
        closePopup();
    };

    // Only render when we're on the client side
    if (!isMounted) return null;

    // Don't show if not open
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative overflow-hidden">
                {/* Close button */}
                <button
                    onClick={closePopup}
                    className="absolute top-2 right-2 bg-white text-gray-500 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="bg-blue-500 text-white p-6 text-center">
                    <h3 className="text-xl font-medium mb-1 font-kantumruy ">បេប៊ីបែរ</h3>
                    <h2 className="text-2xl font-semibold mb-2">Baby Bear</h2>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold mb-4">Telegram Channel</h3>

                    <div className="mb-6 flex justify-center">
                        <div className="bg-blue-100 rounded-full p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" className="w-16 h-16 fill-blue-500">
                                <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z" />
                            </svg>
                        </div>
                    </div>

                    <p className="text-gray-600 mb-2">Get exclusive updates:</p>

                    <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">Promotions and discounts</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">New product arrivals</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">Baby care tips</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">Special offers</p>
                        </div>
                    </div>

                    <button
                        onClick={handleTelegramJoin}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full w-full transition-all"
                    >
                        Join Our Telegram Channel
                    </button>

                    <p className="text-xs text-gray-500 mt-4 font-kantumruy">
                        ហាងលក់ទឹកដោះគោ នឹង សំភារៈកូនតូច ជាមួយគុណភាព នឹងទំនុកចិត្ត
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TelegramPopup;