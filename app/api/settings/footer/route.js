import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Settings from "@/models/Settings";

// GET - Fetch footer settings
export async function GET(request) {
    try {
        await connectDB();
        
        const footerSettings = await Settings.findOne({ type: 'footer' });
        
        if (!footerSettings) {
            // Return default footer settings if none exist
            const defaultFooter = {
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
                    social: [
                        { platform: "facebook", url: "", icon: "facebook" },
                        { platform: "instagram", url: "", icon: "instagram" },
                        { platform: "twitter", url: "", icon: "twitter" }
                    ]
                },
                copyright: {
                    year: new Date().getFullYear(),
                    text: "Baby Bear. All Right Reserved."
                },
                isVisible: true
            };
            
            return NextResponse.json({
                success: true,
                footer: defaultFooter,
                isDefault: true
            });
        }

        return NextResponse.json({
            success: true,
            footer: footerSettings.data,
            updatedAt: footerSettings.updatedAt,
            isDefault: false
        });

    } catch (error) {
        console.error('Error fetching footer settings:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to fetch footer settings'
        });
    }
}

// POST - Update footer settings
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ 
                success: false, 
                message: 'Not Authorized' 
            });
        }

        const footerData = await request.json();

        // Validate required fields
        if (!footerData.companyInfo || !footerData.contact) {
            return NextResponse.json({
                success: false,
                message: 'Company info and contact details are required'
            });
        }

        await connectDB();

        // Save or update footer settings
        const footerSettings = await Settings.findOneAndUpdate(
            { type: 'footer' },
            {
                type: 'footer',
                data: {
                    ...footerData,
                    copyright: {
                        ...footerData.copyright,
                        year: new Date().getFullYear() // Always use current year
                    }
                },
                updatedBy: userId,
                updatedAt: new Date()
            },
            {
                upsert: true,
                new: true
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Footer settings updated successfully',
            footer: footerSettings.data,
            updatedAt: footerSettings.updatedAt
        });

    } catch (error) {
        console.error('Footer settings update error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to update footer settings'
        });
    }
}