import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { memo } from 'react'

import type { FundamentalModelMetricRow } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MIFrozenColumnScrollLayout from '@/pages/mi/fundamentalModel/components/common/MIFrozenColumnScrollLayout'
import {
  FM_VOLUME_SUMMARY_LABEL_COL_W,
  FM_VOLUME_TABLE_BODY_H,
  FM_VOLUME_TABLE_HEADER_H,
  FM_VOLUME_TABLE_BORDER,
  fmVolumeResolvedMonthColumnWidth,
  fmVolumeTableBodyCellSx,
  fmVolumeTableFrameSx,
  fmVolumeTableHeaderCellSx,
  mergeVolumeTableSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelVolumesMatrixProps {
  monthLabels: string[]
  rows: FundamentalModelMetricRow[]
  loading?: boolean
  /** true면 상단 요약 블록(Volumes Table summary=on) */
  compact?: boolean
}

/** 스켈레톤용 props */
interface FundamentalModelVolumesMatrixSkeletonProps {
  monthCount: number
  rowCount: number
  compact?: boolean
  monthColWidth: number
}

/** 표 로딩 시 격자 스켈레톤 */
const FundamentalModelVolumesMatrixSkeleton = ({
  monthCount,
  rowCount,
  compact = false,
  monthColWidth,
}: FundamentalModelVolumesMatrixSkeletonProps) => (
  <Box sx={mergeVolumeTableSx(fmVolumeTableFrameSx, { p: compact ? 0 : '12px' })}>
    <Stack direction="row" gap={1}>
      <Stack sx={{ width: compact ? FM_VOLUME_SUMMARY_LABEL_COL_W : 220, gap: 0.5 }}>
        <Skeleton variant="rounded" height={FM_VOLUME_TABLE_HEADER_H} />
        {Array.from({ length: rowCount }).map((_, i) => (
          <Skeleton key={`sk-r-${i}`} variant="rounded" height={FM_VOLUME_TABLE_BODY_H - 8} />
        ))}
      </Stack>
      <Stack direction="row" gap={0.5} flex={1}>
        {Array.from({ length: Math.min(monthCount, 8) }).map((_, c) => (
          <Stack key={`sk-c-${c}`} sx={{ width: monthColWidth, gap: 0.5 }}>
            <Skeleton variant="rounded" height={FM_VOLUME_TABLE_HEADER_H} />
            {Array.from({ length: rowCount }).map((__, r) => (
              <Skeleton key={`sk-${c}-${r}`} variant="rounded" height={FM_VOLUME_TABLE_BODY_H - 8} />
            ))}
          </Stack>
        ))}
      </Stack>
    </Stack>
  </Box>
)

/** Volumes 요약/상세 표 — summary=on 시 라벨열 고정 + columns group 스크롤 */
const FundamentalModelVolumesMatrix = memo(
  ({ monthLabels, rows, loading = false, compact = false }: FundamentalModelVolumesMatrixProps) => {
    const labelColWidth = compact ? FM_VOLUME_SUMMARY_LABEL_COL_W : 220
    const monthColWidth = fmVolumeResolvedMonthColumnWidth(monthLabels.length, labelColWidth)

    if (loading) {
      return (
        <FundamentalModelVolumesMatrixSkeleton
          monthCount={monthLabels.length}
          rowCount={rows.length || 6}
          compact={compact}
          monthColWidth={monthColWidth}
        />
      )
    }

    const labelColumn = (
      <Stack
        sx={{
          width: labelColWidth,
          flexShrink: 0,
          borderRight: FM_VOLUME_TABLE_BORDER,
          overflow: 'clip',
        }}
      >
        <Box sx={fmVolumeTableHeaderCellSx} />
        {rows.map((row) => (
          <Box key={row.id} sx={fmVolumeTableBodyCellSx}>
            <Typography variant="body2SB14" color="gray.90" noWrap sx={{ width: '100%', lineHeight: 1.4 }}>
              {row.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    )

    const monthColumns = (
      <Stack direction="row" alignItems="flex-start">
        {monthLabels.map((month, colIdx) => (
          <Stack key={`${month}-${colIdx}`} sx={{ width: monthColWidth, flexShrink: 0 }}>
            <Box sx={[fmVolumeTableHeaderCellSx, { justifyContent: 'flex-end' }]}>
              <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
                {month}
              </Typography>
            </Box>
            {rows.map((row) => {
              const cell = row.values[colIdx]
              const isYearRow = row.id === 'year'
              return (
                <Box key={`${row.id}-${month}`} sx={[fmVolumeTableBodyCellSx, { justifyContent: 'flex-end' }]}>
                  <Typography
                    variant={isYearRow ? 'body2SB14' : 'body2R14'}
                    color="gray.90"
                    noWrap
                    sx={{ width: '100%', textAlign: 'right', lineHeight: 1.4 }}
                  >
                    {cell ?? ''}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        ))}
      </Stack>
    )

    if (compact) {
      return (
        <Box sx={fmVolumeTableFrameSx}>
          <MIFrozenColumnScrollLayout frozen={labelColumn} scrollable={monthColumns} />
        </Box>
      )
    }

    return (
      <Box sx={fmVolumeTableFrameSx}>
        <MIFrozenColumnScrollLayout frozen={labelColumn} scrollable={monthColumns} />
      </Box>
    )
  },
)

FundamentalModelVolumesMatrix.displayName = 'FundamentalModelVolumesMatrix'

export default FundamentalModelVolumesMatrix
