import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { memo, useMemo } from 'react'

import type { FundamentalModelVolumesGranularity, IFundamentalModelVolumesColumn } from '@/service/mi/fundamentalModel/case'

import MIFrozenColumnScrollLayout from '@/pages/mi/fundamentalModel/components/common/MIFrozenColumnScrollLayout'
import {
  FM_VOLUME_SUMMARY_LABEL_COL_W,
  FM_VOLUME_TABLE_BODY_H,
  FM_VOLUME_TABLE_BORDER,
  FM_VOLUME_TABLE_HEADER_H,
  fmVolumeResolvedMonthColumnWidth,
  fmVolumeTableBodyCellSx,
  fmVolumeTableFrameSx,
  fmVolumeTableHeaderCellSx,
  mergeVolumeTableSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelVolumesMatrixProps {
  /** 시간축 컬럼(getVolumes columns) */
  columns: IFundamentalModelVolumesColumn[]
  /** API granularity - YEARLY 일 때 unite 행을 연도값으로 표시 */
  granularity: FundamentalModelVolumesGranularity
  loading?: boolean
  /** true 면 상단 요약 블록(Volumes Table summary=on) */
  compact?: boolean
}

/** 요약 매트릭스 행 — id 별 라벨/타이포 분기 */
type SummaryRowId = 'year' | 'unite' | 'mtpa'

interface SummaryRow {
  id: SummaryRowId
  label: string
  values: string[]
}

const SUMMARY_ROW_LABEL: Record<SummaryRowId, string> = {
  year: '',
  unite: 'Unite',
  mtpa: 'mtpa',
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

/** API columns -> 요약 매트릭스 3행(year/unite/mtpa) */
const buildSummaryRows = (columns: IFundamentalModelVolumesColumn[], granularity: FundamentalModelVolumesGranularity): SummaryRow[] => {
  const yearValues = columns.map((column) => String(column.year))
  const monthValues = columns.map((column) => (column.month === null ? '' : String(column.month)))
  const periodValues = columns.map((column) => column.periodLabel)

  return [
    { id: 'year', label: SUMMARY_ROW_LABEL.year, values: yearValues },
    { id: 'unite', label: SUMMARY_ROW_LABEL.unite, values: granularity === 'YEARLY' ? yearValues : monthValues },
    { id: 'mtpa', label: SUMMARY_ROW_LABEL.mtpa, values: periodValues },
  ]
}

/** Volumes 요약 매트릭스 — getVolumes columns/granularity 직결 */
const FundamentalModelVolumesMatrix = memo(
  ({ columns, granularity, loading = false, compact = false }: FundamentalModelVolumesMatrixProps) => {
    const summaryRows = useMemo(() => buildSummaryRows(columns, granularity), [columns, granularity])
    const monthLabels = useMemo(() => columns.map((column) => column.periodLabel), [columns])

    const labelColWidth = compact ? FM_VOLUME_SUMMARY_LABEL_COL_W : 220
    const monthColWidth = fmVolumeResolvedMonthColumnWidth(monthLabels.length, labelColWidth)

    if (loading) {
      return (
        <FundamentalModelVolumesMatrixSkeleton
          monthCount={monthLabels.length}
          rowCount={summaryRows.length || 3}
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
        {summaryRows.map((row) => (
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
            {summaryRows.map((row) => {
              const cell = row.values[colIdx] ?? ''
              const isYearRow = row.id === 'year'
              return (
                <Box key={`${row.id}-${colIdx}`} sx={[fmVolumeTableBodyCellSx, { justifyContent: 'flex-end' }]}>
                  <Typography
                    variant={isYearRow ? 'body2SB14' : 'body2R14'}
                    color="gray.90"
                    noWrap
                    sx={{ width: '100%', textAlign: 'right', lineHeight: 1.4 }}
                  >
                    {cell}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        ))}
      </Stack>
    )

    return (
      <Box sx={fmVolumeTableFrameSx}>
        <MIFrozenColumnScrollLayout frozen={labelColumn} scrollable={monthColumns} />
      </Box>
    )
  },
)

FundamentalModelVolumesMatrix.displayName = 'FundamentalModelVolumesMatrix'

export default FundamentalModelVolumesMatrix
