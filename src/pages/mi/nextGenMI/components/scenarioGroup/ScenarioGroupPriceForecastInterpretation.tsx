import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import { Box, Stack, Typography } from '@mui/material'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  IPriceInterpretationItem,
  IPriceInterpretationSection,
  PriceInterpretationStreamEventData,
  PriceInterpretationStreamEventType,
} from '@/service/mi/nextGenMI/scenarioGroup'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import useSnackbar from '@/hooks/useSnackbar'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIDetailStickySectionHeader from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailStickySectionHeader'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIResizableTextarea from '@/pages/mi/nextGenMI/components/common/NextGenMIResizableTextarea'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import {
  isScenarioGraphModelExecuted,
  scenarioGroupGraphQueryKey,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'
import {
  PRICE_FORECAST_INTERPRETATION_MAX_LENGTH,
  PRICE_FORECAST_INTERPRETATION_SAVED_MESSAGE_DURATION_MS,
  type PriceForecastInterpretationMap,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupPriceForecastInterpretationMock'
import ScenarioGroupPriceForecastInterpretationResetDialog from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupPriceForecastInterpretationResetDialog'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

interface ScenarioGroupPriceForecastInterpretationProps {
  scenarioGroupId: number
  enabled?: boolean
  stickyTopPx?: number
  initialSection?: IPriceInterpretationSection
  groupDetailLoading?: boolean
}

const parsePriceInterpretationStreamEventData = (raw: string): PriceInterpretationStreamEventData | null => {
  try {
    return JSON.parse(raw) as PriceInterpretationStreamEventData
  } catch {
    return null
  }
}

const isPriceInterpretationStreamEventType = (event: string): event is PriceInterpretationStreamEventType =>
  event === 'connected' || event === 'generation'

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

const PriceForecastInterpretationSavedMessage = () => (
  <Typography variant="body3SB12" color="contentText.Subtext" lineHeight={1.4} noWrap>
    수정 사항이 저장되었습니다.
  </Typography>
)

const ScenarioGroupPriceForecastInterpretation = ({
  scenarioGroupId,
  enabled = true,
  stickyTopPx,
  initialSection,
  groupDetailLoading = false,
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
  const scenarioSeries = useMemo(() => graphQuery.data?.scenarioSeries ?? [], [graphQuery.data?.scenarioSeries])
  const [interpretations, setInterpretations] = useState<PriceForecastInterpretationMap>({})
  const [originalInterpretations, setOriginalInterpretations] = useState<PriceForecastInterpretationMap>({})
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | undefined>()
  const [draftText, setDraftText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [savedMessageVisible, setSavedMessageVisible] = useState(false)
  const [maxLengthWarningVisible, setMaxLengthWarningVisible] = useState(false)
  const [interpretationGeneratable, setInterpretationGeneratable] = useState(false)
  const [interpretationItems, setInterpretationItems] = useState<IPriceInterpretationItem[]>([])
  const savedMessageTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const draftScenarioIdRef = useRef<number | undefined>(undefined)
  const draftTextRef = useRef('')
  const priceInterpretationRefreshInFlightRef = useRef(false)
  const priceInterpretationRefreshQueuedRef = useRef(false)
  const refreshPriceInterpretationsRef = useRef<() => void>(() => undefined)
  const handlePriceInterpretationStreamFailureRef = useRef<(reason?: string | null) => void>(() => undefined)
  const showSnackbarRef = useRef(showSnackbar)
  const priceInterpretationStreamHasConnectedRef = useRef(false)
  // POST 이후 SSE generation 전까지 GET 이 [] 여도 로딩 상태를 유지하기 위한 플래그
  const priceInterpretationGeneratePendingRef = useRef(false)

  const executedScenarios = useMemo(() => scenarioSeries.filter(isScenarioGraphModelExecuted), [scenarioSeries])

  const executedScenarioIdSet = useMemo(() => new Set(executedScenarios.map((series) => series.scenarioId)), [executedScenarios])

  const activeInterpretationItems = useMemo(
    () => interpretationItems.filter((item) => executedScenarioIdSet.has(item.scenarioId)),
    [executedScenarioIdSet, interpretationItems],
  )

  const hasExecutedScenario = executedScenarios.length > 0
  const hasInterpretation = activeInterpretationItems.length > 0

  const visibleInterpretationScenarios = useMemo<InterpretationScenarioItem[]>(
    () =>
      activeInterpretationItems.map((item) => ({
        scenarioId: item.scenarioId,
        scenarioName: item.scenarioName,
        displayOrder: item.displayOrder,
        baseCase: item.baseCase,
      })),
    [activeInterpretationItems],
  )

  const canGenerate = interpretationGeneratable && hasExecutedScenario && !isGenerating
  const showScenarioInterpretationPanel = activeInterpretationItems.length > 0
  const showMaxLengthWarning = maxLengthWarningVisible && !savedMessageVisible

  const selectedScenario = useMemo(
    () => visibleInterpretationScenarios.find((scenario) => scenario.scenarioId === selectedScenarioId),
    [selectedScenarioId, visibleInterpretationScenarios],
  )

  const selectedScenarioHasModifications = useMemo(() => {
    if (!selectedScenario) return false

    const scenarioId = selectedScenario.scenarioId
    const currentText = draftText.trim()
    const baseline = originalInterpretations[scenarioId]

    if (baseline !== undefined) {
      return currentText !== baseline.trim()
    }

    const interpretationItem = activeInterpretationItems.find((item) => item.scenarioId === scenarioId)
    return (interpretationItem?.revision ?? 0) > 0
  }, [activeInterpretationItems, draftText, originalInterpretations, selectedScenario])

  const applyPriceInterpretationSection = useCallback((section: IPriceInterpretationSection) => {
    // POST 직후~SSE generation 전까지 BE GET 이 interpretations:[] 일 수 있다.
    // 생성 pending 중이면 로딩만 유지하고, POST ack 로 목록을 만들지 않는다.
    if (section.interpretations.length === 0) {
      setInterpretationGeneratable(section.generatable)
      if (priceInterpretationGeneratePendingRef.current) {
        setIsGenerating(true)
        return
      }

      setInterpretations({})
      setOriginalInterpretations({})
      setInterpretationItems([])
      setIsGenerating(false)
      return
    }

    const nextInterpretations: PriceForecastInterpretationMap = {}
    const nextOriginalInterpretations: PriceForecastInterpretationMap = {}

    // GET 응답 interpretations 를 status(generating|generated|failed) 그대로 반영한다.
    section.interpretations.forEach((item) => {
      if (item.content?.trim()) {
        nextInterpretations[item.scenarioId] = item.content
        if ((item.revision ?? 0) === 0) {
          nextOriginalInterpretations[item.scenarioId] = item.content
        }
      }
    })

    const hasGenerating = section.interpretations.some((item) => item.status === 'generating')
    priceInterpretationGeneratePendingRef.current = hasGenerating
    setInterpretations(nextInterpretations)
    setOriginalInterpretations(nextOriginalInterpretations)
    setInterpretationItems(section.interpretations)
    setInterpretationGeneratable(section.generatable)
    setIsGenerating(hasGenerating)
  }, [])

  const refreshPriceInterpretations = useCallback(() => {
    const refetchOnce = () => {
      if (priceInterpretationRefreshInFlightRef.current) {
        priceInterpretationRefreshQueuedRef.current = true
        return
      }

      priceInterpretationRefreshInFlightRef.current = true
      void nextGenMIScenarioGroupService
        .getPriceInterpretations(scenarioGroupId)
        .then((section) => {
          applyPriceInterpretationSection(section)
        })
        .finally(() => {
          priceInterpretationRefreshInFlightRef.current = false
          if (!priceInterpretationRefreshQueuedRef.current) return

          priceInterpretationRefreshQueuedRef.current = false
          refetchOnce()
        })
    }

    refetchOnce()
  }, [applyPriceInterpretationSection, scenarioGroupId])

  const handlePriceInterpretationStreamFailure = useCallback(
    (reason?: string | null) => {
      priceInterpretationGeneratePendingRef.current = false
      setIsGenerating(false)
      showSnackbar('가격전망 해석 생성에 실패했습니다.', {
        variant: 'error',
        body: reason?.trim() || '잠시 후 다시 시도해 주세요.',
      })
      refreshPriceInterpretations()
    },
    [refreshPriceInterpretations, showSnackbar],
  )

  refreshPriceInterpretationsRef.current = refreshPriceInterpretations
  handlePriceInterpretationStreamFailureRef.current = handlePriceInterpretationStreamFailure
  showSnackbarRef.current = showSnackbar

  useEffect(() => {
    if (!enabled || !scenarioGroupId) return undefined

    priceInterpretationStreamHasConnectedRef.current = false
    const controller = new AbortController()

    void nextGenMIScenarioGroupService
      .streamPriceInterpretations(
        scenarioGroupId,
        ({ event, data }) => {
          if (!isPriceInterpretationStreamEventType(event)) return

          const streamData = parsePriceInterpretationStreamEventData(data)
          if (streamData?.scenarioGroupId !== undefined && streamData.scenarioGroupId !== scenarioGroupId) return

          if (event === 'connected') {
            if (priceInterpretationStreamHasConnectedRef.current) {
              // 재연결 재조회는 생성 pending 중이 아닐 때만 (빈 GET 으로 생성중 UI 를 건드리지 않음)
              if (!priceInterpretationGeneratePendingRef.current) {
                refreshPriceInterpretationsRef.current()
              }
            } else {
              priceInterpretationStreamHasConnectedRef.current = true
            }
            return
          }

          if (streamData?.result === 'failure') {
            handlePriceInterpretationStreamFailureRef.current(streamData.reason)
            return
          }

          // API: generation 완료(SSE) 수신 후 GET 재조회. 목록은 GET 응답만 사용한다.
          priceInterpretationGeneratePendingRef.current = false
          refreshPriceInterpretationsRef.current()
          showSnackbarRef.current('시나리오별 가격전망 해석이 생성되었습니다.', { variant: 'success' })
        },
        controller.signal,
      )
      .catch(() => {
        if (controller.signal.aborted) return
      })

    return () => {
      controller.abort()
    }
  }, [enabled, scenarioGroupId])

  useEffect(() => {
    let cancelled = false

    if (!groupDetailLoading) {
      // 생성 요청 중에는 그룹 상세 embed(빈 interpretations)로 상태를 덮지 않는다.
      if (priceInterpretationGeneratePendingRef.current) return undefined

      if (initialSection) {
        applyPriceInterpretationSection(initialSection)
      } else {
        void nextGenMIScenarioGroupService.getPriceInterpretations(scenarioGroupId).then((section) => {
          if (cancelled) return
          applyPriceInterpretationSection(section)
        })
      }
    }

    return () => {
      cancelled = true
    }
  }, [applyPriceInterpretationSection, groupDetailLoading, initialSection, scenarioGroupId])

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

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return

    // API: POST 는 생성 요청 ack. 목록/생성중 칩은 GET 또는 SSE 이후 GET 으로만 반영한다.
    setIsGenerating(true)
    priceInterpretationGeneratePendingRef.current = true
    try {
      await nextGenMIScenarioGroupService.generatePriceInterpretations(scenarioGroupId)
    } catch {
      priceInterpretationGeneratePendingRef.current = false
      setIsGenerating(false)
      showSnackbar('가격전망 해석 생성을 요청하지 못했습니다.', { variant: 'error', body: '잠시 후 다시 시도해 주세요.' })
    }
  }, [canGenerate, scenarioGroupId, showSnackbar])

  const commitDraft = useCallback(() => {
    const scenarioId = draftScenarioIdRef.current
    if (!scenarioId) return

    const trimmed = draftTextRef.current.trim()
    const previous = interpretations[scenarioId] ?? ''
    if (trimmed === previous) return

    setInterpretations((prev) => ({ ...prev, [scenarioId]: trimmed }))
    void nextGenMIScenarioGroupService
      .updatePriceInterpretation(scenarioGroupId, scenarioId, { content: trimmed })
      .then((result) => {
        setInterpretations((prev) => ({ ...prev, [scenarioId]: result.content }))
        setInterpretationItems((prev) =>
          prev.map((item) =>
            item.scenarioId === scenarioId
              ? {
                ...item,
                content: result.content,
                revision: result.revision ?? item.revision,
                updatedAt: result.updatedAt ?? item.updatedAt,
              }
              : item,
          ),
        )
        showSavedMessage()
      })
      .catch(() => {
        showSnackbar('가격전망 해석 수정을 저장하지 못했습니다.', {
          variant: 'error',
          body: '잠시 후 다시 시도해 주세요.',
        })
      })
  }, [interpretations, scenarioGroupId, showSavedMessage, showSnackbar])

  const handleSelectScenario = useCallback(
    (scenarioId: number) => {
      if (scenarioId === selectedScenarioId) return
      commitDraft()
      setSelectedScenarioId(scenarioId)
    },
    [commitDraft, selectedScenarioId],
  )

  const handleOpenResetDialog = useCallback(() => {
    if (!selectedScenario) return
    commitDraft()
    setResetDialogOpen(true)
  }, [commitDraft, selectedScenario])

  const handleResetConfirm = useCallback(async () => {
    if (!selectedScenarioId) return

    setIsResetting(true)
    try {
      const result = await nextGenMIScenarioGroupService.resetPriceInterpretation(scenarioGroupId, selectedScenarioId)
      setInterpretations((prev) => ({ ...prev, [selectedScenarioId]: result.content }))
      setOriginalInterpretations((prev) => ({ ...prev, [selectedScenarioId]: result.content }))
      setInterpretationItems((prev) =>
        prev.map((item) =>
          item.scenarioId === selectedScenarioId
            ? {
              ...item,
              content: result.content,
              revision: result.revision ?? 0,
              updatedAt: result.updatedAt ?? item.updatedAt,
            }
            : item,
        ),
      )
      setDraftText(result.content)
      draftTextRef.current = result.content

      setSavedMessageVisible(false)
      setMaxLengthWarningVisible(false)
      if (savedMessageTimerRef.current) {
        globalThis.clearTimeout(savedMessageTimerRef.current)
        savedMessageTimerRef.current = null
      }
      setResetDialogOpen(false)
      showSnackbar('가격전망 해석 내용이 초기화되었습니다.', { variant: 'success' })
    } catch {
      showSnackbar('가격전망 해석 초기화에 실패했습니다.', {
        variant: 'error',
        body: '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsResetting(false)
    }
  }, [scenarioGroupId, selectedScenarioId, showSnackbar])

  const handleDraftChange = useCallback((nextValue: string) => {
    if (nextValue.length < PRICE_FORECAST_INTERPRETATION_MAX_LENGTH) {
      setMaxLengthWarningVisible(false)
    }
    setDraftText(nextValue)
  }, [])

  const handleDraftMaxLengthExceeded = useCallback(() => {
    setSavedMessageVisible(false)
    setMaxLengthWarningVisible(true)
  }, [])

  const renderBody = () => {
    if (!hasExecutedScenario && !hasInterpretation) {
      return <PriceForecastInterpretationEmptyMessage icon="warning" message="MI 수급모델을 실행하면 가격전망 해석을 생성할 수 있습니다." />
    }

    if (!showScenarioInterpretationPanel) {
      if (isGenerating) {
        return <PriceForecastInterpretationLoadingMessage />
      }

      return <PriceForecastInterpretationEmptyMessage icon="info" message="시나리오별 가격전망 해석을 생성할 수 있습니다." />
    }

    return (
      <Stack gap="4px" width="100%" position="relative">
        <Stack direction="row" alignItems="center" gap="12px" width="100%" sx={{ opacity: isGenerating ? GENERATING_CONTENT_OPACITY : 1 }}>
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
              {visibleInterpretationScenarios.map((scenario) => (
                <PriceForecastInterpretationScenarioChip
                  key={scenario.scenarioId}
                  scenario={scenario}
                  selected={scenario.scenarioId === selectedScenarioId}
                  onSelect={() => handleSelectScenario(scenario.scenarioId)}
                />
              ))}
            </HorizontalScrollContainer>
          </Box>
          <PriceForecastInterpretationResetButton
            disabled={isGenerating || !selectedScenario || !selectedScenarioHasModifications}
            onClick={handleOpenResetDialog}
          />
        </Stack>

        <Box sx={{ opacity: isGenerating ? GENERATING_CONTENT_OPACITY : 1 }}>
          {selectedScenario ? (
            <Stack gap="4px" width="100%">
              <NextGenMIResizableTextarea
                ariaLabel={`${selectedScenario.scenarioName} 가격전망 해석`}
                value={draftText}
                placeholder="가격전망 해석 내용을 입력해 주세요."
                maxLength={PRICE_FORECAST_INTERPRETATION_MAX_LENGTH}
                minHeight="160px"
                minResizeHeight="160px"
                maxHeight="200px"
                fontSize="16px"
                hoverBgcolor="contentBG.Hover"
                disabled={isGenerating}
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
                  ) : savedMessageVisible ? (
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
                  {draftText.length.toLocaleString()} / {PRICE_FORECAST_INTERPRETATION_MAX_LENGTH.toLocaleString()}
                </Typography>
              </Stack>
            </Stack>
          ) : null}
        </Box>

        {isGenerating ? <PriceForecastInterpretationGeneratingOverlay /> : null}
      </Stack>
    )
  }

  return (
    <>
      <Stack gap="4px" width="100%" bgcolor="commonColor.White">
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
          <PriceForecastInterpretationGenerateButton disabled={isGenerating || !canGenerate} onClick={() => void handleGenerate()} />
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
