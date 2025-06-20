// components/Navbar/Logo.jsx
import React from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { assets } from "@/assets/assets";

const Logo = () => {
    const { router } = useAppContext();

    return (
        <div className="flex-1 flex justify-center">
            {assets.logo ? (
                <Image
                    className="cursor-pointer w-28 md:w-32"
                    onClick={() => router.push("/")}
                    src={assets.logo}
                    alt="logo"
                    width={128}
                    height={40}
                    priority
                />
            ) : (
                <div
                    className="text-xl font-bold cursor-pointer transition-colors hover:text-sky-600"
                    onClick={() => router.push("/")}
                >
                    Baby Bear Store
                </div>
            )}
        </div>
    );
};

export default Logo;