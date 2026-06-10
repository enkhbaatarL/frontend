import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import { Box, CircularProgress, Popover, Stack, Tooltip, Typography } from '@mui/material'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIInputErrorIcon from '@/components/common/input/MIInputErrorIcon'
import useSnackbar from '@/hooks/useSnackbar'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import ScenarioDesignCriteriaDropdown, {
  type ScenarioDesignCriteriaCellMode,
  type ScenarioDesignCriteriaChange,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignCriteriaDropdown'
import { ScenarioDesignOutlineBadge } from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignStickyHeader'
import {
  type ScenarioDesignBranchField,
  type ScenarioDesignBranchItem,
  type ScenarioDesignBranchRow,
  SCENARIO_DESIGN_ALL_AGENT_FIELDS,
  SCENARIO_DESIGN_ALL_BRANCH_ITEMS,
  SCENARIO_DESIGN_CRITERIA_OPTIONS,
  SCENARIO_DESIGN_DEFAULT_VISIBLE_FIELDS,
  SCENARIO_DESIGN_DUPLICATE_NAME_ERROR,
  SCENARIO_DESIGN_MAX_SCENARIO_COUNT,
} from '@/pages/mi/nextGenMI/scenarioDesignMockData'

interface ScenarioDesignBranchingTableProps {
  rows: ScenarioDesignBranchRow[]
  isApplyingChanges?: boolean
  reviewCompleted?: boolean
  onReviewChangesConfirm?: () => void
  onReviewCompleteClick?: () => void
  onResetAll?: () => void
  onCriteriaEdited?: () => void
}

interface ScenarioDesignAddBranchItemsPopupProps {
  open: boolean
  anchorEl: HTMLElement | null
  items: ScenarioDesignBranchItem[]
  onClose: () => void
  onAdd: (fields: string[]) => void
}

const FIXED_ROW_FIELDS = new Set<ScenarioDesignBranchField>([
  'period',
  'transportDisruption',
  'supplyDisruptionIntensity',
  'supplyRecoveryPattern',
  'branchCriteria',
])

const getRowFieldValue = (row: ScenarioDesignBranchRow, field: ScenarioDesignBranchField): string => {
  if (FIXED_ROW_FIELDS.has(field)) return row[field as keyof ScenarioDesignBranchRow] as string
  return row.extraCriteria?.[field] ?? ''
}

const getRowFieldMode = (row: ScenarioDesignBranchRow, field: ScenarioDesignBranchField): ScenarioDesignCriteriaCellMode => {
  if (row.agentAutoFields?.includes(field)) return 'agentAuto'
  if (row.directInputFields?.includes(field)) return 'directInput'
  return 'standard'
}

const buildInitialRowValues = (rows: ScenarioDesignBranchRow[]): Record<string, Record<string, string>> => {
  const map: Record<string, Record<string, string>> = {}
  rows.forEach((row) => {
    map[row.id] = {}
    SCENARIO_DESIGN_ALL_AGENT_FIELDS.forEach((field) => {
      map[row.id][field] = getRowFieldValue(row, field)
    })
  })
  return map
}

const setRowFieldValue = (row: ScenarioDesignBranchRow, field: ScenarioDesignBranchField, value: string): ScenarioDesignBranchRow => {
  if (FIXED_ROW_FIELDS.has(field)) {
    return { ...row, [field]: value }
  }
  return { ...row, extraCriteria: { ...row.extraCriteria, [field]: value } }
}

const assignAgentCriteriaValue = (field: ScenarioDesignBranchField, rowIndex: number): string => {
  const options = SCENARIO_DESIGN_CRITERIA_OPTIONS[field] ?? []
  if (options.length === 0) return ''
  return options[rowIndex % options.length]
}

const confirmPendingCriteriaOnRow = (row: ScenarioDesignBranchRow, rowIndex: number): ScenarioDesignBranchRow => {
  const hasPendingAgent = (row.agentAutoFields?.length ?? 0) > 0
  const hasPendingDirectInput = (row.directInputFields?.length ?? 0) > 0
  if (!hasPendingAgent && !hasPendingDirectInput) return row

  let nextRow = { ...row }

  row.agentAutoFields?.forEach((field) => {
    nextRow = setRowFieldValue(nextRow, field, assignAgentCriteriaValue(field, rowIndex))
  })

  return {
    ...nextRow,
    agentAutoFields: [],
    directInputFields: [],
  }
}

const applyCriteriaChangeToRow = (
  row: ScenarioDesignBranchRow,
  field: ScenarioDesignBranchField,
  change: ScenarioDesignCriteriaChange,
): ScenarioDesignBranchRow => {
  let nextRow = setRowFieldValue(row, field, change.value)
  const agentAutoFields = (nextRow.agentAutoFields ?? []).filter((item) => item !== field)
  const directInputFields = (nextRow.directInputFields ?? []).filter((item) => item !== field)

  if (change.mode === 'agentAuto') {
    nextRow = { ...nextRow, agentAutoFields: [...agentAutoFields, field], directInputFields }
  } else if (change.mode === 'directInput') {
    nextRow = { ...nextRow, agentAutoFields, directInputFields: [...directInputFields, field] }
  } else {
    nextRow = { ...nextRow, agentAutoFields, directInputFields }
  }

  return nextRow
}

const ROW_HEIGHT = '56px'
const CELL_HEIGHT = '36px'
const SCENARIO_COLUMN_WIDTH = '300px'
const CRITERIA_CELL_WIDTH = '180px'
const COLUMN_GAP = '12px'
const FADER_WIDTH = '36px'
const HORIZONTAL_SCROLLBAR_HEIGHT = '18px'
const CRITERIA_ROW_PADDING_X = '12px'
const scrollableColumnsMinWidth = (columnCount: number) =>
  `calc(${columnCount} * (${CRITERIA_CELL_WIDTH} + ${COLUMN_GAP}) - ${COLUMN_GAP} + (2 * ${CRITERIA_ROW_PADDING_X}))`

const CRITERIA_COLUMN_SLOT_SX = {
  width: CRITERIA_CELL_WIDTH,
  minWidth: CRITERIA_CELL_WIDTH,
  maxWidth: CRITERIA_CELL_WIDTH,
  flexShrink: 0,
  boxSizing: 'border-box',
} as const

const CRITERIA_ROW_SX = {
  px: CRITERIA_ROW_PADDING_X,
  boxSizing: 'border-box',
} as const

const TABLE_ROW_SX = {
  height: ROW_HEIGHT,
  minHeight: ROW_HEIGHT,
  maxHeight: ROW_HEIGHT,
  flexShrink: 0,
  boxSizing: 'border-box',
  borderBottom: '1px solid',
  borderColor: 'contentBorder.Normal',
} as const

const LEFT_COLUMN_SHADOW_SX = {
  boxShadow: '4px 0 10px rgba(0, 0, 0, 0.08)',
} as const

const SCENARIO_NAME_INPUT_SX = {
  width: '100%',
  minWidth: 0,
  border: 'none',
  outline: 'none',
  bgcolor: 'transparent',
  padding: 0,
  margin: 0,
  typography: 'body2M14',
  color: 'contentText.Black',
  textAlign: 'left',
  lineHeight: 1.4,
  '&:focus': {
    outline: 'none',
  },
} as const

const SCENARIO_NAME_PREFIX = '시나리오명'

const parseScenarioNameNumber = (scenarioName: string): number | null => {
  const trimmed = scenarioName.trim()
  if (!trimmed.startsWith(SCENARIO_NAME_PREFIX)) return null
  const suffix = trimmed.slice(SCENARIO_NAME_PREFIX.length).trim()
  if (!/^\d+$/.test(suffix)) return null
  return Number(suffix)
}

const getNextScenarioDisplayName = (rows: ScenarioDesignBranchRow[]): string => {
  const usedNumbers = rows.map((row) => parseScenarioNameNumber(row.scenarioName)).filter((value): value is number => value !== null)
  let nextNumber = 1
  while (usedNumbers.includes(nextNumber)) {
    nextNumber += 1
  }
  return `${SCENARIO_NAME_PREFIX} ${nextNumber}`
}

const createNewScenarioRow = (scenarioName: string): ScenarioDesignBranchRow => ({
  id: `scenario-${Date.now()}`,
  scenarioName,
  placeholder: true,
  period: '',
  transportDisruption: '',
  supplyDisruptionIntensity: '',
  supplyRecoveryPattern: '',
  branchCriteria: '',
  agentAutoFields: ['period', 'transportDisruption'],
  directInputFields: ['supplyRecoveryPattern', 'branchCriteria'],
})

const isDuplicateScenarioName = (rows: ScenarioDesignBranchRow[], scenarioName: string, editingId: string | null) => {
  const normalizedName = scenarioName.trim()
  if (!normalizedName) return false
  return rows.some((row) => row.id !== editingId && row.scenarioName.trim() === normalizedName)
}

const SCENARIO_DESIGN_DUPLICATE_ERROR_TOOLTIP_SLOT_PROPS = {
  popper: {
    modifiers: [
      {
        name: 'offset',
        options: {
          // Figma 7599:251919 - tooltip top: icon top - 38px
          offset: [0, -7],
        },
      },
      {
        name: 'flip',
        enabled: false,
      },
    ],
    sx: { zIndex: 1500 },
  },
  tooltip: {
    sx: {
      bgcolor: 'contentText.Error',
      color: 'commonColor.White',
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: 1.4,
      padding: '8px 10px',
      margin: 0,
      borderRadius: '6px',
      maxWidth: '300px',
      minWidth: '40px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
    },
  },
}

const SCENARIO_DESIGN_DELETE_BUTTON_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '28px',
  width: '28px',
  height: '28px',
  padding: 0,
  border: 'none',
  borderRadius: '8px',
  bgcolor: 'transparent',
  cursor: 'pointer',
  flexShrink: 0,
  lineHeight: 0,
  '& .delete-icon-filled': { display: 'none' },
  '&:hover:not(:disabled)': {
    bgcolor: 'contentBG.Hover',
    '& .delete-icon-outline': { display: 'none' },
    '& .delete-icon-filled': { display: 'block' },
  },
  '&:disabled': { cursor: 'default', opacity: 1 },
} as const

