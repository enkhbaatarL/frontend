import MarginRoundedIcon from '@mui/icons-material/MarginRounded'
import { Box, Stack } from '@mui/material'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import type { INextGenMIEventDriverTreeScoreboardItem } from '@/service/mi/nextGenMI/event'

import {
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'

type ScrollAxis = 'horizontal' | 'vertical' | null

const CELL_PADDING = '12px'
const ROW_MIN_HEIGHT = '48px'
const HEADER_HEIGHT = '36px'
const INDEX_COL_WIDTH = '80px'
const DRIVER_COLUMN_WIDTH = '200px'
const IMPACT_COLUMN_WIDTH = '140px'
const REASON_COLUMN_WIDTH = '520px'
const STICKY_COLUMN_EDGE_SHADOW_SX = {
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: '-16px',
    bottom: 0,
    width: '16px',
    pointerEvents: 'none',
    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
  },
} as const

const getIndexName = (row: INextGenMIEventDriverTreeScoreboardItem) => String(row.indexName ?? '').trim()

const shouldShowIndexCell = (rows: INextGenMIEventDriverTreeScoreboardItem[], rowIndex: number) => {
  const indexName = getIndexName(rows[rowIndex])
  if (!indexName) return true
  if (rowIndex === 0) return true
  return getIndexName(rows[rowIndex - 1]) !== indexName
}

const getIndexCellRowSpan = (rows: INextGenMIEventDriverTreeScoreboardItem[], rowIndex: number) => {
  const indexName = getIndexName(rows[rowIndex])
  if (!indexName) return 1

  let rowSpan = 1
  for (let nextIndex = rowIndex + 1; nextIndex < rows.length; nextIndex += 1) {
    if (getIndexName(rows[nextIndex]) !== indexName) break
    rowSpan += 1
  }
  return rowSpan
}

const resolveActiveScrollAxis = (updateAxis: boolean, deltaLeft: number, deltaTop: number): ScrollAxis => {
  if (!updateAxis) return null
  if (deltaLeft === 0 && deltaTop === 0) return null
  if (deltaLeft >= deltaTop) return 'horizontal'
  return 'vertical'
}

const resolveScrollableColumnMaxWidth = (columnIndex: number, isReasonColumn: boolean, width: string) => {
  if (columnIndex < 3) return '420px'
  if (isReasonColumn) return 'none'
  return width
}

interface EventDetailDriverTreeScoreboardSectionProps {
  driverTreeScoreboard?: INextGenMIEventDriverTreeScoreboardItem[]
}

