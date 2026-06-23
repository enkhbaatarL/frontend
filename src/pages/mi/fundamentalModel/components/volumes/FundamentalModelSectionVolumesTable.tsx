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
  FM_VOLUME_TABLE_BASE_W,
  FM_VOLUME_TABLE_COLUMN_HEADER_SHADOW,
  FM_VOLUME_TABLE_HEADER_H,
  FM_VOLUME_TABLE_HOVER_SCROLL_CLASS,
  FM_VOLUME_MONTH_COL_W,
  FM_VOLUME_TABLE_ROW_HEADER_SHADOW,
  FM_VOLUME_TABLE_SCROLL_SHADOW_EPSILON_PX,
  FM_VOLUME_TABLE_SCROLL_SHADOW_TRANSITION,
  FM_VOLUME_TOTAL_CELL_BG,
  FM_VOLUME_TABLE_TOTAL_ROW_BORDER,
  fmVolumeExpandColumnWidthsToFit,
  fmVolumeGlobalBodyCellSx,
  fmVolumeHiddenHorizontalScrollbarSx,
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

const rowTypography = (kind: FundamentalModelVolumesRowKind) => {
  if (kind === 'COUNTRY') return { variant: 'body2R14' as const }
  return { variant: 'body2SB14' as const }
}

const formatVolumeCell = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return value
  return ''
}

interface SectionGroup {
  type: FundamentalModelVolumesType
  label: string
  rows: FundamentalModelVolumesRow[]
}

interface SectionFlatRow {
  sectionType: FundamentalModelVolumesType
  row: FundamentalModelVolumesRow
}

interface SectionLabelLayout {
  labelRows: number
  totalRows: number
}

const getVolumeMonthColumnWidth = (column: FundamentalModelVolumesColumn, rows: SectionFlatRow[]): number => {
  const maxTextLength = rows.reduce((max, { row }) => Math.max(max, formatVolumeCell(row.values[column.key]).length), column.label.length)
  return Math.max(FM_VOLUME_MONTH_COL_W, Math.ceil(maxTextLength * 8 + 32))
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
      map.set(row.type, { type: row.type, label: row.typeLabel, rows: [] })
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
  const flatRows = useMemo<SectionFlatRow[]>(
    () => sections.flatMap((section) => section.rows.map((row) => ({ sectionType: section.type, row }))),
    [sections],
  )
  const tableFrameRef = useRef<HTMLDivElement>(null)
  const [tableFrameWidth, setTableFrameWidth] = useState(FM_VOLUME_TABLE_BASE_W)
  const monthColumnWidths = useMemo(
    () =>
      fmVolumeExpandColumnWidthsToFit(
        columns.map((column) => getVolumeMonthColumnWidth(column, flatRows)),
        Math.max(tableFrameWidth - FM_VOLUME_GLOBAL_FROZEN_W, 0),
      ),
    [columns, flatRows, tableFrameWidth],
  )

  const monthScrollWidth = useMemo(() => monthColumnWidths.reduce((sum, width) => sum + width, 0), [monthColumnWidths])

  const headerMonthScrollRef = useRef<HTMLDivElement>(null)
  const bodyMonthScrollRef = useRef<HTMLDivElement>(null)
  const footerMonthScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const syncingHorizontalRef = useRef(false)
  const [hasScrolledX, setHasScrolledX] = useState(false)
  const [hasScrolledY, setHasScrolledY] = useState(false)

  useEffect(() => {
    const frameEl = tableFrameRef.current
    if (!frameEl) return undefined

    const updateTableFrameWidth = () => {
      const nextWidth = frameEl.clientWidth
      if (nextWidth <= 0) return
      setTableFrameWidth((prev) => (prev === nextWidth ? prev : nextWidth))
    }

    updateTableFrameWidth()
    const resizeObserver = new ResizeObserver(updateTableFrameWidth)
    resizeObserver.observe(frameEl)

    return () => {
      resizeObserver.disconnect()
    }
  }, [loading])

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
    <Stack direction="row" alignItems="flex-start" sx={{ width: `${monthScrollWidth}px`, minWidth: `${monthScrollWidth}px` }}>
      {columns.map((column, colIdx) => {
        const columnWidth = `${monthColumnWidths[colIdx] ?? FM_VOLUME_MONTH_COL_W}px`
        return (
          <Stack key={`${column.key}-${colIdx}`} sx={{ width: columnWidth, flex: `0 0 ${columnWidth}` }}>
            <Box sx={[fmVolumeTableHeaderCellSx, { justifyContent: 'flex-end' }]}>
              <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
                {column.label}
              </Typography>
            </Box>
          </Stack>
        )
      })}
    </Stack>
  )

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
              <Typography
                {...rowTypography(row.rowKind)}
                color="gray.90"
                noWrap
                sx={{ width: '100%', boxSizing: 'border-box', paddingLeft: row.rowKind === 'COUNTRY' ? '12px' : undefined }}
              >
                {row.rowLabel}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Stack>
  )

  const bodyMonthColumns = (
    <Stack direction="row" alignItems="flex-start" sx={{ width: `${monthScrollWidth}px`, minWidth: `${monthScrollWidth}px` }}>
      {columns.map((column, colIdx) => {
        const columnWidth = `${monthColumnWidths[colIdx] ?? FM_VOLUME_MONTH_COL_W}px`
        return (
          <Stack key={`${column.key}-${colIdx}`} sx={{ width: columnWidth, flex: `0 0 ${columnWidth}` }}>
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
                    {formatVolumeCell(row.values[column.key])}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        )
      })}
    </Stack>
  )

  const hiddenMonthScrollBoxProps = {
    sx: fmVolumeHiddenHorizontalScrollbarSx,
  } as const

  const tableBodyAreaMaxHeight = FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT - FM_VOLUME_TABLE_HEADER_H

  return (
    <Box
      ref={tableFrameRef}
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
