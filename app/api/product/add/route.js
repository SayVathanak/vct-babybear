// 2. Product creation route: /api/product/create/route.js
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

        const files = formData.getAll('images');

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files uploaded' })
        }

        // Validate required fields
        if (!name || !price || !offerPrice) {
            return NextResponse.json({ 
                success: false, 
                message: 'Name, price, and offer price are required' 
            })
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
            image,
            isAvailable: true, // Default to available
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
        
        // Handle duplicate barcode error specifically
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