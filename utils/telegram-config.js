// telegram-config.js
// Configuration for Telegram notifications
import axios from "axios";

/**
 * This file manages Telegram bot configuration
 * IMPORTANT: Never commit actual tokens to version control!
 * Use environment variables in production and local .env files for development
 */

// Get Telegram configuration from environment variables
export const TELEGRAM_CONFIG = {
  BOT_TOKEN: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN,
  CHAT_ID: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID
};

/**
 * Formats and sends an order notification to Telegram
 * @param {Object} orderDetails - Order information to send
 * @returns {Promise<Object>} - Result of the notification attempt
 */
export const sendTelegramNotification = async (orderDetails) => {
  try {
    // Make sure we have the required configuration
    if (!TELEGRAM_CONFIG.BOT_TOKEN || !TELEGRAM_CONFIG.CHAT_ID) {
      console.error("Missing Telegram configuration");
      return { success: false, error: "Missing Telegram configuration" };
    }

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;
    
    // Format the order items for better readability
    const itemsList = orderDetails.items
      .map(item => `- ${item.productName} x${item.quantity} (${orderDetails.currency}${item.price} each)`)
      .join('\n');
    
    // Create a well-formatted message
    const message = `🐻 *BABY BEAR*\n\n` +
      // `*Order ID:* ${orderDetails.orderId}\n` +
      `*Order ID:* ${String(orderDetails.orderId).slice(-6)}\n` +
      `*Date:* ${new Date().toLocaleString()}\n\n` +
      `*Delivery Address:*\n` +
      `${orderDetails.address.fullName}\n` +
      `${orderDetails.address.phoneNumber}\n` +
      `${orderDetails.address.area}\n` +
      `${orderDetails.address.state}${orderDetails.address.city ? ', ' + orderDetails.address.city : ''}\n\n` +
      `*Order Items:*\n${itemsList}\n\n` +
      `*Subtotal:* ${orderDetails.currency}${orderDetails.subtotal}\n` +
      `*Delivery:* ${orderDetails.deliveryFee === 0 ? 'Free' : `${orderDetails.currency}${orderDetails.deliveryFee}`}\n` +
      `*Total Amount:* ${orderDetails.currency}${orderDetails.total}\n` +
      `*Thanks for shopping with us! 📦*`;
    
    // Send message to Telegram
    const response = await axios.post(telegramApiUrl, {
      chat_id: TELEGRAM_CONFIG.CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    
    console.log("Telegram notification sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return { success: false, error };
  }
};