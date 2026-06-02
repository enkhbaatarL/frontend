import { Box, Stack, Typography } from '@mui/material'

import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { marketDirectionToLabel } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import { MARKET_IMPACT_LEVEL_KO, MarketDirection, MarketImpactLevel } from '@/service/mi/nextGenMI/common'

/** 영향 지속 기간 (단기 / 장기) */
export type IndexImpactTerm = 'short' | 'long'

const SIGNAL_BAR_GREEN = '#498B47'
const SIGNAL_BAR_RED = '#CC4D50'
const SIGNAL_BAR_EMPTY = '#E4E4E4'
const SIGNAL_BAR_NEUTRAL = '#ADB5BD'

const DURATION_BADGE_BG = '#ECEDF4'

// MarketImpactLevel -> 채워질 막대 개수
const LEVEL_TO_FILLED_BARS: Record<MarketImpactLevel, number> = {
  [MarketImpactLevel.NONE]: 0,
  [MarketImpactLevel.LOW]: 1,
  [MarketImpactLevel.MEDIUM]: 2,
  [MarketImpactLevel.HIGH]: 3,
  [MarketImpactLevel.EXTREME]: 3,
}

const filledBarCount = (level: MarketImpactLevel | undefined): number => (level === undefined ? 0 : (LEVEL_TO_FILLED_BARS[level] ?? 0))

const termToLabel = (term: IndexImpactTerm): string => (term === 'long' ? '장기' : '단기')

const termToBadgeText = (term: IndexImpactTerm): string => (term === 'long' ? 'L' : 'S')

export interface EventIndexSignalCellProps {
  level: MarketImpactLevel | undefined
  direction?: MarketDirection
  /** 영향 지속 기간. API 미연동 단계에서는 기본값(단기) 사용 */
  term?: IndexImpactTerm
  /** 기간 배지(S/L) 노출 여부 */
  showTermBadge?: boolean
  size?: number
}

/** 영향 지속 기간 배지 (S / L) */
const IndexDurationBadge = ({ term }: { term: IndexImpactTerm }) => (
  <Box
    component="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    px="6px"
    py="2px"
    borderRadius="8px"
    bgcolor={DURATION_BADGE_BG}
  >
    <Typography component="span" variant="body3SB12" color="contentText.Normal" lineHeight={1.4} noWrap>
      {termToBadgeText(term)}
    </Typography>
  </Box>
)

/**
 * 셀룰러 신호 막대: 영향도(채워진 막대 수) + 방향(상승 초록 하단정렬 / 하락 빨강 상단정렬)
 * viewBox 32x32 기준으로 Figma 좌표를 그대로 반영
 */
/** 보합 / 영향 없음: 가로 막대 3개 */
const NeutralSignalBars = ({ level, size = 20 }: { level: MarketImpactLevel | undefined; size?: number }) => {
  const filled = filledBarCount(level)
  const colorFor = (index: number): string => (index < filled ? SIGNAL_BAR_NEUTRAL : SIGNAL_BAR_EMPTY)

  return (
    <Box component="span" display="inline-flex" sx={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        {[0, 1, 2].map((index) => (
          <rect
            key={index}
            x={8 + index * 9}
            y={13}
            width={6}
            height={8}
            rx={1.436}
            fill={colorFor(index)}
            transform={`rotate(90 ${11 + index * 9} 17)`}
          />
        ))}
      </svg>
    </Box>
  )
}

const IndexSignalBars = ({
  level,
  direction,
  size = 20,
}: {
  level: MarketImpactLevel | undefined
  direction?: MarketDirection
  size?: number
}) => {
  const filled = filledBarCount(level)
  const isBearish = direction === MarketDirection.BEARISH
  const isBullish = direction === MarketDirection.BULLISH
  const isNeutral = direction === MarketDirection.NEGLIGIBLE || direction === undefined

  if (isNeutral) {
    return <NeutralSignalBars level={level} size={size} />
  }

  const fillColor = isBullish ? SIGNAL_BAR_GREEN : isBearish ? SIGNAL_BAR_RED : SIGNAL_BAR_EMPTY
  const colorFor = (index: number): string => (index < filled ? fillColor : SIGNAL_BAR_EMPTY)

  // 막대 높이(좌 -> 우 오름차순)와 x 좌표
  const heights = [6, 12, 18]
  const xs = [3, 12.5, 22]
  // 하락은 상단 정렬(7px), 상승은 하단 정렬(바닥에서 7px)
  const yFor = (height: number) => (isBearish ? 7 : 32 - 7 - height)

  return (
    <Box component="span" display="inline-flex" sx={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        {heights.map((height, index) => (
          <rect key={index} x={xs[index]} y={yFor(height)} width={6} height={height} rx={1.436} fill={colorFor(index)} />
        ))}
      </svg>
    </Box>
  )
}

const tooltipLineSx = {
  m: 0,
  fontSize: 12,
  lineHeight: 1.4,
  color: 'common.white',
}

const SignalTooltipContent = ({
  level,
  direction,
  term,
}: {
  level: MarketImpactLevel | undefined
  direction?: MarketDirection
  term: IndexImpactTerm
}) => {
  const impactLabel = level === undefined ? '-' : MARKET_IMPACT_LEVEL_KO[level]
  return (
    <Stack gap={0}>
      <Typography component="p" sx={tooltipLineSx}>
        시장 영향도: {impactLabel}
      </Typography>
      {direction !== undefined && (
        <Typography component="p" sx={tooltipLineSx}>
          방향: {marketDirectionToLabel(direction)}
        </Typography>
      )}
      <Typography component="p" sx={tooltipLineSx}>
        기간: {termToLabel(term)}
      </Typography>
    </Stack>
  )
}

/** Events 테이블 지수(JKM/TTF/HH) 셀: 기간 배지 + 셀룰러 신호 막대 */
const EventIndexSignalCell = ({ level, direction, term = 'short', showTermBadge = true, size }: EventIndexSignalCellProps) => (
  <NextGenMIFollowCursorTooltip title={<SignalTooltipContent level={level} direction={direction} term={term} />}>
    <Stack direction="row" alignItems="center" justifyContent="center" gap="4px" width="100%" height={22}>
      {showTermBadge && <IndexDurationBadge term={term} />}
      <IndexSignalBars level={level} direction={direction} size={size} />
    </Stack>
  </NextGenMIFollowCursorTooltip>
)

export default EventIndexSignalCell
