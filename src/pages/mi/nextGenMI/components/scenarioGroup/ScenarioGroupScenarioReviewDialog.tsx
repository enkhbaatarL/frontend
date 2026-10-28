import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PushPinIcon from '@mui/icons-material/PushPin'
import { Box, Dialog, DialogActions, DialogContent, Divider, Skeleton, Stack, Typography, type TypographyProps } from '@mui/material'
import { useQueries } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

import type { IScenarioDetailViewRes, IScenarioGroupDetailRow, IScenarioSignpostDefinition } from '@/service/mi/nextGenMI/scenarioGroup'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import CollapseIcon from '@/components/common/icons/agent/CollapseIcon'
import ExpandIcon from '@/components/common/icons/agent/ExpandIcon'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import {
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING,
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS,
  NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { toDisplayProbabilityPercent } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioRoleBadge from '@/pages/mi/nextGenMI/components/common/ScenarioRoleBadge'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

const SCENARIO_REVIEW_CARD_DEFAULT_WIDTH = 400
const SCENARIO_REVIEW_CARD_MIN_WIDTH = 320
const SCENARIO_REVIEW_CARD_MAX_WIDTH = 720
const SCENARIO_REVIEW_CARD_SPLITTER_WIDTH = 12

const createScenarioReviewCardWidths = (scenarios: IScenarioGroupDetailRow[], currentWidths: Record<number, number> = {}) => {
  const nextWidths: Record<number, number> = {}

  scenarios.forEach((scenario) => {
    nextWidths[scenario.scenarioId] = currentWidths[scenario.scenarioId] ?? SCENARIO_REVIEW_CARD_DEFAULT_WIDTH
  })

  return nextWidths
}

const getScenarioReviewCardWidthChangeCapacity = (width: number, direction: number) =>
  direction > 0 ? SCENARIO_REVIEW_CARD_MAX_WIDTH - width : width - SCENARIO_REVIEW_CARD_MIN_WIDTH

const getScenarioReviewCardWidthChangeCapacityTotal = (
  scenarios: IScenarioGroupDetailRow[],
  widths: Record<number, number>,
  change: number,
) => {
  const direction = Math.sign(change)
  if (direction === 0) return 0

  return scenarios.reduce(
    (total, scenario) => total + Math.max(getScenarioReviewCardWidthChangeCapacity(widths[scenario.scenarioId], direction), 0),
    0,
  )
}

const applyScenarioReviewCardWidthChange = (
  scenarios: IScenarioGroupDetailRow[],
  sourceWidths: Record<number, number>,
  targetWidths: Record<number, number>,
  change: number,
) => {
  const direction = Math.sign(change)
  if (direction === 0) return

  let remainingChange = Math.abs(change)
  let adjustableScenarios = scenarios
    .map((scenario) => ({
      scenario,
      capacity: Math.max(getScenarioReviewCardWidthChangeCapacity(sourceWidths[scenario.scenarioId], direction), 0),
    }))
    .filter(({ capacity }) => capacity > 0)

  while (remainingChange > 0.0001 && adjustableScenarios.length > 0) {
    const changePerScenario = remainingChange / adjustableScenarios.length
    const nextAdjustableScenarios: Array<{ scenario: IScenarioGroupDetailRow; capacity: number }> = []

    adjustableScenarios.forEach(({ scenario, capacity }) => {
      const appliedChange = Math.min(changePerScenario, capacity)
      targetWidths[scenario.scenarioId] += direction * appliedChange
      remainingChange -= appliedChange

      const nextCapacity = capacity - appliedChange
      if (nextCapacity > 0.0001) nextAdjustableScenarios.push({ scenario, capacity: nextCapacity })
    })

    adjustableScenarios = nextAdjustableScenarios
  }
}

const roundScenarioReviewCardWidths = (scenarios: IScenarioGroupDetailRow[], widths: Record<number, number>, targetTotal: number) => {
  let assignedTotal = 0

  scenarios.forEach((scenario, index) => {
    const width =
      index === scenarios.length - 1
        ? Math.round((targetTotal - assignedTotal) * 100) / 100
        : Math.round(widths[scenario.scenarioId] * 100) / 100
    widths[scenario.scenarioId] = width
    assignedTotal += width
  })
}

const getScenarioReviewResizedCardWidths = (
  scenarios: IScenarioGroupDetailRow[],
  widths: Record<number, number>,
  splitterIndex: number,
  delta: number,
) => {
  const leftScenarios = scenarios.slice(0, splitterIndex + 1)
  const rightScenarios = scenarios.slice(splitterIndex + 1)
  if (leftScenarios.length === 0 || rightScenarios.length === 0) return widths

  const direction = Math.sign(delta)
  if (direction === 0) return widths

  const constrainedDelta =
    direction *
    Math.min(
      Math.abs(delta),
      getScenarioReviewCardWidthChangeCapacityTotal(leftScenarios, widths, delta),
      getScenarioReviewCardWidthChangeCapacityTotal(rightScenarios, widths, -delta),
    )
  const nextWidths = { ...widths }

  applyScenarioReviewCardWidthChange(leftScenarios, widths, nextWidths, constrainedDelta)
  applyScenarioReviewCardWidthChange(rightScenarios, widths, nextWidths, -constrainedDelta)
  roundScenarioReviewCardWidths(
    leftScenarios,
    nextWidths,
    leftScenarios.reduce((total, scenario) => total + widths[scenario.scenarioId], constrainedDelta),
  )
  roundScenarioReviewCardWidths(
    rightScenarios,
    nextWidths,
    rightScenarios.reduce((total, scenario) => total + widths[scenario.scenarioId], -constrainedDelta),
  )

  return nextWidths
}

const ScenarioReviewInfoCard = ({ label, value }: { label: string; value: string }) => (
  <Stack
    minWidth={0}
    bgcolor="gray.5"
    borderRadius="10px"
    padding="8px 12px"
    boxSizing="border-box"
    sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
  >
    <Typography variant="body2SB14" color="contentText.Subtext" lineHeight={1.5}>
      {label}
    </Typography>
    <Typography variant="body2SB14" color="contentText.Normal" lineHeight={1.5}>
      {value}
    </Typography>
  </Stack>
)

const ScenarioReviewSectionHeader = ({ title }: { title: string }) => (
  <Typography variant="body2SB14" color="contentText.Black" lineHeight={1.5} padding="6px 8px">
    {title}
  </Typography>
)

const ScenarioReviewEllipsisText = ({ value, sx, ...typographyProps }: Omit<TypographyProps, 'children'> & { value: string }) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  const typography = (
    <Typography
      ref={ref}
      {...typographyProps}
      noWrap
      sx={[
        {
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {value}
    </Typography>
  )

  return isEllipsis ? <NextGenMIFollowCursorTooltip title={value}>{typography}</NextGenMIFollowCursorTooltip> : typography
}

const ScenarioReviewSignpost = ({ signpost }: { signpost: IScenarioSignpostDefinition }) => (
  <Stack gap="8px" padding="10px 12px" bgcolor="gray.5" borderRadius="10px" minWidth={0}>
    <Stack minWidth={0}>
      <ScenarioReviewEllipsisText value={signpost.label} variant="body2SB14" color="contentText.Black" lineHeight={1.5} />
      <ScenarioReviewEllipsisText
        value={`${signpost.directionLabel} · ${signpost.strengthLabel}`}
        variant="body2M14"
        color="contentText.Normal"
        lineHeight={1.5}
      />
    </Stack>
    <Divider />
    <Stack gap="2px" minWidth={0}>
      <Typography variant="body2SB14" color="contentText.Subtext" lineHeight={1.5}>
        핵심 근거
      </Typography>
      <NextGenMITableBodyText
        value={signpost.rationale || '-'}
        color="contentText.Normal"
        lineClamp={3}
        tooltipWhenTruncated
        sx={{ lineHeight: 1.5 }}
      />
    </Stack>
  </Stack>
)

const ScenarioReviewCardSplitter = ({
  scenarioName,
  active = false,
  trailing = false,
  onPointerDown,
  onKeyDown,
}: {
  scenarioName: string
  active?: boolean
  trailing?: boolean
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}) => (
  <Stack
    role="separator"
    aria-label={`${scenarioName} 카드 너비 조절`}
    aria-orientation="vertical"
    tabIndex={0}
    position={trailing ? 'absolute' : undefined}
    top={trailing ? '0px' : undefined}
    right={trailing ? `-${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH}px` : undefined}
    bottom={trailing ? '0px' : undefined}
    width={`${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH}px`}
    flex={`0 0 ${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH}px`}
    alignItems="center"
    justifyContent="center"
    onPointerDown={onPointerDown}
    onKeyDown={onKeyDown}
    sx={{
      cursor: 'col-resize',
      outline: 'none',
      touchAction: 'none',
      zIndex: 4,
      '&:hover .scenario-review-card-splitter-track, &:focus-visible .scenario-review-card-splitter-track': { opacity: 1 },
    }}
  >
    <Stack
      className="scenario-review-card-splitter-track"
      width="100%"
      height="100%"
      padding="10px 0"
      alignItems="center"
      justifyContent="center"
      boxSizing="border-box"
      sx={{ opacity: active ? 1 : 0, transition: 'opacity 120ms ease' }}
    >
      <Stack
        width="4px"
        flex={1}
        minHeight={0}
        sx={(theme) => ({ background: `linear-gradient(0deg, transparent 0%, ${theme.palette.mari.Primary} 50%, transparent 100%)` })}
      />
    </Stack>
  </Stack>
)

const ScenarioReviewCard = ({
  scenario,
  cardWidth,
  narrativeHeight,
  showSplitter = false,
  splitterEnabled = true,
  splitterActive = false,
  showTrailingSplitter = false,
  trailingSplitterActive = false,
  cardResizeDragging = false,
  titleSticky = false,
  pinned = false,
  pinnedLeftOffset = 24,
  pinnedRightOffset = 24,
  showPinnedLeftBackdrop = false,
  showPinnedRightBackdrop = false,
  onNarrativeTextRef,
  onPinToggle,
  onSplitterPointerDown,
  onSplitterKeyDown,
  onTrailingSplitterPointerDown,
  onTrailingSplitterKeyDown,
}: {
  scenario: IScenarioDetailViewRes
  cardWidth: number
  narrativeHeight: number
  showSplitter?: boolean
  splitterEnabled?: boolean
  splitterActive?: boolean
  showTrailingSplitter?: boolean
  trailingSplitterActive?: boolean
  cardResizeDragging?: boolean
  titleSticky?: boolean
  pinned?: boolean
  pinnedLeftOffset?: number
  pinnedRightOffset?: number
  showPinnedLeftBackdrop?: boolean
  showPinnedRightBackdrop?: boolean
  onNarrativeTextRef: (element: HTMLParagraphElement | null) => void
  onPinToggle: () => void
  onSplitterPointerDown: (event: PointerEvent<HTMLElement>) => void
  onSplitterKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onTrailingSplitterPointerDown: (event: PointerEvent<HTMLElement>) => void
  onTrailingSplitterKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}) => (
  <Stack
    position={pinned ? 'sticky' : 'relative'}
    left={pinned ? `${pinnedLeftOffset}px` : undefined}
    right={pinned ? `${pinnedRightOffset}px` : undefined}
    zIndex={pinned ? 5 : undefined}
    width={`calc(var(--scenario-review-card-width) + ${showSplitter ? SCENARIO_REVIEW_CARD_SPLITTER_WIDTH : 0}px)`}
    flex={`0 0 calc(var(--scenario-review-card-width) + ${showSplitter ? SCENARIO_REVIEW_CARD_SPLITTER_WIDTH : 0}px)`}
    direction="row"
    alignItems="stretch"
    bgcolor={pinned ? 'commonColor.White' : undefined}
    minWidth={0}
    style={{ '--scenario-review-card-width': `${cardWidth}px` } as CSSProperties}
    sx={{
      isolation: 'isolate',
      '&::before': {
        content: showPinnedLeftBackdrop ? '""' : 'none',
        position: 'absolute',
        top: 0,
        left: `-${pinnedLeftOffset}px`,
        bottom: 0,
        width: `${pinnedLeftOffset}px`,
        bgcolor: 'commonColor.White',
        pointerEvents: 'none',
        opacity: showPinnedLeftBackdrop ? 1 : 0,
        transition: 'opacity 180ms ease',
        zIndex: 0,
      },
      '&::after': {
        content: showPinnedRightBackdrop ? '""' : 'none',
        position: 'absolute',
        top: 0,
        right: `-${pinnedRightOffset}px`,
        bottom: 0,
        width: `${pinnedRightOffset}px`,
        bgcolor: 'commonColor.White',
        pointerEvents: 'none',
        opacity: showPinnedRightBackdrop ? 1 : 0,
        transition: 'opacity 180ms ease',
        zIndex: 0,
      },
      transition: cardResizeDragging ? 'none' : 'width 180ms ease, flex-basis 180ms ease',
    }}
  >
    {showSplitter &&
      (splitterEnabled ? (
        <ScenarioReviewCardSplitter
          scenarioName={scenario.scenarioName}
          active={splitterActive}
          onPointerDown={onSplitterPointerDown}
          onKeyDown={onSplitterKeyDown}
        />
      ) : (
        <Stack aria-hidden width={`${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH}px`} flex={`0 0 ${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH}px`} />
      ))}
    <Stack
      width="var(--scenario-review-card-width)"
      flex="0 0 var(--scenario-review-card-width)"
      height="100%"
      sx={{ transition: cardResizeDragging ? 'none' : 'width 180ms ease, flex-basis 180ms ease' }}
    >
      <Stack
        position="sticky"
        top="0px"
        zIndex={3}
        bgcolor="commonColor.White"
        sx={{
          boxShadow: titleSticky ? NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED : 'none',
          transition: `box-shadow ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS}ms ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING}`,
        }}
      >
        <Stack
          bgcolor="commonColor.White"
          border="1px solid"
          borderBottom={0}
          borderColor="contentBorder.Normal"
          borderRadius="10px 10px 0 0"
          padding="12px 12px 0"
        >
          <Stack gap="6px" padding="6px 8px 12px" minHeight="95px">
            <Stack direction="row" alignItems="center" gap="4px" width="100%">
              <NextGenMIDisplayOrderBadge value={scenario.displayOrder} height="21px" />
              {scenario.baseCase && <NextGenMIBaseCaseChip height="21px" padding="2px 6px" />}
              {!scenario.baseCase && (scenario.scenarioRole || scenario.scenarioRoleLabel || scenario.scenarioType) && (
                <ScenarioRoleBadge role={scenario.scenarioRole} type={scenario.scenarioType} label={scenario.scenarioRoleLabel} />
              )}
              <Box
                component="button"
                type="button"
                aria-label={`${scenario.scenarioName} 시나리오 ${pinned ? '고정 해제' : '고정'}`}
                aria-pressed={pinned}
                marginLeft="auto"
                onClick={onPinToggle}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  width: '20px',
                  height: '20px',
                  padding: 0,
                  border: 0,
                  bgcolor: 'transparent',
                  color: pinned ? 'commonColor.Primary' : 'gray.50',
                  cursor: 'pointer',
                  transition: 'color 120ms ease',
                  '& .MuiSvgIcon-root': {
                    transform: pinned ? 'rotate(-45deg)' : 'rotate(0deg)',
                    transformOrigin: 'center',
                    transition: 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  },
                  '&:hover': {
                    color: pinned ? 'commonColor.Primary' : 'gray.60',
                  },
                  '&:hover .MuiSvgIcon-root': {
                    transform: 'rotate(-45deg)',
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    '& .MuiSvgIcon-root': {
                      transition: 'none',
                    },
                  },
                }}
              >
                <PushPinIcon sx={{ fontSize: '16px' }} />
              </Box>
            </Stack>
            <Typography
              fontSize="18px"
              fontWeight={600}
              color="contentText.Black"
              lineHeight={1.4}
              height="50px"
              overflow="hidden"
              sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
            >
              {scenario.scenarioName}
            </Typography>
          </Stack>
          <Divider />
        </Stack>
      </Stack>

      <Stack
        flex={1}
        minHeight={0}
        bgcolor="commonColor.White"
        border="1px solid"
        borderTop={0}
        borderColor="contentBorder.Normal"
        borderRadius="0 0 10px 10px"
        padding="0 12px 12px"
      >
        <Stack gap="6px" padding="24px 0">
          <ScenarioReviewSectionHeader title="시나리오 내러티브" />
          <Stack minHeight={`${narrativeHeight}px`} bgcolor="gray.5" borderRadius="10px" padding="12px" boxSizing="border-box">
            <Typography
              ref={onNarrativeTextRef}
              variant="body2M14"
              color="contentText.Normal"
              lineHeight={1.5}
              sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}
            >
              {scenario.narrative || '-'}
            </Typography>
          </Stack>
        </Stack>
        <Divider />

        <Stack gap="6px" padding="24px 0">
          <ScenarioReviewSectionHeader title="시나리오 특화 분기" />
          <Stack gap="8px" width="100%" minWidth={0}>
            {scenario.dimensions.map((dimension) => (
              <ScenarioReviewInfoCard key={dimension.key} label={dimension.label} value={dimension.valueLabel ?? dimension.value} />
            ))}
          </Stack>
        </Stack>
        <Divider />

        <Stack gap="6px" padding="24px 0">
          <ScenarioReviewSectionHeader title="시나리오 가능성" />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            minHeight="48px"
            bgcolor="gray.5"
            borderRadius="10px"
            padding="6px 12px"
          >
            <Typography variant="body2SB14" color="contentText.Black" lineHeight={1.4} noWrap>
              시나리오 가능성
            </Typography>
            <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4}>
              {Number.isFinite(toDisplayProbabilityPercent(scenario.adjustedProbability ?? scenario.probability))
                ? `${Math.round(toDisplayProbabilityPercent(scenario.adjustedProbability ?? scenario.probability))}%`
                : '-'}
            </Typography>
          </Stack>
        </Stack>
        <Divider />

        <Stack gap="6px" padding="24px 0 0">
          <ScenarioReviewSectionHeader title="주요 Signpost" />
          <Stack gap="8px">
            {scenario.signpostDefinitions.length === 0 ? (
              <Typography variant="body2M14" color="contentText.Subtext" lineHeight={1.5} padding="10px 12px">
                Signpost 데이터가 없습니다.
              </Typography>
            ) : (
              scenario.signpostDefinitions.map((signpost, index) => (
                <ScenarioReviewSignpost key={`${signpost.label}-${signpost.displayOrder}-${index}`} signpost={signpost} />
              ))
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
    {showTrailingSplitter && (
      <ScenarioReviewCardSplitter
        scenarioName={scenario.scenarioName}
        active={trailingSplitterActive}
        trailing
        onPointerDown={onTrailingSplitterPointerDown}
        onKeyDown={onTrailingSplitterKeyDown}
      />
    )}
  </Stack>
)

const ScenarioReviewCardSkeleton = () => (
  <Skeleton variant="rounded" width="400px" height="720px" sx={{ flex: '0 0 400px', borderRadius: '10px' }} />
)

interface ScenarioGroupScenarioReviewDialogProps {
  open: boolean
  scenarioGroupId: string
  scenarios: IScenarioGroupDetailRow[]
  onClose: () => void
}

const ScenarioGroupScenarioReviewDialog = ({ open, scenarioGroupId, scenarios, onClose }: ScenarioGroupScenarioReviewDialogProps) => {
  const scenarioDetailQueries = useQueries({
    queries: scenarios.map((scenario) => ({
      queryKey: ['nextGenMIScenarioGroupScenarioDetail', scenarioGroupId, scenario.scenarioId],
      queryFn: () => nextGenMIScenarioGroupService.getScenarioDetail(scenarioGroupId, scenario.scenarioId),
      enabled: open && Boolean(scenarioGroupId),
      refetchOnWindowFocus: false,
      gcTime: 0,
    })),
  })
  const loading = scenarioDetailQueries.some((query) => query.isLoading)
  const scenarioDetailsUpdatedAt = scenarioDetailQueries.map((query) => query.dataUpdatedAt).join(',')
  const narrativeTextRefs = useRef<Record<number, HTMLParagraphElement | null>>({})
  const cardResizeCleanupRef = useRef<(() => void) | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scenarioCardsRef = useRef<HTMLDivElement>(null)
  const [narrativeHeight, setNarrativeHeight] = useState(194)
  const [cardWidths, setCardWidths] = useState<Record<number, number>>(() => createScenarioReviewCardWidths(scenarios))
  const [activeSplitterIndex, setActiveSplitterIndex] = useState<number | null>(null)
  const [isMaximized, setIsMaximized] = useState(() => scenarios.length > 3)
  const [pinnedScenarioIds, setPinnedScenarioIds] = useState<number[]>([])
  const [scrollEdges, setScrollEdges] = useState({ top: false, right: false, bottom: false, left: false })
  const [stickyCardEdges, setStickyCardEdges] = useState<{
    left: number | null
    right: number | null
    leftSplitterIndex: number | null
  }>({ left: null, right: null, leftSplitterIndex: null })
  const pinnedScenarioIdSet = useMemo(() => new Set(pinnedScenarioIds), [pinnedScenarioIds])
  const firstPinnedScenarioId = useMemo(
    () => scenarios.find((scenario) => pinnedScenarioIdSet.has(scenario.scenarioId))?.scenarioId,
    [pinnedScenarioIdSet, scenarios],
  )
  const lastPinnedScenarioId = useMemo(
    () =>
      scenarios
        .slice()
        .reverse()
        .find((scenario) => pinnedScenarioIdSet.has(scenario.scenarioId))?.scenarioId,
    [pinnedScenarioIdSet, scenarios],
  )
  const pinnedScenarioOffsets = useMemo(() => {
    let leftOffset = 24
    let rightOffset = 8
    let leftPinnedCount = 0
    const nextOffsets = new Map<number, { left: number; right: number }>()

    scenarios.forEach((scenario, index) => {
      if (!pinnedScenarioIdSet.has(scenario.scenarioId)) return

      const splitterWidth = index > 0 ? SCENARIO_REVIEW_CARD_SPLITTER_WIDTH : 0
      const cardLeftOffset = leftPinnedCount === 0 ? leftOffset - splitterWidth : leftOffset
      nextOffsets.set(scenario.scenarioId, { left: cardLeftOffset, right: 0 })
      leftOffset = cardLeftOffset + splitterWidth + (cardWidths[scenario.scenarioId] ?? SCENARIO_REVIEW_CARD_DEFAULT_WIDTH)
      leftPinnedCount += 1
    })

    scenarios
      .slice()
      .reverse()
      .forEach((scenario, reverseIndex) => {
        if (!pinnedScenarioIdSet.has(scenario.scenarioId)) return

        const scenarioIndex = scenarios.length - reverseIndex - 1
        const left = nextOffsets.get(scenario.scenarioId)?.left ?? 24
        nextOffsets.set(scenario.scenarioId, { left, right: rightOffset })
        rightOffset +=
          (cardWidths[scenario.scenarioId] ?? SCENARIO_REVIEW_CARD_DEFAULT_WIDTH) +
          (scenarioIndex > 0 ? SCENARIO_REVIEW_CARD_SPLITTER_WIDTH : 0)
      })

    return nextOffsets
  }, [cardWidths, pinnedScenarioIdSet, scenarios])

  const measureNarrativeHeight = useCallback(() => {
    const nextHeight = Math.max(
      194,
      ...Object.values(narrativeTextRefs.current)
        .filter((element): element is HTMLParagraphElement => element !== null)
        .map((element) => element.scrollHeight + 24),
    )
    setNarrativeHeight((currentHeight) => (currentHeight === nextHeight ? currentHeight : nextHeight))
  }, [])

  useEffect(() => {
    setCardWidths((currentWidths) => createScenarioReviewCardWidths(scenarios, currentWidths))
  }, [scenarios])

  useEffect(() => {
    setPinnedScenarioIds((currentIds) =>
      currentIds.filter((scenarioId) => scenarios.some((scenario) => scenario.scenarioId === scenarioId)),
    )
  }, [scenarios])

  useEffect(() => {
    if (!open) setIsMaximized(scenarios.length > 3)
  }, [open, scenarios.length])

  useLayoutEffect(() => {
    if (!open || loading) return undefined

    measureNarrativeHeight()
    const resizeObserver = new ResizeObserver(measureNarrativeHeight)
    Object.values(narrativeTextRefs.current).forEach((element) => {
      if (element) resizeObserver.observe(element)
    })

    return () => resizeObserver.disconnect()
  }, [loading, measureNarrativeHeight, open, scenarioDetailsUpdatedAt])

  useEffect(
    () => () => {
      cardResizeCleanupRef.current?.()
    },
    [],
  )

  const handleScenarioPinToggle = useCallback((scenarioId: number) => {
    setPinnedScenarioIds((currentIds) =>
      currentIds.includes(scenarioId) ? currentIds.filter((currentId) => currentId !== scenarioId) : [...currentIds, scenarioId],
    )
  }, [])

  const handleSplitterPointerDown = useCallback(
    (splitterIndex: number, event: PointerEvent<HTMLElement>) => {
      event.preventDefault()
      cardResizeCleanupRef.current?.()

      const startX = event.clientX
      const startWidths = createScenarioReviewCardWidths(scenarios, cardWidths)
      setActiveSplitterIndex(splitterIndex)

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        setCardWidths(getScenarioReviewResizedCardWidths(scenarios, startWidths, splitterIndex, Math.round(moveEvent.clientX - startX)))
      }
      const handlePointerUp = () => {
        globalThis.removeEventListener('pointermove', handlePointerMove)
        globalThis.removeEventListener('pointerup', handlePointerUp)
        cardResizeCleanupRef.current = null
        setActiveSplitterIndex(null)
      }

      cardResizeCleanupRef.current = () => {
        globalThis.removeEventListener('pointermove', handlePointerMove)
        globalThis.removeEventListener('pointerup', handlePointerUp)
        setActiveSplitterIndex(null)
      }
      globalThis.addEventListener('pointermove', handlePointerMove)
      globalThis.addEventListener('pointerup', handlePointerUp)
    },
    [cardWidths, scenarios],
  )

  const handleSplitterKeyDown = useCallback(
    (splitterIndex: number, event: KeyboardEvent<HTMLElement>) => {
      const delta = event.key === 'ArrowLeft' ? -20 : event.key === 'ArrowRight' ? 20 : 0
      if (delta === 0) return

      event.preventDefault()
      setCardWidths((currentWidths) =>
        getScenarioReviewResizedCardWidths(scenarios, createScenarioReviewCardWidths(scenarios, currentWidths), splitterIndex, delta),
      )
    },
    [scenarios],
  )

  const updateScrollEdges = useCallback(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const scrollContainerStyle = globalThis.getComputedStyle(scrollContainer)
    const scrollContainerRect = scrollContainer.getBoundingClientRect()
    const scenarioCards = scenarioCardsRef.current
    const scenarioCardsStyle = scenarioCards ? globalThis.getComputedStyle(scenarioCards) : null
    const scenarioCardsRect = scenarioCards?.getBoundingClientRect()
    const scrollViewportLeft = scrollContainer.scrollLeft + (Number.parseFloat(scrollContainerStyle.paddingLeft) || 0)
    const scrollViewportRight =
      scrollContainer.scrollLeft + scrollContainer.clientWidth - (Number.parseFloat(scrollContainerStyle.paddingRight) || 0)
    let cardOffsetLeft =
      scrollContainer.scrollLeft +
      (scenarioCardsRect ? scenarioCardsRect.left - scrollContainerRect.left : 0) +
      (scenarioCardsStyle ? Number.parseFloat(scenarioCardsStyle.paddingLeft) || 0 : 0)
    let stickyLeftBoundary: number | null = null
    let stickyRightBoundary: number | null = null
    let stickyLeftSplitterIndex: number | null = null

    scenarios.forEach((scenario, index) => {
      const splitterWidth = index > 0 ? SCENARIO_REVIEW_CARD_SPLITTER_WIDTH : 0
      const cardWidth = cardWidths[scenario.scenarioId] ?? SCENARIO_REVIEW_CARD_DEFAULT_WIDTH
      const cardOffsetRight = cardOffsetLeft + splitterWidth + cardWidth
      const pinnedOffset = pinnedScenarioOffsets.get(scenario.scenarioId)

      if (pinnedOffset) {
        if (cardOffsetLeft < scrollViewportLeft + pinnedOffset.left - 1) {
          const nextStickyLeftBoundary = pinnedOffset.left + splitterWidth + cardWidth
          if (stickyLeftBoundary === null || nextStickyLeftBoundary > stickyLeftBoundary) {
            stickyLeftBoundary = nextStickyLeftBoundary
            stickyLeftSplitterIndex = index
          }
        }
        if (cardOffsetRight > scrollViewportRight - pinnedOffset.right + 1) {
          stickyRightBoundary = Math.max(stickyRightBoundary ?? 0, pinnedOffset.right + cardWidth)
        }
      }

      cardOffsetLeft = cardOffsetRight
    })

    const nextEdges = {
      top: scrollContainer.scrollTop > 2,
      right: scrollContainer.scrollLeft + scrollContainer.clientWidth < scrollContainer.scrollWidth - 2,
      bottom: scrollContainer.scrollTop + scrollContainer.clientHeight < scrollContainer.scrollHeight - 2,
      left: scrollContainer.scrollLeft > 2,
    }
    setScrollEdges((currentEdges) =>
      currentEdges.top === nextEdges.top &&
      currentEdges.right === nextEdges.right &&
      currentEdges.bottom === nextEdges.bottom &&
      currentEdges.left === nextEdges.left
        ? currentEdges
        : nextEdges,
    )
    setStickyCardEdges((currentEdges) =>
      currentEdges.left === stickyLeftBoundary &&
      currentEdges.right === stickyRightBoundary &&
      currentEdges.leftSplitterIndex === stickyLeftSplitterIndex
        ? currentEdges
        : { left: stickyLeftBoundary, right: stickyRightBoundary, leftSplitterIndex: stickyLeftSplitterIndex },
    )
  }, [cardWidths, pinnedScenarioOffsets, scenarios])

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!open || !scrollContainer) return undefined

    let frameId = 0
    const scheduleUpdate = () => {
      if (frameId !== 0) return
      frameId = globalThis.requestAnimationFrame(() => {
        frameId = 0
        updateScrollEdges()
      })
    }
    const resizeObserver = new ResizeObserver(scheduleUpdate)

    resizeObserver.observe(scrollContainer)
    if (scrollContainer.firstElementChild) resizeObserver.observe(scrollContainer.firstElementChild)
    scrollContainer.addEventListener('scroll', scheduleUpdate, { passive: true })
    globalThis.addEventListener('resize', scheduleUpdate)
    scheduleUpdate()

    return () => {
      if (frameId !== 0) globalThis.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      scrollContainer.removeEventListener('scroll', scheduleUpdate)
      globalThis.removeEventListener('resize', scheduleUpdate)
    }
  }, [open, scenarioDetailsUpdatedAt, updateScrollEdges])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMaximized ? 'calc(100dvw - 32px)' : 'calc(100vw - 96px)',
            maxWidth: isMaximized ? 'calc(100dvw - 32px)' : '1440px',
            height: isMaximized ? 'calc(100dvh - 32px)' : 'calc(100vh - 48px)',
            maxHeight: isMaximized ? 'calc(100dvh - 32px)' : 'calc(100vh - 48px)',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            borderRadius: '10px',
            boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
            margin: isMaximized ? '16px' : 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 300ms ease, height 300ms ease, max-width 300ms ease, max-height 300ms ease, margin 300ms ease',
          },
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" padding="12px 20px" flexShrink={0}>
        <Typography color="contentText.Black" fontSize="18px" fontWeight={600} lineHeight={1.4}>
          시나리오 검토
        </Typography>
        <Stack direction="row" alignItems="center" gap="4px">
          <MIBaseButton
            variant="text"
            title={isMaximized ? '기본 크기로 보기' : '최대화'}
            aria-label={isMaximized ? '기본 크기로 보기' : '최대화'}
            aria-pressed={isMaximized}
            onClick={() => setIsMaximized((maximized) => !maximized)}
            disableRipple
            buttonHoverBgColor="contentBG.Hover"
            sx={{ height: '36px', width: '36px', minWidth: '36px', padding: '8px', borderRadius: '8px', color: 'contentIcon.Enabled' }}
          >
            {isMaximized ? <CollapseIcon width={16} height={16} /> : <ExpandIcon width={24} height={24} />}
          </MIBaseButton>
          <MIBaseButton
            aria-label="닫기"
            variant="text"
            onClick={onClose}
            sx={{ height: '36px', width: '36px', minWidth: '36px', padding: '6px' }}
          >
            <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
          </MIBaseButton>
        </Stack>
      </Stack>

      <DialogContent sx={{ display: 'flex', flex: 1, minHeight: 0, padding: 0, overflow: 'hidden' }}>
        <Stack position="relative" flex={1} minWidth={0} minHeight={0} overflow="hidden">
          <ScrollWrapper
            ref={scrollContainerRef}
            height="100%"
            overflowX="auto"
            showHorizontalScrollbar
            horizontalScrollbarInset={24}
            scrollbarOutside
            scrollbarOutsideGutter={18}
            scrollbarOutsideRightGutter={14}
            showScrollbarOnHover
            styScroll={{ width: 6 }}
            sx={{
              flex: 1,
              minWidth: 0,
              '&:hover .scroll-wrapper-thumb, &:hover .scroll-wrapper-track, &:hover .scroll-wrapper-horizontal-thumb, &:hover .scroll-wrapper-horizontal-track':
                {
                  opacity: 1,
                  pointerEvents: 'auto',
                },
            }}
          >
            <Stack
              ref={scenarioCardsRef}
              direction="row"
              alignItems="stretch"
              gap="0px"
              width="100%"
              padding="0 8px 20px 24px"
              boxSizing="border-box"
            >
              {loading
                ? scenarios.map((scenario) => <ScenarioReviewCardSkeleton key={scenario.scenarioId} />)
                : scenarioDetailQueries.map((query, index) =>
                  query.data ? (
                    <ScenarioReviewCard
                      key={query.data.scenarioId}
                      scenario={query.data}
                      cardWidth={cardWidths[query.data.scenarioId] ?? SCENARIO_REVIEW_CARD_DEFAULT_WIDTH}
                      narrativeHeight={narrativeHeight}
                      showSplitter={index > 0}
                      splitterEnabled={stickyCardEdges.leftSplitterIndex !== index - 1 || pinnedScenarioIdSet.has(query.data.scenarioId)}
                      splitterActive={activeSplitterIndex === index - 1}
                      showTrailingSplitter={stickyCardEdges.leftSplitterIndex === index && index < scenarios.length - 1}
                      trailingSplitterActive={activeSplitterIndex === index}
                      cardResizeDragging={activeSplitterIndex !== null}
                      titleSticky={scrollEdges.top}
                      pinned={pinnedScenarioIdSet.has(query.data.scenarioId)}
                      pinnedLeftOffset={pinnedScenarioOffsets.get(query.data.scenarioId)?.left}
                      pinnedRightOffset={pinnedScenarioOffsets.get(query.data.scenarioId)?.right}
                      showPinnedLeftBackdrop={stickyCardEdges.left !== null && query.data.scenarioId === firstPinnedScenarioId}
                      showPinnedRightBackdrop={stickyCardEdges.right !== null && query.data.scenarioId === lastPinnedScenarioId}
                      onNarrativeTextRef={(element) => {
                        narrativeTextRefs.current[query.data.scenarioId] = element
                      }}
                      onPinToggle={() => handleScenarioPinToggle(query.data.scenarioId)}
                      onSplitterPointerDown={(event) => handleSplitterPointerDown(index - 1, event)}
                      onSplitterKeyDown={(event) => handleSplitterKeyDown(index - 1, event)}
                      onTrailingSplitterPointerDown={(event) => handleSplitterPointerDown(index, event)}
                      onTrailingSplitterKeyDown={(event) => handleSplitterKeyDown(index, event)}
                    />
                  ) : (
                    <ScenarioReviewCardSkeleton key={scenarios[index].scenarioId} />
                  ),
                )}
            </Stack>
          </ScrollWrapper>
          <Stack
            aria-hidden
            position="absolute"
            top="10px"
            left={stickyCardEdges.left === null ? undefined : `${stickyCardEdges.left}px`}
            bottom="28px"
            width={`${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH / 2}px`}
            sx={{
              pointerEvents: 'none',
              bgcolor: 'commonColor.White',
              opacity: stickyCardEdges.left === null ? 0 : 1,
              transition: 'opacity 180ms ease',
              zIndex: 4,
            }}
          />
          <Stack
            aria-hidden
            position="absolute"
            top="10px"
            right={stickyCardEdges.right === null ? undefined : `${stickyCardEdges.right + 14}px`}
            bottom="28px"
            width={`${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH / 2}px`}
            sx={{
              pointerEvents: 'none',
              bgcolor: 'commonColor.White',
              opacity: stickyCardEdges.right === null ? 0 : 1,
              transition: 'opacity 180ms ease',
              zIndex: 4,
            }}
          />
          <Stack
            aria-hidden
            position="absolute"
            top="10px"
            left={stickyCardEdges.left === null ? undefined : `${stickyCardEdges.left + SCENARIO_REVIEW_CARD_SPLITTER_WIDTH / 2}px`}
            bottom="28px"
            width={`${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH}px`}
            sx={{
              pointerEvents: 'none',
              background: 'linear-gradient(to right, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0))',
              maskImage: 'linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)',
              opacity: stickyCardEdges.left === null ? 0 : 1,
              transition: 'opacity 180ms ease',
              zIndex: 4,
            }}
          />
          <Stack
            aria-hidden
            position="absolute"
            top="10px"
            right={stickyCardEdges.right === null ? undefined : `${stickyCardEdges.right + 14 + SCENARIO_REVIEW_CARD_SPLITTER_WIDTH / 2}px`}
            bottom="28px"
            width={`${SCENARIO_REVIEW_CARD_SPLITTER_WIDTH}px`}
            sx={{
              pointerEvents: 'none',
              background: 'linear-gradient(to left, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0))',
              maskImage: 'linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)',
              opacity: stickyCardEdges.right === null ? 0 : 1,
              transition: 'opacity 180ms ease',
              zIndex: 4,
            }}
          />
          <Stack
            aria-hidden
            position="absolute"
            top="0px"
            left="0px"
            bottom="18px"
            width="100px"
            sx={{
              pointerEvents: 'none',
              background: 'linear-gradient(to right, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
              opacity: scrollEdges.left && stickyCardEdges.left === null ? 1 : 0,
              transition: 'opacity 180ms ease',
              zIndex: 1,
            }}
          />
          <Stack
            aria-hidden
            position="absolute"
            top="0px"
            right="14px"
            bottom="18px"
            width="100px"
            sx={{
              pointerEvents: 'none',
              background: 'linear-gradient(to left, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
              opacity: scrollEdges.right && stickyCardEdges.right === null ? 1 : 0,
              transition: 'opacity 180ms ease',
              zIndex: 1,
            }}
          />
          <Stack
            aria-hidden
            position="absolute"
            right="14px"
            bottom="18px"
            left="0px"
            height="80px"
            sx={{
              pointerEvents: 'none',
              background: 'linear-gradient(to top, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
              opacity: scrollEdges.bottom ? 1 : 0,
              transition: 'opacity 180ms ease',
              zIndex: 1,
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions disableSpacing sx={{ padding: '20px', gap: '8px', flexShrink: 0 }}>
        <MIBaseButton
          variant="contained"
          onClick={onClose}
          labelColor="contentText.White"
          sx={{
            height: '34px',
            borderRadius: '8px',
            padding: '8px 10px',
            backgroundColor: 'contentIcon.ActivePrimary',
            '&:hover:not(:disabled)': { backgroundColor: 'contentIcon.ActivePrimary' },
          }}
        >
          확인
        </MIBaseButton>
      </DialogActions>
    </Dialog>
  )
}

export default ScenarioGroupScenarioReviewDialog
