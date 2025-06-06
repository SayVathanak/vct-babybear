import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { uploadToCloudinary } from "@/lib/cloudinary";

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
      return NextResponse.json({ success: false, message: "Not Authorized" }, { status: 403 });
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
      const barcode = formData.get("barcode");

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
        barcode,
        existingImages,
        newImageFiles
      };
    } else {
      // Handle JSON request for simple updates
      requestData = await request.json();
    }

    // Connect to the database
    await connectDB();

    // Validate barcode uniqueness if provided
    if (requestData.barcode && requestData.barcode.trim()) {
      const trimmedBarcode = requestData.barcode.trim();
      
      // Check if another product already has this barcode
      const existingProduct = await Product.findOne({ 
        barcode: trimmedBarcode,
        _id: { $ne: requestData._id || requestData.productId } 
      });

      if (existingProduct) {
        return NextResponse.json({
          success: false,
          message: "This barcode is already assigned to another product",
          field: "barcode"
        }, { status: 409 });
      }
    }

    // Determine the type of update based on provided fields
    const hasFullEditFields = 'name' in requestData && 'description' in requestData;
    const hasQuickEditFields = 'name' in requestData && !('description' in requestData);
    const hasAvailabilityOnly = 'productId' in requestData && Object.keys(requestData).length <= 3; // productId, isAvailable, and possibly barcode

    if (hasFullEditFields) {
      // Handle full edit with description and possibly images
      return await handleFullEdit(requestData);
    } else if (hasQuickEditFields) {
      // Handle quick edit functionality
      return await handleQuickEdit(requestData);
    } else {
      // Handle simple availability update or partial updates
      return await handlePartialUpdate(requestData);
    }

  } catch (error) {
    console.error("Error in PUT route:", error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000 && error.keyPattern?.barcode) {
      return NextResponse.json({
        success: false,
        message: "This barcode is already assigned to another product",
        field: "barcode"
      }, { status: 409 });
    }

    return NextResponse.json({ 
      success: false, 
      message: error.message || "An unexpected error occurred" 
    }, { status: 500 });
  }
}

// Helper function for full edit operations
async function handleFullEdit(requestData) {
  const {
    _id,
    name,
    price,
    offerPrice,
    category,
    isAvailable,
    description,
    barcode,
    existingImages,
    newImageFiles
  } = requestData;

  if (!_id) {
    return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
  }

  // Validate required fields
  if (!name || !price || !offerPrice || !category || !description) {
    return NextResponse.json({
      success: false,
      message: "Name, price, offer price, category, and description are required"
    }, { status: 400 });
  }

  // Additional validation
  if (price < 0 || offerPrice < 0) {
    return NextResponse.json({
      success: false,
      message: "Price and offer price must be non-negative"
    }, { status: 400 });
  }

  if (offerPrice > price) {
    return NextResponse.json({
      success: false,
      message: "Offer price cannot be greater than regular price"
    }, { status: 400 });
  }

  // Find the product
  const product = await Product.findById(_id);

  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  // Process image uploads (if any)
  let finalImageUrls = [...(existingImages || [])];

  if (newImageFiles && newImageFiles.length > 0) {
    try {
      const uploadPromises = newImageFiles.map(file => uploadToCloudinary(file));
      const uploadResults = await Promise.all(uploadPromises);
      const newImageUrls = uploadResults.map(result => result.secure_url);
      finalImageUrls = [...finalImageUrls, ...newImageUrls];
    } catch (uploadError) {
      return NextResponse.json({
        success: false,
        message: "Failed to upload images"
      }, { status: 500 });
    }
  }

  // Update product with all fields
  product.name = name;
  product.price = price;
  product.offerPrice = offerPrice;
  product.category = category;
  product.isAvailable = isAvailable;
  product.description = description;
  product.image = finalImageUrls;
  
  // Update barcode (can be empty string to remove barcode)
  if (barcode !== undefined) {
    product.barcode = barcode.trim() || null;
  }

  await product.save();

  return NextResponse.json({
    success: true,
    message: "Product updated successfully",
    product
  });
}

// Helper function for quick edit operations
async function handleQuickEdit(requestData) {
  const { _id, name, price, offerPrice, category, isAvailable, barcode } = requestData;

  if (!_id) {
    return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
  }

  // Validate required fields
  if (!name || price === undefined || offerPrice === undefined || !category) {
    return NextResponse.json({
      success: false,
      message: "Name, price, offer price, and category are required"
    }, { status: 400 });
  }

  // Additional validation
  if (price < 0 || offerPrice < 0) {
    return NextResponse.json({
      success: false,
      message: "Price and offer price must be non-negative"
    }, { status: 400 });
  }

  if (offerPrice > price) {
    return NextResponse.json({
      success: false,
      message: "Offer price cannot be greater than regular price"
    }, { status: 400 });
  }

  // Find the product
  const product = await Product.findById(_id);

  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  // Update product with quick edit fields
  product.name = name;
  product.price = price;
  product.offerPrice = offerPrice;
  product.category = category;
  
  if (isAvailable !== undefined) {
    product.isAvailable = isAvailable;
  }

  // Update barcode if provided
  if (barcode !== undefined) {
    product.barcode = barcode.trim() || null;
  }

  await product.save();

  return NextResponse.json({
    success: true,
    message: "Product updated successfully",
    product
  });
}

// Helper function for partial updates (including availability-only updates)
async function handlePartialUpdate(requestData) {
  const { productId, _id, isAvailable, barcode, name, price, offerPrice, category } = requestData;
  
  const id = productId || _id;
  
  if (!id) {
    return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
  }

  // Find the product
  const product = await Product.findById(id);

  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  // Track what fields are being updated
  const updatedFields = [];

  // Update availability if provided
  if (isAvailable !== undefined) {
    product.isAvailable = isAvailable;
    updatedFields.push(`availability (${isAvailable ? 'available' : 'unavailable'})`);
  }

  // Update barcode if provided
  if (barcode !== undefined) {
    product.barcode = barcode.trim() || null;
    updatedFields.push('barcode');
  }

  // Update other fields if provided
  if (name !== undefined) {
    if (!name.trim()) {
      return NextResponse.json({
        success: false,
        message: "Product name cannot be empty"
      }, { status: 400 });
    }
    product.name = name;
    updatedFields.push('name');
  }

  if (price !== undefined) {
    if (price < 0) {
      return NextResponse.json({
        success: false,
        message: "Price must be non-negative"
      }, { status: 400 });
    }
    product.price = price;
    updatedFields.push('price');
  }

  if (offerPrice !== undefined) {
    if (offerPrice < 0) {
      return NextResponse.json({
        success: false,
        message: "Offer price must be non-negative"
      }, { status: 400 });
    }
    if (price !== undefined && offerPrice > price) {
      return NextResponse.json({
        success: false,
        message: "Offer price cannot be greater than regular price"
      }, { status: 400 });
    }
    if (price === undefined && offerPrice > product.price) {
      return NextResponse.json({
        success: false,
        message: "Offer price cannot be greater than regular price"
      }, { status: 400 });
    }
    product.offerPrice = offerPrice;
    updatedFields.push('offer price');
  }

  if (category !== undefined) {
    if (!category.trim()) {
      return NextResponse.json({
        success: false,
        message: "Category cannot be empty"
      }, { status: 400 });
    }
    product.category = category;
    updatedFields.push('category');
  }

  await product.save();

  const message = updatedFields.length > 0 
    ? `Product ${updatedFields.join(', ')} updated successfully`
    : 'Product updated successfully';

  return NextResponse.json({
    success: true,
    message,
    product
  });
}