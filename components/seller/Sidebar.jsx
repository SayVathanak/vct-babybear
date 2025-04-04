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

const SideBar = () => {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Add Product', path: '/seller', icon: assets.add_icon },
        { name: 'Product List', path: '/seller/product-list', icon: assets.product_list_icon },
        { name: 'Orders', path: '/seller/orders', icon: assets.order_icon },
        { name: 'Analytics', path: '/seller/analytics', icon: 'custom' }, // Use keyword to detect custom icon
    ];

    return (
        <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-300 py-2 flex flex-col'>
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