const EventDetailDriverTreeScoreboardSection = ({ driverTreeScoreboard = [] }: EventDetailDriverTreeScoreboardSectionProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastScrollPositionRef = useRef({ left: 0, top: 0 })
  const [scrollState, setScrollState] = useState<{
    left: boolean
    right: boolean
    up: boolean
    down: boolean
    horizontal: boolean
    vertical: boolean
    activeAxis: ScrollAxis
    scrollLeft: number
    scrollTop: number
    scrollWidth: number
    scrollHeight: number
    clientWidth: number
    clientHeight: number
  }>({
    left: false,
    right: false,
    up: false,
    down: false,
    horizontal: false,
    vertical: false,
    activeAxis: null,
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 0,
    scrollHeight: 0,
    clientWidth: 0,
    clientHeight: 0,
  })
  const [isScrollAreaHovered, setIsScrollAreaHovered] = useState(false)
  const [dragAxis, setDragAxis] = useState<ScrollAxis>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined

    const sync = (updateAxis = false) => {
      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = el
      const maxLeft = Math.max(0, scrollWidth - clientWidth)
      const maxTop = Math.max(0, scrollHeight - clientHeight)
      const deltaLeft = Math.abs(scrollLeft - lastScrollPositionRef.current.left)
      const deltaTop = Math.abs(scrollTop - lastScrollPositionRef.current.top)
      const activeAxis = resolveActiveScrollAxis(updateAxis, deltaLeft, deltaTop)
      const next = {
        left: scrollLeft > 1,
        right: scrollLeft < maxLeft - 1,
        up: scrollTop > 1,
        down: scrollTop < maxTop - 1,
        horizontal: maxLeft > 1,
        vertical: maxTop > 1,
        scrollLeft,
        scrollTop,
        scrollWidth,
        scrollHeight,
        clientWidth,
        clientHeight,
      }

      lastScrollPositionRef.current = { left: scrollLeft, top: scrollTop }

      setScrollState((prev) => {
        const nextActiveAxis = next.horizontal || next.vertical ? (activeAxis ?? prev.activeAxis) : null

        return prev.left === next.left &&
          prev.right === next.right &&
          prev.up === next.up &&
          prev.down === next.down &&
          prev.horizontal === next.horizontal &&
          prev.vertical === next.vertical &&
          prev.activeAxis === nextActiveAxis &&
          prev.scrollLeft === next.scrollLeft &&
          prev.scrollTop === next.scrollTop &&
          prev.scrollWidth === next.scrollWidth &&
          prev.scrollHeight === next.scrollHeight &&
          prev.clientWidth === next.clientWidth &&
          prev.clientHeight === next.clientHeight
          ? prev
          : { ...next, activeAxis: nextActiveAxis }
      })
    }

    sync()
    const handleScroll = () => sync(true)
    el.addEventListener('scroll', handleScroll, { passive: true })
    const ro = new ResizeObserver(() => sync())
    ro.observe(el)
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild)
    }
    return () => {
      el.removeEventListener('scroll', handleScroll)
      ro.disconnect()
    }
  }, [driverTreeScoreboard.length])

  const handleScrollbarPointerDown = (axis: Exclude<ScrollAxis, null>) => (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    const track = event.currentTarget.parentElement
    if (!el || !track) return

    event.preventDefault()
    event.stopPropagation()
    setDragAxis(axis)

    const startPosition = axis === 'horizontal' ? event.clientX : event.clientY
    const startScroll = axis === 'horizontal' ? el.scrollLeft : el.scrollTop
    const maxScroll = axis === 'horizontal' ? Math.max(0, el.scrollWidth - el.clientWidth) : Math.max(0, el.scrollHeight - el.clientHeight)
    const trackSize = axis === 'horizontal' ? track.clientWidth : track.clientHeight
    const thumbSize = axis === 'horizontal' ? event.currentTarget.clientWidth : event.currentTarget.clientHeight
    const maxThumbTravel = Math.max(1, trackSize - thumbSize)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentPosition = axis === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
      const nextScroll = startScroll + ((currentPosition - startPosition) / maxThumbTravel) * maxScroll

      if (axis === 'horizontal') {
        el.scrollLeft = nextScroll
        return
      }
      el.scrollTop = nextScroll
    }

    const handlePointerUp = () => {
      setDragAxis(null)
      globalThis.removeEventListener('pointermove', handlePointerMove)
      globalThis.removeEventListener('pointerup', handlePointerUp)
    }

    globalThis.addEventListener('pointermove', handlePointerMove)
    globalThis.addEventListener('pointerup', handlePointerUp, { once: true })
  }

  const showScrollbars = isScrollAreaHovered || dragAxis !== null
  const horizontalThumbWidth =
    scrollState.horizontal && scrollState.scrollWidth > 0 ? Math.max((scrollState.clientWidth / scrollState.scrollWidth) * 100, 8) : 0
  const horizontalThumbLeft =
    scrollState.horizontal && scrollState.scrollWidth > scrollState.clientWidth
      ? (scrollState.scrollLeft / (scrollState.scrollWidth - scrollState.clientWidth)) * (100 - horizontalThumbWidth)
      : 0
  const verticalThumbHeight =
    scrollState.vertical && scrollState.scrollHeight > 0 ? Math.max((scrollState.clientHeight / scrollState.scrollHeight) * 100, 8) : 0
  const verticalThumbTop =
    scrollState.vertical && scrollState.scrollHeight > scrollState.clientHeight
      ? (scrollState.scrollTop / (scrollState.scrollHeight - scrollState.clientHeight)) * (100 - verticalThumbHeight)
      : 0

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<MarginRoundedIcon sx={{ fontSize: '26px', color: 'contentText.Normal' }} />}
        title="Index Driver별 영향도 분석"
        tooltipTitle=""
      />
      <Box
        onMouseEnter={() => setIsScrollAreaHovered(true)}
        onMouseLeave={() => setIsScrollAreaHovered(false)}
        sx={{ position: 'relative', width: '100%', overflow: 'hidden', bgcolor: 'commonColor.White', borderRadius: '10px' }}
      >
        <Box
          ref={scrollRef}
          sx={{
            width: '100%',
            maxHeight: 'min(520px, calc(100vh - 320px))',
            overflowX: 'auto',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            pr: scrollState.vertical ? '16px' : 0,
            pb: scrollState.horizontal ? '18px' : 0,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box
            component="table"
            sx={{
              width: 'max-content',
              minWidth: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'auto',
            }}
          >
            <Box
              component="thead"
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                bgcolor: 'commonColor.White',
                boxShadow: scrollState.activeAxis === 'vertical' && scrollState.up ? NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP : 'none',
              }}
            >
              <Box component="tr">
                <Box
                  component="th"
                  sx={[
                    {
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      bgcolor: 'commonColor.White',
                      width: INDEX_COL_WIDTH,
                      minWidth: INDEX_COL_WIDTH,
                      maxWidth: INDEX_COL_WIDTH,
                      borderBottom: '1px solid',
                      borderColor: 'contentBorder.Normal',
                    },
                    scrollState.left && STICKY_COLUMN_EDGE_SHADOW_SX,
                  ]}
                >
                  <Stack height={HEADER_HEIGHT} padding={`0 ${CELL_PADDING}`} justifyContent="center">
                    <Box component="span" sx={{ fontSize: '14px', fontWeight: 600, color: 'contentText.Black', whiteSpace: 'nowrap' }}>
                      대상
                    </Box>
                  </Stack>
                </Box>
                {(
                  [
                    { label: 'Driver Lv1', width: DRIVER_COLUMN_WIDTH, align: 'left' as const },
                    { label: 'Driver Lv2', width: DRIVER_COLUMN_WIDTH, align: 'left' as const },
                    { label: 'Driver Lv3', width: DRIVER_COLUMN_WIDTH, align: 'left' as const },
                    { label: '단기 영향', width: IMPACT_COLUMN_WIDTH, align: 'center' as const },
                    { label: '중장기 영향', width: IMPACT_COLUMN_WIDTH, align: 'center' as const },
                    { label: '근거', width: REASON_COLUMN_WIDTH, align: 'left' as const },
                  ] as const
                ).map((c, idx) => {
                  const isReasonColumn = c.width === REASON_COLUMN_WIDTH
                  return (
                    <Box
                      key={c.label}
                      component="th"
                      sx={[
                        {
                          height: HEADER_HEIGHT,
                          padding: `0 ${CELL_PADDING}`,
                          textAlign: c.align,
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'contentText.Black',
                          borderBottom: '1px solid',
                          borderColor: 'contentBorder.Normal',
                          whiteSpace: 'nowrap',
                          width: isReasonColumn ? 'max-content' : c.width,
                          minWidth: c.width,
                          maxWidth: resolveScrollableColumnMaxWidth(idx, isReasonColumn, c.width),
                          boxSizing: 'border-box',
                        },
                        c.align === 'left' && { clipPath: 'inset(0)' },
                      ]}
                    >
                      <Box
                        component="span"
                        sx={[
                          {
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                          c.align === 'left' && {
                            position: 'sticky',
                            left: `calc(${INDEX_COL_WIDTH} + ${CELL_PADDING})`,
                            width: 'fit-content',
                            maxWidth: '100%',
                          },
                        ]}
                      >
                        {c.label}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>

            <Box component="tbody">
              {driverTreeScoreboard.map((r, rowIndex) => {
                const indexName = getIndexName(r)
                const showIndexCell = shouldShowIndexCell(driverTreeScoreboard, rowIndex)
                const rowSpan = showIndexCell ? getIndexCellRowSpan(driverTreeScoreboard, rowIndex) : 1
                const rowKey = `${indexName || 'no-index'}-${rowIndex}`
                return (
                  <Box
                    component="tr"
                    key={rowKey}
                    sx={{
                      transition: 'background-color 120ms ease',
                      '&:hover:not(:has([data-sticky-index="true"]:hover)) td:not([data-sticky-index="true"])': {
                        backgroundColor: 'gray.10',
                      },
                    }}
                  >
                    {showIndexCell ? (
                      <Box
                        component="td"
                        rowSpan={rowSpan}
                        data-sticky-index="true"
                        sx={[
                          {
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            bgcolor: 'commonColor.White',
                            width: INDEX_COL_WIDTH,
                            minWidth: INDEX_COL_WIDTH,
                            maxWidth: INDEX_COL_WIDTH,
                            borderBottom: '1px solid',
                            borderColor: 'contentBorder.Normal',
                            verticalAlign: 'middle',
                            boxSizing: 'border-box',
                          },
                          scrollState.left && STICKY_COLUMN_EDGE_SHADOW_SX,
                        ]}
                      >
                        <Stack
                          height={ROW_MIN_HEIGHT}
                          padding={`0 ${CELL_PADDING}`}
                          justifyContent="center"
                          fontWeight={600}
                          whiteSpace="nowrap"
                          overflow="hidden"
                          textOverflow="ellipsis"
                        >
                          {indexName || '-'}
                        </Stack>
                      </Box>
                    ) : null}

                    {(
                      [
                        { width: DRIVER_COLUMN_WIDTH, align: 'left' as const, node: String(r.lv1Label ?? '') },
                        { width: DRIVER_COLUMN_WIDTH, align: 'left' as const, node: String(r.lv2Label ?? '') },
                        { width: DRIVER_COLUMN_WIDTH, align: 'left' as const, node: String(r.lv3Label ?? '') },
                        {
                          width: IMPACT_COLUMN_WIDTH,
                          align: 'center' as const,
                          node: (
                            <Stack direction="row" justifyContent="center">
                              <EventIndexSignalCell
                                indexLabel={indexName}
                                level={r.marketImpactLevel}
                                direction={r.direction}
                                term="short"
                                showTermBadge={false}
                                size={20}
                              />
                            </Stack>
                          ),
                        },
                        {
                          width: IMPACT_COLUMN_WIDTH,
                          align: 'center' as const,
                          node: (
                            <Stack direction="row" justifyContent="center">
                              <EventIndexSignalCell
                                indexLabel={indexName}
                                level={r.midLongTermImpactLevel}
                                direction={r.midLongTermDirection}
                                term="long"
                                showTermBadge={false}
                                size={20}
                              />
                            </Stack>
                          ),
                        },
                        { width: REASON_COLUMN_WIDTH, align: 'left' as const, node: String(r.reason ?? '') },
                      ] as const
                    ).map((c, idx) => {
                      const isReasonColumn = c.width === REASON_COLUMN_WIDTH
                      return (
                        <Box
                          key={idx}
                          component="td"
                          sx={{
                            padding: `0 ${CELL_PADDING}`,
                            textAlign: c.align,
                            fontSize: '16px',
                            fontWeight: 500,
                            color: 'contentText.Black',
                            borderBottom: '1px solid',
                            borderColor: 'contentBorder.Normal',
                            verticalAlign: 'middle',
                            height: ROW_MIN_HEIGHT,
                            // 근거를 제외한 기본 컬럼은 1줄 + ellipsis
                            whiteSpace: 'nowrap',
                            overflow: isReasonColumn ? 'visible' : 'hidden',
                            textOverflow: isReasonColumn ? 'clip' : 'ellipsis',
                            width: isReasonColumn ? 'max-content' : c.width,
                            minWidth: c.width,
                            maxWidth: resolveScrollableColumnMaxWidth(idx, isReasonColumn, c.width),
                            boxSizing: 'border-box',
                          }}
                        >
                          {c.node}
                        </Box>
                      )
                    })}
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>

        {scrollState.activeAxis === 'vertical' && scrollState.down && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              right: scrollState.vertical ? '16px' : 0,
              bottom: scrollState.horizontal ? '18px' : 0,
              left: 0,
              height: '1px',
              pointerEvents: 'none',
              boxShadow: NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
              zIndex: 4,
            }}
          />
        )}

        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 0,
            right: scrollState.vertical ? '16px' : 0,
            bottom: scrollState.horizontal ? '18px' : 0,
            width: '100px',
            pointerEvents: 'none',
            background: 'linear-gradient(to left, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
            opacity: scrollState.right ? 1 : 0,
            transition: 'opacity 180ms ease',
            zIndex: 4,
          }}
        />

        {scrollState.horizontal && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              right: scrollState.vertical ? '18px' : 0,
              bottom: '4px',
              height: '10px',
              borderRadius: '10px',
              bgcolor: 'transparent',
              opacity: showScrollbars ? 1 : 0,
              pointerEvents: showScrollbars ? 'auto' : 'none',
              transition: 'opacity 120ms ease',
              zIndex: 5,
            }}
          >
            <Box
              onPointerDown={handleScrollbarPointerDown('horizontal')}
              sx={{
                position: 'absolute',
                top: '2px',
                bottom: '2px',
                left: `${horizontalThumbLeft}%`,
                width: `${horizontalThumbWidth}%`,
                borderRadius: '10px',
                bgcolor: dragAxis === 'horizontal' ? '#868E96' : '#ADB5BD',
                cursor: dragAxis === 'horizontal' ? 'grabbing' : 'grab',
                '&:hover': { bgcolor: '#868E96' },
              }}
            />
          </Box>
        )}

        {scrollState.vertical && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              right: '4px',
              bottom: scrollState.horizontal ? '22px' : 0,
              width: '10px',
              borderRadius: '10px',
              bgcolor: 'transparent',
              opacity: showScrollbars ? 1 : 0,
              pointerEvents: showScrollbars ? 'auto' : 'none',
              transition: 'opacity 120ms ease',
              zIndex: 5,
            }}
          >
            <Box
              onPointerDown={handleScrollbarPointerDown('vertical')}
              sx={{
                position: 'absolute',
                right: '2px',
                left: '2px',
                top: `${verticalThumbTop}%`,
                height: `${verticalThumbHeight}%`,
                borderRadius: '10px',
                bgcolor: dragAxis === 'vertical' ? '#868E96' : '#ADB5BD',
                cursor: dragAxis === 'vertical' ? 'grabbing' : 'grab',
                '&:hover': { bgcolor: '#868E96' },
              }}
            />
          </Box>
        )}
      </Box>
    </Stack>
  )
}

export default EventDetailDriverTreeScoreboardSection
