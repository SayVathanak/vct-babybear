import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const HeaderSlider = () => {
  const sliderData = [
    {
      id: 1,
      title: "Experience Pure Sound - Your Perfect Headphones Awaits!",
      offer: "Limited Time Offer 30% Off",
      buttonText1: "Buy now",
      buttonText2: "Find more",
      imgSrcSm: assets.header_headphone_image_sm,
      imgSrcMd: assets.header_headphone_image_md,
    },
    {
      id: 2,
      title: "Next-Level Gaming Starts Here - Discover PlayStation 5 Today!",
      offer: "Hurry up only few lefts!",
      buttonText1: "Shop Now",
      buttonText2: "Explore Deals",
      imgSrcSm: assets.header_playstation_image_sm,
      imgSrcMd: assets.header_playstation_image_md,
    },
    {
      id: 3,
      title: "Power Meets Elegance - Apple MacBook Pro is Here for you!",
      offer: "Exclusive Deal 40% Off",
      buttonText1: "Order Now",
      buttonText2: "Learn More",
      imgSrcSm: assets.header_macbook_image_sm,
      imgSrcMd: assets.header_macbook_image_md,
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="overflow-hidden relative w-full">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide.id}
            className="flex flex-col-reverse md:flex-row items-center justify-between bg-sky-50 md:py-8 md:px-14 mt-6 rounded-xl min-w-full"
          >
            {/* Hide this text content on mobile */}
            <div className="hidden md:block md:pl-8 mt-10 md:mt-0">
              <p className="md:text-base pb-1">{slide.offer}</p>
              <h1 className="max-w-lg md:text-[40px] md:leading-[48px] text-2xl font-prata font-medium">
                {slide.title}
              </h1>
              <div className="flex items-center mt-4 md:mt-6">
                <button className="md:px-10 px-7 md:py-2.5 py-2 bg-sky-100 rounded-full font-medium">
                  {slide.buttonText1}
                </button>
                <button className="group flex items-center gap-2 px-6 py-2.5 font-medium">
                  {slide.buttonText2}
                  <Image className="group-hover:translate-x-1 transition" src={assets.arrow_icon} alt="arrow_icon" />
                </button>
              </div>
            </div>

            {/* Image is always visible */}
            {/* <div className="flex items-center flex-1 justify-center">
              <Image
                className="md:w-72 w-48"
                src={slide.imgSrcSm}
                alt={`Slide ${index + 1}`}
              />
            </div> */}
            {/* <div className="relative w-full h-full overflow-hidden rounded-md"> */}
            <div className="relative w-full h-full rounded-md md:flex md:items-center md:flex-1 md:justify-center">
              {/* <Image
                className="w-full h-full object-cover"
                src={slide.imgSrcSm}
                alt={`Slide ${index + 1}`}
              /> */}

              {/* Image A (shown on md and larger) */}
              <Image
                className="hidden md:block w-72 object-cover rounded-md"
                src={slide.imgSrcMd}
                alt={`Slide ${index + 1} - Desktop`}
              />

              {/* Image B (shown on small screens) */}
              <Image
                className="block md:hidden w-full object-cover rounded-md"
                src={slide.imgSrcSm}
                alt={`Slide ${index + 1} - Mobile`}
              />
            </div>

          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {sliderData.map((_, index) => (
          <div
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`h-1.5 w-1.5 rounded-full cursor-pointer ${currentSlide === index ? "bg-sky-300/70" : "bg-gray-300/30"
              }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;