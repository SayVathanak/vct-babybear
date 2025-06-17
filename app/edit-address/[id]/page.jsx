

// 2. Create edit address page: /edit-address/[id]/page.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { FaUser, FaPhoneAlt, FaMapMarkerAlt, FaLocationArrow } from "react-icons/fa";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import { assets } from "@/assets/assets";
import Image from "next/image";

// ProvinceSelector Component (same as in add-address)
const ProvinceSelector = ({ provinces, address, setAddress, errors, setErrors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleProvinceSelect = (e, province) => {
    e.preventDefault();
    e.stopPropagation();
    setAddress({ ...address, state: province });
    if (errors && setErrors && errors.state) {
      setErrors({ ...errors, state: null });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="peer w-full text-left px-3 py-2 border rounded text-sm bg-white cursor-pointer font-kantumruy focus:outline-none"
        onClick={toggleDropdown}
      >
        <span>{address.state || "ជ្រើសរើសខេត្ដមួយ"}</span>
        <svg
          className={`w-5 h-5 inline float-right transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#6B7280"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 w-full mt-1 border rounded bg-white shadow-md max-h-48 overflow-y-auto z-10">
          {provinces.map((province, index) => (
            <div
              key={index}
              className="px-3 py-2 cursor-pointer hover:bg-gray-200"
              onClick={(e) => handleProvinceSelect(e, province)}
            >
              {province}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const provinces = [
  "ភ្នំពេញ", "បន្ទាយមានជ័យ", "បាត់ដំបង", "កំពង់ចាម", "កំពង់ឆ្នាំង", "កំពង់ស្ពឺ",
  "កំពង់ធំ", "កំពត", "កណ្ដាល", "កោះកុង", "ក្រចេះ", "មណ្ឌលគិរី", "ឧត្ដរមានជ័យ",
  "ប៉ៃលិន", "ព្រះវិហារ", "ព្រៃវែង", "ពោធិ៍សាត់", "រតនគិរី", "សៀមរាប", "ព្រះសីហនុ",
  "ស្ទឹងត្រែង", "ស្វាយរៀង", "តាកែវ", "ត្បូងឃ្មុំ", "កែប"
];

const EditAddress = ({ params }) => {
  const { getToken, router } = useAppContext();
  const [address, setAddress] = useState({
    fullName: "",
    phoneNumber: "",
    pincode: "",
    area: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch address data
  const fetchAddress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/get-address', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const addressToEdit = data.addresses.find(addr => addr._id === params.id);
        if (addressToEdit) {
          setAddress({
            fullName: addressToEdit.fullName || "",
            phoneNumber: addressToEdit.phoneNumber || "",
            pincode: addressToEdit.pincode || "",
            area: addressToEdit.area || "",
            city: addressToEdit.city || "",
            state: addressToEdit.state || "",
          });
        } else {
          toast.error("Address not found");
          router.push('/manage-addresses');
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch address");
    } finally {
      setLoading(false);
    }
  };

  // Update address
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (!address.fullName) validationErrors.fullName = "Full name is required";
    if (!address.phoneNumber) validationErrors.phoneNumber = "Phone number is required";
    if (!address.area) validationErrors.area = "Address is required";
    if (!address.state) validationErrors.state = "Province is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setUpdating(true);
    try {
      const token = await getToken();
      const { data } = await axios.put(`/api/user/edit-address/${params.id}`, 
        { address }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        toast.success(data.message);
        router.push("/manage-addresses");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update address");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading address...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-6 flex flex-col md:flex-row justify-between">
        <form onSubmit={onSubmitHandler} className="w-full md:w-1/2 space-y-6">
          <div className="p-6 rounded-lg shadow-md">
            <h3 className="font-kantumruy text-md font-semibold mb-4">Edit Address</h3>
            <div className="space-y-3 text-sm">
              <label className="font-kantumruy flex items-center gap-2">
                <FaUser /> ឈ្មោះ:*
              </label>
              <input
                className="w-full px-3 py-2 border rounded font-light text-[16px]"
                type="text"
                placeholder="Ex: John Doe"
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                value={address.fullName}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}

              <label className="font-kantumruy flex items-center gap-2">
                <FaPhoneAlt /> លេខទូរស័ព្ទ:*
              </label>
              <input
                className="w-full px-3 py-2 border rounded font-light text-[16px]"
                type="text"
                placeholder="Ex: 0xx xxx xxx"
                onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                value={address.phoneNumber}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            <h3 className="font-kantumruy text-md font-semibold pt-6 mb-4">ព័ត៌មានដឹកជញ្ជូន</h3>
            <div className="space-y-3 text-sm">
              <label className="font-kantumruy flex items-center gap-2">
                <FaMapMarkerAlt /> អាស័យដ្ឋាន:*
              </label>
              <input
                className="w-full px-3 py-2 border rounded font-light text-[16px]"
                placeholder="Ex: Toul Kork"
                onChange={(e) => setAddress({ ...address, area: e.target.value })}
                value={address.area}
              />
              {errors.area && (
                <p className="text-red-500 text-xs mt-1">{errors.area}</p>
              )}

              <label className="font-kantumruy flex items-center gap-2">
                <FaLocationArrow /> ខេត្ត:*
              </label>
              <ProvinceSelector
                provinces={provinces}
                address={address}
                setAddress={setAddress}
                errors={errors}
                setErrors={setErrors}
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}

              <label className="font-kantumruy flex items-center gap-2">សារបន្ថែម:</label>
              <textarea
                className="w-full px-3 py-2 border rounded text-[16px]"
                type="text"
                rows={2}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                value={address.city}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => router.push('/manage-addresses')}
              className="flex-1 bg-gray-300 text-gray-700 py-3 hover:bg-gray-400 transition duration-300 uppercase rounded"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={updating}
              className="flex-1 bg-black text-white py-3 hover:bg-green-500 transition duration-300 uppercase rounded disabled:bg-gray-400"
            >
              {updating ? 'Updating...' : 'Update Address'}
            </button>
          </div>
        </form>

        <Image className="hidden md:block md:ml-16 mt-16 md:mt-0" src={assets.my_location_image} alt="my_location_image" />
      </div>
      <Footer />
    </>
  );
};

export default EditAddress;