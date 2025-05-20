import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FitScreenIcon from '@mui/icons-material/FitScreenOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { ChangeEvent, useEffect, useRef, useState, KeyboardEvent } from 'react'

import MIButtonPdf from '@/components/common/button/MIButtonPdf'
import MILine from '@/components/common/divider/MILine'
import PdfPageImage from '@/components/common/pdfviewer/PdfPageImage'
import { PdfMetadata } from '@/service/common/pdf'
import { formatFileSize } from '@/utils/dataUtil'

interface PdfViewerProps {
  metadata: PdfMetadata
}

const MIN_ZOOM_LEVEL = 30
const MAX_ZOOM_LEVEL = 300

const PdfViewer = ({ metadata }: Readonly<PdfViewerProps>) => {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [inputValue, setInputValue] = useState<string>(currentPage.toString())
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [zoomInputValue, setZoomInputValue] = useState<string>(zoomLevel.toFixed(0))
  const imageContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(currentPage.toString())
  }, [currentPage])

  useEffect(() => {
    setZoomInputValue(zoomLevel.toFixed(0))
  }, [zoomLevel])

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

  return (
    <Grid className="flex flex-col w-full h-full border border-gray-300 rounded-md overflow-hidden" minWidth={800}>
      <Grid
        container
        justifyContent={'center'}
        height={'57px'}
        bgcolor={'gray.80'}
        p={4}
        sx={{ boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', userSelect: 'none' }}
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
            <MIButtonPdf onClick={() => setZoomLevel(100)} disabled={!metadata.numberOfImages}>
              <FitScreenIcon />
            </MIButtonPdf>
          </Grid>
        </Grid>
      </Grid>
      <Grid flexWrap={'nowrap'} style={{ height: 'calc(100vh - 57px)' }} bgcolor={'gray.70'} container>
        <Box
          width={280}
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
          ref={imageContainerRef}
        >
          <PdfPageImage currentPage={currentPage} numberOfImages={metadata.numberOfImages} zoomLevel={zoomLevel} />
        </Grid>
      </Grid>
    </Grid>
  )
}

export default PdfViewer
