'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    CiCircleRemove,
    CiDiscount1,
    CiDeliveryTruck,
    CiMedicalCase,
    CiGift,
    CiRead,
    CiPaperplane
} from 'react-icons/ci';

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
                    <CiCircleRemove className="h-6 w-6" />
                </button>

                {/* Header */}
                <div className="bg-blue-500 text-white p-6 text-center">
                    <h3 className="text-xl font-bold mb-1">បេប៊ីបែរ</h3>
                    <h2 className="text-2xl font-bold mb-2">Baby Bear</h2>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold mb-4">Join Our Telegram Channel</h3>

                    <div className="mb-6 flex justify-center">
                        <div className="bg-blue-100 rounded-full p-4">
                            <CiPaperplane className="w-16 h-16 text-blue-500" />
                        </div>
                    </div>

                    <p className="text-gray-600 mb-2">Get exclusive updates:</p>

                    <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2 justify-center">
                            <CiDiscount1 className="text-blue-700 text-lg" />
                            <p className="font-medium text-blue-700">Promotions and discounts</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2 justify-center">
                            <CiDeliveryTruck className="text-blue-700 text-lg" />
                            <p className="font-medium text-blue-700">New product arrivals</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2 justify-center">
                            <CiMedicalCase className="text-blue-700 text-lg" />
                            <p className="font-medium text-blue-700">Baby care tips</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2 justify-center">
                            <CiGift className="text-blue-700 text-lg" />
                            <p className="font-medium text-blue-700">Special offers</p>
                        </div>
                    </div>

                    <button
                        onClick={handleTelegramJoin}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full w-full transition-all flex items-center justify-center gap-2"
                    >
                        <CiPaperplane className="text-xl" /> Join Our Telegram Channel
                    </button>

                    <p className="text-xs text-gray-500 mt-4 font-kantumruy flex items-center justify-center gap-1">
                        <CiRead className="text-gray-500" />
                        ជាកន្លែងផ្តល់នៅ ទឹកដោះគោ 🇺🇸 នឹង សំភារៈរបស់កូនៗជាទីស្រលាញ់ ជាមួយគុណភាព នឹងទំនុកចិត្ត
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TelegramPopup;