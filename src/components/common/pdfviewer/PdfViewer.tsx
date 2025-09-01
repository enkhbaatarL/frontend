import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FitScreenIcon from '@mui/icons-material/FitScreenOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { ChangeEvent, useEffect, useRef, useState, KeyboardEvent, MouseEvent, useCallback } from 'react'

import MIButtonPdf from '@/components/common/button/MIButtonPdf'
import MILine from '@/components/common/divider/MILine'
import PdfPageImage, { PdfPageImageHandles } from '@/components/common/pdfviewer/PdfPageImage'
import { PdfMetadata } from '@/service/common/pdf'
import { formatFileSize } from '@/utils/dataUtil'

interface PdfViewerProps {
  metadata: PdfMetadata
}

interface Position {
  x: number
  y: number
}

interface ViewLimits {
  leftLimit: number
  rightLimit: number
  topLimit: number
  bottomLimit: number
}

interface CanvasInfo {
  containerWidth: number
  containerHeight: number
  scaledWidth: number
  scaledHeight: number
}

const MIN_ZOOM_LEVEL = 30
const MAX_ZOOM_LEVEL = 500

const INITIAL_PADDING = 32
const SIDEBAR_WIDTH = 180

const MIN_VISIBLE_PX = 150

const WHEEL_SCROLL_SPEED = 40
const HORIZONTAL_WHEEL_SCROLL_SPEED = 14
const WHEEL_ZOOM_STEP = 20

