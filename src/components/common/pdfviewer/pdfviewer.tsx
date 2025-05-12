import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import RefreshIcon from '@mui/icons-material/Refresh'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import { useEffect, useRef, useState } from 'react'

import type React from 'react'

import MIButtonPdf from '@/components/common/button/MIButtonPdf.tsx'
import MILine from '@/components/common/divider/MILine.tsx'
import PDFPageImage from '@/components/common/pdfviewer/PDFPageImage.tsx'

interface PDFViewerProps {
  fileName?: string
  fileDate?: Date
  images: string[]
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

export default function PDFViewer({ fileName = 'Document', fileDate = new Date(), images }: PDFViewerProps) {
  const [fileSize, setFileSize] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [zoomInputValue, setZoomInputValue] = useState('100')
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isScrolling, setIsScrolling] = useState(false)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const viewerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastScrollPosition = useRef(0)
  const renderInProgress = useRef(false)

  //const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setZoomInputValue(Math.round(scale * 100).toString())
  }, [scale])

  useEffect(() => {
    setDragOffset({ x: 0, y: 0 })
  }, [scale, currentIndex])

  // Get file size
  const getFileSize = async (url: string) => {
    const response = await fetch(url)
    const blob = await response.blob()

    return blob.size
  }

  useEffect(() => {
    const calculateTotalSize = async () => {
      let totalSize = 0

      for (const image of images) {
        const size = await getFileSize(image)

        totalSize += size
      }
      setFileSize(totalSize)
    }

    calculateTotalSize()
  }, [images])
  // Format file size to human-readable format

  // Reset drag offset when scale or page changes
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 })
  }, [scale, currentIndex])

  // Load the current image

  useEffect(() => {
    if (images.length === 0) {
      setError('No images provided')

      return () => {}
    }

    const img = new Image()

    img.onload = () => {
      setIsLoading(false)
      setError(null)
    }
    img.onerror = () => {
      setError(`Failed to load image: ${images[currentIndex]}`)
      setIsLoading(false)
    }

    setIsLoading(true)
    img.src = images[currentIndex]

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [currentIndex, images])

  // Handle manual navigation with next/prev page buttons
  const goToPrevPage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNextPage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  // Reset scroll position after page change
  useEffect(() => {
    if (isScrolling && scrollContainerRef.current) {
      const wasScrollingDown = lastScrollPosition.current > 0

      setTimeout(() => {
        if (scrollContainerRef.current) {
          if (wasScrollingDown) {
            scrollContainerRef.current.scrollTop = 0
          } else {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
          }
          setIsScrolling(false)
        }
      }, 300) // Longer delay to ensure the new page has rendered
    }
  }, [currentIndex, isScrolling])

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)

    if (!isNaN(value) && value >= 1 && value <= images.length) {
      setCurrentIndex(value - 1) // Convert from 1-based to 0-based index
    }
  }

  // Zoom functions
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 5.0))
  }

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.7))
  }

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInputValue(e.target.value)
  }

  const applyZoom = () => {
    if (renderInProgress.current) return

    const zoomValue = Number.parseInt(zoomInputValue)

    if (!isNaN(zoomValue) && zoomValue >= 50 && zoomValue <= 500) {
      setScale(zoomValue / 100)
    } else {
      // Reset to current scale if invalid
      setZoomInputValue(Math.round(scale * 100).toString())
    }
  }

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('test')
      e.preventDefault()
      applyZoom()
    }
  }

  // Rotation function
  const rotateClockwise = () => {
    if (!renderInProgress.current) {
      setRotation((rotation + 90) % 360)
    }
  }

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only enable dragging when zoomed in
    if (scale <= 1.0 || renderInProgress.current) return

    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    setDragOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }))

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
    }
  }

  // Determine if dragging should be enabled
  const canDrag = scale > 1.0 && !renderInProgress.current

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <Grid ref={viewerRef} className="flex flex-col w-full h-full border border-gray-300 rounded-md overflow-hidden">
      {/* File info with hover properties */}
      <Grid
        container
        justifyContent={'center'}
        bgcolor={'gray.80'}
        p={4}
        sx={{ boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative' }}
      >
        <Grid
          container
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            maxWidth: '425px',
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
                maxWidth: '425px',
                paddingBottom: '11px',
              }}
              variant={'infoDocument'}
              color={'gray.20'}
            >
              {fileName}
            </Typography>
            <Box
              className={'fileInfo'}
              sx={{
                padding: '14px 20px',
                position: 'absolute',
                display: 'none',
                top: '100%',
                left: '0',
                borderRadius: '4px',
                backgroundColor: 'gray.90',
                boxShadow: '0px 1px 8px 0px rgba(0, 0, 0, 0.10)',
                width: '410px',
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
                {fileName}
              </Typography>
              <Grid mb={1} container alignItems={'center'}>
                <Typography variant={'body2M14'} color={'gray.50'}>
                  {images.length}p
                </Typography>
                <MILine direction={'vertical'} thickness={'1px'} length={10} margin={'0 6px'} backgroundColor={'gray.70'} />
                <Typography variant={'body2M14'} color={'gray.50'}>
                  {formatFileSize(fileSize)}
                </Typography>
                <MILine direction={'vertical'} thickness={'1px'} length={10} margin={'0 6px'} backgroundColor={'gray.70'} />
                <Typography variant={'body2M14'} color={'gray.50'}>
                  {fileDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Grid>
              <Typography variant={'body2M14'} color={'gray.30'}>
                {'WoodMackenzie'}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Toolbar */}
        <Grid container alignItems={'center'}>
          <Grid container alignItems="center" px={6} spacing={2}>
            <MIButtonPdf onClick={goToPrevPage} disabled={currentIndex <= 0}>
              <ChevronLeftIcon />
            </MIButtonPdf>
            <MIButtonPdf onClick={goToNextPage} disabled={currentIndex >= images.length - 1}>
              <ChevronRightIcon />
            </MIButtonPdf>
            <input
              type="number"
              min={1}
              max={images.length}
              value={currentIndex + 1}
              onChange={handlePageInputChange}
              className="pdf-page-number"
              disabled={renderInProgress.current}
            />
            <Typography color={'gray.20'} variant={'body1M16'}>
              /
            </Typography>
            <Typography color={'gray.20'} variant={'body1M16'}>
              {images.length}
            </Typography>
          </Grid>
          <MILine direction={'vertical'} length={'25px'} margin={'0 8px'} thickness={'1px'} backgroundColor={'gray.70'} />
          <Grid container alignItems="center" px={6} spacing={2}>
            <MIButtonPdf onClick={zoomOut} disabled={scale <= 0.7 || renderInProgress.current}>
              <RemoveIcon />
            </MIButtonPdf>
            <MIButtonPdf onClick={zoomIn} disabled={scale >= 5 || renderInProgress.current}>
              <AddIcon />
            </MIButtonPdf>
            <Box sx={{ mr: 2 }}>
              <input
                type="number"
                min={70}
                max={500}
                style={{ width: '56px', textAlign: 'left' }}
                onBlur={applyZoom}
                value={zoomInputValue}
                onChange={handleZoomInputChange}
                onKeyDown={handleZoomInputKeyDown}
                className="pdf-page-number"
                disabled={renderInProgress.current}
              />
              <Typography ml={'2px'} color={'gray.20'} variant={'body1M16'}>
                %
              </Typography>
            </Box>

            <MIButtonPdf onClick={rotateClockwise} disabled={renderInProgress.current}>
              <RefreshIcon />
            </MIButtonPdf>
          </Grid>
        </Grid>
      </Grid>

      <Grid flexWrap={'nowrap'} style={{ height: 'calc(100vh - 57px)' }} bgcolor={'gray.70'} container>
        {/* Sidebar */}
        <Box
          width={320}
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
          {images.map((_image, index) => (
            <Box
              sx={{
                cursor: 'pointer',
                backgroundColor: index === currentIndex ? '#5A6169' : 'transparent',
                padding: '10px 12px',
                borderRadius: '2px',
                fontSize: '16px',
                transition: 'all 0.1s',
                fontWeight: index === currentIndex ? 600 : 500,
                color: index === currentIndex ? '#fff' : 'gray.40',
                '&:hover': {
                  fontWeight: 600,
                  color: '#fff',
                },
              }}
              key={index}
              onClick={() => setCurrentIndex(index)}
            >
              {index + 1} Page
            </Box>
          ))}
        </Box>

        {/* Main content */}
        <Grid
          sx={{
            overflowY: 'auto',
            overflow: 'hidden',
            position: 'relative',
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
          container
          alignItems={'center'}
          justifyContent={'center'}
          flexGrow={1}
        >
          <Box ref={scrollContainerRef}>
            <PDFPageImage
              imageSrc={images[currentIndex] || '/placeholder.svg'}
              scale={scale}
              rotation={rotation}
              dragOffset={dragOffset}
              isDragging={isDragging}
              canDrag={canDrag}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              imageRef={imageRef}
              containerRef={containerRef}
            />
          </Box>
        </Grid>
      </Grid>
    </Grid>
  )
}
