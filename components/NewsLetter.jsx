import React from "react";
import toast from "react-hot-toast";

const NewsLetter = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14">
      <h1 className="text-lg md:text-xl text-sky-300">
        Subscribe now & get 10% off
      </h1>
      <p className="text-sm md:text-base text-sky-300/70 pb-8">
        Subscribe for exclusive updates, offers, and the latest baby essentials from Baby Bear!
      </p>
      <div className="flex items-center justify-between max-w-2xl w-full h-12">
        <input
          className="border border-sky-300/70 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-blue-200 cursor-not-allowed"
          type="text"
          placeholder="Enter your email"
        />
        <button
          onClick={() => toast.error("This feature is not available yet.")} 
          className="px-8 h-full text-white bg-sky-300/70 rounded-md rounded-l-none">
          Subscribe
        </button>
      </div>
    </div>
  );
};

export default NewsLetter;