const PdfViewer = ({ metadata }: Readonly<PdfViewerProps>) => {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [inputValue, setInputValue] = useState<string>(currentPage.toString())
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [zoomInputValue, setZoomInputValue] = useState<string>(zoomLevel.toFixed(0))
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const pdfPageImageRef = useRef<PdfPageImageHandles>(null)

  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  const [viewPosition, setViewPosition] = useState<Position>({ x: 0, y: 0 })

  // 제한 범위 계산
  const calculateViewLimits = useCallback(
    (containerWidth: number, containerHeight: number, scaledWidth: number, scaledHeight: number): ViewLimits => ({
      rightLimit: containerWidth / 2 + scaledWidth / 2 - MIN_VISIBLE_PX,
      bottomLimit: containerHeight / 2 + scaledHeight / 2 - MIN_VISIBLE_PX,
      leftLimit: -(containerWidth / 2 + scaledWidth / 2 - MIN_VISIBLE_PX),
      topLimit: -(containerHeight / 2 + scaledHeight / 2 - MIN_VISIBLE_PX),
    }),
    [],
  )

  const getCanvasInfo = useCallback((): CanvasInfo | null => {
    const imageContainer = imageContainerRef.current
    const initialCanvasSize = pdfPageImageRef.current?.getInitialCanvasSize()

    if (imageContainer && initialCanvasSize) {
      const containerRect = imageContainer.getBoundingClientRect()
      return {
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        scaledWidth: initialCanvasSize.width * (zoomLevel / 100),
        scaledHeight: initialCanvasSize.height * (zoomLevel / 100),
      }
    }
    return null
  }, [zoomLevel])

  // 위치 값을 제한 범위 내로 조정
  const adjustPositionWithinLimits = useCallback(
    (position: Position): Position => {
      const canvasInfo = getCanvasInfo()

      if (!canvasInfo) return position

      const { containerWidth, containerHeight, scaledWidth, scaledHeight } = canvasInfo
      const { leftLimit, rightLimit, topLimit, bottomLimit } = calculateViewLimits(
        containerWidth,
        containerHeight,
        scaledWidth,
        scaledHeight,
      )

      return {
        x: Math.max(leftLimit, Math.min(position.x, rightLimit)),
        y: Math.max(topLimit, Math.min(position.y, bottomLimit)),
      }
    },
    [calculateViewLimits, getCanvasInfo],
  )

  // 이미지가 화면 범위를 벗어나지 않도록 보정
  const adjustViewPositionForZoom = useCallback(() => {
    const adjustedPosition = adjustPositionWithinLimits(viewPosition)

    if (adjustedPosition.x !== viewPosition.x || adjustedPosition.y !== viewPosition.y) {
      setViewPosition(adjustedPosition)
    }
  }, [viewPosition, adjustPositionWithinLimits])

  useEffect(() => {
    setInputValue(currentPage.toString())
  }, [currentPage])

  useEffect(() => {
    setZoomInputValue(zoomLevel.toFixed(0))
    adjustViewPositionForZoom()
  }, [zoomLevel, adjustViewPositionForZoom])

  const handleApplyPageChange = () => {
    let newPage = parseInt(inputValue, 10)

    if (isNaN(newPage)) {
      setInputValue(currentPage.toString())
      return
    }

    if (newPage < 1) {
      newPage = 1
    } else if (newPage > metadata.numberOfImages) {
      newPage = metadata.numberOfImages
    }

    if (newPage !== currentPage) {
      setCurrentPage(newPage)
    }
    setInputValue(newPage.toString())
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleApplyPageChange()
    }
  }

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev < metadata.numberOfImages ? prev + 1 : prev))
  }

  const handleZoomInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setZoomInputValue(event.target.value)
  }

  const handleApplyZoom = () => {
    let newZoom = parseInt(zoomInputValue, 10)
    if (isNaN(newZoom)) {
      setZoomInputValue(zoomLevel.toString())
      return
    }
    if (newZoom < MIN_ZOOM_LEVEL) {
      newZoom = MIN_ZOOM_LEVEL
    } else if (newZoom > MAX_ZOOM_LEVEL) {
      newZoom = MAX_ZOOM_LEVEL
    }
    setZoomLevel(newZoom)
  }

  const handleZoomInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleApplyZoom()
      event.preventDefault()
    }
  }

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, MAX_ZOOM_LEVEL))
  }

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, MIN_ZOOM_LEVEL))
  }

  const setFitZoom = () => {
    const canvasInfo = getCanvasInfo()

    if (!canvasInfo) return

    const { containerWidth, containerHeight } = canvasInfo
    const initialCanvasSize = pdfPageImageRef.current?.getInitialCanvasSize()

    if (!initialCanvasSize || initialCanvasSize.width <= 0 || initialCanvasSize.height <= 0) {
      setZoomLevel(100)
      return
    }

    const targetContainerWidth = Math.max(0, containerWidth - INITIAL_PADDING * 2)
    const targetContainerHeight = Math.max(0, containerHeight - INITIAL_PADDING * 2)

    if (targetContainerWidth <= 0 || targetContainerHeight <= 0) {
      setZoomLevel(100)
      return
    }

    // 100% 줌 상태를 기준으로 현재 컨테이너에 맞추기 위한 비율 계산
    const widthRatio = targetContainerWidth / initialCanvasSize.width
    const heightRatio = targetContainerHeight / initialCanvasSize.height

    let newZoomLevel = Math.min(widthRatio, heightRatio) * 100
    newZoomLevel = Math.max(MIN_ZOOM_LEVEL, Math.min(newZoomLevel, MAX_ZOOM_LEVEL))

    setZoomLevel(newZoomLevel)
    setViewPosition({ x: 0, y: 0 })
  }

  const updatePositionWithLimits = useCallback(
    (newPosition: Position) => {
      const adjustedPosition = adjustPositionWithinLimits(newPosition)
      setViewPosition(adjustedPosition)
    },
    [adjustPositionWithinLimits],
  )

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // 좌 or 휠 클릭
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })

      if (imageContainerRef.current) {
        imageContainerRef.current.style.cursor = 'grabbing'
      }
    }
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.preventDefault()
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y

      updatePositionWithLimits({
        x: viewPosition.x + dx,
        y: viewPosition.y + dy,
      })

      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (imageContainerRef.current) {
      imageContainerRef.current.style.cursor = 'grab'
    }
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      if (imageContainerRef.current) {
        imageContainerRef.current.style.cursor = 'grab'
      }
    }
  }

  // 마우스 휠
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      const isHorizontalWheel = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5

      // Ctrl(Meta): 확대/축소
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY
        const direction = delta > 0 ? -1 : 1
        const newZoom = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, zoomLevel + direction * WHEEL_ZOOM_STEP))
        setZoomLevel(newZoom)
      }
      // Shift: 좌/우 스크롤
      else if (e.shiftKey || isHorizontalWheel) {
        let scrollAmount = e.deltaY > 0 ? -WHEEL_SCROLL_SPEED : WHEEL_SCROLL_SPEED

        // 마우스 가로 휠
        if (isHorizontalWheel) {
          scrollAmount = e.deltaX > 0 ? -HORIZONTAL_WHEEL_SCROLL_SPEED : HORIZONTAL_WHEEL_SCROLL_SPEED
        }

        updatePositionWithLimits({
          x: viewPosition.x + scrollAmount,
          y: viewPosition.y,
        })
      }
      // 일반 스크롤
      else {
        const delta = e.deltaY !== 0 ? e.deltaY : e.deltaZ || 0
        const scrollAmount = delta > 0 ? -WHEEL_SCROLL_SPEED : WHEEL_SCROLL_SPEED

        updatePositionWithLimits({
          x: viewPosition.x,
          y: viewPosition.y + scrollAmount,
        })
      }
    },
    [zoomLevel, viewPosition, updatePositionWithLimits],
  )

  useEffect(() => {
    const imageContainer = imageContainerRef.current
    if (!imageContainer) return () => {}

    const wheelHandler = (e: WheelEvent) => {
      handleWheel(e)
    }

    imageContainer.addEventListener('wheel', wheelHandler, { passive: false })

    return () => {
      imageContainer.removeEventListener('wheel', wheelHandler)
    }
  }, [handleWheel])

  useEffect(() => {
    const handleResize = () => {
      adjustViewPositionForZoom()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [adjustViewPositionForZoom])

  return (
    <Grid className="flex flex-col w-full h-full border border-gray-300 rounded-md overflow-hidden" minWidth={800}>
      <Grid
        container
        justifyContent={'center'}
        height={'57px'}
        bgcolor={'gray.80'}
        p={4}
        sx={{
          boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          userSelect: 'none',
          paddingLeft: `${SIDEBAR_WIDTH + 24}px`,
        }}
        zIndex={200}
      >
        <Grid
          container
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            maxWidth: '320px',
            '&:hover .fileInfo': { display: 'block' },
          }}
        >
          <Box>
            <Typography
              component={'div'}
              sx={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: '260px',
                paddingBottom: '11px',
              }}
              variant={'infoDocument'}
              color={'gray.20'}
            >
              {metadata.originFileNm}
            </Typography>
            <Box
              className={'fileInfo'}
              sx={{
                padding: '14px 20px',
                position: 'absolute',
                display: 'none',
                top: '86%',
                left: '0',
                borderRadius: '4px',
                backgroundColor: 'gray.90',
                boxShadow: '0px 1px 8px 0px rgba(0, 0, 0, 0.10)',
                width: '410px',
                zIndex: 300,
              }}
            >
              <Typography
                sx={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 6,
                  WebkitBoxOrient: 'vertical',
                }}
                mb={'14px'}
                variant={'body1'}
                color={'#fff'}
              >
                {metadata.originFileNm}
              </Typography>
              <Grid mb={1} container alignItems={'center'}>
                <Typography variant={'body2M14'} color={'gray.50'}>
                  {metadata.numberOfImages.toLocaleString()}p
                </Typography>
                <MILine direction={'vertical'} thickness={'1px'} length={10} margin={'0 6px'} backgroundColor={'gray.70'} />
                <Typography variant={'body2M14'} color={'gray.50'}>
                  {formatFileSize(metadata.fileSize)}
                </Typography>
                <MILine direction={'vertical'} thickness={'1px'} length={10} margin={'0 6px'} backgroundColor={'gray.70'} />
                <Typography variant={'body2M14'} color={'gray.50'}>
                  {dayjs(metadata.auditInfo.createDt).format('MMMM D, YYYY')}
                </Typography>
              </Grid>
              <Typography variant={'body2M14'} color={'gray.30'}>
                {'WoodMackenzie'}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid container alignItems={'center'}>
          <Grid container alignItems="center" px={6} spacing={2}>
            <MIButtonPdf onClick={goToPrevPage} disabled={currentPage <= 1}>
              <ChevronLeftIcon />
            </MIButtonPdf>
            <MIButtonPdf onClick={goToNextPage} disabled={currentPage >= metadata.numberOfImages}>
              <ChevronRightIcon />
            </MIButtonPdf>
            <input
              type="number"
              min={1}
              max={metadata.numberOfImages}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleApplyPageChange}
              className="pdf-page-number"
            />
            <Typography color={'gray.20'} variant={'body1M16'}>
              /
            </Typography>
            <Typography color={'gray.20'} variant={'body1M16'}>
              {metadata.numberOfImages}
            </Typography>
          </Grid>
          <MILine direction={'vertical'} length={'25px'} margin={'0 8px'} thickness={'1px'} backgroundColor={'gray.70'} />

          <Grid container alignItems="center" px={6} spacing={2}>
            <MIButtonPdf onClick={zoomOut} disabled={zoomLevel <= MIN_ZOOM_LEVEL}>
              <RemoveIcon />
            </MIButtonPdf>
            <MIButtonPdf onClick={zoomIn} disabled={zoomLevel >= MAX_ZOOM_LEVEL}>
              <AddIcon />
            </MIButtonPdf>
            <Box sx={{ mr: 2 }}>
              <input
                type="number"
                min={MIN_ZOOM_LEVEL}
                max={MAX_ZOOM_LEVEL}
                style={{ width: '56px', textAlign: 'left' }}
                value={zoomInputValue}
                onChange={handleZoomInputChange}
                onKeyDown={handleZoomInputKeyDown}
                onBlur={handleApplyZoom}
                className="pdf-page-number"
                disabled={!metadata.numberOfImages}
              />
              <Typography ml={'2px'} color={'gray.20'} variant={'body1R16'}>
                %
              </Typography>
            </Box>
            <MIButtonPdf onClick={setFitZoom} disabled={!metadata.numberOfImages}>
              <FitScreenIcon />
            </MIButtonPdf>
          </Grid>
        </Grid>
      </Grid>
      <Grid flexWrap={'nowrap'} style={{ height: 'calc(100vh - 57px)' }} bgcolor={'gray.70'} container>
        <Box
          width={SIDEBAR_WIDTH}
          flexShrink={0}
          p={5}
          borderRight={'1px solid #5A6169'}
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#CED4DA',
              borderRadius: '10px',
            },
          }}
        >
          {Array.from({ length: metadata.numberOfImages }, (_, index) => index + 1).map((number) => {
            const isCurrentPage = number === currentPage

            return (
              <Box
                key={number}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: isCurrentPage ? '#5A6169' : 'transparent',
                  padding: '10px 12px',
                  borderRadius: '2px',
                  fontSize: '16px',
                  transition: 'all 0.1s',
                  fontWeight: isCurrentPage ? 600 : 500,
                  color: isCurrentPage ? '#fff' : 'gray.40',
                  '&:hover': {
                    fontWeight: 600,
                    color: '#fff',
                  },
                }}
                onClick={() => setCurrentPage(number)}
              >
                {number.toLocaleString()} Page
              </Box>
            )
          })}
        </Box>
        <Box
          ref={imageContainerRef}
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            height: '100%',
            bgcolor: 'gray.70',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <PdfPageImage
            ref={pdfPageImageRef}
            currentPage={currentPage}
            numberOfImages={metadata.numberOfImages}
            zoomLevel={zoomLevel}
            initialPadding={INITIAL_PADDING}
            viewPosition={viewPosition}
          />
        </Box>
      </Grid>
    </Grid>
  )
}

export default PdfViewer
