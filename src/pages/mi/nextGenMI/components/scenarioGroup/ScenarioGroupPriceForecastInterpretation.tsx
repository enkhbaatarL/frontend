import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import { Box, Stack, Typography } from '@mui/material'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { IScenarioGraphSeries } from '@/service/mi/nextGenMI/scenarioGroup'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import useSnackbar from '@/hooks/useSnackbar'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIDetailStickySectionHeader from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailStickySectionHeader'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIResizableTextarea from '@/pages/mi/nextGenMI/components/common/NextGenMIResizableTextarea'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { scenarioGroupGraphQueryKey } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'
import {
  buildInterpretationOrderAfterGenerate,
  buildDevPublishingPaginationScenarios,
  DEV_ASSUMED_EXECUTED_SCENARIO_SLICE,
  fetchMockPriceForecastInterpretations,
  generateMockPriceForecastInterpretations,
  getOrderedActiveScenarios,
  MOCK_PRICE_FORECAST_INTERPRETATION_TEXT,
  PREVIEW_INTERPRETATION_PAGINATION_SCENARIOS,
  PREVIEW_INTERPRETATION_SCENARIOS,
  PRICE_FORECAST_INTERPRETATION_MAX_LENGTH,
  PRICE_FORECAST_INTERPRETATION_PREVIEW_OPTIONS,
  PRICE_FORECAST_INTERPRETATION_SAVED_MESSAGE_DURATION_MS,
  resetMockPriceForecastInterpretation,
  saveMockPriceForecastInterpretation,
  sortInterpretedScenarioIds,
  sortInterpretedScenarioItems,
  type PriceForecastInterpretationMap,
  type PriceForecastInterpretationPreviewMode,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupPriceForecastInterpretationMock'
import ScenarioGroupPriceForecastInterpretationResetDialog from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupPriceForecastInterpretationResetDialog'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

interface ScenarioGroupPriceForecastInterpretationProps {
  scenarioGroupId: number
  enabled?: boolean
  stickyTopPx?: number
}

interface InterpretationScenarioItem {
  scenarioId: number
  scenarioName: string
  displayOrder: number
  baseCase: boolean
}

const EMPTY_MESSAGE_HEIGHT = '300px'

const PriceForecastInterpretationGenerateButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
  <MIBaseButton
    variant="contained"
    disabled={disabled}
    onClick={onClick}
    labelColor="contentText.White"
    sx={{
      height: '36px',
      padding: '8px 10px',
      borderRadius: '8px',
      backgroundColor: disabled ? 'contentBG.Disabled' : 'mari.Primary',
      color: disabled ? 'contentText.Disabled' : 'commonColor.White',
      '&:hover:not(:disabled)': {
        backgroundColor: 'mari.Primary',
      },
    }}
  >
    가격전망 해석
  </MIBaseButton>
)

const PriceForecastInterpretationResetButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
  <MIBaseButton
    aria-label="가격전망 해석 초기화"
    variant="outlined"
    disabled={disabled}
    prefix={<ReplayRoundedIcon sx={{ fontSize: '20px', color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled' }} />}
    onClick={onClick}
    sx={{
      flexShrink: 0,
      width: '36px',
      minWidth: '36px',
      height: '36px',
      padding: '8px',
      borderRadius: '8px',
      backgroundColor: disabled ? 'contentBG.Disabled' : 'commonColor.White',
      borderColor: disabled ? 'transparent' : 'contentBorder.Normal',
      '&.Mui-disabled': {
        backgroundColor: 'contentBG.Disabled',
        borderColor: 'transparent',
      },
      '&:hover:not(:disabled)': {
        backgroundColor: 'contentBG.Hover',
        borderColor: 'contentBorder.Normal',
      },
      '& > .MuiBox-root, & .MuiStack-root, & .MuiTypography-root': {
        alignItems: 'center',
        justifyContent: 'center',
      },
      '& .MuiTypography-root': {
        display: 'none',
      },
    }}
  >
    {''}
  </MIBaseButton>
)

const PriceForecastInterpretationScenarioChip = ({
  scenario,
  selected,
  onSelect,
}: {
  scenario: InterpretationScenarioItem
  selected: boolean
  onSelect: () => void
}) => (
  <Box
    component="button"
    type="button"
    onClick={onSelect}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      boxSizing: 'border-box',
      height: '32px',
      maxWidth: '260px',
      padding: '6px 10px',
      borderRadius: '100px',
      border: '1px solid',
      borderColor: selected ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
      bgcolor: selected ? 'contentBG.PrimaryFade' : 'commonColor.White',
      cursor: 'pointer',
      flexShrink: 0,
      ...(!selected && {
        '&:hover': {
          bgcolor: 'contentBG.Hover',
          borderColor: 'contentBorder.Hover',
        },
      }),
    }}
  >
    <NextGenMIDisplayOrderBadge value={scenario.displayOrder} borderColor={selected ? 'contentText.Black' : undefined} />
    {scenario.baseCase && <NextGenMIBaseCaseChip />}
    <NextGenMITableBodyText
      value={scenario.scenarioName}
      variant={selected ? 'body2SB14' : 'body2M14'}
      color={selected ? 'contentText.Black' : 'contentText.Normal'}
      tooltipWhenTruncated
      sx={{ flex: '1 1 0%', minWidth: 0 }}
    />
  </Box>
)

