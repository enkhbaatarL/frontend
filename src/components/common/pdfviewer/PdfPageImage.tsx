import { Box, CircularProgress, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, MouseEvent, useRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import queryClient from '@/lib/queryClient'
import pdfService from '@/service/common/pdf'

interface PdfPageImageProps {
  currentPage: number
  numberOfImages: number
  zoomLevel: number
}

// 페이지 이미지 URL을 전역적으로 관리하는 객체
const imageUrlCache: Record<string, string> = {}

const PDF_IMAGE_STALE_TIME = 1000 * 60 * 30 // PDF 이미지 캐시 유효 시간 (30분)
const INITIAL_PADDING = 32

// 컨텍스트 메뉴(오른쪽 클릭) 방지
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  return false
}

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

const PdfPageImage = ({ currentPage, numberOfImages, zoomLevel }: PdfPageImageProps) => {
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
        if (!initialImageInfo) {
          const { width: containerWidth, height: containerHeight } = imageWrapperRef.current?.parentElement?.getBoundingClientRect() ?? {
            width: 0,
            height: 0,
          }
          const imageType = img.width > img.height ? 'landscape' : 'portrait'

          // 세로기준 기본값 설정
          let imageWrapperHeight = Math.max(Math.floor(containerHeight - INITIAL_PADDING * 2), 0)
          let imageWrapperWidth = Math.max(Math.floor(imageWrapperHeight * (img.width / img.height)), 0)

          if (imageType === 'landscape') {
            imageWrapperWidth = Math.max(Math.floor(containerWidth - INITIAL_PADDING * 2), 0)
            imageWrapperHeight = Math.max(Math.floor(imageWrapperWidth * (img.height / img.width)), 0)
          }

          canvas.width = imageWrapperWidth
          canvas.height = imageWrapperHeight

          setInitialImageInfo({
            width: imageWrapperWidth,
            height: imageWrapperHeight,
          })
        } else {
          canvas.width = initialImageInfo.width
          canvas.height = initialImageInfo.height
        }

        context?.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
    }
  }, [imageUrl, initialImageInfo])

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
          <Typography variant="body1R16" color="gray.40">
            {t('페이지를 불러오는데 실패했습니다.')}
          </Typography>
        </Box>
      )}
      {imageUrl && !isLoading && !error && (
        <Box
          ref={imageWrapperRef}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-out',
            userSelect: 'none',
          }}
          onContextMenu={handleContextMenu}
        >
          <canvas ref={canvasRef} className="shadow-lg bg-white" />
        </Box>
      )}
    </>
  )
}

export default PdfPageImage