const ScenarioDesignDeleteButton = ({
  disabled = false,
  onClick,
  className,
}: {
  disabled?: boolean
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void
  className?: string
}) => (
  <Box component="button" type="button" disabled={disabled} className={className} onClick={onClick} sx={SCENARIO_DESIGN_DELETE_BUTTON_SX}>
    <DeleteOutlineRoundedIcon
      className="delete-icon-outline"
      sx={{ fontSize: 20, color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled' }}
    />
    <DeleteRoundedIcon className="delete-icon-filled" sx={{ fontSize: 20, color: 'contentText.Error' }} />
  </Box>
)

const ScenarioDesignMandatoryBadge = () => (
  <Box
    component="span"
    className="mandatory-badge"
    display="inline-flex"
    alignItems="center"
    px="6px"
    py="2px"
    borderRadius="8px"
    border="1px solid"
    borderColor="contentText.Error"
    bgcolor="commonColor.White"
    lineHeight={0}
    sx={{ verticalAlign: 'middle' }}
  >
    <Typography component="span" fontSize="12px" fontWeight={600} color="contentText.Error" lineHeight={1.4} noWrap>
      필수
    </Typography>
  </Box>
)

const ScenarioDesignAddBranchItemsPopup = ({ open, anchorEl, items, onClose, onAdd }: ScenarioDesignAddBranchItemsPopupProps) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  useEffect(() => {
    if (open) setSelectedFields([])
  }, [open])

  const handleToggle = useCallback((field: string) => {
    setSelectedFields((prev) => (prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field]))
  }, [])

  const handleAdd = useCallback(() => {
    if (selectedFields.length === 0) return
    onAdd(selectedFields)
    onClose()
  }, [onAdd, onClose, selectedFields])

  const canAdd = selectedFields.length > 0

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            width: '311px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.1)',
            mt: '4px',
          },
        },
      }}
    >
      <Stack px="6px" py="8px" gap="4px" maxHeight="240px" overflow="auto">
        {items.map((item) => {
          const checked = selectedFields.includes(item.field)
          return (
            <Stack
              key={item.field}
              direction="row"
              alignItems="center"
              gap="8px"
              minHeight="36px"
              pl="6px"
              pr="12px"
              py="8px"
              borderRadius="10px"
              bgcolor={checked ? 'contentBG.PrimaryFade' : 'transparent'}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: checked ? 'contentBG.PrimaryFade' : 'gray.5' } }}
              onClick={() => handleToggle(item.field)}
            >
              <CheckRoundedIcon
                sx={{
                  fontSize: 20,
                  color: checked ? 'contentIcon.ActivePrimary' : 'transparent',
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2M14" color={checked ? 'contentText.Black' : 'contentText.Normal'} lineHeight={1.4} noWrap flex={1}>
                {item.headerName}
              </Typography>
            </Stack>
          )
        })}
      </Stack>
      <Stack px="10px" py="6px" direction="row" alignItems="flex-start" gap="4px">
        <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Subtext', mt: '2px', flexShrink: 0 }} />
        <Typography variant="body3M12" color="contentText.Subtext" lineHeight={1.4}>
          Agent 생성된 분기항목 중 선택 가능합니다
        </Typography>
      </Stack>
      <Stack px="12px" py="12px" direction="row" alignItems="center" justifyContent="flex-end" gap="8px">
        <MIBaseButton variant="outlined" onClick={onClose} sx={{ height: '32px', padding: '6px 10px', borderRadius: '8px' }}>
          취소
        </MIBaseButton>
        <MIBaseButton
          variant="contained"
          disabled={!canAdd}
          onClick={handleAdd}
          sx={{
            height: '32px',
            padding: '6px 10px',
            borderRadius: '8px',
            bgcolor: canAdd ? 'common.primary' : 'contentBG.Disabled',
            color: canAdd ? 'commonColor.White' : 'contentText.Disabled',
            '&.Mui-disabled': {
              bgcolor: 'contentBG.Disabled',
              color: 'contentText.Disabled',
            },
          }}
        >
          분기항목 추가
        </MIBaseButton>
      </Stack>
    </Popover>
  )
}

