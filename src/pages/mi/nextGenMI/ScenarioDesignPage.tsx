import { Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type { KpiCardProps } from '@/pages/mi/nextGenMI/components/common/KpiCard'
import type { IScenarioDimension } from '@/service/mi/nextGenMI/scenarioGroup'

import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import { nextGenMIIsEventNoiseSignal } from '@/pages/mi/nextGenMI/components/common/nextGenMIClassificationChip'
import ScenarioDesignBaseEventSection from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignBaseEventSection'
import ScenarioDesignBranchingTable from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignBranchingTable'
import ScenarioDesignStickyHeaderView, {
  publishScenarioDesignStickyHeaderContent,
  resetScenarioDesignStickyHeaderContent,
  type ScenarioDesignStep,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignStickyHeader'
import { getNextGenMIEventDetailPath, getNextGenMITabPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import {
  type ScenarioDesignBranchRow,
  SCENARIO_DESIGN_MOCK_BRANCH_ROWS,
  SCENARIO_DESIGN_MOCK_RATIONALE,
} from '@/pages/mi/nextGenMI/scenarioDesignMockData'
import nextGenMIEventService, { type RelatedScenario } from '@/service/mi/nextGenMI/event'

interface NextGenMIScenarioDesignLocationState {
  eventName?: string
}

const SCENARIO_DESIGN_STICKY_HEIGHTS_PX = {
  expanded: 196,
  collapsed: 144,
}

const REVIEW_CHANGES_MOCK_DELAY_MS = 2000

const getScenarioDimensionValue = (dimensions: IScenarioDimension[] | undefined, key: string) => {
  const dimension = dimensions?.find((item) => item.key === key)
  return dimension?.valueLabel ?? dimension?.value ?? ''
}

const mapRelatedScenarioToBranchRow = (scenario: RelatedScenario): ScenarioDesignBranchRow => ({
  id: String(scenario.scenarioId),
  scenarioName: scenario.scenarioName,
  baseCase: scenario.baseCase,
  period: getScenarioDimensionValue(scenario.dimensions, 'period'),
  transportDisruption: getScenarioDimensionValue(scenario.dimensions, 'transportDisruption'),
  supplyDisruptionIntensity: getScenarioDimensionValue(scenario.dimensions, 'supplyDisruptionIntensity'),
  supplyRecoveryPattern: getScenarioDimensionValue(scenario.dimensions, 'supplyRecoveryPattern'),
  branchCriteria: getScenarioDimensionValue(scenario.dimensions, 'branchCriteria') || '분기기준값',
})

const buildBranchRows = (scenarios?: RelatedScenario[]): ScenarioDesignBranchRow[] => {
  if (!scenarios || scenarios.length === 0) return SCENARIO_DESIGN_MOCK_BRANCH_ROWS

  const mappedRows = scenarios.map(mapRelatedScenarioToBranchRow)
  const placeholderRows = SCENARIO_DESIGN_MOCK_BRANCH_ROWS.filter((row) => row.placeholder)
  return [...mappedRows, ...placeholderRows]
}

const ScenarioDesignPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as NextGenMIScenarioDesignLocationState | null
  const { setStickyHeader } = useStickyHeader()
  const { showSnackbar } = useSnackbar()
  const reviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [activeStep, setActiveStep] = useState<ScenarioDesignStep>(1)
  const [isApplyingChanges, setIsApplyingChanges] = useState(false)
  const [reviewCompleted, setReviewCompleted] = useState(false)
  const [recordsPagination, setRecordsPagination] = useState({ page: 1, size: 10 })
  const [outlooksPagination, setOutlooksPagination] = useState({ page: 1, size: 10 })

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTop = 0
  }, [])

  useEffect(
    () => () => {
      if (reviewTimerRef.current) clearTimeout(reviewTimerRef.current)
    },
    [],
  )

  const { data: detail, isLoading } = useQuery({
    queryKey: ['nextGenMIEventDetail', eventId],
    queryFn: () => nextGenMIEventService.getEventDetail(eventId!),
    enabled: Boolean(eventId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['nextGenMIEventRecords', eventId, recordsPagination.page, recordsPagination.size],
    queryFn: () => nextGenMIEventService.getEventRecords(eventId!, recordsPagination),
    enabled: Boolean(eventId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: outlooksData, isLoading: outlooksLoading } = useQuery({
    queryKey: ['nextGenMIEventOutlooks', eventId, outlooksPagination.page, outlooksPagination.size],
    queryFn: () => nextGenMIEventService.getEventOutlooks(eventId!, outlooksPagination),
    enabled: Boolean(eventId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const eventName = detail?.eventName ?? state?.eventName
  const categoryLabel = detail?.impactAnalysis?.eventTypeLv1Label ?? detail?.impactAnalysis?.eventTypeLv1

  const branchRows = useMemo(() => buildBranchRows(detail?.relatedEventScenario?.scenarios), [detail?.relatedEventScenario?.scenarios])

  const impactKpiItems = useMemo((): [KpiCardProps, KpiCardProps] => {
    const ia = detail?.impactAnalysis
    return [
      {
        title: '카테고리',
        content: ia?.eventTypeLv1Label || ia?.eventTypeLv1 || '-',
        description: ia?.eventTypeLv2Label || ia?.eventTypeLv2 || '\u00a0',
      },
      {
        title: '출처',
        content: ia?.sources?.filter(Boolean).join(', ') || '-',
        description: '\u00a0',
      },
    ]
  }, [detail?.impactAnalysis])

  const aiBullets = useMemo(() => {
    const list = detail?.aiInsights?.keySummaries ?? []
    if (list.length > 0) return list
    if (isLoading) return []
    return ['요약 데이터가 없습니다.']
  }, [detail?.aiInsights?.keySummaries, isLoading])

  const aiDetailedAnalysis = detail?.aiInsights?.detailedAnalysis ?? (isLoading ? '' : '상세 분석 데이터가 없습니다.')

  const handleBackToEventList = useCallback(() => {
    navigate(getNextGenMITabPath('events'))
  }, [navigate])

  const handleBackToEvent = useCallback(() => {
    if (!eventId) {
      handleBackToEventList()
      return
    }
    navigate(getNextGenMIEventDetailPath(eventId), {
      state: eventName ? { eventName } : undefined,
    })
  }, [eventId, eventName, handleBackToEventList, navigate])

  const handleReviewChangesConfirm = useCallback(() => {
    if (reviewTimerRef.current) clearTimeout(reviewTimerRef.current)

    setReviewCompleted(false)
    setIsApplyingChanges(true)

    reviewTimerRef.current = setTimeout(() => {
      setIsApplyingChanges(false)
      setReviewCompleted(true)
      showSnackbar('변경사항 검토가 완료되었습니다.', { variant: 'success' })
      reviewTimerRef.current = null
    }, REVIEW_CHANGES_MOCK_DELAY_MS)
  }, [showSnackbar])

  const handleReviewCompleteClick = useCallback(() => {
    setActiveStep(2)
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTop = 0
  }, [])

  const handleResetAll = useCallback(() => {
    setReviewCompleted(false)
  }, [])

  const handleCriteriaEdited = useCallback(() => {
    setReviewCompleted(false)
  }, [])

  useLayoutEffect(() => {
    publishScenarioDesignStickyHeaderContent({
      onBackToEventList: handleBackToEventList,
      onBackToEvent: handleBackToEvent,
      activeStep,
    })
  }, [activeStep, handleBackToEvent, handleBackToEventList])

  useLayoutEffect(() => {
    setStickyHeader(<ScenarioDesignStickyHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: SCENARIO_DESIGN_STICKY_HEIGHTS_PX,
    })

    return () => {
      setStickyHeader(null)
      resetScenarioDesignStickyHeaderContent()
    }
  }, [setStickyHeader])

  return (
    <Stack maxWidth="1380px" margin="auto" px="12px" pt="20px" pb="40px">
      <Stack gap="38px" px="12px" py="30px" borderRadius="10px" bgcolor="commonColor.White" sx={{ minWidth: 0, maxWidth: '100%' }}>
        <ScenarioDesignBaseEventSection
          eventName={eventName}
          createdAt={detail?.createdAt}
          categoryLabel={categoryLabel ?? undefined}
          detailLoading={isLoading}
          isNoiseEvent={nextGenMIIsEventNoiseSignal(detail?.signalType)}
          aiBullets={aiBullets}
          aiDetailedAnalysis={aiDetailedAnalysis}
          impactTableRows={detail?.impactAnalysis?.indexImpacts ?? []}
          impactKpiItems={impactKpiItems}
          impactNarrative={detail?.impactAnalysis?.analysisText ?? ''}
          driverTreeScoreboard={detail?.driverTreeScoreboard}
          outlookRows={outlooksData?.detail ?? []}
          outlooksPagination={outlooksData}
          onOutlooksPageChange={(page) => setOutlooksPagination((p) => ({ ...p, page }))}
          onOutlooksSizeChange={(size) => setOutlooksPagination({ size, page: 1 })}
          outlooksLoading={outlooksLoading}
          recordRows={recordsData?.detail ?? []}
          recordsPagination={recordsData}
          onRecordsPageChange={(page) => setRecordsPagination((p) => ({ ...p, page }))}
          onRecordsSizeChange={(size) => setRecordsPagination({ size, page: 1 })}
          recordsLoading={recordsLoading}
        />
        <Stack gap="4px" width="100%">
          <Typography fontSize={18} fontWeight={600} color="contentText.Black" px="8px" py="4px" lineHeight={1.4}>
            설계 근거
          </Typography>
          <Stack bgcolor="gray.5" borderRadius="10px" padding="20px">
            <Typography variant="body1M16" color="contentText.Normal" lineHeight={1.5}>
              {SCENARIO_DESIGN_MOCK_RATIONALE}
            </Typography>
          </Stack>
        </Stack>
        <ScenarioDesignBranchingTable
          rows={branchRows}
          isApplyingChanges={isApplyingChanges}
          reviewCompleted={reviewCompleted}
          onReviewChangesConfirm={handleReviewChangesConfirm}
          onReviewCompleteClick={handleReviewCompleteClick}
          onResetAll={handleResetAll}
          onCriteriaEdited={handleCriteriaEdited}
        />
      </Stack>
    </Stack>
  )
}

export default ScenarioDesignPage
