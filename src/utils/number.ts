/**
 * Formats a number as a value with currency symbol, thousands separators, and specified decimal places
 * @param {number | null | undefined} amount - The value amount to format
 * @param {string} [currencySymbol=''] - Currency symbol to prepend
 * @param {string} [locale='en-US'] - The locale to use for number formatting
 * @param {number} [toFixed] - Number of decimal places. When omitted, displays full precision from the source.
 * @param {string} [fallback] - When provided, used as replacement when amount is null or undefined. When omitted, runs normal formatting.
 * @returns {string} The formatted value string
 */
export const formatValue = (
  amount: number | null | undefined,
  currencySymbol: string = '',
  locale: string = 'en-US',
  toFixed?: number,
  fallback?: string,
): string => {
  if (fallback !== undefined && (amount === null || amount === undefined)) {
    return fallback
  }

  const value = amount ?? NaN

  let formattedNumber: string

  if (toFixed !== undefined) {
    // Round to specified decimal places
    const roundedAmount = Math.round(value * Math.pow(10, toFixed)) / Math.pow(10, toFixed)
    formattedNumber = roundedAmount.toLocaleString(locale, {
      minimumFractionDigits: toFixed,
      maximumFractionDigits: toFixed,
    })
  } else {
    // Display with full precision (no decimal restriction)
    formattedNumber = value.toLocaleString(locale, {
      maximumFractionDigits: 20,
    })
  }

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