const PriceForecastInterpretationEmptyMessage = ({ icon, message }: { icon: 'warning' | 'info'; message: string }) => (
  <Stack height={EMPTY_MESSAGE_HEIGHT} alignItems="center" justifyContent="center" gap="10px" sx={{ userSelect: 'none' }}>
    {icon === 'warning' ? (
      <ErrorOutlineOutlinedIcon sx={{ fontSize: 24, color: 'gray.60' }} aria-hidden />
    ) : (
      <InfoOutlinedIcon sx={{ fontSize: 24, color: 'gray.60' }} aria-hidden />
    )}
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} textAlign="center">
      {message}
    </Typography>
  </Stack>
)

const GENERATING_CONTENT_OPACITY = 0.1

const PriceForecastInterpretationLoadingMessage = () => (
  <Stack height={EMPTY_MESSAGE_HEIGHT} alignItems="center" justifyContent="center" gap="10px" sx={{ userSelect: 'none' }}>
    <MIAgentSpinner
      size={24}
      tone="gray"
      sx={{
        '& svg': {
          width: '24px',
          height: '24px',
        },
      }}
    />
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
      가격전망 해석을 생성하고 있습니다
    </Typography>
  </Stack>
)

const PriceForecastInterpretationGeneratingOverlay = () => (
  <Stack
    position="absolute"
    top={0}
    right={0}
    bottom={0}
    left={0}
    alignItems="center"
    justifyContent="center"
    gap="10px"
    sx={{ userSelect: 'none', zIndex: 2, pointerEvents: 'none' }}
  >
    <MIAgentSpinner size={40} tone="gray" />
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} textAlign="center">
      가격전망 해석을 생성하고 있습니다
    </Typography>
  </Stack>
)

// #DELETE DEV 미리보기 상태 판별
const isPreviewCompleteMode = (mode: PriceForecastInterpretationPreviewMode) =>
  mode === 'complete' ||
  mode === 'complete-toast' ||
  mode === 'regeneratable' ||
  mode === 'interpreted-one' ||
  mode === 'editing' ||
  mode === 'saved' ||
  mode === 'reset-dialog'

// #DELETE DEV 미리보기 상태 판별
const isPreviewEditableMode = (mode: PriceForecastInterpretationPreviewMode) => mode === 'editing' || mode === 'saved'

const PriceForecastInterpretationSavedMessage = () => (
  <Typography variant="body3SB12" color="contentText.Subtext" lineHeight={1.4} noWrap>
    수정 사항이 저장되었습니다.
  </Typography>
)

// #DELETE DEV 상태 미리보기 툴바
const PriceForecastInterpretationPreviewToolbar = ({
  value,
  onChange,
}: {
  value: PriceForecastInterpretationPreviewMode
  onChange: (mode: PriceForecastInterpretationPreviewMode) => void
}) => (
  <Stack
    direction="row"
    alignItems="center"
    flexWrap="wrap"
    gap="8px"
    padding="10px 12px"
    marginBottom="8px"
    borderRadius="8px"
    border="1px dashed"
    borderColor="contentBorder.Active"
    bgcolor="gray.5"
  >
    <Typography variant="body3SB12" color="contentText.Subtext" flexShrink={0}>
      [DEV] 상태 미리보기
    </Typography>
    {PRICE_FORECAST_INTERPRETATION_PREVIEW_OPTIONS.map((option) => (
      <MIBaseButton
        key={option.value}
        variant={value === option.value ? 'contained' : 'outlined'}
        onClick={() => onChange(option.value)}
        sx={{
          height: '28px',
          padding: '4px 10px',
          borderRadius: '6px',
          ...(value === option.value
            ? {
              backgroundColor: 'mari.Primary',
              '&:hover:not(:disabled)': { backgroundColor: 'mari.Primary' },
            }
            : {}),
        }}
      >
        {option.label}
      </MIBaseButton>
    ))}
  </Stack>
)

