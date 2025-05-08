/**
 * Formats a number as a price with currency symbol, thousands separators, and 2 decimal places
 * @param {number} amount - The price amount to format
 * @param {string} [currencySymbol='$'] - Currency symbol to prepend (default: $)
 * @param {string} [locale='en-US'] - The locale to use for number formatting
 * @returns {string} The formatted price string
 */
export const formatPrice = (amount: number, currencySymbol = '', locale = 'en-US') => {
  // Round to 2 decimal places (standard for currency)
  const roundedAmount = Math.round(amount * 100) / 100

  // Format the number according to locale with 2 decimal places
  const formattedNumber = roundedAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Return with currency symbol
  return `${currencySymbol}${formattedNumber}`
}
