import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication failed" }, { status: 401 });
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not Authorized" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");
    let requestData;

    if (isFormData) {
      const formData = await request.formData();
      requestData = {
        _id: formData.get("_id"),
        name: formData.get("name"),
        price: parseFloat(formData.get("price")),
        offerPrice: parseFloat(formData.get("offerPrice")),
        category: formData.get("category"),
        isAvailable: formData.get("isAvailable") === "true",
        description: formData.get("description"),
        barcode: formData.get("barcode"),
        // --- INVENTORY: Get stock from form data ---
        stock: formData.get("stock") !== null ? parseInt(formData.get("stock"), 10) : undefined,
        existingImages: formData.getAll("existingImages"),
        newImageFiles: formData.getAll("newImages")
      };
    } else {
      requestData = await request.json();
    }

    await connectDB();

    // Barcode uniqueness validation
    if (requestData.barcode && requestData.barcode.trim()) {
      const existingProduct = await Product.findOne({ 
        barcode: requestData.barcode.trim(),
        _id: { $ne: requestData._id || requestData.productId } 
      });
      if (existingProduct) {
        return NextResponse.json({ success: false, message: "This barcode is already assigned to another product" }, { status: 409 });
      }
    }
    
    // --- INVENTORY: Update isAvailable based on stock if stock is provided ---
    if (requestData.stock !== undefined && !isNaN(requestData.stock)) {
        requestData.isAvailable = requestData.stock > 0;
    }

    const hasFullEditFields = 'name' in requestData && 'description' in requestData;

    if (hasFullEditFields) {
      return await handleFullEdit(requestData);
    } else {
      return await handlePartialUpdate(requestData);
    }

  } catch (error) {
    console.error("Error in PUT route:", error);
    if (error.code === 11000 && error.keyPattern?.barcode) {
      return NextResponse.json({ success: false, message: "This barcode is already assigned to another product" }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}

// Handles full product edits, including from the QuickEditModal
async function handleFullEdit(requestData) {
  const { _id, name, price, offerPrice, category, isAvailable, description, barcode, stock, existingImages, newImageFiles } = requestData;

  if (!_id) {
    return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
  }

  // --- Validation ---
  if (!name || !price || !offerPrice || !category || !description) {
    return NextResponse.json({ success: false, message: "Name, price, offer price, category, and description are required" }, { status: 400 });
  }
  if (stock === undefined || isNaN(stock) || stock < 0) {
    return NextResponse.json({ success: false, message: "Stock must be a valid non-negative number." }, { status: 400 });
  }

  const product = await Product.findById(_id);
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  // Image processing
  let finalImageUrls = [...(existingImages || [])];
  if (newImageFiles && newImageFiles.length > 0) {
    try {
      const uploadPromises = newImageFiles.map(file => uploadToCloudinary(file));
      const uploadResults = await Promise.all(uploadPromises);
      finalImageUrls = [...finalImageUrls, ...uploadResults.map(result => result.secure_url)];
    } catch (uploadError) {
      return NextResponse.json({ success: false, message: "Failed to upload new images" }, { status: 500 });
    }
  }

  // --- Update Product Fields ---
  product.name = name;
  product.price = price;
  product.offerPrice = offerPrice;
  product.category = category;
  product.description = description;
  product.image = finalImageUrls;
  product.barcode = barcode !== undefined ? barcode.trim() || null : product.barcode;
  // --- INVENTORY: Update stock and availability ---
  product.stock = stock;
  product.isAvailable = stock > 0;

  await product.save();

  return NextResponse.json({
    success: true,
    message: "Product updated successfully",
    product
  });
}

// Handles simple partial updates, like toggling availability from the main list
async function handlePartialUpdate(requestData) {
  const { productId, _id, isAvailable, stock } = requestData;
  const id = productId || _id;
  
  if (!id) {
    return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
  }

  const product = await Product.findById(id);
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  const updatePayload = {};

  if (isAvailable !== undefined) {
    updatePayload.isAvailable = isAvailable;
    // If making unavailable, set stock to 0. If making available, ensure stock is at least 1.
    if(isAvailable === false) {
        updatePayload.stock = 0;
    } else if (product.stock <= 0) {
        updatePayload.stock = 1; // Or another default, but this prevents available with 0 stock
    }
  }
  
  // This allows updating stock directly if that's the only field sent
  if (stock !== undefined && !isNaN(stock) && stock >= 0) {
      updatePayload.stock = stock;
      updatePayload.isAvailable = stock > 0;
  }
  
  if (Object.keys(updatePayload).length === 0){
      return NextResponse.json({ success: false, message: "No valid fields to update." }, { status: 400 });
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, { $set: updatePayload }, { new: true });

  return NextResponse.json({
    success: true,
    message: 'Product updated successfully',
    product: updatedProduct
  });
}
