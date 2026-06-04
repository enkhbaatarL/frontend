import { Box, Divider, Stack, Typography } from '@mui/material'

import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { marketDirectionToLabel } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import { MARKET_IMPACT_LEVEL_KO, MarketDirection, MarketImpactLevel } from '@/service/mi/nextGenMI/common'

/** 영향 지속 기간 (단기 / 중장기) */
export type IndexImpactTerm = 'short' | 'long' | 'mid_long'

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

const filledBarCount = (level: MarketImpactLevel | null | undefined): number =>
  level === undefined || level === null ? 0 : (LEVEL_TO_FILLED_BARS[level] ?? 0)

const isLongTerm = (term: IndexImpactTerm): boolean => term === 'long' || term === 'mid_long'

const termToLabel = (term: IndexImpactTerm): string => (isLongTerm(term) ? '중장기' : '단기')

const termToBadgeText = (term: IndexImpactTerm): string => (isLongTerm(term) ? 'L' : 'S')

const isDirectionMissing = (direction?: MarketDirection | null): direction is null | undefined =>
  direction === undefined || direction === null

const isNoMarketDirection = (direction?: MarketDirection | null): boolean =>
  isDirectionMissing(direction) || direction === MarketDirection.NEGLIGIBLE

const signalBarFillColor = (direction?: MarketDirection | null): string => {
  switch (direction) {
    case MarketDirection.BULLISH:
      return SIGNAL_BAR_GREEN
    case MarketDirection.BEARISH:
      return SIGNAL_BAR_RED
    default:
      return SIGNAL_BAR_EMPTY
  }
}

export interface EventIndexSignalCellProps {
  level: MarketImpactLevel | null | undefined
  levelLabel?: string | null
  direction?: MarketDirection | null
  directionLabel?: string | null
  term?: IndexImpactTerm | null
  termLabel?: string | null
  /** 기간 배지(S/L) 노출 여부 */
  showTermBadge?: boolean
  size?: number
  /** 툴팁 상단에 표시할 지수명(JKM/TTF/HH 등) */
  indexLabel?: string
}

/** 영향 지속 기간 배지 (S / L) */
const IndexDurationBadge = ({ term }: { term: IndexImpactTerm }) => (
  <Stack
    component="span"
    direction="row"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    padding="2px 6px"
    borderRadius="8px"
    bgcolor={DURATION_BADGE_BG}
  >
    <Typography component="span" variant="body3SB12" color="contentText.Normal" lineHeight={1.4} noWrap>
      {termToBadgeText(term)}
    </Typography>
  </Stack>
)

/**
 * 셀룰러 신호 막대: 영향도(채워진 막대 수) + 방향(상승 초록 하단정렬 / 하락 빨강 상단정렬)
 * viewBox 32x32 기준으로 Figma 좌표를 그대로 반영
 */
/** 시장 방향 없음(보합 포함): 영향 강도도 없음으로 간주하여 단일 가로 막대 */
const NoDirectionSignalBar = ({ size = 32 }: { size?: number }) => (
  <Box component="span" display="inline-flex" width={`${size}px`} height={`${size}px`} flexShrink={0}>
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x={3.5} y={14} width={25} height={6} rx={1.436} fill={SIGNAL_BAR_EMPTY} />
    </svg>
  </Box>
)

const IndexSignalBars = ({
  level,
  direction,
  size = 32,
}: {
  level: MarketImpactLevel | null | undefined
  direction?: MarketDirection | null
  size?: number
}) => {
  const filled = filledBarCount(level)
  const isBearish = direction === MarketDirection.BEARISH

  if (isNoMarketDirection(direction)) {
    return <NoDirectionSignalBar size={size} />
  }

  const fillColor = signalBarFillColor(direction)
  const colorFor = (index: number): string => (index < filled ? fillColor : SIGNAL_BAR_EMPTY)

  // 막대 높이(좌 -> 우 오름차순)와 x 좌표
  const heights = [6, 12, 18]
  const xs = [3, 12.5, 22]
  // 하락은 상단 정렬(7px), 상승은 하단 정렬(바닥에서 7px)
  const yFor = (height: number) => (isBearish ? 7 : 32 - 7 - height)

  return (
    <Box component="span" display="inline-flex" width={`${size}px`} height={`${size}px`} flexShrink={0}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        {heights.map((height, index) => (
          <rect key={index} x={xs[index]} y={yFor(height)} width={6} height={height} rx={1.436} fill={colorFor(index)} />
        ))}
      </svg>
    </Box>
  )
}

