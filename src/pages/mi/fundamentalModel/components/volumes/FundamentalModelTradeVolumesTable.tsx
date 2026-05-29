import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelTradeRowKind, FundamentalModelTradeVolumesData } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIFrozenColumnScrollLayout from '@/pages/mi/fundamentalModel/components/common/MIFrozenColumnScrollLayout'
import FundamentalModelHoverHorizontalScrollbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelHoverHorizontalScrollbar'
import FundamentalModelTradeSummaryToolbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelTradeSummaryToolbar'
import {
  FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
  FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
  FM_VOLUME_TABLE_BODY_H,
  FM_VOLUME_TABLE_BORDER,
  FM_VOLUME_TABLE_COLUMN_HEADER_SHADOW,
  FM_VOLUME_TABLE_HEADER_H,
  FM_VOLUME_TABLE_HOVER_SCROLL_CLASS,
  FM_VOLUME_TABLE_ROW_HEADER_SHADOW,
  FM_VOLUME_TABLE_SCROLL_SHADOW_EPSILON_PX,
  FM_VOLUME_TABLE_SCROLL_SHADOW_TRANSITION,
  FM_VOLUME_TRADE_FROM_COL_MIN_W,
  FM_VOLUME_TRADE_TABLE_BODY_MAX_HEIGHT,
  FM_VOLUME_TRADE_TABLE_HEADER_H,
  FM_VOLUME_TRADE_TOTAL_COL_W,
  FM_VOLUME_TRADE_TO_COL_W,
  FM_VOLUME_SUBTOTAL_CELL_BG,
  FM_VOLUME_TOTAL_CELL_BG,
  fmVolumeHiddenHorizontalScrollbarSx,
  fmVolumeTableBodyCellSx,
  fmVolumeTableFrameSx,
  fmVolumeTableHeaderCellSx,
  fmVolumeTradeBodyCellSx,
  fmVolumeTradeColumnsWidth,
  fmVolumeTradeFromColumnWidth,
  mergeVolumeTableSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelTradeVolumesTableProps {
  data: FundamentalModelTradeVolumesData
  loading?: boolean
}

const rowTypography = (kind: FundamentalModelTradeRowKind) => {
  if (kind === 'country') return { variant: 'body2R14' as const }
  return { variant: 'body2SB14' as const }
}

const parseTradeValue = (value: string | null): number | null => {
  if (typeof value !== 'string') return null
  const numericValue = Number(value.replaceAll(',', ''))
  return Number.isFinite(numericValue) ? numericValue : null
}

const formatTradeTotalValue = (values: (string | null)[], fromColumns: FundamentalModelTradeVolumesData['fromColumns']): string => {
  const numbers = values
    .filter((_, index) => fromColumns[index]?.kind !== 'region')
    .map(parseTradeValue)
    .filter((value): value is number => value !== null)
  if (numbers.length === 0) return '-'
  return numbers.reduce((sum, value) => sum + value, 0).toFixed(1)
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

  const toCountryTotals = useMemo(
    () => new Map(toRows.map((row) => [row.id, formatTradeTotalValue(row.values, fromColumns)])),
    [fromColumns, toRows],
  )
  const tradeScrollWidth = useMemo(() => fmVolumeTradeColumnsWidth(fromColumns.length) + FM_VOLUME_TRADE_TOTAL_COL_W, [fromColumns.length])

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
  }, [loading, toRows.length, updateVerticalScrollShadow])

  useEffect(() => {
    const scrollLeft =
      footerMonthScrollRef.current?.scrollLeft ?? bodyMonthScrollRef.current?.scrollLeft ?? headerMonthScrollRef.current?.scrollLeft ?? 0
    updateHorizontalScrollShadow(scrollLeft)
  }, [loading, tradeScrollWidth, updateHorizontalScrollShadow])

  const hiddenMonthScrollBoxProps = useMemo(() => ({ sx: fmVolumeHiddenHorizontalScrollbarSx }), [])

  if (loading) {
    return <TradeVolumesTableSkeleton colCount={fromColumns.length || 12} rowCount={toRows.length || 19} />
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
    <Stack sx={[{ width: FM_VOLUME_TRADE_TO_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER }, rowHeaderShadowSx]}>
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
    <Stack sx={{ width: '100%', minWidth: tradeScrollWidth }}>
      <Box
        sx={mergeVolumeTableSx(fmVolumeTableHeaderCellSx, {
          height: FM_VOLUME_TABLE_HEADER_H,
          width: '100%',
        })}
      >
        <Typography
          variant="tableHeaderSemibold"
          color="gray.60"
          noWrap
          sx={{
            position: 'sticky',
            left: '12px',
            zIndex: 1,
            width: 'fit-content',
            maxWidth: 'calc(100% - 24px)',
            lineHeight: 1.4,
          }}
        >
          From country
        </Typography>
      </Box>
      <Stack direction="row" alignItems="flex-start">
        {fromColumns.map((col, colIdx) => {
          const colWidth = fmVolumeTradeFromColumnWidth(colIdx)
          const isRegionCol = col.kind === 'region'
          return (
            <Box
              key={col.id}
              sx={mergeVolumeTableSx(fmVolumeTableBodyCellSx, {
                width: colWidth,
                minWidth: colWidth,
                flexShrink: 0,
                justifyContent: 'flex-end',
                bgcolor: isRegionCol ? FM_VOLUME_SUBTOTAL_CELL_BG : 'commonColor.White',
              })}
            >
              <Typography {...rowTypography(col.kind)} color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
                {col.label}
              </Typography>
            </Box>
          )
        })}
        <Box
          sx={mergeVolumeTableSx(fmVolumeTableBodyCellSx, {
            width: FM_VOLUME_TRADE_TOTAL_COL_W,
            minWidth: FM_VOLUME_TRADE_TOTAL_COL_W,
            flexShrink: 0,
            justifyContent: 'flex-end',
            bgcolor: FM_VOLUME_TOTAL_CELL_BG,
          })}
        >
          <Typography variant="body2SB14" color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
            Total
          </Typography>
        </Box>
      </Stack>
    </Stack>
  )

  const bodyFrozen = (
    <Stack
      sx={[{ width: FM_VOLUME_TRADE_TO_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER, overflow: 'clip' }, rowHeaderShadowSx]}
    >
      {toRows.map((row, rowIdx) => {
        const nextIsTotal = toRows[rowIdx + 1]?.kind === 'total'
        const isTotal = row.kind === 'total'
        const isRegionRow = row.kind === 'region'
        return (
          <Box key={row.id} sx={[fmVolumeTableBodyCellSx, fmVolumeTradeBodyCellSx(isTotal, nextIsTotal, isRegionRow)]}>
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
                  sx={[
                    fmVolumeTableBodyCellSx,
                    fmVolumeTradeBodyCellSx(isTotal, nextIsTotal, isRegionCol || isRegionRow),
                    { justifyContent: 'flex-end' },
                  ]}
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
      <Stack sx={{ width: FM_VOLUME_TRADE_TOTAL_COL_W, minWidth: FM_VOLUME_TRADE_TOTAL_COL_W, flexShrink: 0 }}>
        {toRows.map((row, rowIdx) => {
          const nextIsTotal = toRows[rowIdx + 1]?.kind === 'total'
          const isTotal = row.kind === 'total'
          const isRegionRow = row.kind === 'region'
          return (
            <Box
              key={`${row.id}-total`}
              sx={[
                fmVolumeTableBodyCellSx,
                fmVolumeTradeBodyCellSx(isTotal, nextIsTotal, isRegionRow, true),
                { justifyContent: 'flex-end' },
              ]}
            >
              <Typography variant="body2SB14" color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
                {toCountryTotals.get(row.id) ?? '-'}
              </Typography>
            </Box>
          )
        })}
      </Stack>
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
          <ScrollWrapper ref={bodyScrollRef} {...tradeBodyScrollWrapperProps} contentKey={toRows.length}>
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
                  marginLeft: `${FM_VOLUME_TRADE_TO_COL_W}px`,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                },
                fmVolumeHiddenHorizontalScrollbarSx,
              )}
            >
              <Box sx={{ width: tradeScrollWidth, height: 1 }} aria-hidden />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                left: `${FM_VOLUME_TRADE_TO_COL_W}px`,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            >
              <FundamentalModelHoverHorizontalScrollbar
                scrollRef={footerMonthScrollRef}
                contentWidthKey={tradeScrollWidth}
                hoverRootClassName={FM_VOLUME_TABLE_HOVER_SCROLL_CLASS}
                onScrollLeftChange={() => syncHorizontalScroll('footer')}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Stack>
  )
})

FundamentalModelTradeVolumesTable.displayName = 'FundamentalModelTradeVolumesTable'

export default FundamentalModelTradeVolumesTable
