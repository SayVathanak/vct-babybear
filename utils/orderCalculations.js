/**
 * Utility functions for consistent order calculations throughout the application
 */

/**
 * Calculate the delivery fee based on item count
 * @param {number} itemCount - Total number of items in the cart
 * @returns {number} - The delivery fee
 */
export const calculateDeliveryFee = (itemCount) => {
    return Number((itemCount > 1 ? 0 : 1.5).toFixed(2));
  };
  
  /**
   * Calculate the discount from a promo code
   * @param {Object} promoCode - The promo code object
   * @param {number} subtotal - The order subtotal
   * @returns {number} - The calculated discount amount
   */
  export const calculatePromoDiscount = (promoCode, subtotal) => {
    if (!promoCode) return 0;
  
    let discount = 0;
    
    if (promoCode.discountType === 'percentage') {
      // Ensure percentage is within valid range (0-100)
      const validPercentage = Math.min(Math.max(promoCode.discountValue, 0), 100);
      discount = (subtotal * validPercentage) / 100;
  
      // Apply maximum discount cap if specified
      if (promoCode.maxDiscountAmount && discount > promoCode.maxDiscountAmount) {
        discount = promoCode.maxDiscountAmount;
      }
    } else if (promoCode.discountType === 'fixed') {
      // For fixed discount, don't allow more than the subtotal
      discount = Math.min(promoCode.discountValue, subtotal);
    }
  
    return Number(discount.toFixed(2));
  };
  
  /**
   * Calculate all order amounts
   * @param {number} subtotal - The order subtotal
   * @param {number} deliveryFee - The delivery fee
   * @param {number} discount - The discount amount
   * @returns {Object} - The calculated order amounts
   */
  export const calculateOrderTotals = (subtotal, deliveryFee = 0, discount = 0) => {
    return {
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number((subtotal + deliveryFee - discount).toFixed(2))
    };
  };
  
  /**
   * Calculate the complete order summary
   * @param {Object} params - Parameters for order calculation
   * @param {Array} params.items - The order items
   * @param {Object} params.promoCode - The applied promo code (optional)
   * @returns {Object} - The complete order summary
   */
  export const calculateOrderSummary = ({ items, promoCode }) => {
    // Calculate item count
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    
    // Calculate subtotal
    const subtotal = Number(
      items.reduce((acc, item) => {
        const price = item.product.offerPrice || item.product.price;
        return acc + (price * item.quantity);
      }, 0).toFixed(2)
    );
    
    // Calculate delivery fee
    const deliveryFee = calculateDeliveryFee(itemCount);
    
    // Calculate discount
    const discount = calculatePromoDiscount(promoCode, subtotal);
    
    // Calculate totals
    const { total } = calculateOrderTotals(subtotal, deliveryFee, discount);
    
    return {
      itemCount,
      subtotal,
      deliveryFee,
      discount,
      total,
      promoCode
    };
  };