import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const authSeller = async (userId) => {
    try {

        const client = await clerkClient()
        const user = await client.users.getUser(userId)

        if (user.publicMetadata.role === 'seller') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

export default authSeller;

// import { clerkClient } from '@clerk/nextjs/server';

// const authSeller = async (userId) => {
//     try {
//         const client = await clerkClient();
//         const user = await client.users.getUser(userId);

//         return user.publicMetadata.role === 'seller';
//     } catch (error) {
//         console.error("Error checking seller auth:", error);
//         return false; // Return false instead of NextResponse
//     }   
// }

// export default authSeller;

