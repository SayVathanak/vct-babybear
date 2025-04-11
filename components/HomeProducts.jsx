import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";

const HomeProducts = () => {
  const { products, router } = useAppContext();

  return (
    <div className="flex flex-col items-center pt-6 md:pt-12 w-full overflow-hidden">
      {/* Scrolling Text Animation */}
      <div className="w-full overflow-hidden">
        <div className="marquee-container">
          <div className="animate-marquee">
            <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
              Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
            </p>
            <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
              Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
            </p>
            <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
              Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
            </p>
            <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
              Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
            </p>
            <p className="whitespace-nowrap pr-10 text-xl text-sky-200 font-prata font-medium">
              Baby Bear - Premium Imported Milk and Baby Essentials from the USA. Pure, Nutritious, and Safe for Your Little One.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 pt-6 md:pt-12 pb-14 w-full">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>

      <button
        onClick={() => {
          router.push("/all-products");
        }}
        className="px-12 py-2 text-sm border rounded text-gray-500/70 hover:bg-slate-50/90 transition"
      >
        See more
      </button>
    </div>
  );
};

export default HomeProducts;