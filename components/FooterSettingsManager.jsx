import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

const FooterSettingsManager = () => {
    const { getToken } = useAppContext();
    const [footerData, setFooterData] = useState({
        companyInfo: {
            description: "",
            establishedYear: "2020"
        },
        contact: {
            phone: "",
            email: "",
            address: "",
            mapUrl: "",
            mapLabel: ""
        },
        links: {
            company: [
                { label: "Home", url: "/" },
                { label: "About us", url: "/about" },
                { label: "Contact us", url: "/contact" },
                { label: "Privacy policy", url: "/privacy" }
            ],
            social: [
                { platform: "facebook", url: "" },
                { platform: "instagram", url: "" },
                { platform: "twitter", url: "" }
            ]
        },
        copyright: {
            year: new Date().getFullYear(),
            text: "Baby Bear. All Right Reserved."
        },
        isVisible: true
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchFooterSettings();
    }, []);

    const fetchFooterSettings = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/settings/footer');
            
            if (data.success) {
                setFooterData(data.footer);
            }
        } catch (error) {
            console.error('Error fetching footer settings:', error);
            toast.error('Failed to load footer settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await getToken();
            
            const { data } = await axios.post('/api/settings/footer', footerData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error saving footer settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save footer settings');
        } finally {
            setSaving(false);
        }
    };

    const addCompanyLink = () => {
        setFooterData(prev => ({
            ...prev,
            links: {
                ...prev.links,
                company: [...prev.links.company, { label: "", url: "" }]
            }
        }));
    };

    const removeCompanyLink = (index) => {
        setFooterData(prev => ({
            ...prev,
            links: {
                ...prev.links,
                company: prev.links.company.filter((_, i) => i !== index)
            }
        }));
    };

    const updateCompanyLink = (index, field, value) => {
        setFooterData(prev => ({
            ...prev,
            links: {
                ...prev.links,
                company: prev.links.company.map((link, i) => 
                    i === index ? { ...link, [field]: value } : link
                )
            }
        }));
    };

    const updateSocialLink = (index, value) => {
        setFooterData(prev => ({
            ...prev,
            links: {
                ...prev.links,
                social: prev.links.social.map((social, i) => 
                    i === index ? { ...social, url: value } : social
                )
            }
        }));
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Footer Settings</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setFooterData(prev => ({ ...prev, isVisible: !prev.isVisible }))}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                                footerData.isVisible 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-gray-50 text-gray-700'
                            }`}
                        >
                            {footerData.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {footerData.isVisible ? 'Visible' : 'Hidden'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Company Information */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Company Information</h4>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Description
                            </label>
                            <textarea
                                rows={4}
                                value={footerData.companyInfo.description}
                                onChange={(e) => setFooterData(prev => ({
                                    ...prev,
                                    companyInfo: { ...prev.companyInfo, description: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe your company..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Established Year
                            </label>
                            <input
                                type="number"
                                value={footerData.companyInfo.establishedYear}
                                onChange={(e) => setFooterData(prev => ({
                                    ...prev,
                                    companyInfo: { ...prev.companyInfo, establishedYear: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Copyright Text
                            </label>
                            <input
                                type="text"
                                value={footerData.copyright.text}
                                onChange={(e) => setFooterData(prev => ({
                                    ...prev,
                                    copyright: { ...prev.copyright, text: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Contact Information</h4>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={footerData.contact.phone}
                                onChange={(e) => setFooterData(prev => ({
                                    ...prev,
                                    contact: { ...prev.contact, phone: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={footerData.contact.email}
                                onChange={(e) => setFooterData(prev => ({
                                    ...prev,
                                    contact: { ...prev.contact, email: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Physical Address
                            </label>
                            <textarea
                                rows={2}
                                value={footerData.contact.address}
                                onChange={(e) => setFooterData(prev => ({
                                    ...prev,
                                    contact: { ...prev.contact, address: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Google Maps URL
                            </label>
                            <input
                                type="url"
                                value={footerData.contact.mapUrl}
                                onChange={(e) => setFooterData(prev => ({
                                    ...prev,
                                    contact: { ...prev.contact, mapUrl: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Map Link Label
                            </label>
                            <input
                                type="text"
                                value={footerData.contact.mapLabel}
                                onChange={(e) => setFooterData(prev => ({
                                    ...prev,
                                    contact: { ...prev.contact, mapLabel: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., VCT Baby Bear"
                            />
                        </div>
                    </div>
                </div>

                {/* Company Links */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Company Links</h4>
                        <button
                            onClick={addCompanyLink}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Link
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {footerData.links.company.map((link, index) => (
                            <div key={index} className="flex gap-3">
                                <input
                                    type="text"
                                    value={link.label}
                                    onChange={(e) => updateCompanyLink(index, 'label', e.target.value)}
                                    placeholder="Link Label"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    value={link.url}
                                    onChange={(e) => updateCompanyLink(index, 'url', e.target.value)}
                                    placeholder="URL"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => removeCompanyLink(index)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Social Media Links */}
                <div className="mt-8">
                    <h4 className="font-medium text-gray-900 mb-4">Social Media Links</h4>
                    <div className="space-y-3">
                        {footerData.links.social.map((social, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <div className="w-24 text-sm font-medium text-gray-700 capitalize">
                                    {social.platform}
                                </div>
                                <input
                                    type="url"
                                    value={social.url}
                                    onChange={(e) => updateSocialLink(index, e.target.value)}
                                    placeholder={`${social.platform} URL`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FooterSettingsManager;