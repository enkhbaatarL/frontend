import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { Collapse, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { type ReactNode, useCallback, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type { KpiCardProps } from '@/pages/mi/nextGenMI/components/common/KpiCard'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import ArrowDown from '@/components/common/icons/ArrowDown'
import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import { nextGenMIIsEventNoiseSignal } from '@/pages/mi/nextGenMI/components/common/nextGenMIClassificationChip'
import NextGenMIDetailHeader, {
  NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type NextGenMIDetailHeaderSection,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMIInlineEditableInput from '@/pages/mi/nextGenMI/components/common/NextGenMIInlineEditableInput'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import { formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import EventDetailAiInsightsSection from '@/pages/mi/nextGenMI/components/event/EventDetailAiInsightsSection'
import EventDetailDriverTreeScoreboardSection from '@/pages/mi/nextGenMI/components/event/EventDetailDriverTreeScoreboardSection'
import EventDetailImpactAnalysisSection from '@/pages/mi/nextGenMI/components/event/EventDetailImpactAnalysisSection'
import EventDetailInstitutionalOutlookTable from '@/pages/mi/nextGenMI/components/event/EventDetailInstitutionalOutlookTable'
import EventDetailMiRecordsTable from '@/pages/mi/nextGenMI/components/event/EventDetailMiRecordsTable'
import NextGenMIUserFeedback from '@/pages/mi/nextGenMI/components/NextGenMIUserFeedback'
import { getNextGenMITabPath, NEXT_GEN_MI_BASE_PATH } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import nextGenMIEventService from '@/service/mi/nextGenMI/event'

type ScenarioDesignColumnKey = 'period' | 'transportDisruption' | 'supplyIntensity' | 'supplyRecovery' | 'branchItem'

const SCENARIO_DESIGN_BASE_EVENT_TABS = [
  { key: 'ai', label: 'AI Insights' },
  { key: 'impact', label: '영향도 분석' },
  { key: 'driverTree', label: 'Index Driver별 영향도 분석' },
  { key: 'outlook', label: '기관 전망' },
  { key: 'records', label: 'MI Records' },
] as const

type ScenarioDesignBaseEventTabKey = (typeof SCENARIO_DESIGN_BASE_EVENT_TABS)[number]['key']

interface ScenarioDesignLocationState {
  eventName?: string
}

interface ScenarioDesignRow {
  id: number
  scenarioName: string
  recommended?: boolean
  period: string
  transportDisruption: string
  supplyIntensity: string
  supplyRecovery: string
  branchItem: string
}

const SCENARIO_DESIGN_COLUMNS: Array<{ key: ScenarioDesignColumnKey; label: string; width: string }> = [
  { key: 'period', label: '기간', width: '200px' },
  { key: 'transportDisruption', label: '운송 차질', width: '200px' },
  { key: 'supplyIntensity', label: '공급 차질 - 강도', width: '200px' },
  { key: 'supplyRecovery', label: '공급 차질 - 완화/회복...', width: '200px' },
  { key: 'branchItem', label: '분기항목', width: '200px' },
]

const isScenarioDesignRequiredColumn = (key: ScenarioDesignColumnKey) => key === 'period' || key === 'transportDisruption'

const SCENARIO_DESIGN_SELECT_COMMON_ACTIONS = {
  agent: {
    value: 'agent',
    label: 'Agent 자동 설정',
  },
  manual: {
    value: 'manual',
    label: '직접 입력값',
    inputLabel: '직접 입력',
  },
  reset: {
    label: '초기화',
  },
} as const

const scenarioDesignAgentItem: SelectMenuItem<string> = {
  value: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
  label: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.label,
  icon: <AutoAwesomeRoundedIcon sx={{ fontSize: '18px', color: 'contentIcon.Enabled' }} />,
}

const scenarioDesignManualItem: SelectMenuItem<string> = {
  value: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.value,
  label: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
  icon: <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />,
}

const periodItems: SelectMenuItem<string>[] = [
  { value: 'short', label: '단기 (1~3M)' },
  { value: 'mid', label: '중기 (3~6M)' },
  { value: 'long', label: '장기 (6M+)' },
]

const impactLevelItems: SelectMenuItem<string>[] = [
  { value: 'none', label: '거의 없음' },
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '중간' },
  { value: 'high', label: '매우 높음' },
]

const recoveryItems: SelectMenuItem<string>[] = [
  { value: 'immediate', label: '신속 차질 → 신속 회복' },
  { value: 'delayed', label: '지연 발생 → 점진 회복' },
  { value: 'extended', label: '급락 피해 → 장기 재고' },
]

const branchItems: SelectMenuItem<string>[] = [
  { value: 'quarter', label: '분기기준값' },
  { value: 'quarterBase', label: '분기기준값 분기기준값 분기기준값' },
]

const SCENARIO_DESIGN_INITIAL_ROWS: ScenarioDesignRow[] = [
  {
    id: 1,
    scenarioName: '단기 휴전-위험 프리미엄 해소',
    period: 'short',
    transportDisruption: 'low',
    supplyIntensity: 'none',
    supplyRecovery: 'immediate',
    branchItem: 'quarter',
  },
  {
    id: 2,
    scenarioName: '분쟁 장기화·LNG 시장 경직 확대',
    recommended: true,
    period: 'mid',
    transportDisruption: 'medium',
    supplyIntensity: 'medium',
    supplyRecovery: 'delayed',
    branchItem: 'quarter',
  },
  {
    id: 3,
    scenarioName: '신규형 정착·위험 프리미엄 영구화',
    period: 'long',
    transportDisruption: 'medium',
    supplyIntensity: 'medium',
    supplyRecovery: 'delayed',
    branchItem: 'quarter',
  },
  {
    id: 4,
    scenarioName: '확전·호르무즈 전면 봉쇄 (Tail Risk)',
    period: 'long',
    transportDisruption: 'high',
    supplyIntensity: 'high',
    supplyRecovery: 'extended',
    branchItem: 'quarterBase',
  },
  {
    id: 5,
    scenarioName: '시나리오명',
    period: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
    transportDisruption: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
    supplyIntensity: 'medium',
    supplyRecovery: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
    branchItem: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
  },
  {
    id: 6,
    scenarioName: '시나리오명',
    period: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
    transportDisruption: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
    supplyIntensity: 'medium',
    supplyRecovery: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
    branchItem: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
  },
]

const createInitialScenarioDesignRows = (): ScenarioDesignRow[] => SCENARIO_DESIGN_INITIAL_ROWS.map((row) => ({ ...row }))

const getScenarioDesignColumnItems = (key: ScenarioDesignColumnKey) => {
  if (key === 'period') return periodItems
  if (key === 'supplyRecovery') return recoveryItems
  if (key === 'branchItem') return branchItems
  return impactLevelItems
}

const getInitialScenarioDesignColumnValue = (rowId: number, key: ScenarioDesignColumnKey, fallbackValue: string) =>
  SCENARIO_DESIGN_INITIAL_ROWS.find((row) => row.id === rowId)?.[key] ?? fallbackValue

const SCENARIO_DESIGN_SECTIONS: NextGenMIDetailHeaderSection[] = [
  { id: 'scenario-design-section-base-event', label: 'Base Event' },
  { id: 'scenario-design-section-rationale', label: '설계 근거' },
  { id: 'scenario-design-section-criteria', label: '분기 항목 및 분기 기준 검토' },
]

interface ScenarioDesignHeaderContent {
  backLabel: string
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

const ScenarioDesignStatusBadge = ({ label }: { label: ReactNode }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    minWidth="42px"
    height="20px"
    px="4px"
    border="1px solid"
    borderColor="contentBorder.Normal"
    borderRadius="4px"
    boxSizing="border-box"
    flexShrink={0}
  >
    <Typography variant="body3SB12" color="contentText.Normal" lineHeight={1.4} noWrap>
      {label}
    </Typography>
  </Stack>
)

const ScenarioDesignCriteriaHeader = ({ label, required, onDelete }: { label: string; required: boolean; onDelete?: () => void }) => (
  <Stack
    component="span"
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    width="100%"
    height="36px"
    minWidth={0}
    padding="8px 8px 8px 12px"
    borderRadius="8px"
    boxSizing="border-box"
    sx={{
      transition: 'background-color 120ms ease',
      '&:hover, &:focus-within': {
        backgroundColor: 'contentBG.Hover',
      },
      '& [data-scenario-design-header-action="true"]': {
        opacity: 0,
        pointerEvents: 'none',
        transition: 'opacity 120ms ease',
      },
      '&:hover [data-scenario-design-header-action="true"], &:focus-within [data-scenario-design-header-action="true"]': {
        opacity: 1,
        pointerEvents: 'auto',
      },
    }}
  >
    <Typography component="span" variant="body2M14" color="contentText.Normal" noWrap flex={1} minWidth={0}>
      {label}
    </Typography>
    {required ? (
      <Typography
        data-scenario-design-header-action="true"
        variant="body3SB12"
        color="contentText.Error"
        noWrap
        sx={{
          height: '22px',
          padding: '2px 6px',
          border: '1px solid',
          borderColor: 'contentText.Error',
          borderRadius: '8px',
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
      >
        필수
      </Typography>
    ) : (
      <DeleteRoundedIcon
        data-scenario-design-header-action="true"
        onClick={(event) => {
          event.stopPropagation()
          onDelete?.()
        }}
        sx={{
          fontSize: '20px',
          color: 'contentText.Error',
          cursor: 'pointer',
        }}
      />
    )}
  </Stack>
)

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
      onBack={content.onBack}
      titleSlot={content.titleSlot}
      sectionSlot={content.sectionSlot}
      rightAction={content.rightAction}
    />
  )
}

const ScenarioDesignStep = ({
  active,
  number,
  label,
  stateLabel,
}: {
  active: boolean
  number: number
  label: string
  stateLabel?: string
}) => (
  <Stack direction="row" alignItems="center" gap="6px" height="40px" padding="8px 12px" borderRadius="10px" minWidth={0}>
    <Stack
      alignItems="center"
      justifyContent="center"
      width="24px"
      height="24px"
      borderRadius="100px"
      bgcolor={active ? 'mari.Primary' : 'commonColor.White'}
      border="1px solid"
      borderColor={active ? 'transparent' : 'contentBorder.Normal'}
      boxSizing="border-box"
      flexShrink={0}
    >
      <Typography variant="body2SB14" color={active ? 'contentText.White' : 'contentText.Subtext'} lineHeight={1.4}>
        {number}
      </Typography>
    </Stack>
    <Typography variant="body1SB16" color={active ? 'mari.Primary' : 'contentText.Subtext'} noWrap>
      {label}
    </Typography>
    {stateLabel && <ScenarioDesignStatusBadge label={stateLabel} />}
  </Stack>
)

const ScenarioDesignSelectFooterAction = ({
  icon,
  label,
  selected,
  disabled,
  dangerOnHover,
  onClick,
}: {
  icon: ReactNode
  label: string
  selected?: boolean
  disabled?: boolean
  dangerOnHover?: boolean
  onClick: () => void
}) => (
  <MIBaseButton
    variant="text"
    disabled={disabled}
    prefix={icon}
    gap="8px"
    onClick={onClick}
    labelColor={disabled ? 'contentText.Disabled' : selected ? 'contentText.Black' : 'contentText.Normal'}
    labelTextAlign="left"
    sx={{
      width: '100%',
      height: '36px',
      padding: '8px 12px 8px 8px',
      borderRadius: '10px',
      justifyContent: 'flex-start',
      backgroundColor: selected ? 'contentBG.PrimaryFade' : 'transparent',
      '&:hover:not(:disabled)': {
        backgroundColor: 'contentBG.Hover',
        ...(dangerOnHover && {
          color: 'contentText.Error',
          '& .MuiTypography-root, & svg': {
            color: 'contentText.Error',
          },
        }),
      },
      '&.Mui-disabled': {
        backgroundColor: 'transparent',
      },
      '& > span, & > span > span': {
        justifyContent: 'flex-start',
      },
      '& .MuiTypography-root': {
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1.4,
      },
    }}
  >
    {label}
  </MIBaseButton>
)

const ScenarioDesignSelectFooter = ({
  selected,
  defaultValue,
  manualValue,
  manualSelected,
  onManualSave,
  onSelected,
  onReset,
}: {
  selected: string
  defaultValue: string
  manualValue: string
  manualSelected: boolean
  onManualSave: (value: string) => void
  onSelected: (value: string) => void
  onReset: () => void
}) => {
  const hasManualValue = manualValue.trim().length > 0
  const resetDisabled = selected === defaultValue

  return (
    <Stack gap="6px" padding="8px 12px">
      <Divider />
      <ScenarioDesignSelectFooterAction
        icon={
          <AutoAwesomeRoundedIcon
            sx={{ fontSize: '18px', color: selected === scenarioDesignAgentItem.value ? 'mari.Primary' : 'contentIcon.Enabled' }}
          />
        }
        label={String(scenarioDesignAgentItem.label)}
        selected={selected === scenarioDesignAgentItem.value}
        onClick={() => onSelected(scenarioDesignAgentItem.value)}
      />

      <Divider />
      <NextGenMIInlineEditableInput
        value={manualValue}
        emptyMode="trigger"
        placeholder={SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.inputLabel}
        modePrefix={{
          trigger: <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />,
          input: <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Activeb', flexShrink: 0 }} />,
          display: <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: '20px', color: 'mari.Primary', flexShrink: 0 }} />,
        }}
        selected={manualSelected}
        autoFocus
        showSaveButton
        showEditButton={hasManualValue}
        resetOnBlur
        trimOnSave
        onCommit={onManualSave}
        onClick={() => onSelected(manualValue.trim() || SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label)}
      />

      <Divider />
      <ScenarioDesignSelectFooterAction
        icon={<RefreshRoundedIcon sx={{ fontSize: '20px', color: resetDisabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled' }} />}
        label={SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.reset.label}
        disabled={resetDisabled}
        dangerOnHover
        onClick={onReset}
      />
    </Stack>
  )
}

const ScenarioDesignSelectCell = ({
  selected,
  items,
  defaultValue,
  onSelected,
}: {
  selected: string
  items: SelectMenuItem<string>[]
  defaultValue: string
  onSelected: (value: string) => void
}) => {
  const selectedColumnItem = items.find((item) => item.value === selected)
  const [open, setOpen] = useState(false)
  const isAgentSelected = selected === scenarioDesignAgentItem.value
  const isLegacyManualSelected = selected === scenarioDesignManualItem.value
  const manualValue = isLegacyManualSelected
    ? SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label
    : !selectedColumnItem && !isAgentSelected
      ? selected
      : ''
  const isManualSelected = manualValue.trim().length > 0
  const selectedItem =
    selectedColumnItem ??
    (isAgentSelected ? scenarioDesignAgentItem : undefined) ??
    (isManualSelected ? scenarioDesignManualItem : undefined)
  const isInlineBadgeValue = isAgentSelected || isManualSelected
  const inlineBadgeLabel = isManualSelected ? manualValue.trim() : selectedItem?.label

  const handleSelected = (value: string) => {
    onSelected(value)
    setOpen(false)
  }

  const handleManualSave = (value: string) => {
    const nextValue = value.trim()
    if (!nextValue) return
    onSelected(nextValue)
    setOpen(false)
  }

  const handleReset = () => {
    onSelected(defaultValue)
    setOpen(false)
  }

  return (
    <MISelectMenu<string>
      selected={selected}
      onSelected={handleSelected}
      items={items}
      variant="outlined"
      closeOnScroll
      enableHoverBackground
      maxHeight="260px"
      open={open}
      onOpenChange={setOpen}
      labelPrefix={isInlineBadgeValue ? null : undefined}
      textLabel={
        isInlineBadgeValue ? (
          <Stack
            component="span"
            data-scenario-design-inline-value
            direction="row"
            alignItems="center"
            gap="4px"
            width="100%"
            minWidth={0}
            maxWidth="100%"
            padding="4px 8px 4px 4px"
            bgcolor="contentBG.PrimaryFade"
            borderRadius="8px"
            boxSizing="border-box"
          >
            {selectedItem?.icon}
            <Typography component="span" variant="body2M14" color="contentText.Normal" noWrap minWidth={0}>
              {inlineBadgeLabel}
            </Typography>
          </Stack>
        ) : undefined
      }
      sx={{
        width: '100%',
        minWidth: 0,
        height: '36px',
        padding: isInlineBadgeValue ? '8px 12px 8px 4px' : '8px 12px',
        borderRadius: '8px',
        overflow: 'hidden',
        ...(isInlineBadgeValue && {
          '& > .MuiBox-root > .MuiBox-root > .MuiStack-root': {
            gap: 0,
          },
        }),
        '& > .MuiBox-root > .MuiBox-root > .MuiStack-root > .MuiStack-root': {
          flex: 1,
          minWidth: 0,
        },
        '& > .MuiBox-root > .MuiBox-root > .MuiStack-root > .MuiStack-root > .MuiTypography-root': {
          flex: 1,
          minWidth: 0,
          justifyContent: 'flex-start',
        },
        '& .MuiTypography-root': {
          maxWidth: '100%',
        },
      }}
      paperProps={{
        elevation: 0,
        sx: {
          width: '260px',
        },
      }}
      footer={
        <ScenarioDesignSelectFooter
          selected={selected}
          defaultValue={defaultValue}
          manualValue={manualValue}
          manualSelected={isManualSelected}
          onManualSave={handleManualSave}
          onSelected={handleSelected}
          onReset={handleReset}
        />
      }
    />
  )
}

const ScenarioDesignIconButton = ({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick?: () => void }) => (
  <MIBaseButton
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    sx={{
      width: '28px',
      minWidth: '28px',
      height: '28px',
      padding: '4px',
      justifyContent: 'center',
      color: 'contentIcon.Enabled',
      '&:hover:not(:disabled)': {
        color: 'contentIcon.Error',
      },
      '&.Mui-disabled': {
        color: 'contentIcon.Disabled',
      },
      '& > .MuiBox-root, & > .MuiBox-root > .MuiBox-root, & .MuiStack-root, & .MuiTypography-root': {
        justifyContent: 'center',
      },
      '& .MuiTypography-root': {
        width: '100%',
      },
    }}
  >
    <DeleteRoundedIcon sx={{ fontSize: '20px', color: 'inherit' }} />
  </MIBaseButton>
)

const ScenarioDesignBaseEventTabButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <MIBaseButton
    variant="outlined"
    onClick={onClick}
    labelColor={active ? 'contentText.Black' : 'contentText.Normal'}
    sx={{
      height: '32px',
      minWidth: 'auto',
      maxWidth: '260px',
      padding: '6px 10px',
      borderRadius: '100px',
      backgroundColor: active ? 'contentBG.PrimaryFade' : 'commonColor.White',
      borderColor: active ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
      '&:hover:not(:disabled)': {
        backgroundColor: active ? 'contentBG.PrimaryFade' : 'commonColor.White',
        borderColor: active ? 'contentBorder.Primaryactive' : 'contentBorder.Hover',
      },
      '& .MuiTypography-root': {
        fontWeight: active ? 600 : 500,
      },
    }}
  >
    {label}
  </MIBaseButton>
)

const ScenarioDesignPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showSnackbar } = useSnackbar()
  const { setStickyHeader } = useStickyHeader()
  const state = location.state as ScenarioDesignLocationState | null
  const [rows, setRows] = useState<ScenarioDesignRow[]>(() => createInitialScenarioDesignRows())
  const [reviewed, setReviewed] = useState(false)
  const [hiddenScenarioDesignColumnKeys, setHiddenScenarioDesignColumnKeys] = useState<ScenarioDesignColumnKey[]>([])
  const [baseEventExpanded, setBaseEventExpanded] = useState(false)
  const [selectedBaseEventTab, setSelectedBaseEventTab] = useState<ScenarioDesignBaseEventTabKey>('ai')
  const [recordsPagination, setRecordsPagination] = useState({ page: 1, size: 10 })
  const [outlooksPagination, setOutlooksPagination] = useState({ page: 1, size: 10 })

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
  const canCompleteScenarioDesignReview = useMemo(
    () =>
      rows.every((row) =>
        visibleScenarioDesignColumns.every((column) => row[column.key] !== SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value),
      ),
    [rows, visibleScenarioDesignColumns],
  )

  const handleRowValueChange = useCallback((rowId: number, key: keyof ScenarioDesignRow, value: string) => {
    setRows((currentRows) => currentRows.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)))
    setReviewed(false)
  }, [])

  const handleAddRow = useCallback(() => {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: Math.max(0, ...currentRows.map((row) => row.id)) + 1,
        scenarioName: '시나리오명',
        period: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
        transportDisruption: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
        supplyIntensity: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
        supplyRecovery: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
        branchItem: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
      },
    ])
    setReviewed(false)
  }, [])

  const handleDeleteCriteriaColumn = useCallback((key: ScenarioDesignColumnKey) => {
    if (isScenarioDesignRequiredColumn(key)) return
    setHiddenScenarioDesignColumnKeys((currentKeys) => (currentKeys.includes(key) ? currentKeys : [...currentKeys, key]))
    setReviewed(false)
  }, [])

  const handleAddCriteria = useCallback(() => {
    const nextColumnKey = hiddenScenarioDesignColumns[0]?.key
    if (!nextColumnKey) {
      showSnackbar('추가 가능한 분기 기준이 없습니다.', { variant: 'info' })
      return
    }

    setHiddenScenarioDesignColumnKeys((currentKeys) => currentKeys.filter((key) => key !== nextColumnKey))
    setReviewed(false)
  }, [hiddenScenarioDesignColumns, showSnackbar])

  const handleDeleteRow = useCallback((rowId: number) => {
    setRows((currentRows) => (currentRows.length <= 1 ? currentRows : currentRows.filter((row) => row.id !== rowId)))
    setReviewed(false)
  }, [])

  const handleReset = useCallback(() => {
    setRows(createInitialScenarioDesignRows())
    setHiddenScenarioDesignColumnKeys([])
    setReviewed(false)
  }, [])

  const handleReview = useCallback(() => {
    setReviewed(true)
    showSnackbar('변경사항 검토가 완료되었습니다.', { variant: 'success' })
  }, [showSnackbar])

  const handleComplete = useCallback(() => {
    if (!reviewed || !canCompleteScenarioDesignReview) return
    showSnackbar('시나리오 One-view 검토 단계로 진행합니다.', { variant: 'success' })
  }, [canCompleteScenarioDesignReview, reviewed, showSnackbar])

  const headerTitleSlot = useMemo(
    () => (
      <Stack width="100%" pt="20px">
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
        <ScenarioDesignStep active number={1} label="시나리오 분기항목 및 분기기준 검토" stateLabel={reviewed ? '검토 완료' : '진행 중'} />
        <Divider flexItem sx={{ width: '40px', alignSelf: 'center', borderColor: 'gray.30' }} />
        <ScenarioDesignStep active={false} number={2} label="시나리오 One-view 검토" />
      </Stack>
    ),
    [reviewed],
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

  const columns = useMemo<NextGenMIStickyTableColumn<ScenarioDesignRow>[]>(
    () => [
      {
        field: 'scenarioName',
        headerName: (
          <Stack direction="row" alignItems="center" gap="8px">
            <Typography variant="body2M14" color="contentText.Normal">
              시나리오 목록
            </Typography>
            <ScenarioDesignStatusBadge label="3개 이상 구성 권장" />
          </Stack>
        ),
        width: '300px',
        headerCellSx: {
          padding: '0 12px',
        },
        cellSx: {
          padding: '0 8px',
          overflow: 'visible',
        },
        renderCell: ({ row }) => (
          <Stack direction="row" alignItems="center" gap="8px" width="100%" minWidth={0}>
            <ScenarioDesignIconButton
              label={`${row.scenarioName} 삭제`}
              disabled={rows.length <= 1}
              onClick={() => handleDeleteRow(row.id)}
            />
            <NextGenMIInlineEditableInput
              value={row.scenarioName}
              autoFocus
              showEditButton={false}
              editOnClick
              commitOnBlur
              commitOnEnter
              suffix={
                row.recommended ? (
                  <MIChip
                    label="BC"
                    color="purple"
                    size="h20"
                    disableHover
                    sx={{
                      padding: '2px 6px',
                      borderRadius: '8px',
                      backgroundColor: 'mari.Primary',
                      color: 'contentText.White',
                    }}
                  />
                ) : undefined
              }
              onCommit={(value) => {
                if (value !== row.scenarioName) handleRowValueChange(row.id, 'scenarioName', value)
              }}
              sx={{
                borderColor: 'contentBorder.Normal',
                bgcolor: 'commonColor.White',
                '&:hover:not(:focus-within)': {
                  backgroundColor: 'contentBG.Hover',
                  borderColor: 'contentBorder.Hover',
                },
                '&:focus-within': {
                  borderColor: 'contentBorder.Active',
                  backgroundColor: 'commonColor.White',
                },
              }}
            />
          </Stack>
        ),
      },
      ...visibleScenarioDesignColumns.map((column): NextGenMIStickyTableColumn<ScenarioDesignRow> => {
        const required = isScenarioDesignRequiredColumn(column.key)

        return {
          field: column.key,
          headerName: (
            <ScenarioDesignCriteriaHeader
              label={column.label}
              required={required}
              onDelete={required ? undefined : () => handleDeleteCriteriaColumn(column.key)}
            />
          ),
          width: column.width,
          minWidth: column.width,
          headerCellSx: {
            padding: '10px 8px',
          },
          renderCell: ({ row }) => {
            const items = getScenarioDesignColumnItems(column.key)
            return (
              <ScenarioDesignSelectCell
                selected={row[column.key]}
                items={items}
                defaultValue={getInitialScenarioDesignColumnValue(row.id, column.key, SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value)}
                onSelected={(value) => handleRowValueChange(row.id, column.key, value)}
              />
            )
          },
        }
      }),
      {
        field: 'spacer',
        headerName: '',
        width: 'auto',
        minWidth: '0px',
        maxWidth: 'none',
        headerCellSx: {
          padding: 0,
        },
        cellSx: {
          padding: 0,
        },
        renderCell: () => null,
      },
    ],
    [handleDeleteCriteriaColumn, handleDeleteRow, handleRowValueChange, rows.length, visibleScenarioDesignColumns],
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
      backLabel: 'Event',
      onBack: handleBackToEvent,
      titleSlot: headerTitleSlot,
      sectionSlot: headerSectionSlot,
      rightAction: headerRightAction,
    })
  }, [handleBackToEvent, headerRightAction, headerSectionSlot, headerTitleSlot])

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
    <Stack maxWidth="1380px" margin="auto" px="12px" pt="12px" position="relative" sx={{ overflowX: 'hidden' }}>
      <Stack gap="38px" py="24px">
        <Stack id={SCENARIO_DESIGN_SECTIONS[0].id} gap="4px">
          <Stack padding="4px 8px">
            <Typography fontSize="18px" fontWeight={600} color="contentText.Black" lineHeight={1.4} noWrap>
              Base Event
            </Typography>
          </Stack>
          <Stack
            gap="10px"
            padding="16px"
            bgcolor={baseEventExpanded ? 'gray.5' : 'commonColor.White'}
            border="1px solid"
            borderColor={baseEventExpanded ? 'contentBorder.Hover' : 'contentBorder.Normal'}
            borderRadius="10px"
            sx={{
              transition: 'background-color 120ms ease, border-color 120ms ease',
              ...(!baseEventExpanded && {
                '&:hover': {
                  backgroundColor: 'contentBG.Hover',
                  borderColor: 'contentBorder.Hover',
                },
              }),
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
              onClick={handleBaseEventToggle}
              sx={{ cursor: 'pointer' }}
            >
              <Stack flex={1} minWidth={0} gap="6px">
                {isLoading ? (
                  <>
                    <Skeleton variant="rounded" width="min(720px, 100%)" height="20px" />
                    <Skeleton variant="rounded" width="360px" height="16px" />
                  </>
                ) : (
                  <>
                    <Stack direction="row" alignItems="center" gap="4px" minWidth={0}>
                      {isScenarioSuggested && <StarRoundedIcon sx={{ fontSize: '18px', color: 'mari.Primary', flexShrink: 0 }} />}
                      <NextGenMIHoverLinkCell
                        value={eventTitle}
                        variant="body1M16"
                        ariaLabel={`${eventTitle} 상세 보기`}
                        onClick={() => navigate(eventDetailPath, { state: { eventName: eventTitle } })}
                      />
                    </Stack>
                    <Stack direction="row" alignItems="center" gap="8px" minWidth={0}>
                      <Typography variant="body2R14" color="contentText.Subtext" lineHeight={1.5} noWrap>
                        {createdAtLabel}
                      </Typography>
                      <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.5} noWrap>
                        {eventTypeLabel}
                      </Typography>
                    </Stack>
                  </>
                )}
              </Stack>
              <MIBaseButton
                aria-label={baseEventExpanded ? 'Base Event 접기' : 'Base Event 펼치기'}
                aria-expanded={baseEventExpanded}
                aria-controls="scenario-design-base-event-detail"
                variant="text"
                prefix={
                  baseEventExpanded ? (
                    <KeyboardArrowUpIcon aria-hidden focusable="false" style={{ color: '#868E96' }} />
                  ) : (
                    <ArrowDown aria-hidden focusable="false" />
                  )
                }
                onClick={(event) => {
                  event.stopPropagation()
                  handleBaseEventToggle()
                }}
                sx={{
                  width: '28px',
                  minWidth: '28px',
                  height: '28px',
                  padding: '4px',
                  borderRadius: '10px',
                  '& .MuiTypography-root': {
                    display: 'none',
                  },
                }}
              >
                {''}
              </MIBaseButton>
            </Stack>

            <Collapse in={baseEventExpanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
              <Stack id="scenario-design-base-event-detail" gap="6px" width="100%" minWidth={0}>
                <Stack direction="row" alignItems="center" gap="5px" minHeight="48px" padding="8px 12px" flexWrap="wrap">
                  {SCENARIO_DESIGN_BASE_EVENT_TABS.map((tab) => (
                    <ScenarioDesignBaseEventTabButton
                      key={tab.key}
                      active={selectedBaseEventTab === tab.key}
                      label={tab.label}
                      onClick={() => setSelectedBaseEventTab(tab.key)}
                    />
                  ))}
                </Stack>
                <Stack bgcolor="commonColor.White" borderRadius="10px" padding="8px" overflow="hidden" minWidth={0}>
                  {baseEventDetailContent}
                </Stack>
              </Stack>
            </Collapse>
          </Stack>
        </Stack>

        {showDesignRationale && (
          <Stack id={SCENARIO_DESIGN_SECTIONS[1].id} gap="12px">
            <Typography fontSize="18px" fontWeight={600} color="contentText.Black" lineHeight={1.4} padding="4px 8px">
              설계 근거
            </Typography>
            <Stack bgcolor="gray.5" borderRadius="10px" padding="20px" justifyContent="center">
              {isLoading ? (
                <Stack gap="8px">
                  <Skeleton variant="rounded" width="100%" height="18px" />
                  <Skeleton variant="rounded" width="78%" height="18px" />
                </Stack>
              ) : (
                <Typography fontSize="16px" fontWeight={500} color="contentText.Normal" lineHeight={1.5} whiteSpace="pre-line">
                  {designRationale}
                </Typography>
              )}
            </Stack>
          </Stack>
        )}

        <Stack id={SCENARIO_DESIGN_SECTIONS[2].id} gap="4px">
          <Typography fontSize="18px" fontWeight={600} color="contentText.Black" padding="4px 8px">
            분기 항목 및 분기 기준 검토
          </Typography>
          <Stack width="100%" minWidth={0}>
            <Stack position="relative" width="100%" minWidth={0}>
              <NextGenMIStickyTable<ScenarioDesignRow>
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.id}
                fixedLeftColumnIndexes={[0]}
                rowHeight="56px"
                headerHeight="56px"
                cellPaddingX="8px"
                cellPaddingY="8px"
                headerFontSize="14px"
                bodyFontSize="14px"
                noRowMessage="시나리오를 추가해 주세요."
                containerShell={false}
              />
              <Stack
                position="absolute"
                top={0}
                right={0}
                bottom={0}
                width="36px"
                alignItems="flex-end"
                padding="10px 0"
                zIndex={7}
                sx={{
                  pointerEvents: 'none',
                }}
              >
                <MIBaseButton
                  aria-label="분기 기준 추가"
                  variant="outlined"
                  enableHoverBackground
                  onClick={handleAddCriteria}
                  sx={{
                    width: '28px',
                    minWidth: '28px',
                    height: '28px',
                    padding: 0,
                    borderRadius: '8px',
                    pointerEvents: 'auto',
                    '& > .MuiBox-root, & .MuiStack-root, & .MuiTypography-root': {
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    '& .MuiTypography-root': {
                      lineHeight: 0,
                    },
                  }}
                >
                  <AddRoundedIcon sx={{ fontSize: '20px' }} />
                </MIBaseButton>
              </Stack>
            </Stack>

            <MIBaseButton
              variant="outlined"
              enableHoverBackground
              onClick={handleAddRow}
              sx={{
                width: '100%',
                minWidth: 0,
                height: '30px',
                marginTop: '4px',
                padding: 0,
                borderRadius: '4px',
                '& > .MuiBox-root, & .MuiStack-root, & .MuiTypography-root': {
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                '& .MuiTypography-root': {
                  lineHeight: 0,
                },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: '20px' }} />
            </MIBaseButton>
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" minHeight="60px" padding="12px 0">
            <MIBaseButton
              variant="outlined"
              prefix={<ReplayRoundedIcon sx={{ fontSize: '20px' }} />}
              onClick={handleReset}
              gap="4px"
              sx={{ height: '36px', padding: '8px 10px 8px 6px', borderRadius: '8px' }}
            >
              전체 초기화
            </MIBaseButton>

            <Stack direction="row" alignItems="center" gap="8px">
              <MIBaseButton
                variant="outlined"
                onClick={() => navigate(eventDetailPath, { state: { eventName: eventTitle } })}
                sx={{ height: '36px', padding: '8px 10px', borderRadius: '8px' }}
              >
                취소
              </MIBaseButton>
              <MIBaseButton
                variant="contained"
                onClick={handleReview}
                sx={{
                  height: '36px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'contentIcon.ActivePrimary',
                  '&:hover:not(:disabled)': {
                    backgroundColor: 'contentIcon.ActivePrimary',
                  },
                }}
              >
                변경사항 검토
              </MIBaseButton>
              <MIBaseButton
                variant="contained"
                suffix={<ChevronRightRoundedIcon sx={{ fontSize: '20px' }} />}
                disabled={!reviewed || !canCompleteScenarioDesignReview}
                onClick={handleComplete}
                labelColor="contentText.White"
                sx={{
                  height: '36px',
                  padding: '8px 6px 8px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'contentIcon.ActivePrimary',
                  '&:hover:not(:disabled)': {
                    backgroundColor: 'contentIcon.ActivePrimary',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#C3CAEE',
                    color: 'contentText.White',
                  },
                  '&.Mui-disabled .MuiTypography-root, &.Mui-disabled svg': {
                    color: 'contentText.White',
                  },
                }}
              >
                검토 완료
              </MIBaseButton>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioDesignPage
