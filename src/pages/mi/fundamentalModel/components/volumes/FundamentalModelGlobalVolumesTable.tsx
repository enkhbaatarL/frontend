import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { memo, useMemo } from 'react'

import type {
  FundamentalModelGlobalRowKind,
  FundamentalModelGlobalVolumeRow,
  FundamentalModelGlobalVolumesData,
} from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MIFrozenColumnScrollLayout from '@/pages/mi/fundamentalModel/components/common/MIFrozenColumnScrollLayout'
import {
  FM_VOLUME_GLOBAL_COUNTRY_COL_W,
  FM_VOLUME_GLOBAL_FROZEN_W,
  FM_VOLUME_GLOBAL_SECTION_COL_W,
  FM_VOLUME_MONTH_COL_W,
  FM_VOLUME_TABLE_BODY_H,
  FM_VOLUME_TABLE_BORDER,
  fmVolumeGlobalBodyCellSx,
  fmVolumeTableBodyCellSx,
  fmVolumeTableFrameSx,
  fmVolumeTableHeaderCellSx,
  mergeVolumeTableSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelGlobalVolumesTableProps {
  data: FundamentalModelGlobalVolumesData
  loading?: boolean
}

/** 섹션 라벨이 span하는 본문 행 수(지역/국가 8행, Total 제외) */
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

const FundamentalModelGlobalVolumesTableSkeleton = ({ monthCount, rowCount }: { monthCount: number; rowCount: number }) => (
  <Box sx={mergeVolumeTableSx(fmVolumeTableFrameSx, { p: '12px' })}>
    <Stack direction="row" gap={1}>
      <Stack sx={{ width: FM_VOLUME_GLOBAL_FROZEN_W, gap: 0.5 }}>
        <Skeleton variant="rounded" height={36} />
        {Array.from({ length: rowCount }).map((_, i) => (
          <Skeleton key={`sk-l-${i}`} variant="rounded" height={36} />
        ))}
      </Stack>
      <Stack direction="row" gap={0.5} flex={1}>
        {Array.from({ length: Math.min(monthCount, 6) }).map((_, c) => (
          <Stack key={`sk-m-${c}`} sx={{ width: FM_VOLUME_MONTH_COL_W, gap: 0.5 }}>
            <Skeleton variant="rounded" height={36} />
            {Array.from({ length: rowCount }).map((__, r) => (
              <Skeleton key={`sk-${c}-${r}`} variant="rounded" height={36} />
            ))}
          </Stack>
        ))}
      </Stack>
    </Stack>
  </Box>
)

/** Global 세부 표(summary=off): 섹션/국가 고정 + columns group 가로 스크롤 */
const FundamentalModelGlobalVolumesTable = memo(({ data, loading = false }: FundamentalModelGlobalVolumesTableProps) => {
  const flatRows = useMemo(() => flattenSections(data), [data])
  const rowCount = flatRows.length

  if (loading) {
    return <FundamentalModelGlobalVolumesTableSkeleton monthCount={data.monthLabels.length} rowCount={rowCount || 45} />
  }

  const frozenColumns = (
    <Stack direction="row" alignItems="flex-start" sx={{ flexShrink: 0 }}>
      <Stack sx={{ width: FM_VOLUME_GLOBAL_SECTION_COL_W, flexShrink: 0 }}>
        <Box sx={fmVolumeTableHeaderCellSx} />
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
            <Box
              sx={{
                height: FM_VOLUME_TABLE_BODY_H,
                bgcolor: 'gray.5',
                borderTop: FM_VOLUME_TABLE_BORDER,
              }}
            />
          </Box>
        ))}
      </Stack>

      <Stack
        sx={{
          width: FM_VOLUME_GLOBAL_COUNTRY_COL_W,
          flexShrink: 0,
          borderRight: FM_VOLUME_TABLE_BORDER,
          overflow: 'clip',
        }}
      >
        <Box sx={fmVolumeTableHeaderCellSx}>
          <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
            국가
          </Typography>
        </Box>
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

  const monthColumns = (
    <Stack direction="row" alignItems="flex-start">
      {data.monthLabels.map((month, colIdx) => (
        <Stack key={month} sx={{ width: FM_VOLUME_MONTH_COL_W, flexShrink: 0 }}>
          <Box sx={[fmVolumeTableHeaderCellSx, { justifyContent: 'flex-end' }]}>
            <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
              {month}
            </Typography>
          </Box>
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

  return (
    <Box sx={fmVolumeTableFrameSx}>
      <MIFrozenColumnScrollLayout frozen={frozenColumns} scrollable={monthColumns} />
    </Box>
  )
})

FundamentalModelGlobalVolumesTable.displayName = 'FundamentalModelGlobalVolumesTable'

export default FundamentalModelGlobalVolumesTable
