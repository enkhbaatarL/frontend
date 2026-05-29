import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelTradeRowKind, FundamentalModelTradeVolumesData } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIFrozenColumnScrollLayout from '@/pages/mi/fundamentalModel/components/common/MIFrozenColumnScrollLayout'
import FundamentalModelTradeSummaryToolbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelTradeSummaryToolbar'
import {
  FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
  FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
  FM_VOLUME_TABLE_BODY_H,
  FM_VOLUME_TABLE_BORDER,
  FM_VOLUME_TABLE_HEADER_H,
  FM_VOLUME_TRADE_FROM_COL_WIDTHS,
  FM_VOLUME_TRADE_TABLE_BODY_MAX_HEIGHT,
  FM_VOLUME_TRADE_TABLE_HEADER_H,
  FM_VOLUME_TRADE_TO_COL_W,
  fmVolumeTradeFromColumnWidth,
  fmVolumeHiddenHorizontalScrollbarSx,
  fmVolumeTableBodyCellSx,
  fmVolumeTableFrameSx,
  fmVolumeTableHeaderCellSx,
  fmVolumeTradeBodyCellSx,
  fmVolumeTradeColumnsWidth,
  mergeVolumeTableSx,
  miThinScrollbarSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelTradeVolumesTableProps {
  data: FundamentalModelTradeVolumesData
  loading?: boolean
}

const rowTypography = (kind: FundamentalModelTradeRowKind) => {
  if (kind === 'country') return { variant: 'body2R14' as const }
  return { variant: 'body2SB14' as const }
}

const tradeBodyScrollWrapperProps = {
  maxHeight: FM_VOLUME_TRADE_TABLE_BODY_MAX_HEIGHT,
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

/** 데이터 미도착 시 사용할 기본 행/열 수(Trade 표 고정 구조 기준) */
export const TRADE_SKELETON_COL_COUNT = FM_VOLUME_TRADE_FROM_COL_WIDTHS.length
export const TRADE_SKELETON_ROW_COUNT = 18

/** 올해 기준 연도 옵션(올해 포함 +9년, 총 10개) */
const buildTradeYearOptions = (count = 10) => {
  const startYear = new Date().getFullYear()
  return Array.from({ length: count }, (_, i) => {
    const year = String(startYear + i)
    return { id: year, label: year }
  })
}

/** 상단 툴바(LNG/연도/Unit) - 표 매트릭스와 별도로 즉시 노출할 기본값 */
const TRADE_TOOLBAR_FALLBACK = {
  productOptions: [
    { id: 'lng', label: 'LNG' },
    { id: 'png', label: 'PNG' },
  ],
  yearOptions: buildTradeYearOptions(),
  selectedProductId: 'lng',
  selectedYearId: String(new Date().getFullYear()),
  unitLabel: 'mtpa',
}

const resolveTradeToolbarProps = (data: FundamentalModelTradeVolumesData) => ({
  productOptions: data.productOptions.length > 0 ? data.productOptions : [...TRADE_TOOLBAR_FALLBACK.productOptions],
  yearOptions: data.yearOptions.length > 0 ? data.yearOptions : TRADE_TOOLBAR_FALLBACK.yearOptions,
  selectedProductId: data.selectedProductId || TRADE_TOOLBAR_FALLBACK.selectedProductId,
  selectedYearId: data.selectedYearId || TRADE_TOOLBAR_FALLBACK.selectedYearId,
  unitLabel: data.unitLabel || TRADE_TOOLBAR_FALLBACK.unitLabel,
})

/** 셀 안에 들어갈 회색 데이터 바 */
const tradeSkeletonBarSx = { width: '64%', borderRadius: '4px' } as const

/**
 * Trade 표 스켈레톤: 표 프레임/헤더(To country | From country)는 그대로 유지하고
 * 국가 라벨과 데이터 셀만 회색 바로 채워, API 호출 전에도 표가 고정되어 보이도록 한다.
 * Trade 매트릭스 API 연동 시 `loading` 분기에서 사용 예정.
 */
export const TradeVolumesTableSkeleton = ({
  colCount = TRADE_SKELETON_COL_COUNT,
  rowCount = TRADE_SKELETON_ROW_COUNT,
}: {
  colCount?: number
  rowCount?: number
}) => {
  const columns = Array.from({ length: colCount })
  const rows = Array.from({ length: rowCount })

  return (
    <Box
      sx={mergeVolumeTableSx(fmVolumeTableFrameSx, {
        maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      })}
    >
      {/* 헤더: To country / From country 라벨은 고정, 국가 컬럼 라벨은 스켈레톤 */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
        <Stack sx={{ width: FM_VOLUME_TRADE_TO_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER }}>
          <Box sx={mergeVolumeTableSx(fmVolumeTableHeaderCellSx, { height: FM_VOLUME_TABLE_HEADER_H, borderRight: 'none' })} />
          <Box sx={mergeVolumeTableSx(fmVolumeTableHeaderCellSx, { height: FM_VOLUME_TABLE_BODY_H, borderRight: 'none' })}>
            <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
              To country
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={mergeVolumeTableSx(fmVolumeTableHeaderCellSx, { height: FM_VOLUME_TABLE_HEADER_H, width: '100%' })}>
            <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
              From country
            </Typography>
          </Box>
          <Stack direction="row" alignItems="flex-start" sx={{ width: 'max-content' }}>
            {columns.map((_, colIdx) => {
              const colWidth = fmVolumeTradeFromColumnWidth(colIdx)
              return (
                <Box
                  key={`sk-head-${colIdx}`}
                  sx={mergeVolumeTableSx(fmVolumeTableBodyCellSx, {
                    width: colWidth,
                    minWidth: colWidth,
                    flexShrink: 0,
                    justifyContent: 'flex-end',
                    bgcolor: 'commonColor.White',
                  })}
                >
                  <Skeleton variant="rounded" height={14} sx={tradeSkeletonBarSx} />
                </Box>
              )
            })}
          </Stack>
        </Box>
      </Box>

      {/* 본문: 고정열(To country) + 데이터 셀 모두 회색 바 */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', minHeight: 0 }}>
        <Stack sx={{ width: FM_VOLUME_TRADE_TO_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER }}>
          {rows.map((_, rowIdx) => (
            <Box key={`sk-row-${rowIdx}`} sx={fmVolumeTableBodyCellSx}>
              <Skeleton variant="rounded" height={14} sx={tradeSkeletonBarSx} />
            </Box>
          ))}
        </Stack>

        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Stack direction="row" alignItems="flex-start" sx={{ width: 'max-content' }}>
            {columns.map((_, colIdx) => {
              const colWidth = fmVolumeTradeFromColumnWidth(colIdx)
              return (
                <Stack key={`sk-bcol-${colIdx}`} sx={{ width: colWidth, minWidth: colWidth, flexShrink: 0 }}>
                  {rows.map((__, rowIdx) => (
                    <Box key={`sk-cell-${colIdx}-${rowIdx}`} sx={[fmVolumeTableBodyCellSx, { justifyContent: 'flex-end' }]}>
                      <Skeleton variant="rounded" height={14} sx={tradeSkeletonBarSx} />
                    </Box>
                  ))}
                </Stack>
              )
            })}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

/** Trade From/To 국가 매트릭스 표 */
const FundamentalModelTradeVolumesTable = memo(({ data, loading = false }: FundamentalModelTradeVolumesTableProps) => {
  const { fromColumns, toRows } = data
  const [selectedProductId, setSelectedProductId] = useState(data.selectedProductId)
  const [selectedYearId, setSelectedYearId] = useState(data.selectedYearId)

  useEffect(() => {
    setSelectedProductId(data.selectedProductId)
    setSelectedYearId(data.selectedYearId)
  }, [data.selectedProductId, data.selectedYearId])

  const monthScrollWidth = fmVolumeTradeColumnsWidth(fromColumns.length)

  const headerMonthScrollRef = useRef<HTMLDivElement>(null)
  const bodyMonthScrollRef = useRef<HTMLDivElement>(null)
  const footerMonthScrollRef = useRef<HTMLDivElement>(null)
  const syncingHorizontalRef = useRef(false)

  const syncHorizontalScroll = useCallback((source: 'header' | 'body' | 'footer') => {
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
    syncingHorizontalRef.current = false
  }, [])

  const hiddenMonthScrollBoxProps = useMemo(() => ({ sx: fmVolumeHiddenHorizontalScrollbarSx }), [])
  const toolbarProps = resolveTradeToolbarProps(data)

  const headerFrozen = (
    <Stack sx={{ width: FM_VOLUME_TRADE_TO_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER }}>
      <Box
        sx={mergeVolumeTableSx(fmVolumeTableHeaderCellSx, {
          height: FM_VOLUME_TABLE_HEADER_H,
          borderRight: 'none',
        })}
      />
      <Box
        sx={mergeVolumeTableSx(fmVolumeTableHeaderCellSx, {
          height: FM_VOLUME_TABLE_BODY_H,
          borderRight: 'none',
        })}
      >
        <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
          To country
        </Typography>
      </Box>
    </Stack>
  )

  const headerScrollable = (
    <Stack sx={{ minWidth: 0 }}>
      <Box
        sx={mergeVolumeTableSx(fmVolumeTableHeaderCellSx, {
          height: FM_VOLUME_TABLE_HEADER_H,
          width: '100%',
        })}
      >
        <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
          From country
        </Typography>
      </Box>
      <Stack direction="row" alignItems="flex-start">
        {fromColumns.map((col, colIdx) => {
          const colWidth = fmVolumeTradeFromColumnWidth(colIdx)
          return (
            <Box
              key={col.id}
              sx={mergeVolumeTableSx(fmVolumeTableBodyCellSx, {
                width: colWidth,
                minWidth: colWidth,
                flexShrink: 0,
                justifyContent: 'flex-end',
                bgcolor: 'commonColor.White',
              })}
            >
              <Typography {...rowTypography(col.kind)} color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
                {col.label}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Stack>
  )

  const bodyFrozen = (
    <Stack sx={{ width: FM_VOLUME_TRADE_TO_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER, overflow: 'clip' }}>
      {toRows.map((row, rowIdx) => {
        const nextIsTotal = toRows[rowIdx + 1]?.kind === 'total'
        const isTotal = row.kind === 'total'
        return (
          <Box key={row.id} sx={[fmVolumeTableBodyCellSx, fmVolumeTradeBodyCellSx(isTotal, nextIsTotal)]}>
            <Typography {...rowTypography(row.kind)} color="gray.90" noWrap sx={{ width: '100%' }}>
              {row.label}
            </Typography>
          </Box>
        )
      })}
    </Stack>
  )

  const bodyScrollable = (
    <Stack direction="row" alignItems="flex-start">
      {fromColumns.map((col, colIdx) => {
        const colWidth = fmVolumeTradeFromColumnWidth(colIdx)
        return (
          <Stack key={col.id} sx={{ width: colWidth, minWidth: colWidth, flexShrink: 0 }}>
            {toRows.map((row, rowIdx) => {
              const nextIsTotal = toRows[rowIdx + 1]?.kind === 'total'
              const isTotal = row.kind === 'total'
              const isRegionCol = col.kind === 'region'
              const isRegionRow = row.kind === 'region'
              const useStrong = isTotal || isRegionCol || isRegionRow
              return (
                <Box
                  key={`${row.id}-${col.id}`}
                  sx={[fmVolumeTableBodyCellSx, fmVolumeTradeBodyCellSx(isTotal, nextIsTotal), { justifyContent: 'flex-end' }]}
                >
                  <Typography
                    variant={useStrong ? 'body2SB14' : 'body2R14'}
                    color="gray.90"
                    noWrap
                    sx={{ width: '100%', textAlign: 'right' }}
                  >
                    {row.values[colIdx] ?? ''}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        )
      })}
    </Stack>
  )

  return (
    <Stack gap="10px">
      <FundamentalModelTradeSummaryToolbar
        {...toolbarProps}
        selectedProductId={selectedProductId}
        selectedYearId={selectedYearId}
        loading={loading}
        onProductChange={setSelectedProductId}
        onYearChange={setSelectedYearId}
      />

      <Box
        sx={mergeVolumeTableSx(fmVolumeTableFrameSx, {
          maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        })}
      >
        <Box sx={{ flexShrink: 0 }}>
          <MIFrozenColumnScrollLayout
            frozen={headerFrozen}
            scrollable={headerScrollable}
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
            maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT - FM_VOLUME_TRADE_TABLE_HEADER_H,
          }}
        >
          <ScrollWrapper {...tradeBodyScrollWrapperProps} contentKey={toRows.length}>
            <MIFrozenColumnScrollLayout
              frozen={bodyFrozen}
              scrollable={bodyScrollable}
              horizontalScrollRef={bodyMonthScrollRef}
              scrollBoxProps={{
                ...hiddenMonthScrollBoxProps,
                onScroll: () => syncHorizontalScroll('body'),
              }}
            />
          </ScrollWrapper>

          <Box
            ref={footerMonthScrollRef}
            onScroll={() => syncHorizontalScroll('footer')}
            sx={mergeVolumeTableSx(
              {
                flexShrink: 0,
                height: FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
                marginLeft: `${FM_VOLUME_TRADE_TO_COL_W}px`,
                overflowX: 'auto',
                overflowY: 'hidden',
              },
              miThinScrollbarSx,
            )}
          >
            <Box sx={{ width: monthScrollWidth, height: 1 }} aria-hidden />
          </Box>
        </Box>
      </Box>
    </Stack>
  )
})

FundamentalModelTradeVolumesTable.displayName = 'FundamentalModelTradeVolumesTable'

export default FundamentalModelTradeVolumesTable
