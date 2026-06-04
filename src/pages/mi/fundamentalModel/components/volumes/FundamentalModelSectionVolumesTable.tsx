import { Box, Stack, Typography } from '@mui/material'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  FundamentalModelVolumesColumn,
  FundamentalModelVolumesRegion,
  FundamentalModelVolumesRow,
  FundamentalModelVolumesRowKind,
  FundamentalModelVolumesType,
} from '@/service/mi/fundamentalModel/case'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIFrozenColumnScrollLayout from '@/pages/mi/fundamentalModel/components/common/MIFrozenColumnScrollLayout'
import FundamentalModelHoverHorizontalScrollbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelHoverHorizontalScrollbar'
import {
  FM_VOLUME_GLOBAL_COUNTRY_COL_W,
  FM_VOLUME_GLOBAL_FROZEN_W,
  FM_VOLUME_GLOBAL_SECTION_COL_W,
  FM_VOLUME_GLOBAL_TABLE_BODY_MAX_HEIGHT,
  FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
  FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
  FM_VOLUME_TABLE_SKELETON_H,
  FM_VOLUME_TABLE_BODY_H,
  FM_VOLUME_TABLE_BORDER,
  FM_VOLUME_TABLE_COLUMN_HEADER_SHADOW,
  FM_VOLUME_TABLE_HEADER_H,
  FM_VOLUME_TABLE_HOVER_SCROLL_CLASS,
  FM_VOLUME_MONTH_COL_W,
  FM_VOLUME_TABLE_ROW_HEADER_SHADOW,
  FM_VOLUME_TABLE_SCROLL_SHADOW_EPSILON_PX,
  FM_VOLUME_TABLE_SCROLL_SHADOW_TRANSITION,
  FM_VOLUME_TOTAL_CELL_BG,
  FM_VOLUME_TABLE_TOTAL_ROW_BORDER,
  fmVolumeGlobalBodyCellSx,
  fmVolumeHiddenHorizontalScrollbarSx,
  fmVolumeMonthColumnsWidth,
  fmVolumeTableBodyCellSx,
  fmVolumeTableFrameSx,
  fmVolumeTableHeaderCellSx,
  mergeVolumeTableSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelSectionVolumesTableProps {
  /** 시간축 컬럼(getVolumes columns) */
  columns: FundamentalModelVolumesColumn[]
  /** 본문 행(getVolumes rows) - type 순서로 묶여서 응답되는 것을 가정 */
  rows: FundamentalModelVolumesRow[]
  loading?: boolean
}

/** type enum -> 섹션 표시용 라벨 (없으면 enum 자체를 노출) */
const VOLUME_TYPE_LABEL: Record<FundamentalModelVolumesType, string> = {
  DEMAND: 'Demand',
  PRODUCTION: 'Production',
  LNG_IMPORTS: 'LNG Imports',
  LNG_EXPORTS: 'LNG Exports',
  PIPELINE_IMPORTS: 'Pipeline Imports',
  PIPELINE_EXPORTS: 'Pipeline Exports',
}

/** region enum -> 표시 라벨(REGION_SUBTOTAL 행에서 사용) */
const VOLUME_REGION_LABEL: Record<FundamentalModelVolumesRegion, string> = {
  ASIA: 'Asia',
  EUROPE: 'Europe',
  NORTH_AMERICA: 'North America',
  MIDDLE_EAST: 'Middle East',
  AUSTRALIA: 'Australia',
  RUSSIA: 'Russia',
  AFRICA: 'Africa',
  SOUTH_AMERICA: 'South America',
}

const rowTypography = (kind: FundamentalModelVolumesRowKind) => {
  if (kind === 'COUNTRY') return { variant: 'body2R14' as const }
  return { variant: 'body2SB14' as const }
}

const formatVolumeCell = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return value.toFixed(1)
}

const resolveRowLabel = (row: FundamentalModelVolumesRow): string => {
  if (row.rowKind === 'TYPE_TOTAL') return 'Total'
  if (row.rowKind === 'REGION_SUBTOTAL') return VOLUME_REGION_LABEL[row.region] ?? row.region
  return row.country ?? VOLUME_REGION_LABEL[row.region] ?? ''
}

