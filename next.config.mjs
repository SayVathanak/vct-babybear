/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**', // Allows any path under this hostname
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**', // Allows any path under this hostname
            },
            { // Added for placehold.co
                protocol: 'https',
                hostname: 'placehold.co',
                pathname: '/**', // Allows any path under this hostname (using '/**' which is also common)
            },
        ],
    },
};

export default nextConfig;