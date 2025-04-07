import { Resend } from 'resend';
import { OrderConfirmationEmail } from '../emails/OrderConfirmationEmail';
import { render } from '@react-email/render';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrderConfirmationEmail = async ({ user, orderDetails }) => {
  try {
    const emailHtml = render(OrderConfirmationEmail({ 
      user, 
      orderDetails 
    }));

    const { data, error } = await resend.emails.send({
      from: 'saksovathanaksay@gmail.com',
      to: user.email,
      subject: `Order Confirmation #${orderDetails.orderId}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};