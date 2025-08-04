import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { 
    Facebook, 
    Instagram, 
    Twitter, 
    MapPin, 
    Phone, 
    Mail,
    ExternalLink 
} from "lucide-react";

const Footer = () => {
    const [footerData, setFooterData] = useState(null);
    const [logoData, setLogoData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFooterData();
        fetchLogoData();
    }, []);

    const fetchFooterData = async () => {
        try {
            const { data } = await axios.get('/api/settings/footer');
            if (data.success) {
                setFooterData(data.footer);
            }
        } catch (error) {
            console.error('Error fetching footer data:', error);
            // Use fallback data if API fails
            setFooterData(getDefaultFooterData());
        }
    };

    const fetchLogoData = async () => {
        try {
            const { data } = await axios.get('/api/settings/logo');
            if (data.success && data.logo) {
                setLogoData(data.logo);
            }
        } catch (error) {
            console.error('Error fetching logo data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDefaultFooterData = () => ({
        companyInfo: {
            description: "Baby Bear is dedicated to providing high-quality, safe, and reliable products for your little one. Since 2020, we've been committed to supporting parents with essentials that promote healthy growth and happiness. Trust us to be there for every step of your baby's journey.",
            establishedYear: "2020"
        },
        contact: {
            phone: "078 223 444",
            email: "",
            address: "",
            mapUrl: "https://maps.app.goo.gl/mCgK7xcU3r61Z3S5A",
            mapLabel: "VCT Baby Bear"
        },
        links: {
            company: [
                { label: "Home", url: "/" },
                { label: "About us", url: "/about" },
                { label: "Contact us", url: "/contact" },
                { label: "Privacy policy", url: "/privacy" }
            ],
            social: []
        },
        copyright: {
            year: new Date().getFullYear(),
            text: "Baby Bear. All Right Reserved."
        },
        isVisible: true
    });

    const getSocialIcon = (platform) => {
        switch (platform.toLowerCase()) {
            case 'facebook':
                return <Facebook className="w-5 h-5" />;
            case 'instagram':
                return <Instagram className="w-5 h-5" />;
            case 'twitter':
                return <Twitter className="w-5 h-5" />;
            default:
                return <ExternalLink className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <footer className="bg-gray-100 animate-pulse">
                <div className="px-6 md:px-16 lg:px-32 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-4">
                            <div className="w-32 h-8 bg-gray-300 rounded"></div>
                            <div className="space-y-2">
                                <div className="w-full h-4 bg-gray-300 rounded"></div>
                                <div className="w-full h-4 bg-gray-300 rounded"></div>
                                <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="w-24 h-6 bg-gray-300 rounded"></div>
                            <div className="space-y-2">
                                <div className="w-20 h-4 bg-gray-300 rounded"></div>
                                <div className="w-24 h-4 bg-gray-300 rounded"></div>
                                <div className="w-28 h-4 bg-gray-300 rounded"></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="w-28 h-6 bg-gray-300 rounded"></div>
                            <div className="space-y-2">
                                <div className="w-32 h-4 bg-gray-300 rounded"></div>
                                <div className="w-36 h-4 bg-gray-300 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    if (!footerData || !footerData.isVisible) {
        return null;
    }

    return (
        <footer className="bg-white border-t">
            <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">
                {/* Company Info */}
                <div className="w-full md:w-4/5">
                    {logoData?.url ? (
                        <Image 
                            className="w-28 md:w-32 mb-6" 
                            src={logoData.url} 
                            alt="logo"
                            width={logoData.width || 128}
                            height={logoData.height || 40}
                        />
                    ) : (
                        <div className="text-2xl font-bold text-gray-900 mb-6">
                            Baby Bear Store
                        </div>
                    )}
                    
                    <p className="text-sm leading-relaxed">
                        {footerData.companyInfo.description}
                    </p>

                    {/* Social Media Links */}
                    {footerData.links.social && footerData.links.social.length > 0 && (
                        <div className="flex space-x-4 mt-6">
                            {footerData.links.social
                                .filter(social => social.url)
                                .map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={social.platform}
                                >
                                    {getSocialIcon(social.platform)}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Company Links */}
                <div className="md:w-1/2 flex items-center justify-start md:justify-center">
                    <div>
                        <h2 className="font-medium text-gray-900 mb-5">Company</h2>
                        <ul className="text-sm space-y-2">
                            {footerData.links.company.map((link, index) => (
                                <li key={index}>
                                    <Link 
                                        href={link.url}
                                        className="hover:underline transition-colors hover:text-gray-700"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="w-full md:w-1/2 flex items-start justify-start md:justify-center">
                    <div>
                        <h2 className="font-medium text-gray-900 mb-5">Get in touch</h2>
                        <div className="text-sm space-y-3">
                            {footerData.contact.phone && (
                                <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <a 
                                        href={`tel:${footerData.contact.phone}`}
                                        className="hover:underline transition-colors hover:text-gray-700"
                                    >
                                        {footerData.contact.phone}
                                    </a>
                                </div>
                            )}
                            
                            {footerData.contact.email && (
                                <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <a 
                                        href={`mailto:${footerData.contact.email}`}
                                        className="hover:underline transition-colors hover:text-gray-700"
                                    >
                                        {footerData.contact.email}
                                    </a>
                                </div>
                            )}

                            {footerData.contact.address && (
                                <div className="flex items-start space-x-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>{footerData.contact.address}</span>
                                </div>
                            )}

                            {footerData.contact.mapUrl && (
                                <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>Google Maps:</span>
                                    <a
                                        href={footerData.contact.mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-300/70 hover:text-sky-400 transition-colors"
                                    >
                                        {footerData.contact.mapLabel || 'View Location'}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="py-4 text-center text-xs md:text-sm text-gray-500">
                Copyright {footerData.copyright.year} © {footerData.copyright.text}
            </div>
        </footer>
    );
};

export default Footer;
