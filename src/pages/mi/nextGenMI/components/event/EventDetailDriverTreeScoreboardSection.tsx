import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import { Box, Stack } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { INextGenMIEventDriverTreeScoreboardItem } from '@/service/mi/nextGenMI/event'

import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'

type DriverImpactRow = INextGenMIEventDriverTreeScoreboardItem

const CELL_PX = 12
const ROW_MIN_HEIGHT_PX = 48
const HEADER_HEIGHT_PX = 36
const INDEX_COL_WIDTH_PX = 80
const RIGHT_FADE_WIDTH_PX = 100
const SHADOW = '6px 0 10px rgba(0, 0, 0, 0.08)'

const LV1_WIDTH = 120
const LV2_WIDTH = 240
const LV3_WIDTH = 260
const SHORT_WIDTH = 140
const LONG_WIDTH = 140
const REASON_WIDTH = 520

const groupRowsByIndex = (rows: DriverImpactRow[]) => {
  const out: Array<{ indexName: string; rows: DriverImpactRow[] }> = []
  rows.forEach((r) => {
    const key = String(r.indexName ?? '').trim()
    if (!key) {
      out.push({ indexName: '', rows: [r] })
      return
    }
    const last = out[out.length - 1]
    if (last && last.indexName === key) {
      last.rows.push(r)
      return
    }
    out.push({ indexName: key, rows: [r] })
  })
  return out
}

interface EventDetailDriverTreeScoreboardSectionProps {
  driverTreeScoreboard?: INextGenMIEventDriverTreeScoreboardItem[]
}

