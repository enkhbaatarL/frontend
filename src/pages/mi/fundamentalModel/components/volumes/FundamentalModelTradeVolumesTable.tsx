import { Box, Stack, Typography } from '@mui/material'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  FundamentalModelTradeCountryHeader,
  FundamentalModelTradeCountryHeaderKind,
  FundamentalModelTradeFlows,
  FundamentalModelTradeSelector,
  FundamentalModelTradeUnit,
} from '@/service/mi/fundamentalModel/case'

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
  FM_VOLUME_TABLE_SKELETON_H,
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
  fmVolumeTradeFromColumnWidth,
  mergeVolumeTableSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelTradeVolumesTableProps {
  tradeFlows: FundamentalModelTradeFlows | null
  selector: FundamentalModelTradeSelector
  year: number
  unit: FundamentalModelTradeUnit
  loading?: boolean
  onSelectorChange?: (selector: FundamentalModelTradeSelector) => void
  onYearChange?: (year: number) => void
}

const rowTypography = (kind: FundamentalModelTradeCountryHeaderKind) => {
  if (kind === 'COUNTRY') return { variant: 'body2R14' as const }
  return { variant: 'body2SB14' as const }
}

const getFlowLookupKey = (toKey: string, fromKey: string) => `${toKey}\u0000${fromKey}`

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

