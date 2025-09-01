import html2canvas from 'html2canvas'
import Pica from 'pica'

interface ChartDownloadOptions {
  filename: string
  target: HTMLElement
  remove?: string[]
  imageSize?: {
    width?: number
    height?: number
  }
  padding?: number
}

export const downloadChart = async ({ filename = 'chart.png', target, remove = [], imageSize = {}, padding = 0 }: ChartDownloadOptions) => {
  try {
    const targetElement = target
    const finalFilename = filename.endsWith('.png') ? filename : `${filename}.png`

    const clonedElement = targetElement.cloneNode(true) as HTMLElement
    const originalRect = targetElement.getBoundingClientRect()

    clonedElement.style.position = 'absolute'
    clonedElement.style.left = '-9999px'
    clonedElement.style.width = `${originalRect.width}px`
    clonedElement.style.height = `${originalRect.height}px`
    clonedElement.style.transform = 'none'
    clonedElement.style.transformOrigin = '0 0'
    document.body.appendChild(clonedElement)

    remove.forEach((selector) => {
      const elements = clonedElement.querySelectorAll(selector)
      elements.forEach((element) => element.remove())
    })

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

    document.body.removeChild(clonedElement)

    const resizedCanvas = document.createElement('canvas')

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

    const link = document.createElement('a')
    link.download = finalFilename
    link.href = resizedCanvas.toDataURL('image/png', 1.0)
    link.click()
  } catch (error) {
    console.error('차트 다운로드 중 오류 발생:', error)
  }
}
