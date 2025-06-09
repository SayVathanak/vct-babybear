// Improved app/api/product/barcode-search/route.js
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";

// Helper function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to normalize barcode
function normalizeBarcode(barcode) {
    if (!barcode) return '';
    return decodeURIComponent(barcode).trim();
}

// Helper function to search product with multiple strategies
async function searchProduct(barcode) {
    const normalizedBarcode = normalizeBarcode(barcode);
    
    if (!normalizedBarcode) {
        throw new Error('Invalid barcode provided');
    }

    // Strategy 1: Exact match
    let product = await Product.findOne({ 
        barcode: normalizedBarcode,
        isAvailable: true
    });

    // Strategy 2: Case-insensitive exact match
    if (!product) {
        product = await Product.findOne({ 
            barcode: { 
                $regex: new RegExp(`^${escapeRegex(normalizedBarcode)}$`, 'i') 
            },
            isAvailable: true
        });
    }

    // Strategy 3: Partial match (only if barcode is longer than 3 characters)
    if (!product && normalizedBarcode.length > 3) {
        product = await Product.findOne({ 
            barcode: { 
                $regex: escapeRegex(normalizedBarcode), 
                $options: 'i' 
            },
            isAvailable: true
        });
    }

    return product;
}

export async function GET(request) {
    try {
        // Get the barcode from query parameters
        const { searchParams } = new URL(request.url);
        const barcode = searchParams.get('barcode');
        
        console.log('Barcode search API hit with barcode:', barcode);
        
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
                message: 'Barcode parameter is required' 
            }, { status: 400 });
        }

        // Connect to database with error handling
        try {
            await connectDB();
        } catch (dbError) {
            console.error('Database connection failed:', dbError);
            return NextResponse.json({ 
                success: false, 
                message: 'Database connection failed' 
            }, { status: 503 });
        }

        // Search for product
        const product = await searchProduct(barcode);

        if (!product) {
            const normalizedBarcode = normalizeBarcode(barcode);
            console.log('Product not found for barcode:', normalizedBarcode);
            return NextResponse.json({ 
                success: false, 
                message: `Product not found with barcode: ${normalizedBarcode}` 
            }, { status: 404 });
        }

        console.log('Product found:', product.name, 'with barcode:', product.barcode);
        
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
        
        // Handle specific MongoDB errors
        if (error.name === 'MongoError' || error.name === 'MongoServerError') {
            return NextResponse.json({ 
                success: false, 
                message: 'Database query failed' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            success: false, 
            message: 'Server error while searching for product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        
        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: 'Authentication required' 
            }, { status: 401 });
        }

        const body = await request.json();
        const { barcode, barcodes } = body;

        // Connect to database with error handling
        try {
            await connectDB();
        } catch (dbError) {
            console.error('Database connection failed:', dbError);
            return NextResponse.json({ 
                success: false, 
                message: 'Database connection failed' 
            }, { status: 503 });
        }

        if (barcode) {
            // Single barcode search
            const product = await searchProduct(barcode);

            if (!product) {
                const normalizedBarcode = normalizeBarcode(barcode);
                return NextResponse.json({ 
                    success: false, 
                    message: `Product not found with barcode: ${normalizedBarcode}` 
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
        }

        if (Array.isArray(barcodes) && barcodes.length > 0) {
            // Bulk barcode search with input validation
            if (barcodes.length > 100) {
                return NextResponse.json({ 
                    success: false, 
                    message: 'Too many barcodes. Maximum 100 allowed per request.' 
                }, { status: 400 });
            }

            const normalizedBarcodes = barcodes
                .map(b => normalizeBarcode(b))
                .filter(b => b.length > 0);
            
            const products = await Product.find({ 
                barcode: { $in: normalizedBarcodes },
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
        }

        return NextResponse.json({ 
            success: false, 
            message: 'Invalid request - barcode or barcodes array required' 
        }, { status: 400 });

    } catch (error) {
        console.error('Barcode search error:', error);
        
        // Handle specific MongoDB errors
        if (error.name === 'MongoError' || error.name === 'MongoServerError') {
            return NextResponse.json({ 
                success: false, 
                message: 'Database query failed' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            success: false, 
            message: 'Server error while searching for products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}