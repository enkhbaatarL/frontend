import html2canvas from 'html2canvas'
import Pica from 'pica'

interface ImageConversionOptions {
  target: HTMLElement
  remove?: string[]
  imageSize?: {
    width?: number
    height?: number
  }
  padding?: number
}

/**
 * 이미지 URL을 base64로 변환하는 함수
 * @param imageUrl 변환할 이미지 URL
 * @returns Promise<string> 변환된 base64 문자열
 */
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

/**
 * HTML 요소를 고해상도 이미지(캔버스)로 변환하는 함수
 * @param options 변환 옵션
 * @returns Promise<HTMLCanvasElement> 변환된 캔버스 요소
 */
export const convertElementToImageCanvas = async ({
  target,
  remove = [],
  imageSize = {},
  padding = 0,
}: ImageConversionOptions): Promise<HTMLCanvasElement> => {
  const targetElement = target
  const originalRect = targetElement.getBoundingClientRect()

  // DOM 복제 및 스타일 설정
  const clonedElement = targetElement.cloneNode(true) as HTMLElement
  clonedElement.style.position = 'absolute'
  clonedElement.style.left = '-9999px'
  clonedElement.style.width = `${originalRect.width}px`
  clonedElement.style.height = `${originalRect.height}px`
  clonedElement.style.transform = 'none'
  clonedElement.style.transformOrigin = '0 0'
  document.body.appendChild(clonedElement)

  // 지정된 요소들 제거
  remove.forEach((selector) => {
    const elements = clonedElement.querySelectorAll(selector)
    elements.forEach((element) => element.remove())
  })

  // 캔버스 요소들을 고해상도로 변환
  const originalCanvases = targetElement.querySelectorAll('canvas')
  if (originalCanvases.length > 0) {
    originalCanvases.forEach((originalCanvas, index) => {
      const clonedCanvas = originalCanvas.cloneNode(true) as HTMLCanvasElement
      const clonedCanvasContext = clonedCanvas.getContext('2d')

      const scale = 4
      clonedCanvas.width = originalCanvas.width * scale
      clonedCanvas.height = originalCanvas.height * scale
      clonedCanvas.style.width = originalCanvas.style.width
      clonedCanvas.style.height = originalCanvas.style.height

      if (clonedCanvasContext) {
        clonedCanvasContext.scale(scale, scale)
        if (originalCanvas.width > 0 && originalCanvas.height > 0) {
          clonedCanvasContext.drawImage(originalCanvas, 0, 0)
        }
      }

      const clonedCanvasElements = clonedElement.querySelectorAll('canvas')
      if (clonedCanvasElements[index]) {
        clonedCanvasElements[index].parentNode?.replaceChild(clonedCanvas, clonedCanvasElements[index])
      }
    })
  }

  // html2canvas로 DOM을 캔버스로 변환
  const canvas = await html2canvas(clonedElement, {
    backgroundColor: '#FFFFFF',
    scale: 1,
    allowTaint: false,
    logging: false,
    useCORS: true,
    imageTimeout: 0,
    removeContainer: false,
    width: originalRect.width,
    height: originalRect.height,
  })

  // 복제된 요소 제거
  document.body.removeChild(clonedElement)

  // 최종 크기 계산
  let contentWidth: number
  let contentHeight: number

  if (!imageSize.width && !imageSize.height) {
    contentWidth = originalRect.width
    contentHeight = originalRect.height
  } else if (imageSize.width && !imageSize.height) {
    contentWidth = imageSize.width
    contentHeight = (canvas.height * contentWidth) / canvas.width
  } else if (!imageSize.width && imageSize.height) {
    contentHeight = imageSize.height
    contentWidth = (canvas.width * contentHeight) / canvas.height
  } else {
    contentWidth = imageSize.width!
    contentHeight = imageSize.height!
  }

  const totalWidth = contentWidth + padding * 2
  const totalHeight = contentHeight + padding * 2

  // 최종 캔버스 생성
  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = totalWidth
  resizedCanvas.height = totalHeight

  const pica = new Pica({
    features: ['js', 'wasm', 'cib'],
  })

  const ctx = resizedCanvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, totalWidth, totalHeight)
  }

  const finalTempCanvas = document.createElement('canvas')
  finalTempCanvas.width = contentWidth
  finalTempCanvas.height = contentHeight

  // Pica를 사용한 고품질 리사이징
  await pica.resize(canvas, finalTempCanvas, {
    unsharpAmount: 102,
    unsharpRadius: 1.5,
    unsharpThreshold: 255,
  })

  if (ctx) {
    if (finalTempCanvas && finalTempCanvas.width > 0 && finalTempCanvas.height > 0) {
      ctx.drawImage(finalTempCanvas, padding, padding)
    }
  }

  return resizedCanvas
}
