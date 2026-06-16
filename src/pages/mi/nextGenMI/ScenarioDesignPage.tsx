import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Dialog, DialogActions, DialogContent, Divider, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type { KpiCardProps } from '@/pages/mi/nextGenMI/components/common/KpiCard'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import { nextGenMIIsEventNoiseSignal } from '@/pages/mi/nextGenMI/components/common/nextGenMIClassificationChip'
import NextGenMIDetailHeader, {
  NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import { formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import EventDetailAiInsightsSection from '@/pages/mi/nextGenMI/components/event/EventDetailAiInsightsSection'
import EventDetailDriverTreeScoreboardSection from '@/pages/mi/nextGenMI/components/event/EventDetailDriverTreeScoreboardSection'
import EventDetailImpactAnalysisSection from '@/pages/mi/nextGenMI/components/event/EventDetailImpactAnalysisSection'
import EventDetailInstitutionalOutlookTable from '@/pages/mi/nextGenMI/components/event/EventDetailInstitutionalOutlookTable'
import EventDetailMiRecordsTable from '@/pages/mi/nextGenMI/components/event/EventDetailMiRecordsTable'
import NextGenMIUserFeedback from '@/pages/mi/nextGenMI/components/NextGenMIUserFeedback'
import ScenarioDesignCriteriaStep from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignCriteriaStep'
import {
  createInitialScenarioDesignRows,
  createScenarioDesignGeneratedBranchDefaults,
  isScenarioDesignRequiredColumn,
  SCENARIO_DESIGN_COLUMNS,
  SCENARIO_DESIGN_INITIAL_HIDDEN_COLUMN_KEYS,
  SCENARIO_DESIGN_MAX_ROW_COUNT,
  SCENARIO_DESIGN_SELECT_COMMON_ACTIONS,
  type ScenarioDesignBaseEventTabKey,
  type ScenarioDesignColumnKey,
  type ScenarioDesignConfirmType,
  type ScenarioDesignLocationState,
  type ScenarioDesignRow,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignModel'
import ScenarioDesignOneViewStep from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignOneViewStep'
import ScenarioDesignProgressStep from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignProgressStep'
import { getNextGenMITabPath, NEXT_GEN_MI_BASE_PATH } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import { scrollNextGenMILayoutToTop } from '@/pages/mi/nextGenMI/nextGenMIScroll'
import nextGenMIEventService from '@/service/mi/nextGenMI/event'

type ScenarioDesignHeaderContent = {
  backLabel: string
  backIcon?: ReactNode
  onBack: () => void
  titleSlot: ReactNode
  sectionSlot?: ReactNode
  rightAction?: ReactNode
}

let scenarioDesignHeaderContent: ScenarioDesignHeaderContent | null = null
const scenarioDesignHeaderListeners = new Set<() => void>()

const subscribeScenarioDesignHeaderContent = (listener: () => void) => {
  scenarioDesignHeaderListeners.add(listener)
  return () => scenarioDesignHeaderListeners.delete(listener)
}

const getScenarioDesignHeaderContentSnapshot = () => scenarioDesignHeaderContent

const publishScenarioDesignHeaderContent = (next: ScenarioDesignHeaderContent) => {
  scenarioDesignHeaderContent = next
  scenarioDesignHeaderListeners.forEach((listener) => listener())
}

const ScenarioDesignHeaderView = () => {
  const content = useSyncExternalStore(
    subscribeScenarioDesignHeaderContent,
    getScenarioDesignHeaderContentSnapshot,
    getScenarioDesignHeaderContentSnapshot,
  )
  if (!content) return null

  return (
    <NextGenMIDetailHeader
      sections={[]}
      backLabel={content.backLabel}
      backIcon={content.backIcon}
      onBack={content.onBack}
      titleSlot={content.titleSlot}
      sectionSlot={content.sectionSlot}
      rightAction={content.rightAction}
    />
  )
}

const getScenarioDesignConfirmContent = (
  type: ScenarioDesignConfirmType,
): { title: string; confirmLabel: string; confirmBgColor: string } => {
  if (type === 'criteriaReset') {
    return {
      title: '모든 수정 항목을 기본값으로 초기화하시겠습니까?',
      confirmLabel: '초기화',
      confirmBgColor: 'contentIcon.Error',
    }
  }

  if (type === 'cancel') {
    return {
      title: '시나리오 설계를 취소하시겠습니까?',
      confirmLabel: '확인',
      confirmBgColor: 'contentIcon.ActivePrimary',
    }
  }

  if (type === 'deleteRow') {
    return {
      title: '시나리오를 삭제하시겠습니까?',
      confirmLabel: '삭제',
      confirmBgColor: 'contentIcon.Error',
    }
  }

  if (type === 'deleteCriteriaColumn') {
    return {
      title: '분기항목을 삭제하시겠습니까?',
      confirmLabel: '삭제',
      confirmBgColor: 'contentIcon.Error',
    }
  }

  return {
    title: '변경사항을 검토하시겠습니까?',
    confirmLabel: '검토',
    confirmBgColor: 'contentIcon.ActivePrimary',
  }
}

const ScenarioDesignConfirmDialog = ({
  type,
  onClose,
  onConfirm,
}: {
  type: ScenarioDesignConfirmType | null
  onClose: () => void
  onConfirm: (type: ScenarioDesignConfirmType) => void
}) => {
  if (!type) return null

  const content = getScenarioDesignConfirmContent(type)

  return (
    <Dialog
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '450px',
            maxWidth: 'calc(100vw - 48px)',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            borderRadius: '12px',
            boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
            margin: 0,
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px 20px 30px',
          '&:last-of-type': {
            paddingBottom: '30px',
          },
        }}
      >
        <Stack direction="row" alignItems="center" width="100%" minWidth={0}>
          <Typography variant="body1" fontSize="16px" fontWeight={700} color="contentText.Normal" lineHeight={1.4} flex={1} noWrap>
            {content.title}
          </Typography>
          <MIBaseButton
            aria-label="닫기"
            variant="text"
            onClick={onClose}
            sx={{
              height: '32px',
              padding: '6px',
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
          </MIBaseButton>
        </Stack>
      </DialogContent>
      <DialogActions
        disableSpacing
        sx={{
          padding: '30px 20px 20px',
          gap: '10px',
        }}
      >
        <MIBaseButton
          variant="outlined"
          onClick={onClose}
          sx={{
            height: '34px',
            borderRadius: '4px',
          }}
        >
          취소
        </MIBaseButton>
        <MIBaseButton
          variant="contained"
          onClick={() => onConfirm(type)}
          labelColor="contentText.White"
          sx={{
            height: '34px',
            borderRadius: '4px',
            backgroundColor: content.confirmBgColor,
            '&:hover:not(:disabled)': {
              backgroundColor: content.confirmBgColor,
            },
          }}
        >
          {content.confirmLabel}
        </MIBaseButton>
      </DialogActions>
    </Dialog>
  )
}

const ScenarioDesignPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showSnackbar } = useSnackbar()
  const { setStickyHeader } = useStickyHeader()
  const state = location.state as ScenarioDesignLocationState | null
  const [rows, setRows] = useState<ScenarioDesignRow[]>(() => createInitialScenarioDesignRows())
  const [reviewed, setReviewed] = useState(false)
  const [currentStep, setCurrentStep] = useState<'criteria' | 'oneView'>('criteria')
  const [hiddenScenarioDesignColumnKeys, setHiddenScenarioDesignColumnKeys] = useState<ScenarioDesignColumnKey[]>(() => [
    ...SCENARIO_DESIGN_INITIAL_HIDDEN_COLUMN_KEYS,
  ])
  const [addCriteriaMenuOpen, setAddCriteriaMenuOpen] = useState(false)
  const [selectedAddCriteriaColumnKeys, setSelectedAddCriteriaColumnKeys] = useState<ScenarioDesignColumnKey[]>([])
  const [baseEventExpanded, setBaseEventExpanded] = useState(false)
  const [selectedBaseEventTab, setSelectedBaseEventTab] = useState<ScenarioDesignBaseEventTabKey>('ai')
  const [recordsPagination, setRecordsPagination] = useState({ page: 1, size: 10 })
  const [outlooksPagination, setOutlooksPagination] = useState({ page: 1, size: 10 })
  const [confirmType, setConfirmType] = useState<ScenarioDesignConfirmType | null>(null)
  const [deleteRowId, setDeleteRowId] = useState<number | null>(null)
  const [deleteCriteriaColumnKey, setDeleteCriteriaColumnKey] = useState<ScenarioDesignColumnKey | null>(null)
  const criteriaTableScrollRef = useRef<HTMLDivElement | null>(null)
  const shouldScrollCriteriaTableToEndRef = useRef(false)
  const confirmedScenarioDesignLeaveRef = useRef(false)
  const initialScenarioDesignHistoryIndexRef = useRef<number | null>(null)

  const { data: detail, isLoading } = useQuery({
    queryKey: ['nextGenMIScenarioDesignEvent', id],
    queryFn: () => nextGenMIEventService.getEventDetail(id ?? ''),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['nextGenMIScenarioDesignEventRecords', id, recordsPagination.page, recordsPagination.size],
    queryFn: () => nextGenMIEventService.getEventRecords(id!, recordsPagination),
    enabled: Boolean(id) && baseEventExpanded && selectedBaseEventTab === 'records',
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: outlooksData, isLoading: outlooksLoading } = useQuery({
    queryKey: ['nextGenMIScenarioDesignEventOutlooks', id, outlooksPagination.page, outlooksPagination.size],
    queryFn: () => nextGenMIEventService.getEventOutlooks(id!, outlooksPagination),
    enabled: Boolean(id) && baseEventExpanded && selectedBaseEventTab === 'outlook',
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const eventNameFromState = state?.eventName?.trim()
  const eventTitle = detail?.eventName ?? eventNameFromState ?? (id ? `이벤트 ${id}` : '이벤트')
  const isScenarioSuggested = detail?.isScenarioSuggested === true
  const createdAtLabel = formatNextGenMIDateTimeYmdHm(detail?.createdAt)
  const eventTypeLabel = detail?.impactAnalysis?.eventTypeLv1Label ?? detail?.impactAnalysis?.eventTypeLv1 ?? '-'
  const eventDetailPath = id ? `${NEXT_GEN_MI_BASE_PATH}/events/${encodeURIComponent(id)}` : getNextGenMITabPath('events')
  const handleBackToEvent = useCallback(() => {
    navigate(eventDetailPath, { state: { eventName: eventTitle } })
  }, [eventDetailPath, eventTitle, navigate])
  const pushScenarioDesignHistoryGuard = useCallback(() => {
    if (confirmedScenarioDesignLeaveRef.current) return

    const currentState = globalThis.history.state as Record<string, unknown> | null
    if (currentState?.scenarioDesignLeaveGuard === true) return

    globalThis.history.pushState({ ...(currentState ?? {}), scenarioDesignLeaveGuard: true }, '', globalThis.location.href)
  }, [])
  const handleLeaveScenarioDesign = useCallback(() => {
    confirmedScenarioDesignLeaveRef.current = true

    const currentState = globalThis.history.state as { scenarioDesignLeaveGuard?: unknown } | null
    if (initialScenarioDesignHistoryIndexRef.current !== null && initialScenarioDesignHistoryIndexRef.current > 0) {
      navigate(currentState?.scenarioDesignLeaveGuard === true ? -2 : -1)
      return
    }

    navigate(eventDetailPath, { state: { eventName: eventTitle } })
  }, [eventDetailPath, eventTitle, navigate])
  const handleCancelScenarioDesignRequest = useCallback(() => {
    setConfirmType('cancel')
  }, [])

  useEffect(() => {
    const currentState = globalThis.history.state as { idx?: unknown; scenarioDesignLeaveGuard?: unknown } | null
    const currentHistoryIndex = typeof currentState?.idx === 'number' ? currentState.idx : null
    initialScenarioDesignHistoryIndexRef.current =
      currentState?.scenarioDesignLeaveGuard === true && currentHistoryIndex !== null ? currentHistoryIndex - 1 : currentHistoryIndex

    pushScenarioDesignHistoryGuard()

    const handlePopState = () => {
      if (confirmedScenarioDesignLeaveRef.current) return
      setConfirmType('cancel')
      pushScenarioDesignHistoryGuard()
    }

    globalThis.addEventListener('popstate', handlePopState)
    return () => globalThis.removeEventListener('popstate', handlePopState)
  }, [pushScenarioDesignHistoryGuard])

  const handleBaseEventToggle = useCallback(() => {
    setBaseEventExpanded((expanded) => !expanded)
  }, [])

  const designRationale = detail?.scenarioSuggestReason?.trim() ?? ''
  const showDesignRationale = isLoading || Boolean(designRationale)

  const impactKpiPair = useMemo((): [KpiCardProps, KpiCardProps] => {
    const impactAnalysis = detail?.impactAnalysis
    return [
      {
        title: '카테고리',
        content: impactAnalysis?.eventTypeLv1Label || impactAnalysis?.eventTypeLv1 || '-',
        description: impactAnalysis?.eventTypeLv2Label || impactAnalysis?.eventTypeLv2 || '\u00a0',
      },
      {
        title: '출처',
        content: impactAnalysis?.sources?.filter(Boolean).join(', ') || '-',
        description: '\u00a0',
      },
    ]
  }, [detail?.impactAnalysis])

  const aiBullets = useMemo(() => {
    const keySummaries = detail?.aiInsights?.keySummaries ?? []
    if (keySummaries.length > 0) return keySummaries
    if (isLoading) return []
    return ['요약 데이터가 없습니다.']
  }, [detail?.aiInsights?.keySummaries, isLoading])

  const aiDetailedAnalysis = detail?.aiInsights?.detailedAnalysis ?? (isLoading ? '' : '상세 분석 데이터가 없습니다.')
  const impactTableRows = useMemo(() => detail?.impactAnalysis?.indexImpacts ?? [], [detail?.impactAnalysis?.indexImpacts])
  const impactNarrative = detail?.impactAnalysis?.analysisText ?? ''
  const recordRows = useMemo(() => recordsData?.detail ?? [], [recordsData?.detail])
  const outlookRows = useMemo(() => outlooksData?.detail ?? [], [outlooksData?.detail])
  const visibleScenarioDesignColumns = useMemo(
    () => SCENARIO_DESIGN_COLUMNS.filter((column) => !hiddenScenarioDesignColumnKeys.includes(column.key)),
    [hiddenScenarioDesignColumnKeys],
  )
  const hiddenScenarioDesignColumns = useMemo(
    () => SCENARIO_DESIGN_COLUMNS.filter((column) => hiddenScenarioDesignColumnKeys.includes(column.key)),
    [hiddenScenarioDesignColumnKeys],
  )
  const scenarioNameErrorMessages = useMemo(() => {
    const scenarioNameSet = new Set<string>()
    const errorMessages = new Map<number, string>()

    rows.forEach((row) => {
      const scenarioName = row.scenarioName.trim()
      if (!scenarioName) {
        errorMessages.set(row.id, '시나리오명을 입력해 주세요.')
        return
      }

      if (scenarioNameSet.has(scenarioName)) {
        errorMessages.set(row.id, '중복된 시나리오명은 사용할 수 없습니다.')
        return
      }

      scenarioNameSet.add(scenarioName)
    })

    return errorMessages
  }, [rows])
  const canCompleteScenarioDesignReview = useMemo(
    () =>
      scenarioNameErrorMessages.size === 0 &&
      rows.every((row) =>
        visibleScenarioDesignColumns.every((column) => row[column.key] !== SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value),
      ),
    [rows, scenarioNameErrorMessages, visibleScenarioDesignColumns],
  )
  const handleRowValueChange = useCallback((rowId: number, key: keyof ScenarioDesignRow, value: string) => {
    setRows((currentRows) => currentRows.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)))
    setReviewed(false)
    setCurrentStep('criteria')
  }, [])

  const handleAddRow = useCallback(() => {
    setRows((currentRows) => {
      if (currentRows.length >= SCENARIO_DESIGN_MAX_ROW_COUNT) return currentRows

      return [
        ...currentRows,
        {
          id: Math.max(0, ...currentRows.map((row) => row.id)) + 1,
          scenarioName: '',
          period: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
          transportDisruption: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
          supplyIntensity: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
          supplyRecovery: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
          branchItem: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
          ...createScenarioDesignGeneratedBranchDefaults(),
        },
      ]
    })
    setReviewed(false)
    setCurrentStep('criteria')
  }, [])

  const handleDeleteCriteriaColumn = useCallback((key: ScenarioDesignColumnKey) => {
    if (isScenarioDesignRequiredColumn(key)) return
    setHiddenScenarioDesignColumnKeys((currentKeys) => (currentKeys.includes(key) ? currentKeys : [...currentKeys, key]))
    setReviewed(false)
    setCurrentStep('criteria')
  }, [])

  const handleDeleteCriteriaColumnRequest = useCallback((key: ScenarioDesignColumnKey) => {
    setDeleteRowId(null)
    setDeleteCriteriaColumnKey(key)
    setConfirmType('deleteCriteriaColumn')
  }, [])

  const handleAddCriteriaMenuClose = useCallback(() => {
    setAddCriteriaMenuOpen(false)
    setSelectedAddCriteriaColumnKeys([])
  }, [])

  const handleAddCriteriaMenuOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleAddCriteriaMenuClose()
        return
      }

      if (hiddenScenarioDesignColumns.length === 0) {
        showSnackbar('추가 가능한 분기 기준이 없습니다.', { variant: 'info' })
        return
      }

      setSelectedAddCriteriaColumnKeys([])
      setAddCriteriaMenuOpen(true)
    },
    [handleAddCriteriaMenuClose, hiddenScenarioDesignColumns.length, showSnackbar],
  )

  const handleToggleAddCriteriaColumn = useCallback((key: ScenarioDesignColumnKey) => {
    setSelectedAddCriteriaColumnKeys((currentKeys) =>
      currentKeys.includes(key) ? currentKeys.filter((currentKey) => currentKey !== key) : [...currentKeys, key],
    )
  }, [])

  const handleAddSelectedCriteria = useCallback(() => {
    if (selectedAddCriteriaColumnKeys.length === 0) return

    shouldScrollCriteriaTableToEndRef.current = true
    setHiddenScenarioDesignColumnKeys((currentKeys) => currentKeys.filter((key) => !selectedAddCriteriaColumnKeys.includes(key)))
    setAddCriteriaMenuOpen(false)
    setSelectedAddCriteriaColumnKeys([])
    setReviewed(false)
    setCurrentStep('criteria')
  }, [selectedAddCriteriaColumnKeys])

  const handleDeleteRow = useCallback((rowId: number) => {
    setRows((currentRows) => (currentRows.length <= 1 ? currentRows : currentRows.filter((row) => row.id !== rowId)))
    setReviewed(false)
    setCurrentStep('criteria')
  }, [])

  const handleDeleteRowRequest = useCallback((rowId: number) => {
    setDeleteCriteriaColumnKey(null)
    setDeleteRowId(rowId)
    setConfirmType('deleteRow')
  }, [])

  const handleResetCriteriaStep = useCallback(() => {
    shouldScrollCriteriaTableToEndRef.current = false
    setRows(createInitialScenarioDesignRows())
    setHiddenScenarioDesignColumnKeys([...SCENARIO_DESIGN_INITIAL_HIDDEN_COLUMN_KEYS])
    setAddCriteriaMenuOpen(false)
    setSelectedAddCriteriaColumnKeys([])
    setReviewed(false)
    setCurrentStep('criteria')
    showSnackbar('모든 항목이 기본값으로 초기화되었습니다.', { variant: 'success' })
  }, [showSnackbar])

  const handleConfirmClose = useCallback(() => {
    setConfirmType(null)
    setDeleteRowId(null)
    setDeleteCriteriaColumnKey(null)
  }, [])

  const handleConfirm = useCallback(
    (type: ScenarioDesignConfirmType) => {
      setConfirmType(null)

      if (type === 'criteriaReset') {
        handleResetCriteriaStep()
        return
      }

      if (type === 'cancel') {
        handleLeaveScenarioDesign()
        return
      }

      if (type === 'deleteRow') {
        if (deleteRowId !== null) {
          handleDeleteRow(deleteRowId)
          showSnackbar('시나리오가 삭제되었습니다.', { variant: 'success' })
        }
        setDeleteRowId(null)
        return
      }

      if (type === 'deleteCriteriaColumn') {
        if (deleteCriteriaColumnKey !== null) {
          handleDeleteCriteriaColumn(deleteCriteriaColumnKey)
        }
        setDeleteCriteriaColumnKey(null)
        return
      }

      setReviewed(true)
      if (scenarioNameErrorMessages.size > 0) {
        showSnackbar('시나리오명을 확인해 주세요.', { variant: 'error' })
        return
      }

      showSnackbar('변경사항 검토가 완료되었습니다.', { variant: 'success' })
    },
    [
      deleteCriteriaColumnKey,
      deleteRowId,
      handleDeleteCriteriaColumn,
      handleDeleteRow,
      handleLeaveScenarioDesign,
      handleResetCriteriaStep,
      scenarioNameErrorMessages,
      showSnackbar,
    ],
  )

  const handleComplete = useCallback(() => {
    if (!reviewed || !canCompleteScenarioDesignReview) return
    setCurrentStep('oneView')
    scrollNextGenMILayoutToTop()
  }, [canCompleteScenarioDesignReview, reviewed])

  const handleCreateScenarioGroup = useCallback(() => {
    confirmedScenarioDesignLeaveRef.current = true
    showSnackbar('시나리오 그룹이 생성되었습니다.', { variant: 'success' })
    navigate(getNextGenMITabPath('scenarios'))
  }, [navigate, showSnackbar])

  const headerTitleSlot = useMemo(
    () => (
      <Stack width="100%" paddingTop="20px">
        <Typography variant="titleLarge" fontSize="26px" fontWeight={700} color="contentText.Black" lineHeight={1.4}>
          Scenario Design
        </Typography>
      </Stack>
    ),
    [],
  )

  const headerSectionSlot = useMemo(
    () => (
      <Stack direction="row" alignItems="center" gap="4px" minWidth={0} minHeight="62px" flex={1} position="relative" zIndex={3}>
        <ScenarioDesignProgressStep
          active={currentStep === 'criteria'}
          completed={currentStep === 'oneView'}
          number={1}
          label="시나리오 분기항목 및 분기기준 검토"
          stateLabel={currentStep === 'criteria' ? (reviewed ? '검토 완료' : '진행 중') : undefined}
        />
        <Divider sx={{ width: '40px', borderColor: 'gray.20', flexShrink: 0 }} />
        <ScenarioDesignProgressStep
          active={currentStep === 'oneView'}
          number={2}
          label="시나리오 One-view 검토"
          stateLabel={currentStep === 'oneView' ? '진행 중' : undefined}
        />
      </Stack>
    ),
    [currentStep, reviewed],
  )

  const headerRightAction = useMemo(
    () => (
      <NextGenMIUserFeedback
        pageName="Next-Gen MI"
        sectionName="Scenario Design"
        targetLabel={eventTitle ? `시나리오 설계/ ${eventTitle}` : '시나리오 설계'}
      />
    ),
    [eventTitle],
  )

  const baseEventDetailContent = useMemo<ReactNode>(() => {
    if (selectedBaseEventTab === 'impact') {
      return (
        <EventDetailImpactAnalysisSection
          tableRows={impactTableRows}
          kpiItems={impactKpiPair}
          narrative={impactNarrative}
          loading={isLoading}
          isNoiseEvent={nextGenMIIsEventNoiseSignal(detail?.signalType)}
          compact
        />
      )
    }

    if (selectedBaseEventTab === 'driverTree') {
      return (
        <EventDetailDriverTreeScoreboardSection driverTreeScoreboard={detail?.driverTreeScoreboard ?? []} loading={isLoading} compact />
      )
    }

    if (selectedBaseEventTab === 'outlook') {
      return (
        <EventDetailInstitutionalOutlookTable
          rows={outlookRows}
          serverPagination={outlooksData}
          onServerPageChange={(page) => setOutlooksPagination((pagination) => ({ ...pagination, page }))}
          onServerSizeChange={(size) => setOutlooksPagination({ size, page: 1 })}
          loading={outlooksLoading}
          compact
        />
      )
    }

    if (selectedBaseEventTab === 'records') {
      return (
        <EventDetailMiRecordsTable
          rows={recordRows}
          serverPagination={recordsData}
          onServerPageChange={(page) => setRecordsPagination((pagination) => ({ ...pagination, page }))}
          onServerSizeChange={(size) => setRecordsPagination({ size, page: 1 })}
          loading={recordsLoading}
          compact
        />
      )
    }

    return <EventDetailAiInsightsSection bullets={aiBullets} detailedAnalysis={aiDetailedAnalysis} loading={isLoading} compact />
  }, [
    aiBullets,
    aiDetailedAnalysis,
    detail?.driverTreeScoreboard,
    detail?.signalType,
    impactKpiPair,
    impactNarrative,
    impactTableRows,
    isLoading,
    outlookRows,
    outlooksData,
    outlooksLoading,
    recordRows,
    recordsData,
    recordsLoading,
    selectedBaseEventTab,
  ])

  useLayoutEffect(() => {
    publishScenarioDesignHeaderContent({
      backLabel: 'Back',
      backIcon: <ArrowBackRoundedIcon sx={{ fontSize: '20px' }} />,
      onBack: handleCancelScenarioDesignRequest,
      titleSlot: headerTitleSlot,
      sectionSlot: headerSectionSlot,
      rightAction: headerRightAction,
    })
  }, [handleCancelScenarioDesignRequest, headerRightAction, headerSectionSlot, headerTitleSlot])

  useLayoutEffect(() => {
    if (!shouldScrollCriteriaTableToEndRef.current) return undefined

    shouldScrollCriteriaTableToEndRef.current = false
    const scrollEl = criteriaTableScrollRef.current
    if (!scrollEl) return undefined

    const frame = globalThis.requestAnimationFrame(() => {
      scrollEl.scrollTo({ left: Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth), behavior: 'smooth' })
    })

    return () => globalThis.cancelAnimationFrame(frame)
  }, [visibleScenarioDesignColumns.length])

  useLayoutEffect(() => {
    setStickyHeader(<ScenarioDesignHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
    })

    return () => {
      setStickyHeader(null)
      scenarioDesignHeaderContent = null
    }
  }, [setStickyHeader])

  return (
    <>
      <Stack maxWidth="1380px" margin="auto" padding="12px 12px 0px" position="relative" sx={{ overflowX: 'hidden' }}>
        {currentStep === 'oneView' ? (
          <ScenarioDesignOneViewStep
            rows={rows}
            columns={visibleScenarioDesignColumns}
            narrative=""
            loading={isLoading}
            onCancel={() => setConfirmType('cancel')}
            onCreate={handleCreateScenarioGroup}
          />
        ) : (
          <ScenarioDesignCriteriaStep
            rows={rows}
            visibleScenarioDesignColumns={visibleScenarioDesignColumns}
            hiddenScenarioDesignColumns={hiddenScenarioDesignColumns}
            scenarioNameErrorMessages={scenarioNameErrorMessages}
            reviewed={reviewed}
            canCompleteScenarioDesignReview={canCompleteScenarioDesignReview}
            criteriaTableScrollRef={criteriaTableScrollRef}
            addCriteriaMenuOpen={addCriteriaMenuOpen}
            selectedAddCriteriaColumnKeys={selectedAddCriteriaColumnKeys}
            eventTitle={eventTitle}
            isLoading={isLoading}
            isScenarioSuggested={isScenarioSuggested}
            createdAtLabel={createdAtLabel}
            eventTypeLabel={eventTypeLabel}
            baseEventExpanded={baseEventExpanded}
            selectedBaseEventTab={selectedBaseEventTab}
            baseEventDetailContent={baseEventDetailContent}
            showDesignRationale={showDesignRationale}
            designRationale={designRationale}
            onEventClick={handleBackToEvent}
            onBaseEventToggle={handleBaseEventToggle}
            onBaseEventTabChange={setSelectedBaseEventTab}
            onRowValueChange={handleRowValueChange}
            onDeleteRowRequest={handleDeleteRowRequest}
            onDeleteCriteriaColumn={handleDeleteCriteriaColumnRequest}
            onAddCriteriaMenuOpenChange={handleAddCriteriaMenuOpenChange}
            onToggleAddCriteriaColumn={handleToggleAddCriteriaColumn}
            onAddCriteriaMenuClose={handleAddCriteriaMenuClose}
            onAddSelectedCriteria={handleAddSelectedCriteria}
            onAddRow={handleAddRow}
            onReset={() => setConfirmType('criteriaReset')}
            onCancel={handleCancelScenarioDesignRequest}
            onReview={() => setConfirmType('review')}
            onComplete={handleComplete}
          />
        )}
      </Stack>
      <ScenarioDesignConfirmDialog type={confirmType} onClose={handleConfirmClose} onConfirm={handleConfirm} />
    </>
  )
}

export default ScenarioDesignPage
