import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, BoxProps, Skeleton, Stack, Typography, type SxProps, type Theme } from '@mui/material'
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
  isValidElement,
  cloneElement,
  forwardRef,
  useImperativeHandle,
} from 'react'
import ReactDOM from 'react-dom'

import { MIMorphingPopupContext } from '@/components/mi/MIMorphingPopupContext'

const VERTICAL_MARGIN = 60
const HORIZONTAL_MARGIN = 96
const POPUP_HEADER_HEIGHT = 68

const TRANSITION_CURVE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DURATION_MS = 400
const DURATION = `${DURATION_MS}ms`
const FADEOUT_DURATION_MS = 150
const FADEOUT_DURATION = `${FADEOUT_DURATION_MS}ms`

const SCROLLBAR_SX = {
  scrollBehavior: 'smooth',
  scrollbarWidth: 'thin',
  scrollbarColor: '#ADB5BD transparent',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#ADB5BD',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#ADB5BD',
  },
} as const

const calculateVerticalLayout = (measuredHeight: number, windowHeight: number, useInternalScroll: boolean) => {
  if (useInternalScroll) {
    const maxPopupHeight = Math.max(0, windowHeight - VERTICAL_MARGIN * 2)
    const isTall = measuredHeight > maxPopupHeight
    return {
      isTall,
      top: isTall ? VERTICAL_MARGIN : (windowHeight - measuredHeight) / 2,
      height: isTall ? maxPopupHeight : measuredHeight,
    }
  }

  return {
    isTall: measuredHeight + VERTICAL_MARGIN * 2 > windowHeight,
    top: Math.max(VERTICAL_MARGIN, (windowHeight - measuredHeight) / 2),
    height: measuredHeight,
  }
}

interface DimmedOverlayProps {
  isClosing: boolean
  isExpanded: boolean
  isFadingOut: boolean
}

const DimmedOverlay = ({ isClosing, isExpanded, isFadingOut }: DimmedOverlayProps) => (
  <Box
    position="fixed"
    top={0}
    left={0}
    right={0}
    bottom={0}
    bgcolor="rgba(0, 0, 0, 0.56)"
    zIndex={1299}
    sx={{
      opacity: isClosing || !isExpanded || isFadingOut ? 0 : 1,
      transition: `opacity ${isFadingOut ? FADEOUT_DURATION : DURATION} ${TRANSITION_CURVE}`,
      pointerEvents: 'none',
    }}
  />
)

interface PopupProps extends Omit<BoxProps, 'title' | 'content'> {
  title: ReactNode
  content: ReactNode
  measureContent?: ReactNode
  hideHeaderLine?: boolean
  hideCloseButton?: boolean
  showSkeleton?: boolean
  minWidth?: number
  maxWidth?: number
  useInternalScroll?: boolean
  onOpen?: () => void
  onClose?: () => void
}

interface Props extends BoxProps {
  popup: PopupProps
}

export interface MIMorphingPopupRef {
  open: () => void
  close: () => void
}

