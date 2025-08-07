/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Increase the body size limit for file uploads
        bodyParser: {
            sizeLimit: '3mb', // Slightly higher than your 2MB limit
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**', // Fixed: should be '/**' not '**'
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '/**', // Fixed: should be '/**' not '**'
            },
        ],
        // Enable SVG support for trusted sources like Cloudinary
        dangerouslyAllowSVG: true,
        // Add Content Security Policy for SVG safety
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
};

export default nextConfig;