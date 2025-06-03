import { clerkClient } from '@clerk/nextjs/server';

const authSeller = async (userId) => {
    try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        return user.publicMetadata.role === 'seller';
    } catch (error) {
        console.error("Error checking seller auth:", error);
        return false; // Return false instead of NextResponse
    }   
}

export default authSeller;