import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { memo } from 'react'

import type { FundamentalModelMetricRow } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
export interface FundamentalModelVolumesMatrixProps {
  monthLabels: string[]
  rows: FundamentalModelMetricRow[]
  loading?: boolean
  /** true면 상단 요약 블록용으로 하단 여백을 줄임 */
  compact?: boolean
}

const LABEL_COL_WIDTH = 220
const MONTH_COL_MIN = 88
const HEADER_H = 36
const BODY_H = 40

/** 스켈레톤용 props */
interface FundamentalModelVolumesMatrixSkeletonProps {
  monthCount: number
  rowCount: number
  compact?: boolean
}

/** 표 로딩 시 격자 스켈레톤 */
const FundamentalModelVolumesMatrixSkeleton = ({ monthCount, rowCount, compact = false }: FundamentalModelVolumesMatrixSkeletonProps) => (
  <Box
    sx={{
      width: '100%',
      overflowX: 'auto',
      border: '1px solid',
      borderColor: 'gray.30',
      borderRadius: '10px',
      p: compact ? '8px' : '12px',
    }}
  >
    <Stack direction="row" gap={1} sx={{ minWidth: LABEL_COL_WIDTH + monthCount * MONTH_COL_MIN }}>
      <Stack sx={{ width: LABEL_COL_WIDTH, gap: 0.5 }}>
        <Skeleton variant="rounded" height={HEADER_H} />
        {Array.from({ length: rowCount }).map((_, i) => (
          <Skeleton key={`sk-r-${i}`} variant="rounded" height={BODY_H - 8} />
        ))}
      </Stack>
      <Stack direction="row" gap={0.5} flex={1}>
        {Array.from({ length: monthCount }).map((_, c) => (
          <Stack key={`sk-c-${c}`} sx={{ flex: 1, minWidth: MONTH_COL_MIN }} gap={0.5}>
            <Skeleton variant="rounded" height={HEADER_H} />
            {Array.from({ length: rowCount }).map((__, r) => (
              <Skeleton key={`sk-${c}-${r}`} variant="rounded" height={BODY_H - 8} />
            ))}
          </Stack>
        ))}
      </Stack>
    </Stack>
  </Box>
)

/** Figma Volumes 표: 고정 라벨열 + 가로 스크롤 월 컬럼 — 탭 공통 표 컴포넌트 */
const FundamentalModelVolumesMatrix = memo(
  ({ monthLabels, rows, loading = false, compact = false }: FundamentalModelVolumesMatrixProps) => {
    if (loading) {
      return <FundamentalModelVolumesMatrixSkeleton monthCount={monthLabels.length} rowCount={rows.length || 6} compact={compact} />
    }

    return (
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
          border: '1px solid',
          borderColor: 'gray.30',
          borderRadius: '10px',
          bgcolor: 'commonColor.White',
        }}
      >
        <Stack direction="row" sx={{ minWidth: LABEL_COL_WIDTH + monthLabels.length * MONTH_COL_MIN }}>
          <Stack sx={{ width: LABEL_COL_WIDTH, flexShrink: 0, borderRight: '1px solid', borderColor: 'gray.40' }}>
            <Box
              sx={{
                height: HEADER_H,
                bgcolor: 'gray.5',
                borderBottom: '1px solid',
                borderColor: 'gray.40',
              }}
            />
            {rows.map((row) => (
              <Box
                key={row.id}
                sx={{
                  height: BODY_H,
                  px: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid',
                  borderColor: 'gray.30',
                  bgcolor: 'commonColor.White',
                }}
              >
                <Typography variant="body2SB14" color="gray.90" noWrap sx={{ width: '100%' }}>
                  {row.label}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Stack direction="row" sx={{ flex: 1, minWidth: 0 }}>
            {monthLabels.map((month, colIdx) => (
              <Stack
                key={month}
                sx={{
                  flex: `1 0 ${MONTH_COL_MIN}px`,
                  minWidth: MONTH_COL_MIN,
                  borderRight: colIdx === monthLabels.length - 1 ? 'none' : '1px solid',
                  borderColor: 'gray.30',
                }}
              >
                <Box
                  sx={{
                    height: HEADER_H,
                    px: '12px',
                    py: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    bgcolor: 'gray.5',
                    borderBottom: '1px solid',
                    borderColor: 'gray.40',
                  }}
                >
                  <Typography variant="tableHeaderSemibold" color="gray.60" noWrap>
                    {month}
                  </Typography>
                </Box>
                {rows.map((row) => {
                  const cell = row.values[colIdx]
                  const isYearRow = row.id === 'year'
                  return (
                    <Box
                      key={`${row.id}-${month}`}
                      sx={{
                        height: BODY_H,
                        px: '12px',
                        py: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        borderBottom: '1px solid',
                        borderColor: 'gray.30',
                        bgcolor: 'commonColor.White',
                      }}
                    >
                      <Typography
                        variant={isYearRow ? 'body2SB14' : 'body2R14'}
                        color="gray.90"
                        noWrap
                        sx={{ width: '100%', textAlign: 'right' }}
                      >
                        {cell ?? ''}
                      </Typography>
                    </Box>
                  )
                })}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Box>
    )
  },
)

FundamentalModelVolumesMatrix.displayName = 'FundamentalModelVolumesMatrix'

export default FundamentalModelVolumesMatrix