const MIMorphingPopup = forwardRef<MIMorphingPopupRef, Props>(
  (
    {
      children,
      popup: {
        title,
        content,
        measureContent,
        hideHeaderLine,
        hideCloseButton,
        showSkeleton = true,
        minWidth = 1200,
        maxWidth = 1380,
        useInternalScroll = false,
        onOpen,
        onClose,
        ...popupProps
      },
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isAnimDone, setIsAnimDone] = useState(false)
    const [isMorphComplete, setIsMorphComplete] = useState(false)
    const [isFadingOut, setIsFadingOut] = useState(false)

    type CoordsType = {
      start: DOMRect
      end: { top: number; left: number; width: number; height: number }
      isTall: boolean // 스크롤 처리 확인
    } | null

    const [coords, setCoords] = useState<CoordsType>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<HTMLDivElement>(null)

    const scrollWrapperRef = useRef<HTMLDivElement | null>(null)
    const popupContainerRef = useRef<HTMLDivElement | null>(null)
    const internalScrollContainerRef = useRef<HTMLDivElement | null>(null)
    const [scrollContainerEl, setScrollContainerEl] = useState<HTMLDivElement | null>(null)
    const setScrollWrapperRef = useCallback(
      (el: HTMLDivElement | null) => {
        scrollWrapperRef.current = el
        if (!useInternalScroll) setScrollContainerEl(el)
      },
      [useInternalScroll],
    )
    const setPopupContainerRef = useCallback((el: HTMLDivElement | null) => {
      popupContainerRef.current = el
    }, [])
    const setInternalScrollContainerRef = useCallback(
      (el: HTMLDivElement | null) => {
        internalScrollContainerRef.current = el
        if (useInternalScroll) setScrollContainerEl(el)
      },
      [useInternalScroll],
    )
    const contentWrapperRef = useRef<HTMLDivElement>(null)
    const animTimerRef = useRef<NodeJS.Timeout | null>(null)

    const calculateCoords = useCallback((): CoordsType => {
      if (!triggerRef.current || !measureRef.current) return null

      const rect = triggerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const windowWidth = window.innerWidth

      // 좌우 여백을 제외한 너비 계산 (minWidth ~ maxWidth 범위)
      const endWidth = Math.min(maxWidth, Math.max(minWidth, windowWidth - HORIZONTAL_MARGIN * 2))

      // 측정용 박스의 너비를 강제로 설정한 뒤 높이를 측정
      measureRef.current.style.width = `${endWidth}px`
      const measuredHeight = measureRef.current.offsetHeight + POPUP_HEADER_HEIGHT
      const verticalLayout = calculateVerticalLayout(measuredHeight, windowHeight, useInternalScroll)

      // 왼쪽 여백 계산 (중앙 정렬)
      const endLeft = (windowWidth - endWidth) / 2

      return {
        start: rect,
        end: {
          top: verticalLayout.top,
          left: endLeft,
          width: endWidth,
          height: verticalLayout.height,
        },
        isTall: verticalLayout.isTall,
      }
    }, [minWidth, maxWidth, useInternalScroll])

    const handleClose = useCallback(() => {
      // 닫기 시작 시 예약된 'isAnimDone' 타이머 취소
      if (animTimerRef.current) {
        clearTimeout(animTimerRef.current)
        animTimerRef.current = null
      }

      setIsAnimDone(false)
      setIsClosing(true)
      setIsExpanded(false)

      const scrollEl = useInternalScroll ? internalScrollContainerRef.current : scrollWrapperRef.current
      if (scrollEl) {
        scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
      }

      // 축소 애니메이션 완료 후 페이드아웃 시작
      setTimeout(() => {
        setIsFadingOut(true)
      }, DURATION_MS)

      // 페이드아웃 완료 후 팝업 제거
      setTimeout(() => {
        setIsOpen(false)
        setCoords(null)
        setIsClosing(false)
        setIsFadingOut(false)
        setIsMorphComplete(false)
        onClose?.()
      }, DURATION_MS + FADEOUT_DURATION_MS)
    }, [onClose, useInternalScroll])

    const open = useCallback(() => {
      const newCoords = calculateCoords()
      if (!newCoords) return

      setCoords(newCoords)
      setIsOpen(true)
      setIsClosing(false)
      setIsExpanded(false)
      setIsAnimDone(false)
      setIsMorphComplete(false)
      setIsFadingOut(false)
      onOpen?.()

      requestAnimationFrame(() => {
        setIsExpanded(true)

        if (animTimerRef.current) clearTimeout(animTimerRef.current)

        animTimerRef.current = setTimeout(() => {
          setIsAnimDone(true)
          setIsMorphComplete(true)
          animTimerRef.current = null
        }, DURATION_MS)
      })
    }, [calculateCoords, onOpen])

    useImperativeHandle(
      ref,
      () => ({
        open,
        close: handleClose,
      }),
      [open, handleClose],
    )

    const popupContextValue = useMemo(
      () => ({
        scrollContainer: scrollContainerEl,
        close: handleClose,
        isMorphComplete,
      }),
      [handleClose, isMorphComplete, scrollContainerEl],
    )

    // children에서 border 관련 스타일 추출 및 제거
    const { borderStyles, cleanedChildren } = useMemo(() => {
      const defaultBorderStyles = {
        border: undefined,
        borderColor: undefined,
        borderRadius: undefined,
        hoverBorderColor: undefined,
      }

      if (!isValidElement(children)) {
        return { borderStyles: defaultBorderStyles, cleanedChildren: children }
      }

      const childProps = children.props as BoxProps
      const originalSx = childProps.sx

      // sx에서 hover borderColor 추출
      let hoverBorderColor: string | undefined = undefined
      if (originalSx && typeof originalSx === 'object' && !Array.isArray(originalSx)) {
        const sxRecord = originalSx as Record<string, unknown>
        hoverBorderColor = (sxRecord['&:hover'] as Record<string, unknown>)?.borderColor as string | undefined
      }

      const extractedBorderStyles = {
        border: childProps.border,
        borderColor: childProps.borderColor,
        borderRadius: childProps.borderRadius,
        hoverBorderColor,
      }

      // border 관련 props를 제거한 children 생성
      const { border: _border, borderColor: _borderColor, borderRadius: _borderRadius, sx: _sx, ...restProps } = childProps

      // sx에서 hover borderColor 제거
      let cleanedSx = originalSx
      if (originalSx && typeof originalSx === 'object' && !Array.isArray(originalSx) && hoverBorderColor) {
        const sxRecord = originalSx as Record<string, unknown>
        const { '&:hover': hoverStyles, ...otherSx } = sxRecord
        const hoverStylesRecord = hoverStyles as Record<string, unknown> | undefined
        const { borderColor: _hoverBorderColor, ...restHoverStyles } = hoverStylesRecord || {}
        cleanedSx = {
          ...otherSx,
          ...(Object.keys(restHoverStyles).length > 0 ? { '&:hover': restHoverStyles } : {}),
        } as typeof originalSx
      }

      const childrenWithoutBorder = cloneElement(children, {
        ...restProps,
        border: extractedBorderStyles.border,
        borderColor: 'transparent',
        borderRadius: extractedBorderStyles.borderRadius,
        sx: cleanedSx,
      } as BoxProps)

      return {
        borderStyles: extractedBorderStyles,
        cleanedChildren: childrenWithoutBorder,
      }
    }, [children])

    // 창/뷰포트 리사이즈 시 팝업 위치/크기 재계산
    useEffect(() => {
      if (!isOpen) return undefined

      let rafId: number | null = null
      const handleResize = () => {
        if (rafId !== null) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          rafId = null
          const newCoords = calculateCoords()
          if (!newCoords) return

          if (!useInternalScroll) {
            // 현재 표시 중인 컨텐츠 높이 반영: 리사이즈로 계산된 높이보다 크면 그 높이를 유지
            const contentEl = contentWrapperRef.current
            if (contentEl) {
              const actualContentHeight = contentEl.offsetHeight + POPUP_HEADER_HEIGHT
              if (actualContentHeight > newCoords.end.height) {
                const verticalLayout = calculateVerticalLayout(actualContentHeight, window.innerHeight, useInternalScroll)
                setCoords({
                  ...newCoords,
                  end: {
                    ...newCoords.end,
                    height: verticalLayout.height,
                    top: verticalLayout.top,
                  },
                  isTall: verticalLayout.isTall,
                })
                return
              }
            }
          }

          setCoords(newCoords)
        })
      }

      window.addEventListener('resize', handleResize)
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize)
        window.visualViewport.addEventListener('scroll', handleResize)
      }
      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId)
        window.removeEventListener('resize', handleResize)
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize)
          window.visualViewport.removeEventListener('scroll', handleResize)
        }
      }
    }, [isOpen, calculateCoords, useInternalScroll])

    // ResizeObserver로 팝업 내부(표시 중인 content) 크기 변화 감지
    // ghost가 아닌 contentWrapperRef를 관찰해야 handleFactorClick 등으로 인한
    // content state 변경 시 실제 표시 높이에 맞춰 팝업 크기가 갱신됨
    useEffect(() => {
      const target = contentWrapperRef.current
      if (!isOpen || !isAnimDone || !target) return undefined

      const resizeObserver = new ResizeObserver(() => {
        const contentHeight = target.offsetHeight
        const measuredHeight = contentHeight + POPUP_HEADER_HEIGHT
        setCoords((prev) => {
          if (!prev) return null
          const verticalLayout = calculateVerticalLayout(measuredHeight, window.innerHeight, useInternalScroll)
          return {
            ...prev,
            end: {
              ...prev.end,
              height: verticalLayout.height,
              top: verticalLayout.top,
            },
            isTall: verticalLayout.isTall,
          }
        })
      })

      resizeObserver.observe(target)
      return () => resizeObserver.disconnect()
    }, [isOpen, isAnimDone, useInternalScroll])

    useEffect(
      () => () => {
        if (animTimerRef.current) clearTimeout(animTimerRef.current)
      },
      [],
    )

    if (!coords && isOpen) return null

    // 래퍼 기준의 상대적 위치 계산
    // Fixed가 아닌 Absolute로 동작하므로, 스크롤 컨테이너(0,0) 기준
    const containerStyle = {
      top: isOpen && coords ? (isExpanded && !isClosing ? coords.end.top : coords.start.top) : undefined,
      left: isOpen && coords ? (isExpanded && !isClosing ? coords.end.left : coords.start.left) : undefined,
      width: isOpen && coords ? (isExpanded && !isClosing ? coords.end.width : coords.start.width) : undefined,
      height: isOpen && coords ? (isExpanded && !isClosing ? coords.end.height : coords.start.height) : undefined,
    }
    let hoverSx: SxProps<Theme> = {}
    if (borderStyles.hoverBorderColor && !isOpen) {
      hoverSx = {
        '&:hover': {
          borderColor: borderStyles.hoverBorderColor,
        },
      }
    }

    let scrollWrapperSx: SxProps<Theme> = {
      overflow: 'hidden',
    }
    if (!useInternalScroll) {
      scrollWrapperSx = {
        overflowY: coords?.isTall && isExpanded ? 'auto' : 'hidden',
        ...SCROLLBAR_SX,
      }
    }

    const popupOverflowSx: SxProps<Theme> = {
      overflow: 'hidden',
    }
    const internalScrollBodySx: SxProps<Theme> = {
      height: coords ? Math.max(0, coords.end.height - POPUP_HEADER_HEIGHT) : 0,
      minHeight: 0,
      overflowX: 'hidden',
      overflowY: isAnimDone && !isClosing && coords?.isTall ? 'auto' : 'hidden',
      ...SCROLLBAR_SX,
    }
    const contentBody = (
      <MIMorphingPopupContext.Provider value={popupContextValue}>
        {useInternalScroll ? (
          <Box ref={setInternalScrollContainerRef} sx={internalScrollBodySx}>
            <Box ref={contentWrapperRef} width={coords?.end.width}>
              {content}
            </Box>
          </Box>
        ) : (
          <Box ref={contentWrapperRef} width={coords?.end.width}>
            {content}
          </Box>
        )}
      </MIMorphingPopupContext.Provider>
    )
    const titleBarSx: SxProps<Theme> = {
      userSelect: 'none',
      ...(useInternalScroll && {
        flexShrink: 0,
      }),
    }

    return (
      <>
        {/* Ghost Element: 높이 측정용 */}
        <Box
          ref={measureRef}
          sx={{
            position: 'absolute',
            visibility: 'hidden',
            top: -9999,
            left: -9999,
            bgcolor: 'commonColor.White',
          }}
        >
          {measureContent ?? content}
        </Box>

        <Box
          ref={triggerRef}
          {...props}
          border={borderStyles.border}
          borderColor={showSkeleton && isOpen && coords && !isFadingOut ? 'transparent' : borderStyles.borderColor}
          borderRadius={borderStyles.borderRadius}
          overflow="hidden"
          position="relative"
          sx={{
            opacity: isOpen && !showSkeleton && !isFadingOut ? 0 : 1,
            visibility: isOpen && !showSkeleton && !isFadingOut ? 'hidden' : 'visible',
            ...hoverSx,
            ...props?.sx,
          }}
        >
          <Box
            sx={{
              opacity: showSkeleton && isOpen && coords && !isFadingOut ? 0 : 1,
              visibility: showSkeleton && isOpen && coords && !isFadingOut ? 'hidden' : 'visible',
            }}
          >
            {cleanedChildren}
          </Box>
          {showSkeleton && isOpen && coords && !isFadingOut && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              sx={{
                opacity: isExpanded ? 0.3 : 0,
                transition: `opacity ${DURATION} ${TRANSITION_CURVE}`,
                pointerEvents: 'none',
              }}
            >
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                animation={false}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.08)',
                  borderRadius: 'inherit',
                }}
              />
            </Box>
          )}
        </Box>

        {isOpen &&
          coords &&
          ReactDOM.createPortal(
            <>
              <DimmedOverlay isClosing={isClosing} isExpanded={isExpanded} isFadingOut={isFadingOut} />

              <Box
                ref={setScrollWrapperRef}
                position="fixed"
                top={0}
                left={0}
                right={0}
                bottom={0}
                zIndex={1300}
                sx={scrollWrapperSx}
                onClick={(e) => {
                  if (e.target === e.currentTarget) handleClose()
                }}
              >
                <Box
                  ref={setPopupContainerRef}
                  position="absolute"
                  top={containerStyle.top}
                  left={containerStyle.left}
                  width={containerStyle.width}
                  height={containerStyle.height}
                  bgcolor="commonColor.White"
                  border={borderStyles.border ?? (isAnimDone ? '1px solid' : 'none')}
                  borderColor={isAnimDone ? 'contentBorder.Normal' : (borderStyles.borderColor ?? 'transparent')}
                  borderRadius={isAnimDone ? '10px' : (borderStyles.borderRadius ?? '10px')}
                  boxSizing="border-box"
                  {...popupProps}
                  sx={{
                    transition: isFadingOut
                      ? `all ${DURATION} ${TRANSITION_CURVE}, opacity ${FADEOUT_DURATION} ${TRANSITION_CURVE}`
                      : isAnimDone && !isClosing
                        ? `top ${DURATION} ${TRANSITION_CURVE}, height ${DURATION} ${TRANSITION_CURVE}` // 옵저버로 높이/위치 변경 시 애니메이션
                        : `all ${DURATION} ${TRANSITION_CURVE}`,
                    ...popupOverflowSx,
                    boxShadow: isExpanded ? 24 : 0,
                    opacity: isFadingOut ? 0 : 1,
                    ...popupProps?.sx,
                  }}
                  // 팝업 내부 클릭 시 닫기 이벤트 전파 방지
                  onClick={(e) => e.stopPropagation()}
                >
                  <Box
                    height={useInternalScroll && isAnimDone && !isClosing ? 'auto' : coords.end.height}
                    minHeight={useInternalScroll ? coords.end.height : undefined}
                    position="relative"
                    sx={{
                      transition: isAnimDone && !isClosing ? `height ${DURATION} ${TRANSITION_CURVE}` : 'none',
                    }}
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      sx={{
                        opacity: isExpanded ? 0 : 1,
                        transition: `opacity ${isClosing ? DURATION_MS : DURATION_MS / 3}ms ${TRANSITION_CURVE}`,
                        pointerEvents: isExpanded ? 'none' : 'auto',
                        transformOrigin: 'top left',
                      }}
                    >
                      {cleanedChildren}
                    </Box>

                    <Stack
                      sx={{
                        opacity: isExpanded ? 1 : 0,
                        transition: `opacity ${isClosing ? DURATION_MS / 3 : DURATION_MS}ms ${TRANSITION_CURVE}`,
                      }}
                    >
                      <Stack
                        direction="row"
                        height={`${POPUP_HEADER_HEIGHT}px`}
                        padding="20px 24px"
                        borderBottom={hideHeaderLine ? 'none' : '1px solid'}
                        borderColor={hideHeaderLine ? undefined : 'contentBorder.Normal'}
                        alignItems="center"
                        justifyContent="space-between"
                        gap="24px"
                        boxSizing="border-box"
                        bgcolor={useInternalScroll ? 'commonColor.White' : undefined}
                        sx={titleBarSx}
                      >
                        <Typography fontSize="20px" fontWeight="500" color="contentText.Black">
                          {title}
                        </Typography>
                        <CloseRoundedIcon
                          onClick={handleClose}
                          sx={{
                            fontSize: 26,
                            color: 'contentIcon.Enabled',
                            cursor: 'pointer',
                            display: hideCloseButton ? 'none' : 'block',
                          }}
                        />
                      </Stack>
                      {contentBody}
                    </Stack>
                  </Box>
                </Box>

                {/* 하단 여백 Spacer */}
                {!useInternalScroll && coords.isTall && isExpanded && (
                  <Box position="absolute" top={coords.end.top + coords.end.height} left={0} width="100%" height={`${VERTICAL_MARGIN}px`} />
                )}
              </Box>
            </>,
            document.body,
          )}
      </>
    )
  },
)

MIMorphingPopup.displayName = 'MIMorphingPopup'

export default MIMorphingPopup