interface SectionGroup {
  type: FundamentalModelVolumesType
  label: string
  rows: FundamentalModelVolumesRow[]
}

interface SectionLabelLayout {
  labelRows: number
  totalRows: number
}

const sortRowsWithRegionSubtotalFirst = (rows: FundamentalModelVolumesRow[]): FundamentalModelVolumesRow[] => {
  const totalRows = rows.filter((row) => row.rowKind === 'TYPE_TOTAL')
  const regionRows = new Map<FundamentalModelVolumesRegion, FundamentalModelVolumesRow[]>()
  const regionOrder: FundamentalModelVolumesRegion[] = []

  rows.forEach((row) => {
    if (row.rowKind === 'TYPE_TOTAL') return
    if (!regionRows.has(row.region)) {
      regionRows.set(row.region, [])
      regionOrder.push(row.region)
    }
    regionRows.get(row.region)!.push(row)
  })

  return [
    ...regionOrder.flatMap((region) => {
      const rowsByRegion = regionRows.get(region) ?? []
      const subtotalRows = rowsByRegion.filter((row) => row.rowKind === 'REGION_SUBTOTAL')
      const detailRows = rowsByRegion.filter((row) => row.rowKind !== 'REGION_SUBTOTAL')
      return [...subtotalRows, ...detailRows]
    }),
    ...totalRows,
  ]
}

/** API rows를 type 순서대로 그룹핑(응답 순서 보존) */
const groupRowsByType = (rows: FundamentalModelVolumesRow[]): SectionGroup[] => {
  const map = new Map<FundamentalModelVolumesType, SectionGroup>()
  const order: FundamentalModelVolumesType[] = []
  for (const row of rows) {
    if (!map.has(row.type)) {
      const label = VOLUME_TYPE_LABEL[row.type] ?? String(row.type)
      map.set(row.type, { type: row.type, label, rows: [] })
      order.push(row.type)
    }
    map.get(row.type)!.rows.push(row)
  }
  return order.map((type) => {
    const section = map.get(type)!
    return { ...section, rows: sortRowsWithRegionSubtotalFirst(section.rows) }
  })
}

/** 섹션 좌측 라벨 영역 - TYPE_TOTAL 직전까지가 라벨 표시 영역, 이후는 음영 처리 */
const getSectionLabelLayout = (sectionRows: FundamentalModelVolumesRow[]): SectionLabelLayout => {
  if (sectionRows.length === 0) return { labelRows: 0, totalRows: 0 }
  const firstTotalIndex = sectionRows.findIndex((row) => row.rowKind === 'TYPE_TOTAL')
  if (firstTotalIndex < 0) return { labelRows: sectionRows.length, totalRows: 0 }
  const labelRows = firstTotalIndex === 0 ? 1 : firstTotalIndex
  const totalRows = Math.max(sectionRows.length - labelRows, 0)
  return { labelRows, totalRows }
}

const volumeBodyScrollWrapperProps = {
  maxHeight: FM_VOLUME_GLOBAL_TABLE_BODY_MAX_HEIGHT,
  scrollbarGap: 0,
  thumbInsetTop: 6,
  thumbInsetBottom: 6,
  thumbWidth: 4,
  showScrollbarOnHover: true,
  showScrollEdgeShadow: true,
  sx: {
    flex: '0 1 auto',
    width: '100%',
    minWidth: 0,
  },
  styScroll: { borderRadius: '1000px' },
} as const

const SectionVolumesTableSkeleton = () => (
  <Box
    aria-hidden
    sx={mergeVolumeTableSx(fmVolumeTableFrameSx, {
      height: FM_VOLUME_TABLE_SKELETON_H,
      maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
      minHeight: 360,
      bgcolor: 'gray.5',
      border: FM_VOLUME_TABLE_BORDER,
      borderRadius: '8px',
      boxSizing: 'border-box',
    })}
  />
)

