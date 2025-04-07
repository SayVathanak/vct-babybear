import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/components/email/OrderConfirmationEmail';
import { render } from '@react-email/render';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrderConfirmationEmail = async ({ user, orderDetails }) => {
  try {
    // Ensure numeric values for calculations
    const numericOrderDetails = {
      ...orderDetails,
      subtotal: Number(orderDetails.subtotal),
      deliveryFee: Number(orderDetails.deliveryFee),
      total: Number(orderDetails.total),
      items: orderDetails.items.map(item => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity)
      }))
    };

    const emailHtml = render(OrderConfirmationEmail({ 
      user, 
      orderDetails: numericOrderDetails 
    }));

    console.log('Sending email to:', user.email);
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'saksovathanaksay@gmail.com',
      subject: `Your Baby Bear Order #${orderDetails.orderId} is Confirmed!`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};