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
  FM_VOLUME_TRADE_FROM_COL_MIN_W,
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

const TradeVolumesTableSkeleton = ({ colCount, rowCount }: { colCount: number; rowCount: number }) => (
  <Stack gap="10px">
    <Skeleton variant="rounded" height={28} width={280} />
    <Box sx={mergeVolumeTableSx(fmVolumeTableFrameSx, { maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT })}>
      <Skeleton variant="rounded" height={FM_VOLUME_TRADE_TABLE_HEADER_H} />
      <Box sx={{ p: '12px' }}>
        <Stack direction="row" gap={1}>
          <Skeleton variant="rounded" width={FM_VOLUME_TRADE_TO_COL_W} height={36 * rowCount} />
          <Stack direction="row" gap={0.5} flex={1}>
            {Array.from({ length: Math.min(colCount, 6) }).map((_, c) => (
              <Skeleton key={c} variant="rounded" width={FM_VOLUME_TRADE_FROM_COL_MIN_W} height={36 * rowCount} />
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  </Stack>
)

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

  if (loading) {
    return <TradeVolumesTableSkeleton colCount={fromColumns.length || 12} rowCount={toRows.length || 19} />
  }

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
        productOptions={data.productOptions}
        yearOptions={data.yearOptions}
        selectedProductId={selectedProductId}
        selectedYearId={selectedYearId}
        unitLabel={data.unitLabel}
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
