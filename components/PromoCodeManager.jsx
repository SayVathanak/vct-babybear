'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { FaTrash, FaPen, FaPlus, FaPercentage, FaDollarSign, FaCalendarAlt, FaFilter, FaSearch, FaEye, FaTimes } from 'react-icons/fa';

const PromoCodeManager = () => {
  const { getToken } = useAppContext();
  const [promoCodes, setPromoCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [detailView, setDetailView] = useState(null);
  
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
        setFilteredCodes(data.promoCodes);
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

  useEffect(() => {
    // Filter promo codes based on search term and status filter
    let filtered = promoCodes;
    
    if (searchTerm) {
      filtered = filtered.filter(promo => 
        promo.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(promo => 
        statusFilter === 'active' ? promo.isActive : !promo.isActive
      );
    }
    
    setFilteredCodes(filtered);
  }, [searchTerm, statusFilter, promoCodes]);

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
        if (detailView && detailView._id === promoId) {
          setDetailView(null);
        }
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
        if (detailView && detailView._id === promo._id) {
          setDetailView({...detailView, isActive: !promo.isActive});
        }
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

  const viewDetails = (promo) => {
    setDetailView(promo);
  };

  return (
    <div className="flex-1 min-h-screen p-3 md:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-medium text-gray-800">Promo Code Management</h1>
          <button
            onClick={() => openModal()}
            className="bg-black text-white px-4 py-2 rounded-md flex items-center text-sm shadow-sm hover:bg-gray-800 transition-colors"
          >
            <FaPlus className="mr-2" /> Add Promo Code
          </button>
        </div>
        
        {/* Controls Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search promo codes..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative inline-block text-left">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <FaFilter className="text-gray-400 text-xs" />
                </div>
              </div>
              
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                  aria-label="Grid view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                  aria-label="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detail View */}
        {detailView && (
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Promo Code Details</h3>
              <button 
                onClick={() => setDetailView(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Code</div>
                  <div className="font-medium text-lg">{detailView.code}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    detailView.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {detailView.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Discount</div>
                  <div className="flex items-center">
                    {detailView.discountType === 'percentage' ? (
                      <span className="flex items-center">
                        {detailView.discountValue}% <FaPercentage className="ml-1 text-xs" />
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaDollarSign className="text-xs" /> {detailView.discountValue}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Minimum Purchase</div>
                  <div>{detailView.minPurchaseAmount ? `$${detailView.minPurchaseAmount}` : 'None'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Maximum Discount</div>
                  <div>{detailView.maxDiscountAmount ? `$${detailView.maxDiscountAmount}` : 'No limit'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Expiry Date</div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1 text-gray-400" />
                    {formatDate(detailView.expiryDate)}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => togglePromoStatus(detailView)}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    detailView.isActive 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {detailView.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openModal(detailView)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(detailView._id)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && filteredCodes.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : filteredCodes.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-gray-500">No promo codes found.</div>
                <button 
                  onClick={() => openModal()} 
                  className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <FaPlus className="mr-1" /> Create your first promo code
                </button>
              </div>
            ) : (
              filteredCodes.map((promo) => (
                <div key={promo._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 transition-shadow hover:shadow-md">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{promo.code}</div>
                        <div className="text-sm text-gray-500">
                          {promo.discountType === 'percentage' ? (
                            <span className="flex items-center">
                              {promo.discountValue}% off
                            </span>
                          ) : (
                            <span className="flex items-center">
                              ${promo.discountValue} off
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          promo.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-1 text-gray-400" />
                        {formatDate(promo.expiryDate)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDetails(promo)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          aria-label="View details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => openModal(promo)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          aria-label="Edit"
                        >
                          <FaPen />
                        </button>
                        <button
                          onClick={() => handleDelete(promo._id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          aria-label="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
                    <th scope="col" className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min. Purchase
                    </th>
                    <th scope="col" className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max. Discount
                    </th>
                    <th scope="col" className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  {loading && filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500">
                        <div className="animate-pulse flex justify-center">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500">
                        No promo codes found. Create your first promo code!
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((promo) => (
                      <tr key={promo._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <button 
                              onClick={() => viewDetails(promo)}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {promo.code}
                            </button>
                          </div>
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
                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {promo.minPurchaseAmount ? `$${promo.minPurchaseAmount}` : 'None'}
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {promo.maxDiscountAmount ? `$${promo.maxDiscountAmount}` : 'No limit'}
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
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
                              className={`p-1 rounded text-xs ${
                                promo.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {promo.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => openModal(promo)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              aria-label="Edit"
                            >
                              <FaPen />
                            </button>
                            <button
                              onClick={() => handleDelete(promo._id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              aria-label="Delete"
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
        )}
      </div>

      {/* Modal for adding/editing promo codes */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div 
            className="relative bg-white rounded-lg shadow-xl mx-4 w-full max-w-md p-5 animate-fadeIn"
            style={{maxHeight: '90vh', overflowY: 'auto'}}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPromo ? 'Edit Promo Code' : 'Add New Promo Code'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., SUMMER20"
                  required
                />
              </div>

              <div>
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
                      className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Percentage (%)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="fixed"
                      checked={discountType === 'fixed'}
                      onChange={() => setDiscountType('fixed')}
                      className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Fixed Amount ($)</span>
                  </label>
                </div>
              </div>

              <div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-8"
                    placeholder={discountType === 'percentage' ? '20' : '10.00'}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {discountType === 'percentage' ? '%' : '$'}
                  </div>
                </div>
              </div>

              <div>
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
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50.00"
                  />
                </div>
              </div>

              {discountType === 'percentage' && (
                <div>
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
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="20.00"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
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