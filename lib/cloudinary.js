// Create this file at /lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to upload file to Cloudinary
export const uploadToCloudinary = async (file) => {
    try {
        // Convert the file to base64 string
        const fileBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(fileBuffer).toString('base64');

        // Create data URI
        const fileType = file.type;
        const dataURI = `data:${fileType};base64,${base64String}`;

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                dataURI,
                {
                    folder: 'babybear-products', // Your folder name in Cloudinary
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
        });

        return uploadResult;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Failed to upload image');
    }
};