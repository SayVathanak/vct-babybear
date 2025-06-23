// 2. Product creation route: /api/product/add/route.js
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

// configure environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Not Authorized' })
        }

        const formData = await request.formData()

        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const price = formData.get('price');
        const offerPrice = formData.get('offerPrice');
        const barcode = formData.get('barcode');
        const stock = formData.get('stock'); // --- INVENTORY: Get stock from form data

        const files = formData.getAll('images');

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files uploaded' })
        }

        // --- INVENTORY: Validate required fields including stock ---
        if (!name || !price || !offerPrice || !stock) {
            return NextResponse.json({ 
                success: false, 
                message: 'Name, price, offer price, and stock are required' 
            })
        }
        
        // --- INVENTORY: Validate stock is a non-negative number ---
        if (isNaN(Number(stock)) || Number(stock) < 0) {
            return NextResponse.json({
                success: false,
                message: 'Stock must be a valid, non-negative number.'
            });
        }


        await connectDB()

        // Check if barcode already exists (if provided)
        if (barcode && barcode.trim() !== '') {
            const existingProduct = await Product.findOne({ barcode: barcode.trim() });
            if (existingProduct) {
                return NextResponse.json({ 
                    success: false, 
                    message: "A product with this barcode already exists. Please use a unique barcode." 
                })
            }
        }

        const result = await Promise.all(
            files.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { resource_type: 'auto' },
                        (error, result) => {
                            if (error) {
                                reject(error)
                            } else {
                                resolve(result)
                            }
                        }
                    )
                    stream.end(buffer)
                })
            })
        )

        const image = result.map(result => result.secure_url)

        // Create product data object
        const productData = {
            userId,
            name: name.trim(),
            description: description?.trim() || '',
            category: category?.trim() || '',
            price: Number(price),
            offerPrice: Number(offerPrice),
            stock: Number(stock), // --- INVENTORY: Add stock to the product data ---
            image,
            isAvailable: Number(stock) > 0, // --- INVENTORY: Set availability based on stock ---
            date: Date.now()
        }

        // Only add barcode if it's provided and not empty
        if (barcode && barcode.trim() !== '') {
            productData.barcode = barcode.trim();
        }

        const newProduct = await Product.create(productData)

        return NextResponse.json({ 
            success: true, 
            message: "Product created successfully", 
            product: newProduct 
        })

    } catch (error) {
        console.error('Product creation error:', error);
        
        if (error.code === 11000 && error.keyPattern?.barcode) {
            return NextResponse.json({ 
                success: false, 
                message: "A product with this barcode already exists. Please use a unique barcode." 
            })
        }
        
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Failed to create product' 
        })
    }
}