export const TradeVolumesTableSkeleton = () => (
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

/** Trade From/To 국가 매트릭스 표 */
const FundamentalModelTradeVolumesTable = memo(
  ({ tradeFlows, selector, year, unit, loading = false, onSelectorChange, onYearChange }: FundamentalModelTradeVolumesTableProps) => {
    const fromCountries = useMemo(() => tradeFlows?.fromCountries ?? [], [tradeFlows?.fromCountries])
    const toCountries = useMemo(() => tradeFlows?.toCountries ?? [], [tradeFlows?.toCountries])
    const fromColumns = useMemo<FundamentalModelTradeCountryHeader[]>(() => {
      const hasTotalFlow = tradeFlows?.flows?.some((flow) => flow.fromKey === 'TOTAL') ?? false
      const hasTotalHeader = fromCountries.some((header) => header.key === 'TOTAL')
      if (!hasTotalFlow || hasTotalHeader) return fromCountries

      return [
        ...fromCountries,
        {
          key: 'TOTAL',
          label: 'Total',
          kind: 'GRAND_TOTAL',
          region: null,
          country: 'Total',
        },
      ]
    }, [fromCountries, tradeFlows?.flows])
    const flowValues = useMemo(
      () => new Map((tradeFlows?.flows ?? []).map((flow) => [getFlowLookupKey(flow.toKey, flow.fromKey), flow.value])),
      [tradeFlows?.flows],
    )
    const tradeScrollWidth = useMemo(
      () =>
        fromColumns.reduce(
          (width, column, index) => width + (column.key === 'TOTAL' ? FM_VOLUME_TRADE_TOTAL_COL_W : fmVolumeTradeFromColumnWidth(index)),
          0,
        ),
      [fromColumns],
    )
    const selectorOptions = useMemo<Array<{ value: FundamentalModelTradeSelector; label: string }>>(
      () => [
        { value: 'LNG', label: 'LNG' },
        { value: 'PNG', label: 'PNG' },
      ],
      [],
    )
    const yearOptions = useMemo(
      () =>
        Array.from({ length: 8 }, (_, index) => {
          const optionYear = 2023 + index
          return { value: optionYear, label: String(optionYear) }
        }),
      [],
    )

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
    }, [loading, toCountries.length, updateVerticalScrollShadow])

    useEffect(() => {
      const scrollLeft =
        footerMonthScrollRef.current?.scrollLeft ?? bodyMonthScrollRef.current?.scrollLeft ?? headerMonthScrollRef.current?.scrollLeft ?? 0
      updateHorizontalScrollShadow(scrollLeft)
    }, [loading, tradeScrollWidth, updateHorizontalScrollShadow])

    const hiddenMonthScrollBoxProps = useMemo(() => ({ sx: fmVolumeHiddenHorizontalScrollbarSx }), [])

    if (loading) {
      return (
        <Stack gap="10px">
          <FundamentalModelTradeSummaryToolbar
            selectorOptions={selectorOptions}
            yearOptions={yearOptions}
            selector={selector}
            year={year}
            unit={unit}
            loading={loading}
            onSelectorChange={onSelectorChange}
            onYearChange={onYearChange}
          />
          <TradeVolumesTableSkeleton />
        </Stack>
      )
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
            const colWidth = col.key === 'TOTAL' ? FM_VOLUME_TRADE_TOTAL_COL_W : fmVolumeTradeFromColumnWidth(colIdx)
            const isRegionCol = col.kind === 'REGION_TOTAL'
            const isTotalCol = col.kind === 'GRAND_TOTAL'
            return (
              <Box
                key={col.key}
                sx={mergeVolumeTableSx(fmVolumeTableBodyCellSx, {
                  width: colWidth,
                  minWidth: colWidth,
                  flexShrink: 0,
                  justifyContent: 'flex-end',
                  bgcolor: isTotalCol ? FM_VOLUME_TOTAL_CELL_BG : isRegionCol ? FM_VOLUME_SUBTOTAL_CELL_BG : 'commonColor.White',
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
      <Stack
        sx={[{ width: FM_VOLUME_TRADE_TO_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER, overflow: 'clip' }, rowHeaderShadowSx]}
      >
        {toCountries.map((row, rowIdx) => {
          const nextIsTotal = toCountries[rowIdx + 1]?.kind === 'GRAND_TOTAL'
          const isTotal = row.kind === 'GRAND_TOTAL'
          const isRegionRow = row.kind === 'REGION_TOTAL'
          return (
            <Box key={row.key} sx={[fmVolumeTableBodyCellSx, fmVolumeTradeBodyCellSx(isTotal, nextIsTotal, isRegionRow)]}>
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
          const colWidth = col.key === 'TOTAL' ? FM_VOLUME_TRADE_TOTAL_COL_W : fmVolumeTradeFromColumnWidth(colIdx)
          const isRegionCol = col.kind === 'REGION_TOTAL'
          const isTotalCol = col.kind === 'GRAND_TOTAL'
          return (
            <Stack key={col.key} sx={{ width: colWidth, minWidth: colWidth, flexShrink: 0 }}>
              {toCountries.map((row, rowIdx) => {
                const nextIsTotal = toCountries[rowIdx + 1]?.kind === 'GRAND_TOTAL'
                const isTotal = row.kind === 'GRAND_TOTAL'
                const isRegionRow = row.kind === 'REGION_TOTAL'
                const useStrong = isTotal || isTotalCol || isRegionCol || isRegionRow
                return (
                  <Box
                    key={`${row.key}-${col.key}`}
                    sx={[
                      fmVolumeTableBodyCellSx,
                      fmVolumeTradeBodyCellSx(isTotal, nextIsTotal, isRegionCol || isRegionRow, isTotalCol),
                      { justifyContent: 'flex-end' },
                    ]}
                  >
                    <Typography
                      variant={useStrong ? 'body2SB14' : 'body2R14'}
                      color="gray.90"
                      noWrap
                      sx={{ width: '100%', textAlign: 'right' }}
                    >
                      {flowValues.get(getFlowLookupKey(row.key, col.key)) ?? 0}
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
          selectorOptions={selectorOptions}
          yearOptions={yearOptions}
          selector={selector}
          year={year}
          unit={unit}
          loading={loading}
          onSelectorChange={onSelectorChange}
          onYearChange={onYearChange}
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
            <ScrollWrapper
              ref={bodyScrollRef}
              {...tradeBodyScrollWrapperProps}
              contentKey={`${toCountries.length}-${fromColumns.length}-${tradeFlows?.caseId ?? 'empty'}-${selector}-${year}`}
            >
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
  },
)

FundamentalModelTradeVolumesTable.displayName = 'FundamentalModelTradeVolumesTable'

export default FundamentalModelTradeVolumesTable