/**
 * Global/LNG 세부 표(섹션+국가 고정열, 월 가로 스크롤)
 * - 데이터: getVolumes columns/rows API 직결
 * - 세로: ScrollWrapper(maxHeight), 콘텐츠 높이만큼만 차지
 * - 가로: 본문 바로 아래 트랙(표 프레임 내부), max-height 900px 초과 시 본문만 세로 스크롤
 */
const FundamentalModelSectionVolumesTable = memo(({ columns, rows, loading = false }: FundamentalModelSectionVolumesTableProps) => {
  const sections = useMemo(() => groupRowsByType(rows), [rows])
  const monthLabels = useMemo(() => columns.map((column) => column.periodLabel), [columns])

  const monthScrollWidth = fmVolumeMonthColumnsWidth(monthLabels.length)

  const headerMonthScrollRef = useRef<HTMLDivElement>(null)
  const bodyMonthScrollRef = useRef<HTMLDivElement>(null)
  const footerMonthScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const syncingHorizontalRef = useRef(false)
  const [hasScrolledX, setHasScrolledX] = useState(false)
  const [hasScrolledY, setHasScrolledY] = useState(false)

  const updateHorizontalScrollShadow = useCallback((scrollLeft: number) => {
    const next = scrollLeft > FM_VOLUME_TABLE_SCROLL_SHADOW_EPSILON_PX
    setHasScrolledX((prev) => (prev === next ? prev : next))
  }, [])

  const updateVerticalScrollShadow = useCallback(() => {
    const next = (bodyScrollRef.current?.scrollTop ?? 0) > FM_VOLUME_TABLE_SCROLL_SHADOW_EPSILON_PX
    setHasScrolledY((prev) => (prev === next ? prev : next))
  }, [])

  const syncHorizontalScroll = useCallback(
    (source: 'header' | 'body' | 'footer') => {
      if (syncingHorizontalRef.current) return
      const headerEl = headerMonthScrollRef.current
      const bodyEl = bodyMonthScrollRef.current
      const footerEl = footerMonthScrollRef.current
      if (!headerEl || !bodyEl || !footerEl) return

      syncingHorizontalRef.current = true
      const scrollLeft = source === 'footer' ? footerEl.scrollLeft : source === 'header' ? headerEl.scrollLeft : bodyEl.scrollLeft
      headerEl.scrollLeft = scrollLeft
      bodyEl.scrollLeft = scrollLeft
      footerEl.scrollLeft = scrollLeft
      updateHorizontalScrollShadow(scrollLeft)
      syncingHorizontalRef.current = false
    },
    [updateHorizontalScrollShadow],
  )

  useEffect(() => {
    const scrollEl = bodyScrollRef.current
    updateVerticalScrollShadow()
    if (!scrollEl) return undefined

    scrollEl.addEventListener('scroll', updateVerticalScrollShadow)
    window.addEventListener('resize', updateVerticalScrollShadow)

    const resizeObserver = new ResizeObserver(updateVerticalScrollShadow)
    resizeObserver.observe(scrollEl)
    if (scrollEl.firstElementChild) resizeObserver.observe(scrollEl.firstElementChild)

    return () => {
      scrollEl.removeEventListener('scroll', updateVerticalScrollShadow)
      window.removeEventListener('resize', updateVerticalScrollShadow)
      resizeObserver.disconnect()
    }
  }, [loading, rows.length, updateVerticalScrollShadow])

  useEffect(() => {
    const scrollLeft =
      footerMonthScrollRef.current?.scrollLeft ?? bodyMonthScrollRef.current?.scrollLeft ?? headerMonthScrollRef.current?.scrollLeft ?? 0
    updateHorizontalScrollShadow(scrollLeft)
  }, [loading, monthScrollWidth, updateHorizontalScrollShadow])

  if (loading) {
    return <SectionVolumesTableSkeleton />
  }

  const columnHeaderShadowSx = {
    position: 'relative',
    zIndex: hasScrolledY ? 3 : 1,
    boxShadow: hasScrolledY ? FM_VOLUME_TABLE_COLUMN_HEADER_SHADOW : 'none',
    transition: FM_VOLUME_TABLE_SCROLL_SHADOW_TRANSITION,
  } as const

  const rowHeaderShadowSx = {
    position: 'relative',
    zIndex: hasScrolledX ? 3 : 1,
    boxShadow: hasScrolledX ? FM_VOLUME_TABLE_ROW_HEADER_SHADOW : 'none',
    transition: FM_VOLUME_TABLE_SCROLL_SHADOW_TRANSITION,
  } as const

  const headerFrozen = (
    <Stack direction="row" sx={[{ flexShrink: 0 }, rowHeaderShadowSx]}>
      <Box sx={{ width: FM_VOLUME_GLOBAL_SECTION_COL_W, flexShrink: 0 }}>
        <Box sx={fmVolumeTableHeaderCellSx} />
      </Box>
      <Box sx={{ width: FM_VOLUME_GLOBAL_COUNTRY_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER }}>
        <Box sx={fmVolumeTableHeaderCellSx}>
          <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
            국가
          </Typography>
        </Box>
      </Box>
    </Stack>
  )

  const headerMonthColumns = (
    <Stack direction="row" alignItems="flex-start" sx={{ width: '100%', minWidth: monthScrollWidth }}>
      {monthLabels.map((month, colIdx) => (
        <Stack key={`${month}-${colIdx}`} sx={{ flex: `1 0 ${FM_VOLUME_MONTH_COL_W}px`, minWidth: FM_VOLUME_MONTH_COL_W }}>
          <Box sx={[fmVolumeTableHeaderCellSx, { justifyContent: 'flex-end' }]}>
            <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
              {month}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  )

  const flatRows: { sectionType: FundamentalModelVolumesType; row: FundamentalModelVolumesRow }[] = []
  sections.forEach((section) => {
    section.rows.forEach((row) => flatRows.push({ sectionType: section.type, row }))
  })

  const bodyFrozenColumns = (
    <Stack direction="row" alignItems="flex-start" sx={[{ flexShrink: 0 }, rowHeaderShadowSx]}>
      <Stack sx={{ width: FM_VOLUME_GLOBAL_SECTION_COL_W, flexShrink: 0 }}>
        {sections.map((section) => {
          const layout = getSectionLabelLayout(section.rows)
          return (
            <Box key={section.type}>
              {layout.labelRows > 0 && (
                <Box
                  sx={{
                    height: layout.labelRows * FM_VOLUME_TABLE_BODY_H,
                    px: '12px',
                    py: '10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    bgcolor: 'commonColor.White',
                    borderBottom: layout.totalRows > 0 ? 'none' : FM_VOLUME_TABLE_BORDER,
                    boxSizing: 'border-box',
                  }}
                >
                  <Typography variant="body2SB14" color="gray.90" sx={{ whiteSpace: 'pre-wrap' }}>
                    {section.label}
                  </Typography>
                </Box>
              )}
              {Array.from({ length: layout.totalRows }).map((_, idx) => (
                <Box
                  key={`${section.type}-total-${idx}`}
                  sx={{
                    height: FM_VOLUME_TABLE_BODY_H,
                    bgcolor: FM_VOLUME_TOTAL_CELL_BG,
                    borderTop: FM_VOLUME_TABLE_BORDER,
                    borderBottom: idx === layout.totalRows - 1 ? FM_VOLUME_TABLE_TOTAL_ROW_BORDER : 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ))}
            </Box>
          )
        })}
      </Stack>

      <Stack sx={{ width: FM_VOLUME_GLOBAL_COUNTRY_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER, overflow: 'clip' }}>
        {flatRows.map(({ sectionType, row }, rowIdx) => {
          const nextIsTotal = flatRows[rowIdx + 1]?.row.rowKind === 'TYPE_TOTAL'
          const isTotal = row.rowKind === 'TYPE_TOTAL'
          const isRegion = row.rowKind === 'REGION_SUBTOTAL'
          return (
            <Box
              key={`${sectionType}-${row.region}-${row.rowKind}-${row.country ?? 'NA'}-${rowIdx}`}
              sx={[fmVolumeTableBodyCellSx, fmVolumeGlobalBodyCellSx(isTotal, nextIsTotal, isRegion)]}
            >
              <Typography {...rowTypography(row.rowKind)} color="gray.90" noWrap sx={{ width: '100%' }}>
                {resolveRowLabel(row)}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Stack>
  )

  const bodyMonthColumns = (
    <Stack direction="row" alignItems="flex-start" sx={{ width: '100%', minWidth: monthScrollWidth }}>
      {monthLabels.map((month, colIdx) => (
        <Stack key={`${month}-${colIdx}`} sx={{ flex: `1 0 ${FM_VOLUME_MONTH_COL_W}px`, minWidth: FM_VOLUME_MONTH_COL_W }}>
          {flatRows.map(({ sectionType, row }, rowIdx) => {
            const nextIsTotal = flatRows[rowIdx + 1]?.row.rowKind === 'TYPE_TOTAL'
            const isTotal = row.rowKind === 'TYPE_TOTAL'
            const isRegion = row.rowKind === 'REGION_SUBTOTAL'
            return (
              <Box
                key={`${sectionType}-${row.region}-${row.rowKind}-${row.country ?? 'NA'}-${rowIdx}-${colIdx}`}
                sx={[fmVolumeTableBodyCellSx, fmVolumeGlobalBodyCellSx(isTotal, nextIsTotal, isRegion), { justifyContent: 'flex-end' }]}
              >
                <Typography {...rowTypography(row.rowKind)} color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
                  {formatVolumeCell(row.values[colIdx])}
                </Typography>
              </Box>
            )
          })}
        </Stack>
      ))}
    </Stack>
  )

  const hiddenMonthScrollBoxProps = {
    sx: fmVolumeHiddenHorizontalScrollbarSx,
  } as const

  const tableBodyAreaMaxHeight = FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT - FM_VOLUME_TABLE_HEADER_H

  return (
    <Box
      className={FM_VOLUME_TABLE_HOVER_SCROLL_CLASS}
      sx={mergeVolumeTableSx(fmVolumeTableFrameSx, {
        maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'visible',
      })}
    >
      <Box sx={{ flexShrink: 0, ...columnHeaderShadowSx }}>
        <MIFrozenColumnScrollLayout
          frozen={headerFrozen}
          scrollable={headerMonthColumns}
          horizontalScrollRef={headerMonthScrollRef}
          scrollBoxProps={{
            ...hiddenMonthScrollBoxProps,
            onScroll: () => syncHorizontalScroll('header'),
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: tableBodyAreaMaxHeight,
        }}
      >
        <ScrollWrapper ref={bodyScrollRef} {...volumeBodyScrollWrapperProps} contentKey={flatRows.length}>
          <MIFrozenColumnScrollLayout
            frozen={bodyFrozenColumns}
            scrollable={bodyMonthColumns}
            horizontalScrollRef={bodyMonthScrollRef}
            scrollBoxProps={{
              ...hiddenMonthScrollBoxProps,
              onScroll: () => syncHorizontalScroll('body'),
            }}
          />
        </ScrollWrapper>

        <Box
          sx={{
            flexShrink: 0,
            height: FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
            position: 'sticky',
            bottom: 0,
            zIndex: 2,
            bgcolor: 'commonColor.White',
          }}
        >
          <Box
            ref={footerMonthScrollRef}
            onScroll={() => syncHorizontalScroll('footer')}
            sx={mergeVolumeTableSx(
              {
                height: '100%',
                marginLeft: `${FM_VOLUME_GLOBAL_FROZEN_W}px`,
                overflowX: 'auto',
                overflowY: 'hidden',
              },
              fmVolumeHiddenHorizontalScrollbarSx,
            )}
          >
            <Box sx={{ width: monthScrollWidth, height: 1 }} aria-hidden />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: `${FM_VOLUME_GLOBAL_FROZEN_W}px`,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <FundamentalModelHoverHorizontalScrollbar
              scrollRef={footerMonthScrollRef}
              contentWidthKey={monthScrollWidth}
              hoverRootClassName={FM_VOLUME_TABLE_HOVER_SCROLL_CLASS}
              onScrollLeftChange={() => syncHorizontalScroll('footer')}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
})

FundamentalModelSectionVolumesTable.displayName = 'FundamentalModelSectionVolumesTable'

export default FundamentalModelSectionVolumesTable