const ScenarioDesignApplyingChangesOverlay = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{
      position: 'absolute',
      inset: 0,
      zIndex: 4,
      pointerEvents: 'none',
    }}
  >
    <Stack alignItems="center" gap="10px">
      <CircularProgress size={24} thickness={5} sx={{ color: 'mari.Primary' }} />
      <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
        변경사항을 검토하고 있습니다
      </Typography>
    </Stack>
  </Stack>
)

const ScenarioDesignBranchingTable = ({
  rows: initialRows,
  isApplyingChanges = false,
  reviewCompleted = false,
  onReviewChangesConfirm,
  onReviewCompleteClick,
  onResetAll,
  onCriteriaEdited,
}: ScenarioDesignBranchingTableProps) => {
  const { showSnackbar } = useSnackbar()
  const addCriteriaButtonRef = useRef<HTMLButtonElement>(null)
  const scenarioNameInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ScenarioDesignBranchRow[]>(initialRows)
  const [visibleFields, setVisibleFields] = useState<ScenarioDesignBranchField[]>(SCENARIO_DESIGN_DEFAULT_VISIBLE_FIELDS)
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null)
  const [editingScenarioName, setEditingScenarioName] = useState('')
  const [editingScenarioOriginalName, setEditingScenarioOriginalName] = useState('')
  const [scenarioNameError, setScenarioNameError] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [branchItemsPopupOpen, setBranchItemsPopupOpen] = useState(false)
  const [reviewConfirmOpen, setReviewConfirmOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [initialRowValues, setInitialRowValues] = useState<Record<string, Record<string, string>>>(() => buildInitialRowValues(initialRows))
  const isInteractionDisabled = isApplyingChanges
  const isMaxScenarioReached = rows.length >= SCENARIO_DESIGN_MAX_SCENARIO_COUNT

  useEffect(() => {
    setRows(initialRows)
    setInitialRowValues(buildInitialRowValues(initialRows))
  }, [initialRows])

  useEffect(() => {
    if (!reviewCompleted) return
    setRows((prev) => prev.map((row, rowIndex) => confirmPendingCriteriaOnRow(row, rowIndex)))
  }, [reviewCompleted])

  useLayoutEffect(() => {
    if (!editingScenarioId || !scenarioNameInputRef.current) return
    scenarioNameInputRef.current.scrollLeft = 0
  }, [editingScenarioId])

  const visibleColumns = useMemo(
    () => SCENARIO_DESIGN_ALL_BRANCH_ITEMS.filter((item) => visibleFields.includes(item.field)),
    [visibleFields],
  )

  const unselectedBranchItems = useMemo(
    () => SCENARIO_DESIGN_ALL_BRANCH_ITEMS.filter((item) => !visibleFields.includes(item.field)),
    [visibleFields],
  )

  const canDeleteScenario = rows.length > 1

  const clearEditingState = useCallback(() => {
    setEditingScenarioId(null)
    setEditingScenarioName('')
    setEditingScenarioOriginalName('')
    setScenarioNameError(false)
  }, [])

  const handleStartEditScenarioName = useCallback((row: ScenarioDesignBranchRow) => {
    setEditingScenarioId(row.id)
    setEditingScenarioName(row.scenarioName)
    setEditingScenarioOriginalName(row.scenarioName)
    setScenarioNameError(false)
  }, [])

  const handleScenarioNameChange = useCallback(
    (value: string) => {
      setEditingScenarioName(value)
      setScenarioNameError(isDuplicateScenarioName(rows, value, editingScenarioId))
    },
    [editingScenarioId, rows],
  )

  const handleCommitScenarioName = useCallback(() => {
    if (!editingScenarioId) return
    const trimmedName = editingScenarioName.trim()
    const hasDuplicateError = isDuplicateScenarioName(rows, trimmedName, editingScenarioId)
    if (!trimmedName || hasDuplicateError) {
      clearEditingState()
      return
    }
    if (trimmedName === editingScenarioOriginalName.trim()) {
      clearEditingState()
      return
    }
    setRows((prev) => prev.map((row) => (row.id === editingScenarioId ? { ...row, scenarioName: trimmedName } : row)))
    clearEditingState()
  }, [clearEditingState, editingScenarioId, editingScenarioName, editingScenarioOriginalName, rows])

  const handleCancelScenarioNameEdit = useCallback(() => {
    clearEditingState()
  }, [clearEditingState])

  const handleDeleteScenario = useCallback(() => {
    if (!deleteTargetId) return
    setRows((prev) => prev.filter((row) => row.id !== deleteTargetId))
    if (editingScenarioId === deleteTargetId) clearEditingState()
    setDeleteTargetId(null)
    showSnackbar('시나리오가 삭제되었습니다.', { variant: 'success' })
  }, [clearEditingState, deleteTargetId, editingScenarioId, showSnackbar])

  const handleAddScenario = useCallback(() => {
    if (isMaxScenarioReached) return
    const nextScenarioName = getNextScenarioDisplayName(rows)
    const newRow = createNewScenarioRow(nextScenarioName)
    setRows((prev) => [...prev, newRow])
    setInitialRowValues((prev) => ({
      ...prev,
      [newRow.id]: Object.fromEntries(SCENARIO_DESIGN_ALL_AGENT_FIELDS.map((field) => [field, getRowFieldValue(newRow, field)])),
    }))
    setEditingScenarioId(newRow.id)
    setEditingScenarioName(nextScenarioName)
    setEditingScenarioOriginalName(nextScenarioName)
    setScenarioNameError(false)
  }, [isMaxScenarioReached, rows])

  const handleHideColumn = useCallback((field: ScenarioDesignBranchField) => {
    setVisibleFields((prev) => prev.filter((item) => item !== field))
  }, [])

  const handleAddBranchItems = useCallback((fields: string[]) => {
    setVisibleFields((prev) => [...prev, ...(fields as ScenarioDesignBranchField[])])
  }, [])

  const handleCriteriaChange = useCallback(
    (rowId: string, field: ScenarioDesignBranchField, change: ScenarioDesignCriteriaChange) => {
      setRows((prev) => prev.map((row) => (row.id === rowId ? applyCriteriaChangeToRow(row, field, change) : row)))
      onCriteriaEdited?.()
    },
    [onCriteriaEdited],
  )

  const handleConfirmReview = useCallback(() => {
    setReviewConfirmOpen(false)
    onReviewChangesConfirm?.()
  }, [onReviewChangesConfirm])

  const handleConfirmReset = useCallback(() => {
    setResetConfirmOpen(false)
    setRows(initialRows)
    setInitialRowValues(buildInitialRowValues(initialRows))
    setVisibleFields(SCENARIO_DESIGN_DEFAULT_VISIBLE_FIELDS)
    clearEditingState()
    onResetAll?.()
    showSnackbar('모든 항목이 기본값으로 초기화되었습니다.', { variant: 'success' })
  }, [clearEditingState, initialRows, onResetAll, showSnackbar])

  const addScenarioTooltip = isMaxScenarioReached ? '시나리오는 최대 15개까지 추가할 수 있습니다.' : '시나리오를 추가합니다'

  const horizontalScrollRef = useRef<HTMLDivElement>(null)
  const [isScrollAreaHovered, setIsScrollAreaHovered] = useState(false)
  const [horizontalDragActive, setHorizontalDragActive] = useState(false)
  const [scrollState, setScrollState] = useState({
    horizontal: false,
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
    right: false,
  })

  const updateScrollState = useCallback(() => {
    const horizontalEl = horizontalScrollRef.current
    if (!horizontalEl) return

    const { scrollLeft, scrollWidth, clientWidth } = horizontalEl

    setScrollState({
      horizontal: scrollWidth > clientWidth + 1,
      scrollLeft,
      scrollWidth,
      clientWidth,
      right: scrollLeft + clientWidth < scrollWidth - 1,
    })
  }, [])

  useEffect(() => {
    updateScrollState()
    const horizontalEl = horizontalScrollRef.current
    if (!horizontalEl) {
      return () => {}
    }

    horizontalEl.addEventListener('scroll', updateScrollState, { passive: true })

    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(horizontalEl)

    return () => {
      horizontalEl.removeEventListener('scroll', updateScrollState)
      resizeObserver.disconnect()
    }
  }, [rows.length, updateScrollState, visibleColumns.length])

  const horizontalThumbWidth =
    scrollState.horizontal && scrollState.scrollWidth > 0 ? Math.max((scrollState.clientWidth / scrollState.scrollWidth) * 100, 8) : 0
  const horizontalThumbLeft =
    scrollState.horizontal && scrollState.scrollWidth > scrollState.clientWidth
      ? (scrollState.scrollLeft / (scrollState.scrollWidth - scrollState.clientWidth)) * (100 - horizontalThumbWidth)
      : 0
  const showScrollbars = isScrollAreaHovered || horizontalDragActive

  const handleHorizontalScrollbarPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const horizontalEl = horizontalScrollRef.current
    if (!horizontalEl || !scrollState.horizontal) return

    const track = event.currentTarget.parentElement
    if (!track) return

    const trackRect = track.getBoundingClientRect()
    const thumbWidthPx = (horizontalThumbWidth / 100) * trackRect.width
    const startX = event.clientX
    const startScrollLeft = horizontalEl.scrollLeft
    const maxScrollLeft = horizontalEl.scrollWidth - horizontalEl.clientWidth
    const scrollableTrackWidth = trackRect.width - thumbWidthPx

    setHorizontalDragActive(true)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (scrollableTrackWidth <= 0) return
      const deltaRatio = (moveEvent.clientX - startX) / scrollableTrackWidth
      horizontalEl.scrollLeft = Math.min(Math.max(startScrollLeft + deltaRatio * maxScrollLeft, 0), maxScrollLeft)
    }

    const handlePointerUp = () => {
      setHorizontalDragActive(false)
      globalThis.removeEventListener('pointermove', handlePointerMove)
      globalThis.removeEventListener('pointerup', handlePointerUp)
    }

    globalThis.addEventListener('pointermove', handlePointerMove)
    globalThis.addEventListener('pointerup', handlePointerUp, { once: true })
  }

  const renderScenarioColumnHeader = () => (
    <Stack
      direction="row"
      alignItems="center"
      gap="6px"
      height={ROW_HEIGHT}
      minHeight={ROW_HEIGHT}
      maxHeight={ROW_HEIGHT}
      px="8px"
      borderBottom="0.5px solid"
      borderColor="contentBorder.Active"
      bgcolor="commonColor.White"
      flexShrink={0}
      sx={{ boxSizing: 'border-box' }}
    >
      <Typography variant="body2M14" color="contentText.Black" px="6px" lineHeight={1.4}>
        시나리오 목록
      </Typography>
      <ScenarioDesignOutlineBadge label="3개 이상 구성 권장" />
    </Stack>
  )

  const renderCriteriaColumnHeader = () => (
    <Stack
      direction="row"
      alignItems="center"
      gap={COLUMN_GAP}
      height={ROW_HEIGHT}
      minHeight={ROW_HEIGHT}
      maxHeight={ROW_HEIGHT}
      borderBottom="1px solid"
      borderColor="contentBorder.Normal"
      bgcolor="commonColor.White"
      flexShrink={0}
      sx={[CRITERIA_ROW_SX, { boxSizing: 'border-box' }]}
    >
      {visibleColumns.map((column) => (
        <Box key={column.field} sx={CRITERIA_COLUMN_SLOT_SX}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap="4px"
            width="100%"
            height="40px"
            px="12px"
            py="6px"
            borderRadius="8px"
            sx={{
              boxSizing: 'border-box',
              '& .column-mandatory-label': { opacity: 0 },
              '& .column-delete-btn': { opacity: 0, pointerEvents: 'none' },
              '&:hover': { bgcolor: 'contentBG.Hover' },
              '&:hover .column-mandatory-label': { opacity: column.mandatory ? 1 : 0 },
              '&:hover .mandatory-badge': { bgcolor: 'transparent' },
              '&:hover .column-delete-btn': {
                opacity: column.mandatory ? 0 : 1,
                pointerEvents: column.mandatory ? 'none' : 'auto',
                bgcolor: 'contentBG.Hover',
              },
              '&:hover .column-delete-btn .delete-icon-outline': { display: 'none' },
              '&:hover .column-delete-btn .delete-icon-filled': { display: 'block' },
            }}
          >
            <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} noWrap flex={1} minWidth={0}>
              {column.headerName}
            </Typography>
            {column.mandatory ? (
              <Box className="column-mandatory-label" lineHeight={0} flexShrink={0}>
                <ScenarioDesignMandatoryBadge />
              </Box>
            ) : (
              <ScenarioDesignDeleteButton
                className="column-delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleHideColumn(column.field)
                }}
              />
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  )

  const renderScenarioRow = (row: ScenarioDesignBranchRow, isLastRow: boolean) => {
    const isEditing = editingScenarioId === row.id
    const isDeleteDisabled = !canDeleteScenario
    const hasDuplicateError = isEditing && scenarioNameError

    return (
      <Stack
        key={row.id}
        direction="row"
        alignItems="center"
        gap="4px"
        px="8px"
        sx={[TABLE_ROW_SX, ...(isLastRow ? [{ borderBottom: 'none' }] : [])]}
      >
        <Box width="30px" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
          <ScenarioDesignDeleteButton disabled={isDeleteDisabled} onClick={() => setDeleteTargetId(row.id)} />
        </Box>
        <Box position="relative" flex={1} minWidth={0}>
          <Box
            height={CELL_HEIGHT}
            border="1px solid"
            borderColor={hasDuplicateError ? 'contentText.Error' : isEditing ? 'contentBorder.Active' : 'contentBorder.Normal'}
            borderRadius="8px"
            px="12px"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="8px"
            bgcolor="commonColor.White"
            onClick={!isEditing && !isInteractionDisabled ? () => handleStartEditScenarioName(row) : undefined}
            sx={
              !isEditing && !isInteractionDisabled
                ? {
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'contentBG.Hover', borderColor: 'contentBorder.Hover' },
                }
                : undefined
            }
          >
            {isEditing ? (
              <>
                <Box flex={1} minWidth={0} display="flex" alignItems="center">
                  <Box
                    component="input"
                    ref={scenarioNameInputRef}
                    value={editingScenarioName}
                    onChange={(event) => handleScenarioNameChange(event.target.value)}
                    onBlur={handleCommitScenarioName}
                    onFocus={(event) => {
                      const input = event.target as HTMLInputElement
                      requestAnimationFrame(() => {
                        input.scrollLeft = 0
                      })
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleCommitScenarioName()
                      }
                      if (event.key === 'Escape') {
                        handleCancelScenarioNameEdit()
                      }
                    }}
                    autoFocus
                    sx={SCENARIO_NAME_INPUT_SX}
                  />
                </Box>
                {hasDuplicateError ? (
                  <Tooltip
                    open
                    disableHoverListener
                    disableFocusListener
                    disableTouchListener
                    title={SCENARIO_DESIGN_DUPLICATE_NAME_ERROR}
                    placement="top-start"
                    slotProps={SCENARIO_DESIGN_DUPLICATE_ERROR_TOOLTIP_SLOT_PROPS}
                  >
                    <Box display="flex" alignItems="center" flexShrink={0} lineHeight={0}>
                      <MIInputErrorIcon width={20} height={20} />
                    </Box>
                  </Tooltip>
                ) : null}
              </>
            ) : (
              <>
                <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} noWrap flex={1} minWidth={0} textAlign="left">
                  {row.scenarioName}
                </Typography>
                {row.baseCase ? <NextGenMIBaseCaseChip /> : null}
              </>
            )}
          </Box>
        </Box>
      </Stack>
    )
  }

  const renderCriteriaRow = (row: ScenarioDesignBranchRow, isLastRow: boolean) => (
    <Stack
      key={row.id}
      direction="row"
      alignItems="center"
      gap={COLUMN_GAP}
      sx={[CRITERIA_ROW_SX, TABLE_ROW_SX, ...(isLastRow ? [{ borderBottom: 'none' }] : [])]}
    >
      {visibleColumns.map((column) => (
        <Box key={column.field} sx={CRITERIA_COLUMN_SLOT_SX}>
          <ScenarioDesignCriteriaDropdown
            field={column.field}
            value={getRowFieldValue(row, column.field)}
            mode={getRowFieldMode(row, column.field)}
            initialValue={initialRowValues[row.id]?.[column.field] ?? ''}
            disabled={isInteractionDisabled}
            placeholder={column.field === 'branchCriteria' ? '분기기준값' : '선택'}
            onChange={(change) => handleCriteriaChange(row.id, column.field, change)}
          />
        </Box>
      ))}
    </Stack>
  )

  return (
    <Stack gap="4px" width="100%">
      <Box position="relative">
        {isApplyingChanges ? <ScenarioDesignApplyingChangesOverlay /> : null}
        <Typography fontSize={18} fontWeight={600} color="contentText.Black" px="8px" py="4px" lineHeight={1.4}>
          분기 항목 및 분기 기준 검토
        </Typography>
        <Box
          border="1px solid"
          borderColor="contentBorder.Normal"
          borderRadius="10px"
          overflow="hidden"
          bgcolor="commonColor.White"
          position="relative"
          onMouseEnter={() => setIsScrollAreaHovered(true)}
          onMouseLeave={() => setIsScrollAreaHovered(false)}
        >
          <Stack sx={{ opacity: isApplyingChanges ? 0.2 : 1, pointerEvents: isApplyingChanges ? 'none' : 'auto' }}>
            <Box position="relative">
              <Stack direction="row" alignItems="stretch">
                <Box
                  width={SCENARIO_COLUMN_WIDTH}
                  flexShrink={0}
                  borderRight="1px solid"
                  borderColor="contentBorder.Normal"
                  bgcolor="commonColor.White"
                  sx={LEFT_COLUMN_SHADOW_SX}
                >
                  {renderScenarioColumnHeader()}
                  {rows.map((row, rowIndex) => renderScenarioRow(row, rowIndex === rows.length - 1))}
                </Box>

                <Box flex={1} minWidth={0} position="relative" sx={{ overflow: 'hidden' }}>
                  <Box
                    ref={horizontalScrollRef}
                    onScroll={updateScrollState}
                    sx={{
                      width: `calc(100% - ${FADER_WIDTH})`,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      '&::-webkit-scrollbar': { display: 'none' },
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: scrollableColumnsMinWidth(visibleColumns.length),
                        boxSizing: 'border-box',
                      }}
                    >
                      {renderCriteriaColumnHeader()}
                      {rows.map((row, rowIndex) => renderCriteriaRow(row, rowIndex === rows.length - 1))}
                    </Box>
                  </Box>

                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: FADER_WIDTH,
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 3,
                      background: 'linear-gradient(to left, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
                      opacity: scrollState.right ? 1 : 0,
                      transition: 'opacity 180ms ease',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: FADER_WIDTH,
                      zIndex: 4,
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '10px 0',
                      pointerEvents: 'none',
                    }}
                  >
                    <Box
                      component="button"
                      type="button"
                      ref={addCriteriaButtonRef}
                      onClick={() => setBranchItemsPopupOpen((prev) => !prev)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: FADER_WIDTH,
                        width: FADER_WIDTH,
                        height: FADER_WIDTH,
                        padding: 0,
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: branchItemsPopupOpen ? 'contentBorder.Active' : 'transparent',
                        bgcolor: branchItemsPopupOpen ? 'contentBG.Active' : 'commonColor.White',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        lineHeight: 0,
                        '&:hover': { bgcolor: branchItemsPopupOpen ? 'contentBG.Active' : 'contentBG.Hover' },
                      }}
                    >
                      <AddRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled' }} />
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Box>

            {scrollState.horizontal ? (
              <Box
                aria-hidden
                position="relative"
                height={HORIZONTAL_SCROLLBAR_HEIGHT}
                paddingLeft={SCENARIO_COLUMN_WIDTH}
                paddingRight={FADER_WIDTH}
                flexShrink={0}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: SCENARIO_COLUMN_WIDTH,
                    right: FADER_WIDTH,
                    bottom: '4px',
                    height: '10px',
                    borderRadius: '10px',
                    bgcolor: 'transparent',
                    opacity: showScrollbars ? 1 : 0,
                    pointerEvents: showScrollbars ? 'auto' : 'none',
                    transition: 'opacity 120ms ease',
                  }}
                >
                  <Box
                    onPointerDown={handleHorizontalScrollbarPointerDown}
                    sx={{
                      position: 'absolute',
                      top: '2px',
                      bottom: '2px',
                      left: `${horizontalThumbLeft}%`,
                      width: `${horizontalThumbWidth}%`,
                      borderRadius: '10px',
                      bgcolor: horizontalDragActive ? '#868E96' : '#ADB5BD',
                      cursor: horizontalDragActive ? 'grabbing' : 'grab',
                      '&:hover': { bgcolor: '#868E96' },
                    }}
                  />
                </Box>
              </Box>
            ) : null}

            <Tooltip title={addScenarioTooltip} arrow>
              <Box
                height="30px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderTop="1px solid"
                borderColor="contentBorder.Normal"
                onClick={isInteractionDisabled || isMaxScenarioReached ? undefined : handleAddScenario}
                sx={{
                  cursor: isInteractionDisabled || isMaxScenarioReached ? 'default' : 'pointer',
                  opacity: isApplyingChanges || isMaxScenarioReached ? 0.2 : 1,
                  pointerEvents: isInteractionDisabled ? 'none' : 'auto',
                  '&:hover': isInteractionDisabled || isMaxScenarioReached ? undefined : { bgcolor: 'gray.5' },
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled' }} />
              </Box>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" py="12px">
        <MIBaseButton
          variant="outlined"
          prefix={<ReplayRoundedIcon sx={{ fontSize: 20 }} />}
          gap="4px"
          disabled={isInteractionDisabled}
          onClick={() => setResetConfirmOpen(true)}
          sx={{ height: '32px', padding: '6px 10px 6px 6px', borderRadius: '8px' }}
        >
          전체 초기화
        </MIBaseButton>
        <Stack direction="row" alignItems="center" gap="8px">
          <MIBaseButton
            variant="outlined"
            disabled={isInteractionDisabled}
            sx={{ height: '32px', padding: '6px 10px', borderRadius: '8px' }}
          >
            취소
          </MIBaseButton>
          <MIBaseButton
            variant="contained"
            disabled={isInteractionDisabled}
            onClick={() => setReviewConfirmOpen(true)}
            sx={{ height: '32px', padding: '6px 10px', borderRadius: '8px', bgcolor: 'common.primary' }}
          >
            변경사항 검토
          </MIBaseButton>
          <Tooltip title={!reviewCompleted && !isInteractionDisabled ? '변경사항 검토 후 완료할 수 있습니다.' : ''} arrow>
            <span>
              <MIBaseButton
                variant="contained"
                suffix={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 20, transform: 'rotate(-90deg)' }} />}
                gap="4px"
                disabled={!reviewCompleted || isInteractionDisabled}
                onClick={onReviewCompleteClick}
                sx={{
                  height: '32px',
                  padding: '6px 10px 6px 10px',
                  borderRadius: '8px',
                  bgcolor: reviewCompleted ? 'common.primary' : '#C3CAEE',
                  color: 'commonColor.White',
                  '&.Mui-disabled': {
                    bgcolor: '#C3CAEE',
                    color: 'commonColor.White',
                  },
                }}
              >
                검토 완료
              </MIBaseButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
      <ScenarioDesignAddBranchItemsPopup
        open={branchItemsPopupOpen}
        anchorEl={addCriteriaButtonRef.current}
        items={unselectedBranchItems}
        onClose={() => setBranchItemsPopupOpen(false)}
        onAdd={handleAddBranchItems}
      />
      <MIConfirm
        open={Boolean(deleteTargetId)}
        title="시나리오를 삭제하시겠습니까?"
        width={450}
        handleClose={() => setDeleteTargetId(null)}
        actions={[
          { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setDeleteTargetId(null) },
          { label: '삭제', variant: 'filled', color: 'primary', onClick: handleDeleteScenario },
        ]}
      />
      <MIConfirm
        open={reviewConfirmOpen}
        title="변경사항을 검토하시겠습니까?"
        width={450}
        handleClose={() => setReviewConfirmOpen(false)}
        actions={[
          { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setReviewConfirmOpen(false) },
          { label: '검토', variant: 'filled', color: 'primary', onClick: handleConfirmReview },
        ]}
      />
      <MIConfirm
        open={resetConfirmOpen}
        title="모든 수정 항목을 기본값으로 초기화하시겠습니까?"
        width={450}
        handleClose={() => setResetConfirmOpen(false)}
        actions={[
          { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setResetConfirmOpen(false) },
          { label: '초기화', variant: 'filled', color: 'red', onClick: handleConfirmReset },
        ]}
      />
    </Stack>
  )
}

export default ScenarioDesignBranchingTable