const EventDetailDriverTreeScoreboardSection = ({ driverTreeScoreboard = [] }: EventDetailDriverTreeScoreboardSectionProps) => {
  const groups = useMemo(() => groupRowsByIndex(driverTreeScoreboard), [driverTreeScoreboard])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined

    const sync = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      const max = Math.max(0, scrollWidth - clientWidth)
      setCanScrollLeft(scrollLeft > 1)
      setCanScrollRight(scrollLeft < max - 1)
    }

    sync()
    el.addEventListener('scroll', sync, { passive: true })
    const ro = new ResizeObserver(() => sync())
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', sync)
      ro.disconnect()
    }
  }, [groups.length])

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<AccountTreeRoundedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="Index Driver별 영향도 분석"
        tooltipTitle=""
      />
      <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden', bgcolor: 'commonColor.White', borderRadius: '10px' }}>
        <Box
          ref={scrollRef}
          sx={{
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#ADB5BD transparent',
            '&::-webkit-scrollbar': { height: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#ADB5BD', borderRadius: '10px' },
            '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#868E96' },
          }}
        >
          <Box
            component="table"
            sx={{
              width: 'max-content',
              minWidth: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'fixed',
            }}
          >
            <Box component="thead" sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'commonColor.White' }}>
              <Box component="tr">
                <Box
                  component="th"
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    bgcolor: 'commonColor.White',
                    boxShadow: canScrollLeft ? SHADOW : 'none',
                    width: INDEX_COL_WIDTH_PX,
                    minWidth: INDEX_COL_WIDTH_PX,
                    maxWidth: INDEX_COL_WIDTH_PX,
                    borderBottom: '1px solid',
                    borderColor: 'contentBorder.Normal',
                  }}
                >
                  <Box sx={{ height: HEADER_HEIGHT_PX, px: `${CELL_PX}px`, display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontSize: 14, fontWeight: 600, color: 'contentText.Black', whiteSpace: 'nowrap' }}>
                      대상
                    </Box>
                  </Box>
                </Box>
                {(
                  [
                    { label: 'Driver Lv1', width: LV1_WIDTH, align: 'left' as const },
                    { label: 'Driver Lv2', width: LV2_WIDTH, align: 'left' as const },
                    { label: 'Driver Lv3', width: LV3_WIDTH, align: 'left' as const },
                    { label: '단기 영향', width: SHORT_WIDTH, align: 'center' as const },
                    { label: '중장기 영향', width: LONG_WIDTH, align: 'center' as const },
                    { label: '근거', width: REASON_WIDTH, align: 'left' as const },
                  ] as const
                ).map((c) => (
                  <Box
                    key={c.label}
                    component="th"
                    sx={{
                      height: HEADER_HEIGHT_PX,
                      px: `${CELL_PX}px`,
                      textAlign: c.align,
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'contentText.Black',
                      borderBottom: '1px solid',
                      borderColor: 'contentBorder.Normal',
                      whiteSpace: 'nowrap',
                      width: c.width,
                      minWidth: c.width,
                      maxWidth: c.width,
                      boxSizing: 'border-box',
                    }}
                  >
                    {c.label}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box component="tbody">
              {groups.flatMap((g, groupIndex) =>
                g.rows.map((r, rowIndex) => {
                  const showIndexCell = rowIndex === 0
                  const rowSpan = g.indexName ? g.rows.length : 1
                  const rowKey = `${g.indexName || 'no-index'}-${groupIndex}-${rowIndex}`
                  return (
                    <Box
                      component="tr"
                      key={rowKey}
                      sx={{
                        transition: 'background-color 120ms ease',
                        '&:hover td': { backgroundColor: 'gray.10' },
                        '&:hover [data-sticky-index="true"]': { backgroundColor: 'gray.10' },
                      }}
                    >
                      {showIndexCell ? (
                        <Box
                          component="td"
                          rowSpan={rowSpan}
                          data-sticky-index="true"
                          sx={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            bgcolor: 'commonColor.White',
                            boxShadow: canScrollLeft ? SHADOW : 'none',
                            width: INDEX_COL_WIDTH_PX,
                            minWidth: INDEX_COL_WIDTH_PX,
                            maxWidth: INDEX_COL_WIDTH_PX,
                            borderBottom: '1px solid',
                            borderColor: 'contentBorder.Normal',
                            verticalAlign: 'middle',
                            boxSizing: 'border-box',
                          }}
                        >
                          <Box
                            sx={{
                              height: ROW_MIN_HEIGHT_PX,
                              px: `${CELL_PX}px`,
                              display: 'flex',
                              alignItems: 'center',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {g.indexName || '-'}
                          </Box>
                        </Box>
                      ) : null}

                      {(
                        [
                          { width: LV1_WIDTH, align: 'left' as const, node: String(r.lv1Label ?? '') },
                          { width: LV2_WIDTH, align: 'left' as const, node: String(r.lv2Label ?? '') },
                          { width: LV3_WIDTH, align: 'left' as const, node: String(r.lv3Label ?? '') },
                          {
                            width: SHORT_WIDTH,
                            align: 'center' as const,
                            node: (
                              <Stack direction="row" justifyContent="center">
                                <EventIndexSignalCell
                                  indexLabel={g.indexName}
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
                            width: LONG_WIDTH,
                            align: 'center' as const,
                            node: (
                              <Stack direction="row" justifyContent="center">
                                <EventIndexSignalCell
                                  indexLabel={g.indexName}
                                  level={r.midLongTermImpactLevel}
                                  direction={r.midLongTermDirection}
                                  term="long"
                                  showTermBadge={false}
                                  size={20}
                                />
                              </Stack>
                            ),
                          },
                          { width: REASON_WIDTH, align: 'left' as const, node: String(r.reason ?? '') },
                        ] as const
                      ).map((c, idx) => (
                        <Box
                          key={idx}
                          component="td"
                          sx={{
                            px: `${CELL_PX}px`,
                            py: 0,
                            textAlign: c.align,
                            fontSize: 16,
                            fontWeight: 500,
                            color: 'contentText.Black',
                            borderBottom: '1px solid',
                            borderColor: 'contentBorder.Normal',
                            verticalAlign: 'middle',
                            height: ROW_MIN_HEIGHT_PX,
                            // 이전 테이블 느낌: 기본은 1줄 + ellipsis
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            width: c.width,
                            minWidth: c.width,
                            maxWidth: c.width,
                            boxSizing: 'border-box',
                            ...(c.width === REASON_WIDTH
                              ? {
                                // 근거 컬럼만 2줄까지 허용(디자인처럼 "통으로" 보이되 높이는 유지)
                                whiteSpace: 'normal',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.4,
                                maxHeight: 'calc(16px * 1.4 * 2)',
                              }
                              : {}),
                          }}
                        >
                          {c.node}
                        </Box>
                      ))}
                    </Box>
                  )
                }),
              )}
            </Box>
          </Box>
        </Box>

        {canScrollRight && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: RIGHT_FADE_WIDTH_PX,
              pointerEvents: 'none',
              background: 'linear-gradient(to left, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
              zIndex: 4,
            }}
          />
        )}
      </Box>
    </Stack>
  )
}

export default EventDetailDriverTreeScoreboardSection