const directionValueColor = (direction?: MarketDirection | null) => {
  switch (direction) {
    case MarketDirection.BULLISH:
      return SIGNAL_BAR_GREEN
    case MarketDirection.BEARISH:
      return SIGNAL_BAR_RED
    case MarketDirection.NEGLIGIBLE:
      return SIGNAL_BAR_NEUTRAL
    default:
      return 'commonColor.Black'
  }
}

const SignalTooltipRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <Stack direction="row" alignItems="center" gap="8px" height="30px" padding="6px 12px" boxSizing="border-box" borderRadius="10px">
    <Typography component="p" variant="body2M14" color="contentText.Normal" minWidth="90px" flex="1 0 0" noWrap>
      {label}
    </Typography>
    <Typography component="p" variant="body2SB14" color={valueColor ?? 'commonColor.Black'} flexShrink={0} noWrap>
      {value}
    </Typography>
  </Stack>
)

const SignalTooltipHeader = ({ title, term, termLabel }: { title: string; term: IndexImpactTerm; termLabel?: string | null }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    height="30px"
    padding="6px 6px 6px 12px"
    boxSizing="border-box"
    borderRadius="10px"
  >
    <Typography component="p" variant="body1SB16" color="commonColor.Black" noWrap>
      {title}
    </Typography>
    <Stack
      component="span"
      direction="row"
      display="inline-flex"
      alignItems="center"
      justifyContent="flex-end"
      padding="4px 8px"
      borderRadius="10px"
      bgcolor={DURATION_BADGE_BG}
      flexShrink={0}
    >
      <Typography component="span" variant="body2SB14" color="contentText.Normal" lineHeight={1.4} noWrap>
        {termLabel?.trim() || termToLabel(term)}
      </Typography>
    </Stack>
  </Stack>
)

const SignalTooltipContent = ({
  indexLabel,
  level,
  levelLabel,
  direction,
  directionLabel,
  term,
  termLabel,
}: {
  indexLabel?: string
  level: MarketImpactLevel | null | undefined
  levelLabel?: string | null
  direction?: MarketDirection | null
  directionLabel?: string | null
  term: IndexImpactTerm
  termLabel?: string | null
}) => {
  const impactLabel = isNoMarketDirection(direction)
    ? '-'
    : levelLabel?.trim() || (level === undefined || level === null ? '-' : MARKET_IMPACT_LEVEL_KO[level])
  const directionValueLabel =
    direction === MarketDirection.NEGLIGIBLE
      ? marketDirectionToLabel(MarketDirection.NEGLIGIBLE)
      : directionLabel?.trim() || (isDirectionMissing(direction) ? '-' : marketDirectionToLabel(direction))
  const title = indexLabel || termToLabel(term)
  return (
    <Stack gap="4px">
      <SignalTooltipHeader title={title} term={term} termLabel={termLabel} />
      <Divider sx={{ borderColor: 'contentBorder.Normal' }} />
      <SignalTooltipRow label="시장 영향도" value={impactLabel} />
      <SignalTooltipRow label="방향" value={directionValueLabel} valueColor={directionValueColor(direction)} />
    </Stack>
  )
}

/** Events 테이블 지수(JKM/TTF/HH) 셀: 기간 배지 + 셀룰러 신호 막대 */
const EventIndexSignalCell = ({
  level,
  levelLabel,
  direction,
  directionLabel,
  term,
  termLabel,
  showTermBadge = true,
  size,
  indexLabel,
}: EventIndexSignalCellProps) => {
  const resolvedTerm = term ?? 'short'

  return (
    <NextGenMIFollowCursorTooltip
      title={
        <SignalTooltipContent
          indexLabel={indexLabel}
          level={level}
          levelLabel={levelLabel}
          direction={direction}
          directionLabel={directionLabel}
          term={resolvedTerm}
          termLabel={termLabel}
        />
      }
      tooltipSx={{
        width: '195px',
        bgcolor: 'commonColor.White',
        color: 'contentText.Black',
        border: '1px solid',
        borderColor: 'contentBorder.Normal',
        borderRadius: '10px',
        boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.10)',
        overflow: 'hidden',
        padding: '6px',
        boxSizing: 'border-box',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        gap="4px"
        width={showTermBadge ? '80px' : `${(size ?? 32) + 12}px`}
        height="40px"
        borderRadius="10px"
        padding="4px 6px"
        boxSizing="border-box"
        sx={{
          transition: 'background-color 120ms ease',
          '&:hover': {
            bgcolor: '#F8F9FA',
          },
        }}
      >
        {showTermBadge && <IndexDurationBadge term={resolvedTerm} />}
        <IndexSignalBars level={level} direction={direction} size={size ?? 32} />
      </Stack>
    </NextGenMIFollowCursorTooltip>
  )
}

export default EventIndexSignalCell
