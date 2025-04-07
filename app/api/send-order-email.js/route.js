import { sendOrderConfirmationEmail } from '../../services/emailService';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication with Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { user, orderDetails } = req.body;

    // Validate required data
    if (!user.email || !orderDetails || !orderDetails.orderId) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    // Send the email
    const result = await sendOrderConfirmationEmail({
      user,
      orderDetails
    });

    if (!result.success) {
      return res.status(500).json({ 
        message: 'Failed to send email',
        error: result.error
      });
    }

    return res.status(200).json({ 
      message: 'Email sent successfully',
      emailId: result.data?.id 
    });
  } catch (error) {
    console.error('Error in send-order-email API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}