const ScenarioGroupPriceForecastInterpretation = ({
  scenarioGroupId,
  enabled = true,
  stickyTopPx,
}: ScenarioGroupPriceForecastInterpretationProps) => {
  const { showSnackbar } = useSnackbar()

  const graphQuery = useQuery({
    queryKey: scenarioGroupGraphQueryKey(scenarioGroupId, 'JKM', 'monthly'),
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupGraph(scenarioGroupId, 'JKM', 'monthly'),
    enabled: enabled && Boolean(scenarioGroupId),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  // 수급모델 실행 상태 폴링은 ScenarioGroupGraphView에서만 수행. 완료 시 graph 쿼리가 refetch되면 여기 scenarioSeries도 함께 갱신된다.
  const scenarioSeries = graphQuery.data?.scenarioSeries ?? []
  const [previewMode, setPreviewMode] = useState<PriceForecastInterpretationPreviewMode>('publishing')
  const [interpretations, setInterpretations] = useState<PriceForecastInterpretationMap>({})
  const [originalInterpretations, setOriginalInterpretations] = useState<PriceForecastInterpretationMap>({})
  const [interpretationOrder, setInterpretationOrder] = useState<number[]>([])
  const [devSimulatedExecutedIds, setDevSimulatedExecutedIds] = useState<Set<number>>(() => new Set())
  const [devExtraScenarioSeries, setDevExtraScenarioSeries] = useState<IScenarioGraphSeries[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | undefined>()
  const [draftText, setDraftText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [savedMessageVisible, setSavedMessageVisible] = useState(false)
  const [maxLengthWarningVisible, setMaxLengthWarningVisible] = useState(false)
  // #DELETE DEV 미리보기 전용 상태
  const [previewDraftText, setPreviewDraftText] = useState(MOCK_PRICE_FORECAST_INTERPRETATION_TEXT)
  const [previewSelectedScenarioId, setPreviewSelectedScenarioId] = useState<number>(PREVIEW_INTERPRETATION_SCENARIOS[2].scenarioId)
  const [previewInterpretedScenarioIds, setPreviewInterpretedScenarioIds] = useState<number[]>(() =>
    PREVIEW_INTERPRETATION_SCENARIOS.map((scenario) => scenario.scenarioId),
  )
  const savedMessageTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const draftScenarioIdRef = useRef<number | undefined>(undefined)
  const draftTextRef = useRef('')
  const devExecutionInitializedGroupRef = useRef<string | null>(null)

  const isPublishingPreview = previewMode === 'publishing'
  // #DELETE DEV 실데이터 미리보기
  const isDevAutoPreview = import.meta.env.DEV && previewMode === 'auto'
  const isDevDataPreview = isDevAutoPreview || isPublishingPreview

  const effectiveScenarioSeries = useMemo(() => {
    const baseSeries =
      !isDevDataPreview || devSimulatedExecutedIds.size === 0
        ? scenarioSeries
        : scenarioSeries.map((series) => (devSimulatedExecutedIds.has(series.scenarioId) ? { ...series, executed: true } : series))

    if (devExtraScenarioSeries.length === 0) return baseSeries

    const existingIds = new Set(baseSeries.map((series) => series.scenarioId))
    return [...baseSeries, ...devExtraScenarioSeries.filter((series) => !existingIds.has(series.scenarioId))]
  }, [devExtraScenarioSeries, devSimulatedExecutedIds, isDevDataPreview, scenarioSeries])

  const orderedActiveScenarios = useMemo(() => getOrderedActiveScenarios(effectiveScenarioSeries), [effectiveScenarioSeries])

  // #DELETE DEV 수급모델 시뮬레이션
  const firstScenarioForDevSimulation = orderedActiveScenarios[0]

  const isFirstScenarioDevSimulated = firstScenarioForDevSimulation ? firstScenarioForDevSimulation.executed : false

  const executedScenarios = useMemo(
    () => effectiveScenarioSeries.filter((series) => series.executed && series.status !== 'discarded'),
    [effectiveScenarioSeries],
  )

  const executedDisplayOrderById = useMemo(
    () => new Map(executedScenarios.map((series) => [series.scenarioId, series.displayOrder])),
    [executedScenarios],
  )

  const visibleInterpretationScenarioIds = useMemo(
    () => interpretationOrder.filter((scenarioId) => executedDisplayOrderById.has(scenarioId)),
    [executedDisplayOrderById, interpretationOrder],
  )

  const visibleInterpretationScenarios = useMemo<InterpretationScenarioItem[]>(
    () =>
      visibleInterpretationScenarioIds
        .map((scenarioId) => effectiveScenarioSeries.find((series) => series.scenarioId === scenarioId))
        .filter((series): series is IScenarioGraphSeries => Boolean(series))
        .map((series) => ({
          scenarioId: series.scenarioId,
          scenarioName: series.scenarioName,
          displayOrder: series.displayOrder,
          baseCase: series.baseCase,
        })),
    [effectiveScenarioSeries, visibleInterpretationScenarioIds],
  )

  const firstUninterpretedActiveScenario = orderedActiveScenarios.find((series) => !interpretations[series.scenarioId]?.trim())

  const pendingInterpretationScenarios = useMemo(
    () => executedScenarios.filter((series) => !interpretations[series.scenarioId]?.trim()),
    [executedScenarios, interpretations],
  )

  const hasExecutedScenario = executedScenarios.length > 0
  const hasInterpretation = visibleInterpretationScenarioIds.length > 0

  const publishingCanAddFirstScenario =
    isPublishingPreview &&
    hasInterpretation &&
    Boolean(firstUninterpretedActiveScenario) &&
    firstUninterpretedActiveScenario?.scenarioId === orderedActiveScenarios[0]?.scenarioId &&
    !firstUninterpretedActiveScenario.executed

  const canGenerate =
    (hasExecutedScenario && pendingInterpretationScenarios.length > 0 && !isGenerating) || (publishingCanAddFirstScenario && !isGenerating)

  // #DELETE DEV 미리보기 상태 오버라이드
  const isPreviewActive = import.meta.env.DEV && previewMode !== 'auto' && previewMode !== 'publishing'
  const isPreviewEditable = isPreviewActive && isPreviewEditableMode(previewMode)

  const previewInterpretedScenarios = useMemo<InterpretationScenarioItem[]>(() => {
    if (!isPreviewActive) return []
    if (!isPreviewCompleteMode(previewMode) && previewMode !== 'disabled') return []

    const previewScenarios =
      previewMode === 'interpreted-one'
        ? [PREVIEW_INTERPRETATION_SCENARIOS[1]]
        : previewMode === 'regeneratable'
          ? PREVIEW_INTERPRETATION_SCENARIOS.slice(0, 2)
          : PREVIEW_INTERPRETATION_PAGINATION_SCENARIOS

    return sortInterpretedScenarioItems(
      previewScenarios
        .filter((scenario) => previewInterpretedScenarioIds.includes(scenario.scenarioId))
        .map((scenario) => ({ ...scenario })),
    )
  }, [isPreviewActive, previewInterpretedScenarioIds, previewMode])

  const effectiveIsGenerating = isPreviewActive && previewMode === 'loading' ? true : isGenerating
  const effectiveHasExecutedScenario = isPreviewActive ? previewMode !== 'empty' : hasExecutedScenario
  const effectiveHasInterpretation = isPreviewActive
    ? isPreviewCompleteMode(previewMode) || previewMode === 'disabled'
      ? previewInterpretedScenarioIds.length > 0
      : false
    : hasInterpretation
  const effectiveCanGenerate =
    isPreviewActive && (previewMode === 'ready' || previewMode === 'regeneratable') ? true : isPreviewActive ? false : canGenerate
  const effectiveIsDisabled = isPreviewActive && previewMode === 'disabled'
  const effectiveInterpretedScenarios = isPreviewActive ? previewInterpretedScenarios : visibleInterpretationScenarios
  const showScenarioInterpretationPanel = isPreviewActive ? effectiveHasInterpretation : visibleInterpretationScenarioIds.length > 0
  const effectiveSelectedScenarioId = isPreviewActive ? previewSelectedScenarioId : selectedScenarioId
  const effectiveDraftText = isPreviewEditable
    ? previewDraftText
    : isPreviewActive && (isPreviewCompleteMode(previewMode) || previewMode === 'disabled')
      ? MOCK_PRICE_FORECAST_INTERPRETATION_TEXT
      : draftText
  const effectiveSavedMessageVisible = isPreviewActive && previewMode === 'saved' ? true : savedMessageVisible
  const showMaxLengthWarning = maxLengthWarningVisible && !effectiveSavedMessageVisible

  const selectedScenario = useMemo(
    () => effectiveInterpretedScenarios.find((scenario) => scenario.scenarioId === effectiveSelectedScenarioId),
    [effectiveInterpretedScenarios, effectiveSelectedScenarioId],
  )

  const selectedScenarioHasModifications = useMemo(() => {
    if (!selectedScenario) return false
    if (isPreviewEditable) {
      return previewDraftText.trim() !== MOCK_PRICE_FORECAST_INTERPRETATION_TEXT.trim()
    }
    if (isPreviewActive) return false

    const scenarioId = selectedScenario.scenarioId
    return (interpretations[scenarioId] ?? '').trim() !== (originalInterpretations[scenarioId] ?? '').trim()
  }, [interpretations, isPreviewActive, isPreviewEditable, originalInterpretations, previewDraftText, selectedScenario])

  // #DELETE DEV 모드 전환 시 상태 초기화
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (previewMode !== 'auto' && previewMode !== 'publishing') return

    setInterpretations({})
    setOriginalInterpretations({})
    setInterpretationOrder([])
    setSelectedScenarioId(undefined)
    setDraftText('')
    setDevSimulatedExecutedIds(new Set())
    setDevExtraScenarioSeries([])
    devExecutionInitializedGroupRef.current = null
  }, [previewMode])

  // #DELETE DEV 미리보기 토스트 시뮬레이션
  useEffect(() => {
    if (!import.meta.env.DEV || previewMode !== 'complete-toast') return
    showSnackbar('시나리오별 가격전망 해석이 생성되었습니다.', { variant: 'success' })
  }, [previewMode, showSnackbar])

  // #DELETE DEV 미리보기 편집 상태 동기화
  useEffect(() => {
    if (!isPreviewEditable) return
    setPreviewDraftText(MOCK_PRICE_FORECAST_INTERPRETATION_TEXT)
  }, [isPreviewEditable, previewMode])

  // #DELETE DEV 미리보기 시나리오 칩 상태 동기화
  useEffect(() => {
    if (!isPreviewActive) return
    if (!isPreviewCompleteMode(previewMode) && previewMode !== 'disabled') return

    if (previewMode === 'interpreted-one') {
      setPreviewInterpretedScenarioIds([PREVIEW_INTERPRETATION_SCENARIOS[1].scenarioId])
      setPreviewSelectedScenarioId(PREVIEW_INTERPRETATION_SCENARIOS[1].scenarioId)
      return
    }

    if (previewMode === 'regeneratable') {
      setPreviewInterpretedScenarioIds(PREVIEW_INTERPRETATION_SCENARIOS.slice(0, 2).map((scenario) => scenario.scenarioId))
      setPreviewSelectedScenarioId(PREVIEW_INTERPRETATION_SCENARIOS[1].scenarioId)
      return
    }

    setPreviewInterpretedScenarioIds(PREVIEW_INTERPRETATION_PAGINATION_SCENARIOS.map((scenario) => scenario.scenarioId))
    setPreviewSelectedScenarioId(PREVIEW_INTERPRETATION_PAGINATION_SCENARIOS[0].scenarioId)
  }, [isPreviewActive, previewMode])

  // #DELETE DEV 미리보기 초기화 다이얼로그 자동 오픈
  useEffect(() => {
    if (!import.meta.env.DEV || previewMode !== 'reset-dialog') return
    setResetDialogOpen(true)
  }, [previewMode])

  // #DELETE DEV 미리보기 선택 시나리오 동기화
  useEffect(() => {
    if (!isPreviewActive || previewInterpretedScenarios.length === 0) return
    if (previewInterpretedScenarios.some((scenario) => scenario.scenarioId === previewSelectedScenarioId)) return
    setPreviewSelectedScenarioId(previewInterpretedScenarios[0].scenarioId)
  }, [isPreviewActive, previewInterpretedScenarios, previewSelectedScenarioId])

  useEffect(() => {
    if (!isDevDataPreview) return
    if (scenarioSeries.length === 0) return

    const devInitKey = `${scenarioGroupId}:${previewMode}`
    if (devExecutionInitializedGroupRef.current === devInitKey) return

    devExecutionInitializedGroupRef.current = devInitKey
    const assumedExecutedScenarios = getOrderedActiveScenarios(scenarioSeries).slice(
      DEV_ASSUMED_EXECUTED_SCENARIO_SLICE.start,
      DEV_ASSUMED_EXECUTED_SCENARIO_SLICE.end,
    )
    const assumedExecutedIds = assumedExecutedScenarios.filter((series) => !series.executed).map((series) => series.scenarioId)

    if (assumedExecutedIds.length > 0) {
      setDevSimulatedExecutedIds(new Set(assumedExecutedIds))
    }
  }, [isDevDataPreview, previewMode, scenarioGroupId, scenarioSeries])

  useEffect(() => {
    let cancelled = false

    void fetchMockPriceForecastInterpretations(scenarioGroupId).then((data) => {
      if (cancelled) return
      setInterpretations(data)
      setOriginalInterpretations(data)
      const interpretedIds = Object.keys(data)
        .map(Number)
        .filter((scenarioId) => data[scenarioId] !== undefined)
      const displayOrderById = new Map(getOrderedActiveScenarios(scenarioSeries).map((series) => [series.scenarioId, series.displayOrder]))
      setInterpretationOrder(sortInterpretedScenarioIds(interpretedIds, displayOrderById))
    })

    return () => {
      cancelled = true
    }
  }, [scenarioGroupId, scenarioSeries])

  useEffect(() => {
    if (visibleInterpretationScenarios.length === 0) {
      setSelectedScenarioId(undefined)
      setDraftText('')
      return
    }

    if (!selectedScenarioId || !visibleInterpretationScenarios.some((scenario) => scenario.scenarioId === selectedScenarioId)) {
      setSelectedScenarioId(visibleInterpretationScenarios[0].scenarioId)
    }
  }, [selectedScenarioId, visibleInterpretationScenarios])

  useEffect(() => {
    if (!selectedScenarioId) {
      setDraftText('')
      draftScenarioIdRef.current = undefined
      return
    }

    setDraftText(interpretations[selectedScenarioId] ?? '')
    draftScenarioIdRef.current = selectedScenarioId
  }, [interpretations, selectedScenarioId])

  useEffect(() => {
    draftTextRef.current = draftText
  }, [draftText])

  useEffect(
    () => () => {
      if (savedMessageTimerRef.current) {
        globalThis.clearTimeout(savedMessageTimerRef.current)
      }
    },
    [],
  )

  const showSavedMessage = useCallback(() => {
    setMaxLengthWarningVisible(false)
    setSavedMessageVisible(true)
    if (savedMessageTimerRef.current) {
      globalThis.clearTimeout(savedMessageTimerRef.current)
    }
    savedMessageTimerRef.current = globalThis.setTimeout(() => {
      setSavedMessageVisible(false)
      savedMessageTimerRef.current = null
    }, PRICE_FORECAST_INTERPRETATION_SAVED_MESSAGE_DURATION_MS)
  }, [])

  useEffect(() => {
    setMaxLengthWarningVisible(false)
  }, [effectiveSelectedScenarioId])

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return

    const publishingPaginationScenarios = publishingCanAddFirstScenario ? buildDevPublishingPaginationScenarios(scenarioSeries) : undefined
    const publishingScenarioToAdd =
      !publishingPaginationScenarios && publishingCanAddFirstScenario && firstUninterpretedActiveScenario
        ? firstUninterpretedActiveScenario
        : undefined

    const scenariosToGenerate = publishingPaginationScenarios
      ? publishingPaginationScenarios.filter((series) => !interpretations[series.scenarioId]?.trim())
      : publishingScenarioToAdd
        ? [publishingScenarioToAdd]
        : pendingInterpretationScenarios

    if (scenariosToGenerate.length === 0) return

    if (publishingPaginationScenarios) {
      const syntheticScenarios = publishingPaginationScenarios.filter(
        (series) => !scenarioSeries.some((origin) => origin.scenarioId === series.scenarioId),
      )
      setDevExtraScenarioSeries(syntheticScenarios)
      setDevSimulatedExecutedIds((prev) => new Set([...prev, ...publishingPaginationScenarios.map((series) => series.scenarioId)]))
    } else if (publishingScenarioToAdd) {
      setDevSimulatedExecutedIds((prev) => new Set([...prev, publishingScenarioToAdd.scenarioId]))
    }

    const generatedScenarioIds = scenariosToGenerate.map((series) => series.scenarioId)
    const displayOrderByIdForGenerate = new Map(executedDisplayOrderById)
    scenariosToGenerate.forEach((series) => {
      displayOrderByIdForGenerate.set(series.scenarioId, series.displayOrder)
    })
    publishingPaginationScenarios?.forEach((series) => {
      displayOrderByIdForGenerate.set(series.scenarioId, series.displayOrder)
    })

    setIsGenerating(true)
    try {
      const generated = await generateMockPriceForecastInterpretations(scenariosToGenerate)
      const nextOrder = buildInterpretationOrderAfterGenerate(interpretationOrder, generatedScenarioIds, displayOrderByIdForGenerate)

      setInterpretations((prev) => ({ ...prev, ...generated }))
      setOriginalInterpretations((prev) => ({ ...prev, ...generated }))
      setInterpretationOrder(nextOrder)
      if (nextOrder[0]) setSelectedScenarioId(nextOrder[0])
      showSnackbar('시나리오별 가격전망 해석이 생성되었습니다.', { variant: 'success' })
    } finally {
      setIsGenerating(false)
    }
  }, [
    canGenerate,
    executedDisplayOrderById,
    firstUninterpretedActiveScenario,
    interpretationOrder,
    interpretations,
    pendingInterpretationScenarios,
    publishingCanAddFirstScenario,
    scenarioSeries,
    showSnackbar,
  ])

  const commitDraft = useCallback(() => {
    if (isPreviewEditable) {
      const trimmed = previewDraftText.trim()
      if (trimmed !== MOCK_PRICE_FORECAST_INTERPRETATION_TEXT.trim()) {
        showSavedMessage()
      }
      return
    }
    if (isPreviewActive) return

    const scenarioId = draftScenarioIdRef.current
    if (!scenarioId) return

    const trimmed = draftTextRef.current.trim()
    const previous = interpretations[scenarioId] ?? ''
    if (trimmed === previous) return

    setInterpretations((prev) => ({ ...prev, [scenarioId]: trimmed }))
    void saveMockPriceForecastInterpretation(scenarioGroupId, scenarioId, trimmed).then(showSavedMessage)
  }, [interpretations, isPreviewActive, isPreviewEditable, previewDraftText, scenarioGroupId, showSavedMessage])

  const handleSelectScenario = useCallback(
    (scenarioId: number) => {
      if (isPreviewActive) {
        setPreviewSelectedScenarioId(scenarioId)
        return
      }
      if (scenarioId === selectedScenarioId) return
      commitDraft()
      setSelectedScenarioId(scenarioId)
    },
    [commitDraft, isPreviewActive, selectedScenarioId],
  )

  const handleOpenResetDialog = useCallback(() => {
    if (effectiveIsDisabled || !selectedScenario) return
    if (!isPreviewActive) commitDraft()
    setResetDialogOpen(true)
  }, [commitDraft, effectiveIsDisabled, isPreviewActive, selectedScenario])

  const handleResetConfirm = useCallback(async () => {
    const targetScenarioId = isPreviewActive ? previewSelectedScenarioId : selectedScenarioId
    if (!targetScenarioId) return

    setIsResetting(true)
    try {
      await resetMockPriceForecastInterpretation(scenarioGroupId, targetScenarioId)

      if (isPreviewActive) {
        setPreviewDraftText(MOCK_PRICE_FORECAST_INTERPRETATION_TEXT)
      } else {
        const restoredText = originalInterpretations[targetScenarioId] ?? ''
        setInterpretations((prev) => ({ ...prev, [targetScenarioId]: restoredText }))
        setDraftText(restoredText)
        draftTextRef.current = restoredText
      }

      setSavedMessageVisible(false)
      setMaxLengthWarningVisible(false)
      if (savedMessageTimerRef.current) {
        globalThis.clearTimeout(savedMessageTimerRef.current)
        savedMessageTimerRef.current = null
      }
      setResetDialogOpen(false)
      showSnackbar('가격전망 해석 내용이 초기화되었습니다.', { variant: 'success' })
    } finally {
      setIsResetting(false)
    }
  }, [isPreviewActive, originalInterpretations, previewSelectedScenarioId, scenarioGroupId, selectedScenarioId, showSnackbar])

  const handleDraftChange = useCallback(
    (nextValue: string) => {
      if (nextValue.length < PRICE_FORECAST_INTERPRETATION_MAX_LENGTH) {
        setMaxLengthWarningVisible(false)
      }
      if (isPreviewEditable) {
        setPreviewDraftText(nextValue)
        return
      }
      if (isPreviewActive) return
      setDraftText(nextValue)
    },
    [isPreviewActive, isPreviewEditable],
  )

  const handleDraftMaxLengthExceeded = useCallback(() => {
    setSavedMessageVisible(false)
    setMaxLengthWarningVisible(true)
  }, [])

  // #DELETE DEV 수급모델 시뮬레이션 핸들러
  const handleDevSimulateFirstSupplyModelExecution = useCallback(() => {
    if (!firstScenarioForDevSimulation || firstScenarioForDevSimulation.executed) return
    setDevSimulatedExecutedIds((prev) => new Set([...prev, firstScenarioForDevSimulation.scenarioId]))
  }, [firstScenarioForDevSimulation])

  const renderBody = () => {
    if (!effectiveHasExecutedScenario) {
      return <PriceForecastInterpretationEmptyMessage icon="warning" message="MI 수급모델을 실행하면 가격전망 해석을 생성할 수 있습니다." />
    }

    if (!showScenarioInterpretationPanel) {
      if (effectiveIsGenerating) {
        return <PriceForecastInterpretationLoadingMessage />
      }

      return <PriceForecastInterpretationEmptyMessage icon="info" message="시나리오별 가격전망 해석을 생성할 수 있습니다." />
    }

    return (
      <Stack gap="4px" width="100%" position="relative">
        <Stack
          direction="row"
          alignItems="center"
          gap="12px"
          width="100%"
          sx={{ opacity: effectiveIsGenerating ? GENERATING_CONTENT_OPACITY : 1 }}
        >
          <Box flex="1 1 0" minWidth={0} position="relative">
            <HorizontalScrollContainer
              gap="5px"
              alignItems="center"
              padding="8px 0"
              gradientWidth={63}
              scrollAmount={0.85}
              alwaysShowScrollButtons
              containerSx={{
                width: '100%',
                '& .scroll-button': {
                  borderRadius: '100px',
                  borderColor: 'contentBorder.Normal',
                  boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              {effectiveInterpretedScenarios.map((scenario) => (
                <PriceForecastInterpretationScenarioChip
                  key={scenario.scenarioId}
                  scenario={scenario}
                  selected={scenario.scenarioId === effectiveSelectedScenarioId}
                  onSelect={() => handleSelectScenario(scenario.scenarioId)}
                />
              ))}
            </HorizontalScrollContainer>
          </Box>
          <PriceForecastInterpretationResetButton
            disabled={effectiveIsDisabled || effectiveIsGenerating || !selectedScenario || !selectedScenarioHasModifications}
            onClick={handleOpenResetDialog}
          />
        </Stack>

        <Box sx={{ opacity: effectiveIsGenerating ? GENERATING_CONTENT_OPACITY : 1 }}>
          {selectedScenario ? (
            <Stack gap="4px" width="100%">
              <NextGenMIResizableTextarea
                ariaLabel={`${selectedScenario.scenarioName} 가격전망 해석`}
                value={effectiveDraftText}
                placeholder="가격전망 해석 내용을 입력해 주세요."
                maxLength={PRICE_FORECAST_INTERPRETATION_MAX_LENGTH}
                minHeight="160px"
                minResizeHeight="160px"
                maxHeight="200px"
                fontSize="16px"
                hoverBgcolor="contentBG.Hover"
                disabled={effectiveIsDisabled || effectiveIsGenerating || (isPreviewActive && !isPreviewEditable)}
                onBlur={commitDraft}
                onChange={handleDraftChange}
                onMaxLengthExceeded={handleDraftMaxLengthExceeded}
              />
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap="12px" height="18px" padding="0 8px">
                <Box minWidth={0} flex="1 1 0">
                  {showMaxLengthWarning ? (
                    <Typography variant="body3M12" color="contentText.Error" lineHeight={1.5} noWrap>
                      최대 {PRICE_FORECAST_INTERPRETATION_MAX_LENGTH.toLocaleString()}자까지 입력할 수 있습니다.
                    </Typography>
                  ) : effectiveSavedMessageVisible ? (
                    <PriceForecastInterpretationSavedMessage />
                  ) : null}
                </Box>
                <Typography
                  variant="body3M12"
                  color={showMaxLengthWarning ? 'contentText.Error' : 'contentText.Subtext'}
                  lineHeight={1.5}
                  flexShrink={0}
                  noWrap
                >
                  {effectiveDraftText.length.toLocaleString()} / {PRICE_FORECAST_INTERPRETATION_MAX_LENGTH.toLocaleString()}
                </Typography>
              </Stack>
            </Stack>
          ) : null}
        </Box>

        {effectiveIsGenerating ? <PriceForecastInterpretationGeneratingOverlay /> : null}
      </Stack>
    )
  }

  // #DELETE DEV 미리보기 컨트롤 표시 여부 - 로컬 테스트 시 VITE_SHOW_PRICE_FORECAST_INTERPRETATION_DEV=true
  const showDevPreviewControls = import.meta.env.DEV && import.meta.env.VITE_SHOW_PRICE_FORECAST_INTERPRETATION_DEV === 'true'

  return (
    <>
      {/* #DELETE DEV 미리보기 컨트롤 */}
      {showDevPreviewControls && (
        <Stack gap="8px" marginBottom="8px">
          <PriceForecastInterpretationPreviewToolbar value={previewMode} onChange={setPreviewMode} />
          {isDevAutoPreview && firstScenarioForDevSimulation && (
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              gap="8px"
              padding="10px 12px"
              borderRadius="8px"
              border="1px dashed"
              borderColor="contentBorder.Active"
              bgcolor="gray.5"
            >
              <Typography variant="body3SB12" color="contentText.Subtext" flexShrink={0}>
                [DEV] 수급모델 시뮬레이션
              </Typography>
              <MIBaseButton
                variant="outlined"
                disabled={isFirstScenarioDevSimulated}
                onClick={handleDevSimulateFirstSupplyModelExecution}
                sx={{ height: '28px', padding: '4px 10px', borderRadius: '6px' }}
              >
                1번 시나리오 수급모델 실행
              </MIBaseButton>
            </Stack>
          )}
        </Stack>
      )}
      <Stack
        gap="4px"
        width="100%"
        bgcolor="commonColor.White"
        sx={
          effectiveIsDisabled
            ? {
              opacity: 0.45,
              pointerEvents: 'none',
              userSelect: 'none',
            }
            : undefined
        }
      >
        <NextGenMIDetailStickySectionHeader
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap="16px"
          padding="8px"
          stickyTopPx={stickyTopPx}
        >
          <Typography fontSize="18px" fontWeight={600} lineHeight={1.4} color="contentText.Black">
            시나리오별 가격전망 해석
          </Typography>
          <PriceForecastInterpretationGenerateButton
            disabled={effectiveIsDisabled || effectiveIsGenerating || !effectiveCanGenerate}
            onClick={() => {
              if (isPreviewActive) return
              void handleGenerate()
            }}
          />
        </NextGenMIDetailStickySectionHeader>
        {renderBody()}
      </Stack>

      <ScenarioGroupPriceForecastInterpretationResetDialog
        open={resetDialogOpen}
        pending={isResetting}
        onClose={() => {
          if (isResetting) return
          setResetDialogOpen(false)
        }}
        onConfirm={() => void handleResetConfirm()}
      />
    </>
  )
}

export default memo(ScenarioGroupPriceForecastInterpretation)
