import React from 'react';
import Link from 'next/link';
import { assets } from '../../assets/assets';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CiShoppingTag, CiWavePulse1, CiMonitor } from "react-icons/ci";

const SideBar = () => {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Add Product', path: '/seller', icon: assets.add_icon },
        { name: 'Product List', path: '/seller/product-list', icon: assets.product_list_icon },
        { name: 'Orders', path: '/seller/orders', icon: assets.order_icon },
        { name: 'Promo codes', path: '/seller/promo-codes', icon: <CiShoppingTag size={28} className="text-black stroke-[0.2]" /> },
        { name: 'Promotion Banner', path: '/seller/promotion-slider', icon: <CiMonitor size={28} className="text-black stroke-[0.2]" /> },
        { name: 'Analytics', path: '/seller/analytics', icon: <CiWavePulse1 size={28} className="text-black stroke-[0.2]" /> },
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
                            {/* CORRECTED LOGIC: Check if icon is a static image object by looking for the 'src' property */}
                            {item.icon.src ? (
                                <Image
                                    src={item.icon}
                                    alt={`${item.name.toLowerCase()}_icon`}
                                    className="w-7 h-7"
                                />
                            ) : (
                                // Otherwise, it's a react-icon component, render it directly
                                <div className="w-7 h-7 flex items-center justify-center">
                                    {item.icon}
                                </div>
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