import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { uploadToCloudinary } from "@/lib/cloudinary"; // You'll need to create this utility

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

    // Check if this is a form data request
    const contentType = request.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    let requestData;

    if (isFormData) {
      // Handle form data with files
      const formData = await request.formData();

      const _id = formData.get("_id");
      const name = formData.get("name");
      const price = parseFloat(formData.get("price"));
      const offerPrice = parseFloat(formData.get("offerPrice"));
      const category = formData.get("category");
      const isAvailable = formData.get("isAvailable") === "true";
      const description = formData.get("description");

      // Get existing image URLs
      const existingImages = formData.getAll("existingImages");

      // Get new image files
      const newImageFiles = formData.getAll("newImages");

      requestData = {
        _id,
        name,
        price,
        offerPrice,
        category,
        isAvailable,
        description,
        existingImages,
        newImageFiles
      };
    } else {
      // Handle JSON request for simple updates
      requestData = await request.json();
    }

    // Check if this is a full edit or just an availability update
    const isFullEdit = 'name' in requestData && 'description' in requestData;
    const isQuickEdit = 'name' in requestData && !('description' in requestData);

    if (isFullEdit) {
      // Handle full edit with description and possibly images
      const {
        _id,
        name,
        price,
        offerPrice,
        category,
        isAvailable,
        description,
        existingImages,
        newImageFiles
      } = requestData;

      if (!_id) {
        return NextResponse.json({ success: false, message: "Product ID is required" });
      }

      // Validate required fields
      if (!name || !price || !offerPrice || !category || !description) {
        return NextResponse.json({
          success: false,
          message: "Name, price, offer price, category, and description are required"
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

      // Process image uploads (if any)
      let finalImageUrls = [...existingImages];

      if (newImageFiles && newImageFiles.length > 0) {
        // Upload new images to cloudinary or your storage service
        const uploadPromises = newImageFiles.map(file =>
          uploadToCloudinary(file) // You need to implement this function
        );

        const uploadResults = await Promise.all(uploadPromises);
        const newImageUrls = uploadResults.map(result => result.secure_url);

        // Combine existing and new image URLs
        finalImageUrls = [...finalImageUrls, ...newImageUrls];
      }

      // Update product with all fields
      product.name = name;
      product.price = price;
      product.offerPrice = offerPrice;
      product.category = category;
      product.isAvailable = isAvailable;
      product.description = description;
      product.image = finalImageUrls;

      await product.save();

      return NextResponse.json({
        success: true,
        message: "Product updated successfully",
        product
      });
    } else if (isQuickEdit) {
      // Handle quick edit functionality (original functionality)
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

      // Update product with quick edit fields
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