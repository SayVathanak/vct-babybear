'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { FaTrash, FaPen, FaPlus, FaPercentage, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';

const PromoCodeManager = () => {
  const { getToken } = useAppContext();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  
  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get('/api/promo/list', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setPromoCodes(data.promoCodes);
      } else {
        toast.error(data.message || 'Failed to fetch promo codes');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinPurchaseAmount('');
    setMaxDiscountAmount('');
    setExpiryDate('');
    setIsActive(true);
    setEditingPromo(null);
  };

  const openModal = (promo = null) => {
    if (promo) {
      // Edit mode
      setEditingPromo(promo);
      setCode(promo.code);
      setDiscountType(promo.discountType);
      setDiscountValue(promo.discountValue.toString());
      setMinPurchaseAmount(promo.minPurchaseAmount?.toString() || '');
      setMaxDiscountAmount(promo.maxDiscountAmount?.toString() || '');
      setExpiryDate(promo.expiryDate ? new Date(promo.expiryDate).toISOString().split('T')[0] : '');
      setIsActive(promo.isActive);
    } else {
      // Create mode
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = await getToken();
      
      const promoData = {
        code,
        discountType,
        discountValue: parseFloat(discountValue),
        minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        expiryDate: expiryDate || null,
        isActive
      };
      
      let response;
      if (editingPromo) {
        // Update existing promo
        response = await axios.put(`/api/promo/update/${editingPromo._id}`, promoData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new promo
        response = await axios.post('/api/promo/create', promoData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      const { data } = response;
      
      if (data.success) {
        toast.success(data.message || `Promo code ${editingPromo ? 'updated' : 'created'} successfully`);
        fetchPromoCodes();
        setIsModalOpen(false);
        resetForm();
      } else {
        toast.error(data.message || `Failed to ${editingPromo ? 'update' : 'create'} promo code`);
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.delete(`/api/promo/delete/${promoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message || 'Promo code deleted successfully');
        fetchPromoCodes();
      } else {
        toast.error(data.message || 'Failed to delete promo code');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const togglePromoStatus = async (promo) => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.patch(`/api/promo/toggle-status/${promo._id}`, {
        isActive: !promo.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message || `Promo code ${promo.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchPromoCodes();
      } else {
        toast.error(data.message || 'Failed to update promo code status');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex-1 min-h-screen p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-medium">Promo Code Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> Add Promo Code
        </button>
      </div>
      
      {/* Promo Codes List */}
      <div className="bg-white shadow-md rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min. Purchase
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max. Discount
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && promoCodes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : promoCodes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500">
                    No promo codes found. Create your first promo code!
                  </td>
                </tr>
              ) : (
                promoCodes.map((promo) => (
                  <tr key={promo._id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {promo.code}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {promo.discountType === 'percentage' ? (
                        <span className="flex items-center">
                          {promo.discountValue}% <FaPercentage className="ml-1 text-xs" />
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FaDollarSign className="text-xs" /> {promo.discountValue}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {promo.minPurchaseAmount ? `$${promo.minPurchaseAmount}` : 'None'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {promo.maxDiscountAmount ? `$${promo.maxDiscountAmount}` : 'No limit'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-1 text-gray-400" />
                        {formatDate(promo.expiryDate)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          promo.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => togglePromoStatus(promo)}
                          className={`p-1 rounded ${
                            promo.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {promo.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => openModal(promo)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <FaPen />
                        </button>
                        <button
                          onClick={() => handleDelete(promo._id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding/editing promo codes */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 md:mx-auto w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingPromo ? 'Edit Promo Code' : 'Add New Promo Code'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., SUMMER20"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="percentage"
                      checked={discountType === 'percentage'}
                      onChange={() => setDiscountType('percentage')}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Percentage (%)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="fixed"
                      checked={discountType === 'fixed'}
                      onChange={() => setDiscountType('fixed')}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Fixed Amount ($)</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
                  {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={discountType === 'percentage' ? "100" : undefined}
                    id="discountValue"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={discountType === 'percentage' ? '20' : '10.00'}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {discountType === 'percentage' ? '%' : '$'}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Purchase Amount (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="minPurchaseAmount"
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="50.00"
                  />
                </div>
              </div>

              {discountType === 'percentage' && (
                <div className="mb-4">
                  <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Discount Amount (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      $
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="maxDiscountAmount"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="20.00"
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : editingPromo ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeManager;