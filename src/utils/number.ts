/**
 * Formats a number as a value with currency symbol, thousands separators, and specified decimal places
 * @param {number} amount - The value amount to format
 * @param {string} [currencySymbol='$'] - Currency symbol to prepend (default: $)
 * @param {string} [locale='en-US'] - The locale to use for number formatting
 * @param {number} [toFixed=2] - Number of decimal places (default: 2)
 * @returns {string} The formatted value string
 */
export const formatValue = (amount: number, currencySymbol = '', locale = 'en-US', toFixed = 2) => {
  // Round to specified decimal places
  const roundedAmount = Math.round(amount * Math.pow(10, toFixed)) / Math.pow(10, toFixed)

  // Format the number according to locale with specified decimal places
  const formattedNumber = roundedAmount.toLocaleString(locale, {
    minimumFractionDigits: toFixed,
    maximumFractionDigits: toFixed,
  })

  // Return with currency symbol
  return `${currencySymbol}${formattedNumber}`
}

/**
 * Formats an integer number to decimal string
 * @param {number} num - The number to format
 * @returns {string} The formatted decimal string
 */

export const formatNumberToDecimal = (num: number) => {
  // Convert the number to a string with one decimal place
  let formatted = num.toFixed(1) // Add a plus sign for positive numbers

  if (num > 0) {
    formatted = `+${formatted}`
  }

  return formatted
}
