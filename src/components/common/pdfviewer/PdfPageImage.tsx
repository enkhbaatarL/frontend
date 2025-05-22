import { Box, CircularProgress, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useParams } from 'react-router-dom'

import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import queryClient from '@/lib/queryClient'
import pdfService from '@/service/common/pdf'
import { disableContextMenu } from '@/utils/mouse'

interface PdfPageImageProps {
  currentPage: number
  numberOfImages: number
  zoomLevel: number
  initialPadding: number
  viewPosition?: { x: number; y: number }
}

export interface PdfPageImageHandles {
  getInitialCanvasSize: () => { width: number; height: number } | null
}

// 페이지 이미지 URL을 전역적으로 관리하는 객체
const imageUrlCache: Record<string, string> = {}

const PDF_IMAGE_STALE_TIME = 1000 * 60 * 30 // PDF 이미지 캐시 유효 시간 (30분)

const fetchPdfImage = async (fileId: string | number, page: number): Promise<string> => {
  const cacheKey = `${fileId}-${page}`

  // 캐시에 있으면 재사용
  if (imageUrlCache[cacheKey]) {
    return imageUrlCache[cacheKey]
  }

  const url = await pdfService.getPdfImage(Number(fileId), page)
  imageUrlCache[cacheKey] = url
  return url
}

const PdfPageImage = forwardRef<PdfPageImageHandles, PdfPageImageProps>(
  ({ currentPage, numberOfImages, zoomLevel, initialPadding, viewPosition = { x: 0, y: 0 } }, ref) => {
    const { fileId } = useParams()

    const imageWrapperRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [initialImageInfo, setInitialImageInfo] = useState<{
      width: number
      height: number
    } | null>(null)

    // 현재 페이지 이미지 조회
    const {
      data: imageUrl,
      isLoading,
      error,
    } = useQuery({
      queryKey: ['pdfImage', fileId, currentPage],
      queryFn: () => fetchPdfImage(fileId!, currentPage),
      staleTime: PDF_IMAGE_STALE_TIME,
    })

    useImperativeHandle(
      ref,
      () => ({
        getInitialCanvasSize: () => initialImageInfo,
      }),
      [initialImageInfo],
    )

    const prefetchNeighborPages = useCallback(() => {
      const pagesToPrefetch: number[] = []

      // 현재 페이지 기준 앞뒤로 2장씩 미리 로드
      for (let i = 1; i <= 2; i++) {
        if (currentPage - i > 0) {
          pagesToPrefetch.push(currentPage - i)
        }
        if (currentPage + i <= numberOfImages) {
          pagesToPrefetch.push(currentPage + i)
        }
      }

      if (pagesToPrefetch.length > 0) {
        pagesToPrefetch.forEach(async (page) => {
          await queryClient.prefetchQuery({
            queryKey: ['pdfImage', fileId, page],
            queryFn: () => fetchPdfImage(fileId!, page),
            staleTime: PDF_IMAGE_STALE_TIME,
          })
        })
      }
    }, [currentPage, fileId, numberOfImages])

    // 페이지가 변경되면 주변 페이지 미리 로드
    useEffect(() => {
      prefetchNeighborPages()
    }, [currentPage, prefetchNeighborPages])

    useEffect(() => {
      const canvas = canvasRef.current

      if (canvas && imageUrl) {
        const context = canvas.getContext('2d')
        const img = new Image()
        img.src = imageUrl

        img.onload = () => {
          if (initialImageInfo) {
            canvas.width = initialImageInfo.width
            canvas.height = initialImageInfo.height
          } else {
            // 화면에 보이는 영역을 초기 배율(100%)로 설정
            const parentElement = imageWrapperRef.current?.parentElement

            if (!parentElement) {
              canvas.width = 0
              canvas.height = 0
              setInitialImageInfo({ width: 0, height: 0 })
              console.error('Parent element not found for size calculation.')
              return
            }

            const { width: viewportWidth, height: viewportHeight } = parentElement.getBoundingClientRect()
            const targetContainerWidth = Math.max(0, viewportWidth - initialPadding * 2)
            const targetContainerHeight = Math.max(0, viewportHeight - initialPadding * 2)

            let imageWrapperWidth = 0
            let imageWrapperHeight = 0

            const originalImageWidth = img.width
            const originalImageHeight = img.height

            if (originalImageWidth > 0 && originalImageHeight > 0 && targetContainerWidth > 0 && targetContainerHeight > 0) {
              const widthRatio = targetContainerWidth / originalImageWidth
              const heightRatio = targetContainerHeight / originalImageHeight
              const finalRatio = Math.min(widthRatio, heightRatio)
              imageWrapperWidth = Math.floor(originalImageWidth * finalRatio)
              imageWrapperHeight = Math.floor(originalImageHeight * finalRatio)
            }

            canvas.width = imageWrapperWidth
            canvas.height = imageWrapperHeight

            setInitialImageInfo({
              width: imageWrapperWidth,
              height: imageWrapperHeight,
            })
          }

          context?.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
      }
    }, [imageUrl, initialImageInfo, initialPadding])

    return (
      <>
        {isLoading && (
          <Box display="flex" sx={{ userSelect: 'none' }}>
            <CircularProgress sx={{ color: 'gray.40' }} />
          </Box>
        )}
        {error && (
          <Box display="flex" flexDirection="column" gap="10px" alignItems="center" sx={{ userSelect: 'none' }}>
            <ErrorOutlineIcon fontSize={24} />
            <Typography variant="body1R16" color="gray.50">
              {t('페이지를 불러오는데 실패했습니다.')}
            </Typography>
          </Box>
        )}
        {imageUrl && !isLoading && !error && (
          <Box
            ref={imageWrapperRef}
            style={{
              transform: `translate(${viewPosition.x}px, ${viewPosition.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease-out',
              userSelect: 'none',
            }}
            onContextMenu={disableContextMenu}
          >
            <canvas ref={canvasRef} className="shadow-lg bg-white" />
          </Box>
        )}
      </>
    )
  },
)

PdfPageImage.displayName = 'PdfPageImage'

export default PdfPageImage
