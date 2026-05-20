import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { memo, useCallback, useMemo, useRef } from 'react'

import type {
  FundamentalModelGlobalRowKind,
  FundamentalModelGlobalVolumeRow,
  FundamentalModelGlobalVolumesData,
} from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIFrozenColumnScrollLayout from '@/pages/mi/fundamentalModel/components/common/MIFrozenColumnScrollLayout'
import {
  FM_VOLUME_GLOBAL_COUNTRY_COL_W,
  FM_VOLUME_GLOBAL_FROZEN_W,
  FM_VOLUME_GLOBAL_SECTION_COL_W,
  FM_VOLUME_GLOBAL_TABLE_BODY_MAX_HEIGHT,
  FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
  FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
  FM_VOLUME_MONTH_COL_W,
  FM_VOLUME_TABLE_BODY_H,
  FM_VOLUME_TABLE_BORDER,
  fmVolumeGlobalBodyCellSx,
  fmVolumeHiddenHorizontalScrollbarSx,
  fmVolumeMonthColumnsWidth,
  fmVolumeTableBodyCellSx,
  fmVolumeTableFrameSx,
  fmVolumeTableHeaderCellSx,
  mergeVolumeTableSx,
  miThinScrollbarSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelGlobalVolumesTableProps {
  data: FundamentalModelGlobalVolumesData
  loading?: boolean
}

const SECTION_LABEL_ROW_COUNT = 8
const SECTION_LABEL_BLOCK_H = SECTION_LABEL_ROW_COUNT * FM_VOLUME_TABLE_BODY_H

const rowTypography = (kind: FundamentalModelGlobalRowKind) => {
  if (kind === 'country') return { variant: 'body2R14' as const }
  return { variant: 'body2SB14' as const }
}

interface FlatRow {
  sectionId: string
  row: FundamentalModelGlobalVolumeRow
}

const flattenSections = (data: FundamentalModelGlobalVolumesData): FlatRow[] =>
  data.sections.flatMap((section) => section.rows.map((row) => ({ sectionId: section.id, row })))

const volumeBodyScrollWrapperProps = {
  height: FM_VOLUME_GLOBAL_TABLE_BODY_MAX_HEIGHT,
  maxHeight: FM_VOLUME_GLOBAL_TABLE_BODY_MAX_HEIGHT,
  scrollbarGap: 0,
  thumbInsetTop: 6,
  thumbInsetBottom: 6,
  thumbWidth: 4,
  showScrollbarOnHover: true,
  showScrollEdgeShadow: true,
  sx: {
    flex: '1 1 auto',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
  },
  styScroll: { borderRadius: '1000px' },
} as const

const FundamentalModelGlobalVolumesTableSkeleton = ({ monthCount, rowCount }: { monthCount: number; rowCount: number }) => (
  <Box
    sx={mergeVolumeTableSx(fmVolumeTableFrameSx, {
      maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
      display: 'flex',
      flexDirection: 'column',
    })}
  >
    <Skeleton variant="rounded" height={36} sx={{ flexShrink: 0 }} />
    <Box sx={{ flex: 1, minHeight: 0, p: '12px' }}>
      <Stack direction="row" gap={1}>
        <Stack sx={{ width: FM_VOLUME_GLOBAL_FROZEN_W, gap: 0.5 }}>
          {Array.from({ length: rowCount }).map((_, i) => (
            <Skeleton key={`sk-l-${i}`} variant="rounded" height={36} />
          ))}
        </Stack>
        <Stack direction="row" gap={0.5} flex={1}>
          {Array.from({ length: Math.min(monthCount, 6) }).map((_, c) => (
            <Stack key={`sk-m-${c}`} sx={{ width: FM_VOLUME_MONTH_COL_W, gap: 0.5 }}>
              {Array.from({ length: rowCount }).map((__, r) => (
                <Skeleton key={`sk-${c}-${r}`} variant="rounded" height={36} />
              ))}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  </Box>
)

/**
 * Global 세부 표
 * - 세로: ScrollWrapper 1개(고정열+월 본문 동시 스크롤), 휠은 세로만
 * - 가로: 헤더/본문 스크롤바 숨김 + 표 하단 트랙에만 가로 스크롤바 표시
 */
const FundamentalModelGlobalVolumesTable = memo(({ data, loading = false }: FundamentalModelGlobalVolumesTableProps) => {
  const flatRows = useMemo(() => flattenSections(data), [data])
  const rowCount = flatRows.length
  const monthScrollWidth = fmVolumeMonthColumnsWidth(data.monthLabels.length)

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

  if (loading) {
    return <FundamentalModelGlobalVolumesTableSkeleton monthCount={data.monthLabels.length} rowCount={rowCount || 45} />
  }

  const headerFrozen = (
    <Stack direction="row" sx={{ flexShrink: 0 }}>
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
    <Stack direction="row" alignItems="flex-start">
      {data.monthLabels.map((month) => (
        <Stack key={month} sx={{ width: FM_VOLUME_MONTH_COL_W, flexShrink: 0 }}>
          <Box sx={[fmVolumeTableHeaderCellSx, { justifyContent: 'flex-end' }]}>
            <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
              {month}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  )

  const bodyFrozenColumns = (
    <Stack direction="row" alignItems="flex-start" sx={{ flexShrink: 0 }}>
      <Stack sx={{ width: FM_VOLUME_GLOBAL_SECTION_COL_W, flexShrink: 0 }}>
        {data.sections.map((section) => (
          <Box key={section.id}>
            <Box
              sx={{
                height: SECTION_LABEL_BLOCK_H,
                px: '12px',
                py: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                bgcolor: 'commonColor.White',
                borderBottom: FM_VOLUME_TABLE_BORDER,
                boxSizing: 'border-box',
              }}
            >
              <Typography variant="body2SB14" color="gray.90" sx={{ whiteSpace: 'pre-wrap' }}>
                {section.label}
              </Typography>
            </Box>
            <Box sx={{ height: FM_VOLUME_TABLE_BODY_H, bgcolor: 'gray.5', borderTop: FM_VOLUME_TABLE_BORDER }} />
          </Box>
        ))}
      </Stack>

      <Stack sx={{ width: FM_VOLUME_GLOBAL_COUNTRY_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER, overflow: 'clip' }}>
        {flatRows.map(({ row, sectionId }, rowIdx) => {
          const nextIsTotal = flatRows[rowIdx + 1]?.row.kind === 'total'
          const isTotal = row.kind === 'total'
          return (
            <Box key={`${sectionId}-${row.id}`} sx={[fmVolumeTableBodyCellSx, fmVolumeGlobalBodyCellSx(isTotal, nextIsTotal)]}>
              <Typography {...rowTypography(row.kind)} color="gray.90" noWrap sx={{ width: '100%' }}>
                {row.label}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Stack>
  )

  const bodyMonthColumns = (
    <Stack direction="row" alignItems="flex-start">
      {data.monthLabels.map((month, colIdx) => (
        <Stack key={month} sx={{ width: FM_VOLUME_MONTH_COL_W, flexShrink: 0 }}>
          {flatRows.map(({ row, sectionId }, rowIdx) => {
            const nextIsTotal = flatRows[rowIdx + 1]?.row.kind === 'total'
            const isTotal = row.kind === 'total'
            return (
              <Box
                key={`${sectionId}-${row.id}-${month}`}
                sx={[fmVolumeTableBodyCellSx, fmVolumeGlobalBodyCellSx(isTotal, nextIsTotal), { justifyContent: 'flex-end' }]}
              >
                <Typography {...rowTypography(row.kind)} color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
                  {row.values[colIdx] ?? ''}
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

  return (
    <Box
      sx={mergeVolumeTableSx(fmVolumeTableFrameSx, {
        height: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
        maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      })}
    >
      <Box sx={{ flexShrink: 0 }}>
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

      <ScrollWrapper {...volumeBodyScrollWrapperProps} contentKey={flatRows.length}>
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
        ref={footerMonthScrollRef}
        onScroll={() => syncHorizontalScroll('footer')}
        sx={mergeVolumeTableSx(
          {
            flexShrink: 0,
            height: FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
            marginLeft: `${FM_VOLUME_GLOBAL_FROZEN_W}px`,
            overflowX: 'auto',
            overflowY: 'hidden',
          },
          miThinScrollbarSx,
        )}
      >
        <Box sx={{ width: monthScrollWidth, height: 1 }} aria-hidden />
      </Box>
    </Box>
  )
})

FundamentalModelGlobalVolumesTable.displayName = 'FundamentalModelGlobalVolumesTable'

export default FundamentalModelGlobalVolumesTable
