'use client'
import React from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import FeaturedProduct from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  CiGrid41,
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
      <div className="px-4 md:px-12 lg:px-24 max-w-7xl mx-auto pb-24 md:pb-0">
        <HeaderSlider />

        <HomeProducts/>

        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;