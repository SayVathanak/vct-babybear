"use client";
import { assets } from "@/assets/assets";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { FaUser, FaPhoneAlt, FaMapMarkerAlt, FaLocationArrow } from "react-icons/fa";

// ProvinceSelector Component
const ProvinceSelector = ({ provinces, address, setAddress }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Dropdown Toggle */}
            <div
                className="font-kantumruy w-full px-3 py-2 border rounded text-sm bg-white cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {address.state || "ជ្រើសរើសខេត្ដមួយ"}
            </div>

            {/* Scrollable Province List */}
            {isOpen && (
                <div className="absolute left-0 w-full mt-1 border rounded bg-white shadow-md max-h-48 overflow-y-auto z-10">
                    {provinces.map((province, index) => (
                        <div
                            key={index}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                            onClick={() => {
                                setAddress({ ...address, state: province });
                                setIsOpen(false);
                            }}
                        >
                            {province}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Province List
const provinces = [
    "ភ្នំពេញ", "បន្ទាយមានជ័យ", "បាត់ដំបង", "កំពង់ចាម", "កំពង់ឆ្នាំង", "កំពង់ស្ពឺ",
    "កំពង់ធំ", "កំពត", "កណ្ដាល", "កោះកុង", "ក្រចេះ", "មណ្ឌលគិរី", "ឧត្ដរមានជ័យ",
    "ប៉ៃលិន", "ព្រះវិហារ", "ព្រៃវែង", "ពោធិ៍សាត់", "រតនគិរី", "សៀមរាប", "ព្រះសីហនុ",
    "ស្ទឹងត្រែង", "ស្វាយរៀង", "តាកែវ", "ត្បូងឃ្មុំ", "កែប"
];

const AddAddress = () => {
    const { getToken, router } = useAppContext();
    const [address, setAddress] = useState({
        fullName: "",
        phoneNumber: "",
        pincode: "",
        area: "",
        city: "",
        state: "",
    });

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            const token = await getToken();
            const { data } = await axios.post("/api/user/add-address", { address }, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                toast.success(data.message);
                router.push("/cart");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <>
            <Navbar />
            <div className="px-6 md:px-16 lg:px-32 py-16 flex flex-col md:flex-row justify-between">
                <form onSubmit={onSubmitHandler} className="w-full md:w-1/2 space-y-6">
                    <p className="font-prata text-2xl md:text-3xl text-gray-500">
                        Add Delivery <span className="font-medium text-black">Address</span>
                    </p>

                    {/* User Information */}
                    <div className="p-6 rounded-lg shadow-md">
                        <h3 className="font-kantumruy text-md font-semibold mb-4">ព័ត៌មានអ្នកទិញ</h3>
                        <div className="space-y-3 text-sm">
                            <label className="font-kantumruy flex items-center gap-2">
                                <FaUser /> ឈ្មោះ:*
                            </label>
                            <input
                                className="w-full px-3 py-2 border rounded font-light"
                                type="text"
                                placeholder="Ex: John Doe"
                                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                                value={address.fullName}
                            />
                            <label className="font-kantumruy flex items-center gap-2">
                                <FaPhoneAlt /> លេខទូរស័ព្ទ:*
                            </label>
                            <input
                                className="w-full px-3 py-2 border rounded font-light"
                                type="text"
                                placeholder="Ex: 0xx xxx xxx"
                                onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                                value={address.phoneNumber}
                            />
                        </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="p-6 rounded-lg shadow-md">
                        <h3 className="font-kantumruy text-md font-semibold mb-4">ព័ត៌មានដឹកជញ្ជូន</h3>
                        <div className="space-y-3 text-sm">
                            <label className="font-kantumruy flex items-center gap-2">
                                <FaMapMarkerAlt /> អាស័យដ្ឋាន:*
                            </label>
                            <input
                                className="w-full px-3 py-2 border rounded font-light text-sm"
                                placeholder="Ex: Toul Kork"
                                onChange={(e) => setAddress({ ...address, area: e.target.value })}
                                value={address.area}
                            />

                            <label className="font-kantumruy flex items-center gap-2">
                                <FaLocationArrow /> ខេត្ត:*
                            </label>
                            <ProvinceSelector provinces={provinces} address={address} setAddress={setAddress} />

                            <label className="font-kantumruy flex items-center gap-2">សារបន្ថែម:*</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded"
                                type="text"
                                rows={2}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                value={address.city}
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-black text-white py-3 hover:bg-green-500 transition duration-300 uppercase rounded">
                        Save Address
                    </button>
                </form>

                <Image className="md:ml-16 mt-16 md:mt-0" src={assets.my_location_image} alt="my_location_image" />
            </div>
            <Footer />
        </>
    );
};

export default AddAddress;