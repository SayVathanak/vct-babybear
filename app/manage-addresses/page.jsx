// 1. Create a new page: /manage-addresses/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaPlus, FaMapMarkerAlt, FaUser, FaPhone } from "react-icons/fa";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";

const ManageAddresses = () => {
  const { getToken, router } = useAppContext();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/get-address', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setAddresses(data.addresses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  // Delete address
  const deleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    setDeleteLoading(addressId);
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/user/edit-address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        setAddresses(addresses.filter(addr => addr._id !== addressId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete address");
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading addresses...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-8 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-medium text-gray-800">
              Manage <span className="text-black font-semibold">Addresses</span>
            </h1>
            <button
              onClick={() => router.push('/add-address')}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FaPlus size={14} />
              Add New Address
            </button>
          </div>

          {/* Addresses Grid */}
          {addresses.length === 0 ? (
            <div className="text-center py-16">
              <FaMapMarkerAlt className="mx-auto text-gray-400 text-6xl mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No addresses found</h3>
              <p className="text-gray-500 mb-6">Add your first delivery address to get started</p>
              <button
                onClick={() => router.push('/add-address')}
                className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                Add Address
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {addresses.map((address) => (
                <div key={address._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  {/* Address Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-500" size={16} />
                      <h3 className="font-medium text-gray-800">{address.fullName}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/edit-address/${address._id}`)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit Address"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => deleteAddress(address._id)}
                        disabled={deleteLoading === address._id}
                        className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                        title="Delete Address"
                      >
                        {deleteLoading === address._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <FaTrash size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-gray-400" size={12} />
                      <span>{address.phoneNumber}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-gray-400 mt-0.5" size={12} />
                      <div>
                        <p>{address.area}</p>
                        <p>{address.state}</p>
                        {address.city && <p className="text-gray-500">{address.city}</p>}
                        {address.pincode && <p className="text-gray-500">{address.pincode}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ManageAddresses;