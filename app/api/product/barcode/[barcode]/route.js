
// 1. Barcode lookup route: /api/product/barcode/[barcode]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request, { params }) {
    try {
        // Get the barcode from the URL parameters
        const { barcode } = params;
        
        // Check if user is authenticated
        const { userId } = getAuth(request);
        
        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: 'Authentication required' 
            }, { status: 401 });
        }

        // Validate barcode exists
        if (!barcode || barcode.trim() === '') {
            return NextResponse.json({ 
                success: false, 
                message: 'Barcode is required' 
            }, { status: 400 });
        }

        await connectDB();

        // Find product by barcode (more flexible pattern matching)
        const product = await Product.findOne({ 
            barcode: barcode.trim(),
            isAvailable: true // Only find available products
        });

        if (!product) {
            return NextResponse.json({ 
                success: false, 
                message: 'Product not found with this barcode' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Product found successfully',
            product: {
                _id: product._id,
                name: product.name,
                description: product.description,
                category: product.category,
                price: product.price,
                offerPrice: product.offerPrice,
                barcode: product.barcode,
                image: product.image,
                date: product.date,
                userId: product.userId,
                isAvailable: product.isAvailable
            }
        });

    } catch (error) {
        console.error('Barcode search error:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Server error while searching for product' 
        }, { status: 500 });
    }
}

// Optional: Add a POST method for bulk barcode searches
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        
        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: 'Authentication required' 
            }, { status: 401 });
        }

        const { barcodes } = await request.json();

        if (!Array.isArray(barcodes) || barcodes.length === 0) {
            return NextResponse.json({ 
                success: false, 
                message: 'Invalid barcodes array' 
            }, { status: 400 });
        }

        await connectDB();

        // Find multiple products by barcodes
        const products = await Product.find({ 
            barcode: { $in: barcodes.map(b => b.trim()) },
            isAvailable: true
        });

        return NextResponse.json({ 
            success: true, 
            message: `Found ${products.length} products`,
            products: products.map(product => ({
                _id: product._id,
                name: product.name,
                description: product.description,
                category: product.category,
                price: product.price,
                offerPrice: product.offerPrice,
                barcode: product.barcode,
                image: product.image,
                date: product.date,
                userId: product.userId,
                isAvailable: product.isAvailable
            }))
        });

    } catch (error) {
        console.error('Bulk barcode search error:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Server error while searching for products' 
        }, { status: 500 });
    }
}