import axios from "axios";

export const TELEGRAM_CONFIG = {
  BOT_TOKEN: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN,
  CHAT_ID: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
};

/**
 * Formats and sends an order notification to Telegram
 * @param {Object} orderDetails - Order information to send
 * @returns {Promise<Object>} - Result of the notification attempt
 */
export const sendTelegramNotification = async (orderDetails) => {
  try {
    if (!TELEGRAM_CONFIG.BOT_TOKEN || !TELEGRAM_CONFIG.CHAT_ID) {
      console.error("Missing Telegram configuration");
      return { success: false, error: "Missing Telegram configuration" };
    }

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;

    const itemsList = orderDetails.items
      .map(
        (item) =>
          `- ${item.productName} x${item.quantity} (${orderDetails.currency}${item.price.toFixed(2)} each)`
      )
      .join("\n");

    const promoCodeText =
      typeof orderDetails.promoCode === "string"
        ? orderDetails.promoCode
        : orderDetails.promoCode?.code;

    const message =
      `🐻 *BABY BEAR*\n\n` +
      `*Order ID:* ${String(orderDetails.orderId).slice(-6)}\n` +
      `*Date:* ${new Date().toLocaleString()}\n\n` +
      `*Delivery Address:*\n` +
      `${orderDetails.address.fullName}\n` +
      `0${orderDetails.address.phoneNumber}\n` +
      `${orderDetails.address.area}\n` +
      `${orderDetails.address.state}${
        orderDetails.address.city ? ", " + orderDetails.address.city : ""
      }\n\n` +
      `*Order Items:*\n${itemsList}\n\n` +
      `*Subtotal:* ${orderDetails.currency}${orderDetails.subtotal.toFixed(2)}\n` +
      (promoCodeText ? `*Promo Code:* ${promoCodeText}\n` : "") +
      (orderDetails.discount > 0
        ? `*Discount:* ${orderDetails.currency}${orderDetails.discount.toFixed(2)}\n`
        : "") +
      `*Delivery:* ${
        orderDetails.deliveryFee === 0
          ? "Free"
          : `${orderDetails.currency}${orderDetails.deliveryFee.toFixed(2)}`
      }\n` +
      `*Total Amount:* ${orderDetails.currency}${(orderDetails.total ?? orderDetails.amount).toFixed(2)}\n` +
      // --- MODIFICATION START ---
      `*Payment with:* ${orderDetails.paymentMethod}\n\n` +
      // --- MODIFICATION END ---
      `*Thanks for shopping with us! 📦*`;

    await axios.post(telegramApiUrl, {
      chat_id: TELEGRAM_CONFIG.CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });

    console.log("Telegram notification sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return { success: false, error };
  }
};