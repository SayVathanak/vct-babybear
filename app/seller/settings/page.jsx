'use client'
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderSliderManager from '../promotion-slider/page';
import PromoCodeManager from '@/components/PromoCodeManager';
import FooterSettingsManager from '@/components/FooterSettingsManager';
import LogoManager from '@/components/LogoManager';
import ABAKHQRManager from '@/components/ABAKHQRManager';
import {
  Settings,
  Image as ImageIcon,
  Tag,
  Palette,
  Layout,
  CreditCard,
  Menu,
  Save,
  X,
  Store,
  Bell,
  Shield,
  ChevronRight,
} from 'lucide-react';

const SettingsPage = () => {
  const { getToken } = useAppContext();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // General settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Baby Bear Store',
    storeDescription: 'Your trusted partner for baby essentials',
    contactPhone: '078 223 444',
    contactEmail: '',
    address: '',
    mapUrl: 'https://maps.app.goo.gl/mCgK7xcU3r61Z3S5A',
    currency: 'USD',
    timezone: 'UTC',
    maintenanceMode: false
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    stockAlerts: true,
    promoNotifications: true,
    systemUpdates: true,
    emailNotifications: true,
    smsNotifications: false
  });

  const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'logo', label: 'Logo Management', icon: Palette },
    { id: 'footer', label: 'Footer Settings', icon: Layout },
    { id: 'aba-khqr', label: 'ABA KHQR Payment', icon: CreditCard },
    { id: 'sliders', label: 'Header Sliders', icon: ImageIcon },
    { id: 'promos', label: 'Promo Codes', icon: Tag },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'store', label: 'Store Settings', icon: Store },
    { id: 'security', 'label': 'Security', icon: Shield }
  ];

  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  // Close sidebar when tab changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  const fetchCurrentSettings = async () => {
    try {
      setLoading(true);
      // Fetch current settings from API
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (settingsType, data) => {
    try {
      setLoading(true);
      const token = await getToken();

      // Simulate success
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setLoading(false);
    }
  };

  const getCurrentTabLabel = () => {
    return settingsTabs.find(tab => tab.id === activeTab)?.label || 'Settings';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, storeName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={storeSettings.contactPhone}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Description
                  </label>
                  <textarea
                    rows={3}
                    value={storeSettings.storeDescription}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, storeDescription: e.target.value }))}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={storeSettings.contactEmail}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={storeSettings.mapUrl}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, mapUrl: e.target.value }))}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end">
                <button
                  onClick={() => handleSettingsUpdate('general', storeSettings)}
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={storeSettings.currency}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={storeSettings.timezone}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Asia/Phnom_Penh">Asia/Phnom_Penh</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={storeSettings.maintenanceMode}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Maintenance Mode</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, customers will see a maintenance page
                </p>
              </div>
            </div>
          </div>
        );

      case 'logo':
        return <LogoManager />;

      case 'footer':
        return <FooterSettingsManager />;

      case 'aba-khqr':
        return <ABAKHQRManager />;

      case 'sliders':
        return <HeaderSliderManager />;

      case 'promos':
        return <PromoCodeManager />;

      case 'notifications':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">
                        {key === 'orderNotifications' && 'Get notified about new orders and order updates'}
                        {key === 'stockAlerts' && 'Receive alerts when products are low in stock'}
                        {key === 'promoNotifications' && 'Notifications about promo code usage and performance'}
                        {key === 'systemUpdates' && 'System maintenance and update notifications'}
                        {key === 'emailNotifications' && 'Send notifications via email'}
                        {key === 'smsNotifications' && 'Send notifications via SMS'}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end">
                <button
                  onClick={() => handleSettingsUpdate('notifications', notificationSettings)}
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        );

      case 'store':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Configuration</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Business Hours</h4>
                  <div className="space-y-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div key={day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm text-gray-700 font-medium sm:w-20">{day}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            className="text-xs border rounded px-2 py-1 flex-1 sm:flex-none"
                            defaultValue="09:00"
                          />
                          <span className="text-xs text-gray-500">to</span>
                          <input
                            type="time"
                            className="text-xs border rounded px-2 py-1 flex-1 sm:flex-none"
                            defaultValue="18:00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Policies</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Policy (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      defaultValue="30"
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Policy
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your shipping policy..."
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Access Control</h4>
                  <div className="space-y-3">
                    <label className="flex items-start sm:items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0" defaultChecked />
                      <span className="text-sm text-gray-700">Require two-factor authentication</span>
                    </label>
                    <label className="flex items-start sm:items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0" />
                      <span className="text-sm text-gray-700">Log all admin activities</span>
                    </label>
                    <label className="flex items-start sm:items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0" defaultChecked />
                      <span className="text-sm text-gray-700">Enable session timeout (30 minutes)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Data Protection</h4>
                  <div className="space-y-3">
                    <label className="flex items-start sm:items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0" defaultChecked />
                      <span className="text-sm text-gray-700">Encrypt customer data</span>
                    </label>
                    <label className="flex items-start sm:items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0" defaultChecked />
                      <span className="text-sm text-gray-700">Automatic daily backups</span>
                    </label>
                    <label className="flex items-start sm:items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0" />
                      <span className="text-sm text-gray-700">GDPR compliance mode</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">
                    Generate Security Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="mb-4 lg:mb-6 flex justify-between items-center lg:justify-start">
          <div className="lg:hidden">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {getCurrentTabLabel()}
            </h1>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your store settings and preferences
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                className="fixed inset-0 z-50 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Backdrop with blur effect */}
                <motion.div
                  className="fixed inset-0 backdrop-blur-md transition-backdrop-filter duration-500"
                  onClick={() => setSidebarOpen(false)}
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Settings</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 rounded-md hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-2 overflow-y-auto" style={{ height: 'calc(100vh - 73px)' }}>
                    <nav className="space-y-1">
                      {settingsTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                              activeTab === tab.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                            <span className="truncate">{tab.label}</span>
                            <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border shadow-sm p-2 sticky top-6">
              <nav className="space-y-1">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;