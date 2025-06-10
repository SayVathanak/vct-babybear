import React from 'react';
import Link from 'next/link';
import { assets } from '../../assets/assets';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

// Define the AnalyticsIcon SVG as a component
export const AnalyticsIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M4 4V20H20"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <rect x="6" y="12" width="3" height="6" fill="black" />
        <rect x="11" y="9" width="3" height="9" fill="black" />
        <rect x="16" y="6" width="3" height="12" fill="black" />
    </svg>
);

// Define a SliderIcon SVG as a component
export const SliderIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M14 15C15.1046 15 16 14.1046 16 13C16 11.8954 15.1046 11 14 11C12.8954 11 12 11.8954 12 13C12 14.1046 12.8954 15 14 15Z"
            fill="black"
        />
        <path
            d="M8 9C9.10457 9 10 8.10457 10 7C10 5.89543 9.10457 5 8 5C6.89543 5 6 5.89543 6 7C6 8.10457 6.89543 9 8 9Z"
            fill="black"
        />
    </svg>
);

const SideBar = () => {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Add Product', path: '/seller', icon: assets.add_icon },
        { name: 'Product List', path: '/seller/product-list', icon: assets.product_list_icon },
        { name: 'Orders', path: '/seller/orders', icon: assets.order_icon },
        { name: 'Promo codes', path: '/seller/promo-codes', icon: assets.tag },
        { name: 'Promotion Sliders', path: '/seller/promotion-slider', icon: 'slider' }, // New slider menu item
        { name: 'Analytics', path: '/seller/analytics', icon: 'custom' },
    ];

    return (
        <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-300 flex flex-col'>
            {menuItems.map((item) => {
                const isActive = pathname === item.path;

                return (
                    <Link href={item.path} key={item.name} passHref>
                        <div
                            className={`
                                flex items-center py-3 px-4 gap-3
                                ${isActive
                                    ? "border-r-4 md:border-r-[6px] bg-gray-400/5 border-black"
                                    : "hover:bg-gray-100/90 border-white"
                                }`}
                        >
                            {item.icon === 'custom' ? (
                                <AnalyticsIcon />
                            ) : item.icon === 'slider' ? (
                                <SliderIcon />
                            ) : (
                                <Image
                                    src={item.icon}
                                    alt={`${item.name.toLowerCase()}_icon`}
                                    className="w-7 h-7"
                                />
                            )}
                            <p className='md:block hidden text-center'>{item.name}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default SideBar;