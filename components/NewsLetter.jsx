import React from "react";
import toast from "react-hot-toast";

const NewsLetter = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14">
      <h1 className="md:text-4xl text-2xl font-medium">
        Subscribe now & get 20% off
      </h1>
      <p className="md:text-base text-gray-500/80 pb-8">
        Subscribe for exclusive updates, offers, and the latest baby essentials from Baby Bear!
      </p>
      <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
        <input
          className="border border-gray-500/30 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500 cursor-not-allowed"
          type="text"
          placeholder="Enter your email"
        />
        <button
          onClick={() => toast.error("This feature is not available yet.")} 
          className="md:px-12 px-8 h-full text-white bg-black rounded-md rounded-l-none">
          Subscribe
        </button>
      </div>
    </div>
  );
};

export default NewsLetter;
