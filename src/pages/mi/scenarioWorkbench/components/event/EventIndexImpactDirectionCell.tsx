import { Box, Stack } from '@mui/material'

import type { EventMarketDirection, EventMarketImpactLevel } from '@/pages/mi/scenarioWorkbench/components/event/types'

/** 상승 삼각형(SVG) */
const SvgDirectionUp = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <path d="M7 2.5L12.5 11H1.5L7 2.5Z" fill="#37B24D" />
  </svg>
)

/** 하락 삼각형(SVG) */
const SvgDirectionDown = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <path d="M7 11.5L1.5 3H12.5L7 11.5Z" fill="#FA5252" />
  </svg>
)

/** 보합(가로 막대) */
const SvgDirectionFlat = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <rect x="2" y="6.5" width="10" height="1.5" rx="0.75" fill="#ADB5BD" />
  </svg>
)

/** 단일 지수(JKM/TTF/HH)용 영향도 점 3개 + 방향 아이콘 */
interface EventIndexImpactDirectionCellProps {
  level: EventMarketImpactLevel
  direction: EventMarketDirection
}

/** 영향도 레벨에 따라 채워진 점 개수(0~3) */
const filledDotCount = (level: EventMarketImpactLevel): number => {
  if (level <= 0) return 0
  if (level === 1) return 1
  if (level === 2) return 2
  return 3
}

/** 채움 색: 0=없음, 1=저영향 회색, 2=중간, 3=높음(mari 톤) */
const filledColorForLevel = (filledCount: number, index: number): string | undefined => {
  const filled = index < filledCount
  if (!filled) return undefined
  if (filledCount === 1) return '#868E96'
  if (filledCount === 2) return '#444D7A'
  return '#364FC7'
}

/** 영향도 점 1개 (비움 시 테두리만, 채움 시 부모 color로 면 채움) */
const ImpactDot = ({ filled, emptyBorderMuted }: { filled: boolean; emptyBorderMuted: boolean }) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      flexShrink: 0,
      boxSizing: 'border-box',
      ...(filled
        ? { bgcolor: 'currentColor', border: 'none' }
        : {
          bgcolor: 'transparent',
          border: '1.5px solid',
          borderColor: emptyBorderMuted ? '#ADB5BD' : '#CED4DA',
        }),
    }}
  />
)

/** 점 행: 채워진 개수에 따라 점 색상 팔레트 적용 */
const ImpactDotsRow = ({ level }: { level: EventMarketImpactLevel }) => {
  const n = filledDotCount(level)
  const emptyBorderMuted = n === 0
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" height={22}>
      {[0, 1, 2].map((i) => {
        const filled = i < n
        const fillCol = filled ? filledColorForLevel(n, i) : undefined
        return (
          <Box key={i} sx={{ color: fillCol ?? 'transparent', lineHeight: 0, display: 'flex' }}>
            <ImpactDot filled={filled} emptyBorderMuted={emptyBorderMuted} />
          </Box>
        )
      })}
    </Stack>
  )
}

/** 가격 방향 SVG 아이콘 */
const DirectionGlyph = ({ direction }: { direction: EventMarketDirection }) => {
  if (direction === '상승') return <SvgDirectionUp />
  if (direction === '하락') return <SvgDirectionDown />
  return <SvgDirectionFlat />
}

/** 영향도 점 3개만 표시하는 셀 (레거시 EventImpactDotsCell 대체) */
export interface EventImpactDotsCellProps {
  level: EventMarketImpactLevel
}

/** 시장영향 3-dot 표현 */
export const EventImpactDotsCell = ({ level }: EventImpactDotsCellProps) => (
  <Stack direction="row" alignItems="center" justifyContent="center" width="100%" height={22}>
    <ImpactDotsRow level={level} />
  </Stack>
)

/** 가격방향 아이콘만 표시하는 컴팩트 셀 (레거시 EventImpactDirectionCompact 대체) */
export interface EventImpactDirectionCompactProps {
  direction: EventMarketDirection
}

/** 가격방향 셀(14px 아이콘 중앙) */
export const EventImpactDirectionCompact = ({ direction }: EventImpactDirectionCompactProps) => (
  <Box display="flex" alignItems="center" justifyContent="center" width="100%" height={40}>
    <DirectionGlyph direction={direction} />
  </Box>
)

/** JKM·TTF·HH 셀: 점 3개 + 방향 */
const EventIndexImpactDirectionCell = ({ level, direction }: EventIndexImpactDirectionCellProps) => (
  <Stack direction="row" alignItems="center" justifyContent="center" gap={1.5} width="100%">
    <ImpactDotsRow level={level} />
    <Box display="flex" alignItems="center" justifyContent="center" width={14} height={14}>
      <DirectionGlyph direction={direction} />
    </Box>
  </Stack>
)

export default EventIndexImpactDirectionCell
