import { Box, Popover, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'

/** 메모 최대 표시 줄 수 */
const MEMO_LINE_CLAMP = 2

/** 레이어 팝업 최대 너비 */
const MEMO_POPOVER_MAX_WIDTH = 754

/** 팝업 본문 스크롤 최대 높이 */
const MEMO_POPOVER_BODY_MAX_HEIGHT = 160

export interface FundamentalModelMemoSectionProps {
  /** 시뮬레이션 케이스 설명(최대 500자) */
  text: string
}

/** 상세 헤더 메모 - 2줄 말줄임, 초과 시 더보기 + 레이어 팝업 */
const FundamentalModelMemoSection = ({ text }: FundamentalModelMemoSectionProps) => {
  const textRef = useRef<HTMLParagraphElement>(null)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const [showMoreButton, setShowMoreButton] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const measureOverflow = useCallback(() => {
    const el = textRef.current
    if (!el || !text.trim()) {
      setShowMoreButton(false)
      return
    }

    const prevClamp = el.style.webkitLineClamp
    const prevDisplay = el.style.display
    const prevOrient = el.style.webkitBoxOrient

    el.style.display = '-webkit-box'
    el.style.webkitBoxOrient = 'vertical'
    el.style.webkitLineClamp = String(MEMO_LINE_CLAMP)

    const overflows = el.scrollHeight > el.clientHeight + 1

    el.style.webkitLineClamp = prevClamp
    el.style.display = prevDisplay
    el.style.webkitBoxOrient = prevOrient

    setShowMoreButton(overflows)
  }, [text])

  useEffect(() => {
    const timeoutId = window.setTimeout(measureOverflow, 50)
    const el = textRef.current
    if (!el) return () => window.clearTimeout(timeoutId)

    const observer = new ResizeObserver(measureOverflow)
    observer.observe(el)

    return () => {
      window.clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [measureOverflow])

  const handleOpenPopover = () => {
    setPopoverOpen(true)
  }

  const handleClosePopover = () => {
    setPopoverOpen(false)
  }

  if (!text.trim()) return null

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: '4px',
          alignItems: 'flex-end',
          width: '100%',
          pb: '6px',
        }}
      >
        <Typography
          ref={textRef}
          variant="body1M16"
          color="content.textNormal"
          sx={{
            flex: 1,
            minWidth: 0,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: MEMO_LINE_CLAMP,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </Typography>

        {showMoreButton && (
          <Box
            component="button"
            type="button"
            ref={moreBtnRef}
            onClick={handleOpenPopover}
            aria-label="설명 전체 보기"
            sx={{
              flexShrink: 0,
              width: 40,
              height: 20,
              p: 0,
              border: 0,
              bgcolor: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.4,
              color: 'mari.Primary',
              whiteSpace: 'nowrap',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            더보기
          </Box>
        )}
      </Box>

      <Popover
        open={popoverOpen}
        anchorEl={moreBtnRef.current}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 'min(100%, 754px)',
              maxWidth: MEMO_POPOVER_MAX_WIDTH,
              mt: '4px',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: 'gray.30',
              boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ p: '12px' }}>
          <Typography
            variant="body2R14"
            color="gray.90"
            sx={{
              display: 'block',
              maxHeight: MEMO_POPOVER_BODY_MAX_HEIGHT,
              overflowY: 'auto',
              lineHeight: 1.4,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              pr: '4px',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'gray.40', borderRadius: '1000px' },
            }}
          >
            {text}
          </Typography>
        </Box>
      </Popover>
    </>
  )
}

export default FundamentalModelMemoSection
