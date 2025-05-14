'use client'
import React from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import FeaturedProduct from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  CiMenuFries,
  CiPillsBottle1,
  CiApple,
  CiStar,
  CiHeart,
  CiShoppingCart,
  CiMedicalCross
} from "react-icons/ci";

const Home = () => {
  const categories = [
    {
      name: 'Baby Milk',
      icon: <CiPillsBottle1 className="w-full h-full" />,
      link: '/all-products'
    },
    {
      name: 'Diapers',
      icon: <CiStar className="w-full h-full" />,
      link: '/all-products'
    },
    {
      name: 'Baby Food',
      icon: <CiApple className="w-full h-full" />,
      link: '/all-products'
    },
    {
      name: 'Hygiene',
      icon: <CiMedicalCross className="w-full h-full" />,
      link: '/all-products'
    },
    {
      name: 'Feeding',
      icon: <CiShoppingCart className="w-full h-full" />,
      link: '/all-products'
    },
    {
      name: 'Care',
      icon: <CiHeart className="w-full h-full" />,
      link: '/all-products'
    }
  ];

  return (
    <>
      <Navbar />
      <div className="px-4 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <HeaderSlider />

        <HomeProducts />

        {/* Featured Categories */}
        <div className="py-8 md:py-12">
          <h2 className="text-2xl md:text-3xl text-blue-500 mb-6 flex items-center gap-2 font-thin">
            Shop by category <CiMenuFries className="text-2xl md:text-3xl" />
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link href={category.link} key={index} className="block">
                <div className="flex flex-col items-center cursor-pointer group">
                  <div className="w-full aspect-square bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-all">
                    <div className="w-1/2 h-1/2 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                      {category.icon}
                    </div>
                  </div>
                  <span className="text-gray-800 font-medium text-sm md:text-base group-hover:text-blue-600 transition-all">{category.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;