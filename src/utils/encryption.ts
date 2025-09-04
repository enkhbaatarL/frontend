const DEFAULT_ENCRYPTION_KEY = 'default-encryption-key'

export const simpleEncrypt = (text: string, key: string = DEFAULT_ENCRYPTION_KEY): string => {
  try {
    let result = ''

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i)
      const keyCharCode = key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode ^ keyCharCode)
    }

    return btoa(result)
  } catch (error) {
    console.error('Encryption failed:', error)
    return ''
  }
}

export const simpleDecrypt = (encryptedText: string, key: string = DEFAULT_ENCRYPTION_KEY): string => {
  try {
    const text = atob(encryptedText)
    let result = ''

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i)
      const keyCharCode = key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode ^ keyCharCode)
    }

    return result
  } catch (error) {
    console.error('Decryption failed:', error)
    return ''
  }
}
