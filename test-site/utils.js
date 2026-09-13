/**
 * Utility functions for test-site
 */

/**
 * Add two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * Calculate discount price
 * @param {number} price - Original price
 * @param {number} discountPercent - Discount percentage (0-100)
 * @returns {number} Final price after discount
 */
function calculateDiscount(price, discountPercent) {
  if (price < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new Error("Invalid input");
  }
  return price - (price * discountPercent) / 100;
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Format user data
 * @param {Object} user - User object with id, name, email
 * @returns {string} Formatted user string
 */
function formatUserData(user) {
  if (!user || !user.id || !user.name || !user.email) {
    return "Invalid user data";
  }
  return `${user.name} (${user.email}) - ID: ${user.id}`;
}

module.exports = {
  add,
  calculateDiscount,
  isValidEmail,
  formatUserData,
};
