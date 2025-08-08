// app/api/settings/aba-khqr/details/route.js
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Settings from "@/models/Settings";

// PUT - Update bank details only
export async function PUT(request) {
    try {
        const { userId } = getAuth(request);
        
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ 
                success: false, 
                message: 'Not Authorized' 
            }, { status: 403 });
        }

        const { bankDetails } = await request.json();

        if (!bankDetails) {
            return NextResponse.json({
                success: false,
                message: 'Bank details are required'
            }, { status: 400 });
        }

        // Validate required fields
        if (!bankDetails.accountNumber || !bankDetails.accountName) {
            return NextResponse.json({
                success: false,
                message: 'Account number and account name are required'
            }, { status: 400 });
        }

        await connectDB();

        // Find existing ABA KHQR settings or create new one
        const existingSettings = await Settings.findOne({ type: 'aba-khqr' });

        let updatedData;
        if (existingSettings) {
            // Update existing settings, preserve KHQR data
            updatedData = {
                ...existingSettings.data,
                bankDetails: {
                    accountNumber: bankDetails.accountNumber.trim(),
                    accountName: bankDetails.accountName.trim().toUpperCase(),
                    bankName: bankDetails.bankName || 'ABA Bank',
                    isActive: bankDetails.isActive !== undefined ? bankDetails.isActive : true
                }
            };
        } else {
            // Create new settings with only bank details
            updatedData = {
                khqr: null,
                bankDetails: {
                    accountNumber: bankDetails.accountNumber.trim(),
                    accountName: bankDetails.accountName.trim().toUpperCase(),
                    bankName: bankDetails.bankName || 'ABA Bank',
                    isActive: bankDetails.isActive !== undefined ? bankDetails.isActive : true
                }
            };
        }

        const khqrSettings = await Settings.findOneAndUpdate(
            { type: 'aba-khqr' },
            {
                type: 'aba-khqr',
                data: updatedData,
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
            message: 'Bank details updated successfully',
            bankDetails: updatedData.bankDetails,
            updatedAt: khqrSettings.updatedAt
        });

    } catch (error) {
        console.error('Bank details update error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to update bank details'
        }, { status: 500 });
    }
}