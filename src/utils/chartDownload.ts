import { convertElementToImageCanvas } from './image'

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

/**
 * 캔버스를 이미지 데이터 URL로 변환하는 함수
 * @param canvas 변환할 캔버스 요소
 * @param format 이미지 포맷 (기본값: 'image/png')
 * @param quality 이미지 품질 (0-1, 기본값: 1.0)
 * @returns 이미지 데이터 URL
 */
export const canvasToDataURL = (canvas: HTMLCanvasElement, format: string = 'image/png', quality: number = 1.0): string =>
  canvas.toDataURL(format, quality)

/**
 * 캔버스를 Blob으로 변환하는 함수
 * @param canvas 변환할 캔버스 요소
 * @param format 이미지 포맷 (기본값: 'image/png')
 * @param quality 이미지 품질 (0-1, 기본값: 1.0)
 * @returns Promise<Blob> 변환된 Blob
 */
export const canvasToBlob = (canvas: HTMLCanvasElement, format: string = 'image/png', quality: number = 1.0): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas to Blob conversion failed'))), format, quality)
  })

/**
 * HTML 요소를 이미지로 변환하고 다운로드하는 함수
 * @param options 다운로드 옵션
 */
export const downloadChart = async ({ filename = 'chart.png', target, remove = [], imageSize = {}, padding = 0 }: ChartDownloadOptions) => {
  try {
    const finalFilename = filename.endsWith('.png') ? filename : `${filename}.png`

    const canvas = await convertElementToImageCanvas({
      target,
      remove,
      imageSize,
      padding,
    })

    const link = document.createElement('a')
    link.download = finalFilename
    link.href = canvasToDataURL(canvas, 'image/png', 1.0)
    link.click()
  } catch (error) {
    console.error('차트 다운로드 중 오류 발생:', error)
  }
}
