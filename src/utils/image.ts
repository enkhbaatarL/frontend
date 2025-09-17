export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('이미지를 base64로 변환하는 중 오류 발생:', error)
    return ''
  }
}
