// File: /api/product/update-availability/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function PUT(request) {
  try {
    // Get the authenticated user's ID using Clerk's getAuth
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication failed" }, { status: 401 });
    }
    
    // Verify the user is a seller
    const isSeller = await authSeller(userId);
    
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not Authorized" });
    }
    
    const requestData = await request.json();
    
    // Check if this is a quick-edit request or just an availability update
    const isQuickEdit = 'name' in requestData;
    
    if (isQuickEdit) {
      // Handle quick edit functionality
      const { _id, name, price, offerPrice, category, isAvailable } = requestData;
      
      if (!_id) {
        return NextResponse.json({ success: false, message: "Product ID is required" });
      }
      
      // Validate required fields
      if (!name || !price || !offerPrice || !category) {
        return NextResponse.json({ 
          success: false, 
          message: "Name, price, offer price, and category are required" 
        });
      }
      
      // Connect to the database
      await connectDB();
      
      // Find the product and verify ownership
      const product = await Product.findById(_id);
      
      if (!product) {
        return NextResponse.json({ success: false, message: "Product not found" });
      }
      
      if (product.userId !== userId) {
        return NextResponse.json({ success: false, message: "Not authorized to update this product" });
      }
      
      // Update product with all quick edit fields
      product.name = name;
      product.price = price;
      product.offerPrice = offerPrice;
      product.category = category;
      product.isAvailable = isAvailable;
      
      await product.save();
      
      return NextResponse.json({ 
        success: true, 
        message: "Product updated successfully",
        product
      });
    } else {
      // Handle simple availability update (original functionality)
      const { productId, isAvailable } = requestData;
      
      if (!productId) {
        return NextResponse.json({ success: false, message: "Product ID is required" });
      }
      
      // Connect to the database
      await connectDB();
      
      // Find the product and verify ownership
      const product = await Product.findById(productId);
      
      if (!product) {
        return NextResponse.json({ success: false, message: "Product not found" });
      }
      
      if (product.userId !== userId) {
        return NextResponse.json({ success: false, message: "Not authorized to update this product" });
      }
      
      // Update product availability
      product.isAvailable = isAvailable;
      await product.save();
      
      return NextResponse.json({ 
        success: true, 
        message: `Product marked as ${isAvailable ? 'available' : 'unavailable'}` 
      });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}