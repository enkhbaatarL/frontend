import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Box, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { DesignScenarioRow } from '@/service/mi/nextGenMI/scenarioDesign'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import LoadingIcon from '@/components/common/icons/LoadingIcon'
import MIInputErrorIcon from '@/components/common/input/MIInputErrorIcon'
import MIMenu from '@/components/common/menu/MIMenu'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import MISpinner from '@/components/common/spinner/MISpinner'
import MIFollowCursorTooltip from '@/components/common/table/MIFollowCursorTooltip'
import useSnackbar from '@/hooks/useSnackbar'
import NextGenMIInlineEditableInput from '@/pages/mi/nextGenMI/components/common/NextGenMIInlineEditableInput'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import ScenarioDesignBaseEventSection, {
  type ScenarioDesignBaseEventSectionProps,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignBaseEventSection'
import { ScenarioDesignConfirmDialog } from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignDialogs'
import {
  getInitialScenarioDesignColumnValue,
  getScenarioDesignColumnItems,
  getScenarioDesignDimensionSelectedValue,
  getScenarioDesignRowId,
  isScenarioDesignRequiredColumn,
  scenarioDesignAgentItem,
  SCENARIO_DESIGN_MAX_ROW_COUNT,
  SCENARIO_DESIGN_SECTIONS,
  SCENARIO_DESIGN_SELECT_COMMON_ACTIONS,
  type ScenarioDesignColumn,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignModel'
import { createScenarioDesignBackendReviewItems } from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignReview'
import ScenarioDesignStatusBadge from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignStatusBadge'

type ScenarioDesignReviewButtonStatus = 'loading' | 'completed' | null
type ScenarioDesignCriteriaConfirmType = 'reset' | 'deleteRow' | 'deleteCriteriaColumn'

export type ScenarioDesignReviewIssueSeverity = 'error' | 'warning'

export type ScenarioDesignReviewErrorItem = {
  label: string
  message: string
  severity?: ScenarioDesignReviewIssueSeverity
  actionLabel?: string
}

const getScenarioDesignCriteriaConfirmContent = (type: ScenarioDesignCriteriaConfirmType) => {
  if (type === 'reset') {
    return {
      title: '모든 수정 항목을 기본값으로 초기화하시겠습니까?',
      confirmLabel: '초기화',
      confirmBgColor: 'contentIcon.Error',
    }
  }

  if (type === 'deleteRow') {
    return {
      title: '시나리오를 삭제하시겠습니까?',
      confirmLabel: '삭제',
      confirmBgColor: 'contentIcon.Error',
    }
  }

  return {
    title: '분기항목을 삭제하시겠습니까?',
    confirmLabel: '삭제',
    confirmBgColor: 'contentIcon.Error',
  }
}

const ScenarioDesignCriteriaHeaderLabel = ({ label }: { label: string }) => {
  const ref = useRef<HTMLElement | null>(null)
  const [isEllipsis, setIsEllipsis] = useState(false)

  const updateIsEllipsis = useCallback(() => {
    const element = ref.current
    if (!element) return
    setIsEllipsis(element.scrollWidth > element.clientWidth + 1)
  }, [])

  useLayoutEffect(() => {
    updateIsEllipsis()

    const element = ref.current
    if (!element) return undefined

    let disposed = false
    const resizeObserver = new ResizeObserver(() => {
      if (!disposed) updateIsEllipsis()
    })

    resizeObserver.observe(element)
    document.fonts?.ready.then(() => {
      if (!disposed) updateIsEllipsis()
    })

    return () => {
      disposed = true
      resizeObserver.disconnect()
    }
  }, [label, updateIsEllipsis])

  const labelNode = (
    <Box
      ref={ref}
      component="span"
      sx={{
        display: 'block',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        typography: 'body2M14',
        color: 'contentText.Normal',
      }}
    >
      {label}
    </Box>
  )

  if (!isEllipsis) return labelNode

  return <MIFollowCursorTooltip title={label}>{labelNode}</MIFollowCursorTooltip>
}

const ScenarioDesignCriteriaHeader = ({
  label,
  required,
  disabled = false,
  onDelete,
}: {
  label: string
  required: boolean
  disabled?: boolean
  onDelete?: () => void
}) => (
  <Box
    component="span"
    sx={{
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      width: '100%',
      maxWidth: '100%',
      height: '36px',
      minWidth: 0,
      padding: '8px 8px 8px 12px',
      borderRadius: '8px',
      boxSizing: 'border-box',
      overflow: 'visible',
      '&:hover, &:focus-within': {
        backgroundColor: 'contentBG.Hover',
      },
      '& [data-scenario-design-header-action="true"]': {
        opacity: 0,
        pointerEvents: 'none',
      },
      '&:hover [data-scenario-design-header-action="true"], &:focus-within [data-scenario-design-header-action="true"]': {
        opacity: 1,
        pointerEvents: 'auto',
      },
      '& [data-scenario-design-header-label="true"]': {
        flex: '1 1 auto',
        maxWidth: '100%',
      },
      '& [data-scenario-design-header-action-container="true"]': {
        width: '0px',
        marginLeft: '0px',
        overflow: 'visible',
      },
      '&:hover [data-scenario-design-header-action-container="true"], &:focus-within [data-scenario-design-header-action-container="true"]':
        {
          width: required ? '42px' : disabled ? '0px' : '28px',
          marginLeft: required || !disabled ? '8px' : '0px',
        },
    }}
  >
    <Box
      component="span"
      data-scenario-design-header-label="true"
      sx={{
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <ScenarioDesignCriteriaHeaderLabel label={label} />
    </Box>
    <Stack
      component="span"
      data-scenario-design-header-action-container="true"
      minWidth={0}
      flexShrink={0}
      alignItems="center"
      justifyContent="center"
    >
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
      ) : disabled ? null : (
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
  </Box>
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
  showAgentAction,
  disabled = false,
  onSelected,
  onReset,
}: {
  selected: string
  defaultValue: string
  showAgentAction: boolean
  disabled?: boolean
  onSelected: (value: string) => void
  onReset: () => void
}) => {
  const resetDisabled = disabled || selected === defaultValue

  return (
    <Stack gap="6px" padding="8px 12px">
      {showAgentAction && (
        <>
          <Divider />
          <ScenarioDesignSelectFooterAction
            icon={
              <AutoAwesomeRoundedIcon
                sx={{
                  fontSize: '18px',
                  color: disabled
                    ? 'contentIcon.Disabled'
                    : selected === scenarioDesignAgentItem.value
                      ? 'mari.Primary'
                      : 'contentIcon.Enabled',
                }}
              />
            }
            label={String(scenarioDesignAgentItem.label)}
            selected={selected === scenarioDesignAgentItem.value}
            disabled={disabled}
            onClick={() => onSelected(scenarioDesignAgentItem.value)}
          />
        </>
      )}

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
  showAgentAction,
  disabled = false,
  onSelected,
}: {
  selected: string
  items: SelectMenuItem<string>[]
  defaultValue: string
  showAgentAction: boolean
  disabled?: boolean
  onSelected: (value: string) => void
}) => {
  const selectedColumnItem = items.find((item) => item.value === selected)
  const [open, setOpen] = useState(false)
  const isEmptySelected = selected === ''
  const isAgentSelected = selected === scenarioDesignAgentItem.value
  const customValue = !selectedColumnItem && !isAgentSelected && !isEmptySelected ? selected : ''
  const selectedItem = selectedColumnItem ?? (isAgentSelected ? scenarioDesignAgentItem : undefined)
  const isInlineBadgeValue = isAgentSelected
  const inlineBadgeLabel = selectedItem?.label

  const handleSelected = (value: string) => {
    if (disabled) {
      setOpen(false)
      return
    }

    onSelected(value)
    setOpen(false)
  }

  const handleReset = () => {
    if (disabled) {
      setOpen(false)
      return
    }

    onSelected(defaultValue)
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(!disabled && nextOpen)
  }

  return (
    <MISelectMenu<string>
      selected={selected}
      onSelected={handleSelected}
      items={items}
      variant="outlined"
      selectionIconPosition="left"
      closeOnScroll
      enableHoverBackground
      maxHeight="260px"
      open={open}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      labelPrefix={isInlineBadgeValue ? null : undefined}
      textLabel={
        isInlineBadgeValue ? (
          <Stack
            component="span"
            data-scenario-design-inline-value
            direction="row"
            alignItems="center"
            gap="2px"
            width="100%"
            flex={1}
            minWidth={0}
            maxWidth="100%"
            padding="4px"
            bgcolor="contentBG.PrimaryFade"
            borderRadius="8px"
            boxSizing="border-box"
          >
            {selectedItem?.icon}
            <Typography
              component="span"
              variant="body2M14"
              color="contentText.Normal"
              flex={1}
              minWidth={0}
              overflow="hidden"
              textOverflow="ellipsis"
              textAlign="left"
              noWrap
              sx={{
                display: 'block',
              }}
            >
              {inlineBadgeLabel}
            </Typography>
          </Stack>
        ) : customValue ? (
          <Typography variant="body2M14" color="contentText.Normal" minWidth={0} overflow="hidden" textOverflow="ellipsis" noWrap>
            {customValue}
          </Typography>
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
          showAgentAction={showAgentAction}
          disabled={disabled}
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
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '20px',
        lineHeight: 0,
      },
      '& svg': {
        display: 'block',
      },
    }}
  >
    <DeleteRoundedIcon sx={{ fontSize: '20px', color: 'inherit' }} />
  </MIBaseButton>
)

const ScenarioDesignReviewStatusPrefix = ({ status }: { status: ScenarioDesignReviewButtonStatus }) => {
  const visible = status !== null

  return (
    <Stack
      component="span"
      width={visible ? '20px' : '0px'}
      height="20px"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      flexShrink={0}
      sx={{
        opacity: visible ? 1 : 0,
        transition: 'width 180ms ease, opacity 120ms ease',
      }}
    >
      {status === 'loading' && (
        <MISpinner
          size={20}
          speed={0.55}
          sx={(theme) => ({
            '& svg path': {
              fill: `${theme.palette.contentIcon.Disabled} !important`,
            },
          })}
        >
          <LoadingIcon style={{ width: 20, height: 20 }} />
        </MISpinner>
      )}
      {status === 'completed' && <CheckRoundedIcon sx={{ fontSize: '20px', color: 'point.green1' }} />}
    </Stack>
  )
}

const getScenarioDesignReviewIssueStyle = (severity: ScenarioDesignReviewIssueSeverity) => {
  if (severity === 'warning') {
    return {
      icon: <WarningAmberRoundedIcon sx={{ fontSize: '16px', color: '#ea580c' }} />,
      bgcolor: '#fff7ed',
      borderColor: '#f97316',
      hoverBgcolor: '#ffedd5',
      textColor: '#ea580c',
      actionColor: '#9a3412',
    }
  }

  return {
    icon: <MIInputErrorIcon width="16px" height="16px" aria-hidden />,
    bgcolor: '#fff9f9',
    borderColor: 'contentBorder.Error',
    hoverBgcolor: '#fff9f9',
    textColor: 'contentText.Error',
    actionColor: '#b42318',
  }
}

const ScenarioDesignReviewIssueRow = ({ issue }: { issue: ScenarioDesignReviewErrorItem }) => {
  const severity = issue.severity ?? 'error'
  const issueStyle = getScenarioDesignReviewIssueStyle(severity)

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="8px"
      width="100%"
      minHeight="34px"
      padding="8px"
      border="1px solid"
      borderColor={issueStyle.borderColor}
      borderRadius="8px"
      bgcolor={issueStyle.bgcolor}
      boxSizing="border-box"
      sx={{
        '&:hover': {
          bgcolor: issueStyle.hoverBgcolor,
        },
      }}
    >
      <Stack direction="row" alignItems="center" gap="4px" flexShrink={0} minWidth={0}>
        {issueStyle.icon}
        <Typography variant="body3SB12" color={issueStyle.textColor} lineHeight={1.4} noWrap>
          {issue.label}
        </Typography>
      </Stack>
      <Divider orientation="vertical" flexItem sx={{ borderColor: issueStyle.borderColor }} />
      <Typography variant="body3R12" color={issueStyle.textColor} lineHeight={1.4} flex={1} minWidth={0} sx={{ whiteSpace: 'pre-line' }}>
        {issue.message}
      </Typography>
      <Typography variant="body3R12" color={issueStyle.actionColor} lineHeight={1.4} textAlign="right" flexShrink={0} noWrap>
        {issue.actionLabel ?? (severity === 'warning' ? '확인 후 수정 권장' : '수정 필요')}
      </Typography>
    </Stack>
  )
}

const ScenarioDesignReviewErrorPanel = ({ errors }: { errors: ScenarioDesignReviewErrorItem[] }) => {
  const displayErrors = useMemo(
    () =>
      errors.flatMap((error) =>
        error.label === '검토 결과' && /(?:^|\\n|\r?\n)\s*(?:[•*-]\s*)?\[(주의|경고|warn|warning|오류|에러|error)\]/i.test(error.message)
          ? createScenarioDesignBackendReviewItems(error.message)
          : [error],
      ),
    [errors],
  )
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [visibleErrors, setVisibleErrors] = useState(displayErrors)
  const [height, setHeight] = useState('0px')
  const open = displayErrors.length > 0

  useLayoutEffect(() => {
    if (open) setVisibleErrors(displayErrors)
  }, [displayErrors, open])

  useEffect(() => {
    const frame = globalThis.requestAnimationFrame(() => {
      setHeight(open && contentRef.current ? `${contentRef.current.scrollHeight}px` : '0px')
    })

    return () => globalThis.cancelAnimationFrame(frame)
  }, [open, visibleErrors])

  useEffect(() => {
    const element = contentRef.current
    if (!open || !element) return undefined

    let frame: number | null = null
    const observer = new ResizeObserver(() => {
      if (frame !== null) globalThis.cancelAnimationFrame(frame)
      frame = globalThis.requestAnimationFrame(() => {
        setHeight(`${element.scrollHeight}px`)
      })
    })

    observer.observe(element)

    return () => {
      if (frame !== null) globalThis.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [open, visibleErrors])

  return (
    <Box
      aria-hidden={!open}
      height={height}
      overflow="hidden"
      sx={{
        transition: 'height 220ms ease',
      }}
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget || open) return
        setVisibleErrors([])
      }}
    >
      {visibleErrors.length > 0 && (
        <Stack ref={contentRef} gap="4px" padding="12px 0px" boxSizing="border-box">
          <Stack direction="row" alignItems="center" gap="4px" padding="4px" borderRadius="8px">
            <Typography variant="body3SB12" color="contentText.Normal" lineHeight={1.4} noWrap>
              변경사항 검토 결과를 확인해 주세요
            </Typography>
          </Stack>
          {visibleErrors.map((error) => (
            <ScenarioDesignReviewIssueRow key={`${error.severity ?? 'error'}-${error.label}-${error.message}`} issue={error} />
          ))}
        </Stack>
      )}
    </Box>
  )
}

const ScenarioDesignCriteriaLoadingOverlay = ({ visible, message }: { visible: boolean; message: string }) => (
  <Stack
    position="absolute"
    top={0}
    right={0}
    bottom={0}
    left={0}
    gap="10px"
    alignItems="center"
    justifyContent="center"
    zIndex={8}
    aria-live="polite"
    sx={{
      backgroundColor: 'rgba(255, 255, 255, 0.72)',
      opacity: visible ? 1 : 0,
      visibility: visible ? 'visible' : 'hidden',
      transition: 'opacity 160ms ease, visibility 160ms ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}
  >
    <MIAgentSpinner size={40} tone="gray" />
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} noWrap>
      {message}
    </Typography>
  </Stack>
)

type ScenarioDesignCriteriaTableProps = {
  rows: DesignScenarioRow[]
  initialRows: DesignScenarioRow[]
  initialScenarioDesignColumns: ScenarioDesignColumn[]
  visibleScenarioDesignColumns: ScenarioDesignColumn[]
  hiddenScenarioDesignColumns: ScenarioDesignColumn[]
  agentScenarioDesignColumnKeys: Set<string>
  onRowValueChange: (rowId: number, key: string, value: string) => void
  onDeleteRow: (rowId: number) => void
  onDeleteCriteriaColumn: (key: string) => void
  onAddCriteriaColumns: (columns: ScenarioDesignColumn[]) => void
  onAddRow: () => void
}

type ScenarioDesignCriteriaReviewProps = {
  reviewed: boolean
  pending: boolean
  completedVisible: boolean
  canComplete: boolean
  errorItems: ScenarioDesignReviewErrorItem[]
  onConfirm: () => void
  onComplete: () => void
}

type ScenarioDesignCriteriaStepProps = {
  criteria: ScenarioDesignCriteriaTableProps
  baseEvent: Omit<ScenarioDesignBaseEventSectionProps, 'loading'>
  rationale: {
    visible: boolean
    text: string
  }
  isLoading: boolean
  review: ScenarioDesignCriteriaReviewProps
  actions: {
    onCancel: () => void
    onReset: () => void
    resetDisabled: boolean
  }
}

const ScenarioDesignCriteriaStep = ({ criteria, baseEvent, rationale, isLoading, review, actions }: ScenarioDesignCriteriaStepProps) => {
  const { showSnackbar } = useSnackbar()
  const {
    rows,
    initialRows,
    initialScenarioDesignColumns,
    visibleScenarioDesignColumns,
    hiddenScenarioDesignColumns,
    agentScenarioDesignColumnKeys,
    onRowValueChange,
    onDeleteRow,
    onDeleteCriteriaColumn,
    onAddCriteriaColumns,
    onAddRow,
  } = criteria
  const { visible: showDesignRationale, text: designRationale } = rationale
  const {
    reviewed,
    pending: reviewPending,
    completedVisible: reviewCompletedVisible,
    canComplete: canCompleteScenarioDesignReview,
    errorItems: reviewErrorItems,
    onConfirm: onReviewConfirm,
    onComplete,
  } = review
  const { resetDisabled, onReset, onCancel } = actions
  const [addCriteriaMenuOpen, setAddCriteriaMenuOpen] = useState(false)
  const [selectedAddCriteriaColumnKeys, setSelectedAddCriteriaColumnKeys] = useState<string[]>([])
  const [reviewConfirmOpen, setReviewConfirmOpen] = useState(false)
  const [criteriaConfirmType, setCriteriaConfirmType] = useState<ScenarioDesignCriteriaConfirmType | null>(null)
  const [deleteRowId, setDeleteRowId] = useState<number | null>(null)
  const [deleteCriteriaColumnKey, setDeleteCriteriaColumnKey] = useState<string | null>(null)
  const criteriaEditingDisabled = isLoading || reviewPending
  const reviewButtonDisabled = criteriaEditingDisabled || reviewCompletedVisible || (reviewed && canCompleteScenarioDesignReview)
  const reviewButtonStatusColor = reviewCompletedVisible ? 'point.green1' : 'contentText.Disabled'
  const reviewButtonStatus: ScenarioDesignReviewButtonStatus = reviewPending ? 'loading' : reviewCompletedVisible ? 'completed' : null
  const criteriaConfirmContent = criteriaConfirmType ? getScenarioDesignCriteriaConfirmContent(criteriaConfirmType) : null
  const initialScenarioDesignColumnKeys = useMemo(
    () => new Set(initialScenarioDesignColumns.map((column) => column.key)),
    [initialScenarioDesignColumns],
  )
  const tableScenarioDesignColumns = useMemo(() => {
    if (!isLoading || visibleScenarioDesignColumns.length > 0) return visibleScenarioDesignColumns

    return Array.from({ length: 5 }, (_, index) => ({
      key: `loadingCriteriaColumn${index}`,
      label: '',
      width: '200px',
    }))
  }, [isLoading, visibleScenarioDesignColumns])

  useEffect(() => {
    if (!criteriaEditingDisabled) return

    setAddCriteriaMenuOpen(false)
    setSelectedAddCriteriaColumnKeys([])
    setCriteriaConfirmType(null)
    setDeleteRowId(null)
    setDeleteCriteriaColumnKey(null)
  }, [criteriaEditingDisabled])

  const handleAddCriteriaMenuClose = () => {
    setAddCriteriaMenuOpen(false)
    setSelectedAddCriteriaColumnKeys([])
  }

  const handleAddCriteriaMenuOpenChange = (open: boolean) => {
    if (!open) {
      handleAddCriteriaMenuClose()
      return
    }

    if (criteriaEditingDisabled) {
      handleAddCriteriaMenuClose()
      return
    }

    if (hiddenScenarioDesignColumns.length === 0) {
      showSnackbar('추가 가능한 분기 기준이 없습니다.', { variant: 'info' })
      return
    }

    setSelectedAddCriteriaColumnKeys([])
    setAddCriteriaMenuOpen(true)
  }

  const handleToggleAddCriteriaColumn = (key: string) => {
    if (criteriaEditingDisabled) return

    setSelectedAddCriteriaColumnKeys((currentKeys) =>
      currentKeys.includes(key) ? currentKeys.filter((currentKey) => currentKey !== key) : [...currentKeys, key],
    )
  }

  const handleAddSelectedCriteria = () => {
    if (criteriaEditingDisabled) return

    const selectedColumns = hiddenScenarioDesignColumns.filter((column) => selectedAddCriteriaColumnKeys.includes(column.key))
    if (selectedColumns.length === 0) return

    onAddCriteriaColumns(selectedColumns)
    handleAddCriteriaMenuClose()
  }

  const handleResetRequest = () => {
    if (criteriaEditingDisabled) return

    setCriteriaConfirmType('reset')
  }

  const handleDeleteRowRequest = useCallback(
    (rowId: number) => {
      if (criteriaEditingDisabled) return

      setDeleteCriteriaColumnKey(null)
      setDeleteRowId(rowId)
      setCriteriaConfirmType('deleteRow')
    },
    [criteriaEditingDisabled],
  )

  const handleDeleteCriteriaColumnRequest = useCallback(
    (key: string) => {
      if (criteriaEditingDisabled) return

      setDeleteRowId(null)
      setDeleteCriteriaColumnKey(key)
      setCriteriaConfirmType('deleteCriteriaColumn')
    },
    [criteriaEditingDisabled],
  )

  const handleCriteriaConfirmClose = () => {
    setCriteriaConfirmType(null)
    setDeleteRowId(null)
    setDeleteCriteriaColumnKey(null)
  }

  const handleCriteriaConfirm = () => {
    if (!criteriaConfirmType) return

    if (criteriaEditingDisabled) {
      handleCriteriaConfirmClose()
      return
    }

    if (criteriaConfirmType === 'reset') {
      handleAddCriteriaMenuClose()
      onReset()
      handleCriteriaConfirmClose()
      return
    }

    if (criteriaConfirmType === 'deleteRow') {
      if (deleteRowId !== null) {
        onDeleteRow(deleteRowId)
        showSnackbar('시나리오가 삭제되었습니다.', { variant: 'success' })
      }
      handleCriteriaConfirmClose()
      return
    }

    if (deleteCriteriaColumnKey !== null) {
      onDeleteCriteriaColumn(deleteCriteriaColumnKey)
    }
    handleCriteriaConfirmClose()
  }

  const columns = useMemo<NextGenMIStickyTableColumn<DesignScenarioRow>[]>(
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
        renderCell: ({ row, rowIndex }) => {
          const rowId = getScenarioDesignRowId(row, rowIndex + 1)
          const scenarioName = row.scenarioName ?? ''

          return (
            <Stack direction="row" alignItems="center" gap="8px" width="100%" minWidth={0}>
              <ScenarioDesignIconButton
                label={`${scenarioName || '시나리오'} 삭제`}
                disabled={criteriaEditingDisabled || rows.length <= 1}
                onClick={() => handleDeleteRowRequest(rowId)}
              />
              <NextGenMIInlineEditableInput
                value={scenarioName}
                placeholder="입력하세요"
                autoFocus
                showEditButton={false}
                editOnClick
                commitOnBlur
                commitOnEnter
                disabled={criteriaEditingDisabled}
                suffix={
                  row.baseCase ? (
                    <Stack component="span" direction="row" alignItems="center" gap="4px" flexShrink={0}>
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
                    </Stack>
                  ) : undefined
                }
                onCommit={(value) => {
                  if (value !== scenarioName) onRowValueChange(rowId, 'scenarioName', value)
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
          )
        },
      },
      ...tableScenarioDesignColumns.map((column): NextGenMIStickyTableColumn<DesignScenarioRow> => {
        const required = isScenarioDesignRequiredColumn(column)
        const loadingColumn = isLoading && column.label.length === 0

        return {
          field: column.key,
          headerName: loadingColumn ? (
            <Skeleton variant="rounded" width="80%" height="18px" />
          ) : (
            <ScenarioDesignCriteriaHeader
              label={column.label}
              required={required}
              disabled={criteriaEditingDisabled}
              onDelete={required || criteriaEditingDisabled ? undefined : () => handleDeleteCriteriaColumnRequest(column.key)}
            />
          ),
          width: column.width,
          minWidth: column.width,
          headerCellSx: {
            padding: '10px 8px',
          },
          headerContentSx: {
            overflow: 'visible',
            textOverflow: 'clip',
          },
          renderCell: ({ row, rowIndex }) => {
            const items = getScenarioDesignColumnItems(column)
            const rowId = getScenarioDesignRowId(row, rowIndex + 1)
            const selectedValue = getScenarioDesignDimensionSelectedValue(row, column.key)
            return (
              <ScenarioDesignSelectCell
                selected={selectedValue}
                items={items}
                defaultValue={
                  agentScenarioDesignColumnKeys.has(column.key) && selectedValue === SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value
                    ? SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value
                    : getInitialScenarioDesignColumnValue(initialRows, row, column)
                }
                showAgentAction={
                  !initialScenarioDesignColumnKeys.has(column.key) && selectedValue === SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value
                }
                disabled={criteriaEditingDisabled}
                onSelected={(value) => onRowValueChange(rowId, column.key, value)}
              />
            )
          },
        }
      }),
      {
        field: 'spacer',
        headerName: '',
        width: 'auto',
        minWidth: '44px',
        maxWidth: 'none',
        headerCellSx: {
          padding: '0px',
        },
        cellSx: {
          padding: '0px',
        },
        renderCell: () => null,
      },
    ],
    [
      handleDeleteCriteriaColumnRequest,
      handleDeleteRowRequest,
      agentScenarioDesignColumnKeys,
      criteriaEditingDisabled,
      initialScenarioDesignColumnKeys,
      initialRows,
      isLoading,
      onRowValueChange,
      rows.length,
      tableScenarioDesignColumns,
    ],
  )

  return (
    <>
      <Stack gap="38px" padding="24px 0px">
        <ScenarioDesignBaseEventSection {...baseEvent} loading={isLoading} />

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
          <Stack position="relative" width="100%" minWidth={0}>
            <Stack position="relative" width="100%" minWidth={0}>
              <NextGenMIStickyTable<DesignScenarioRow>
                columns={columns}
                rows={rows}
                getRowKey={(row, index) => getScenarioDesignRowId(row, index + 1)}
                fixedLeftColumnIndexes={[0]}
                rowHeight="56px"
                headerHeight="56px"
                cellPaddingX="8px"
                cellPaddingY="8px"
                headerFontSize="14px"
                bodyFontSize="14px"
                loading={isLoading}
                skeletonRowCount={6}
                noRowMessage="시나리오를 추가해 주세요."
                containerShell={false}
                rightScrollEdgeOffset="30px"
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
                <MIMenu
                  aria-label="분기 기준 추가"
                  label={<AddRoundedIcon sx={{ fontSize: '20px' }} />}
                  variant="outlined"
                  enableHoverBackground
                  disabled={criteriaEditingDisabled}
                  open={addCriteriaMenuOpen}
                  onOpenChange={handleAddCriteriaMenuOpenChange}
                  placement="bottom-end"
                  menuPositionOffset={{ top: 11 }}
                  closeOnScroll
                  paperProps={{
                    sx: {
                      width: '311px',
                      overflow: 'hidden',
                    },
                  }}
                  sx={{
                    width: '28px',
                    minWidth: '28px',
                    height: '28px',
                    padding: '0px',
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
                  <Stack gap="4px" padding="8px 6px">
                    {hiddenScenarioDesignColumns.map((column) => {
                      const selected = selectedAddCriteriaColumnKeys.includes(column.key)

                      return (
                        <MIBaseButton
                          key={column.key}
                          type="button"
                          variant="text"
                          prefix={
                            <CheckRoundedIcon
                              sx={{
                                fontSize: '20px',
                                color: 'mari.Primary',
                                opacity: selected ? 1 : 0,
                                flexShrink: 0,
                              }}
                            />
                          }
                          gap="8px"
                          disabled={criteriaEditingDisabled}
                          onClick={() => handleToggleAddCriteriaColumn(column.key)}
                          aria-pressed={selected}
                          labelColor={selected ? 'contentText.Black' : 'contentText.Normal'}
                          labelTextAlign="left"
                          sx={{
                            width: '100%',
                            height: '36px',
                            padding: '8px 12px 8px 6px',
                            borderRadius: '10px',
                            minWidth: 0,
                            justifyContent: 'flex-start',
                            backgroundColor: selected ? 'contentBG.PrimaryFade' : 'transparent',
                            '&:hover:not(:disabled)': {
                              backgroundColor: selected ? 'contentBG.PrimaryFade' : 'contentBG.Hover',
                            },
                            '&:focus-visible': {
                              outline: '1px solid',
                              outlineColor: 'contentBorder.Active',
                            },
                            '& > span, & > span > span': {
                              justifyContent: 'flex-start',
                            },
                            '& .MuiTypography-root': {
                              flex: 1,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.4,
                            },
                          }}
                        >
                          {column.label}
                        </MIBaseButton>
                      )
                    })}
                  </Stack>
                  <Stack direction="row" alignItems="flex-start" gap="4px" padding="6px 16px">
                    <InfoOutlinedIcon sx={{ fontSize: '16px', color: 'contentIcon.Enabled', flexShrink: 0 }} />
                    <Typography variant="body3M12" color="contentText.Subtext" lineHeight={1.4}>
                      Agent 생성된 분기항목 중 선택 가능합니다
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="8px" padding="12px">
                    <MIBaseButton variant="outlined" onClick={handleAddCriteriaMenuClose} sx={{ height: '32px', borderRadius: '8px' }}>
                      취소
                    </MIBaseButton>
                    <MIBaseButton
                      variant="contained"
                      disabled={criteriaEditingDisabled || selectedAddCriteriaColumnKeys.length === 0}
                      onClick={handleAddSelectedCriteria}
                      labelColor="contentText.White"
                      sx={{ height: '32px', borderRadius: '8px' }}
                    >
                      분기항목 추가
                    </MIBaseButton>
                  </Stack>
                </MIMenu>
              </Stack>
            </Stack>

            <MIFollowCursorTooltip
              title={
                isLoading
                  ? '시나리오 설계를 불러오는 중입니다.'
                  : reviewPending
                    ? '변경사항을 검토하는 중입니다.'
                    : rows.length >= SCENARIO_DESIGN_MAX_ROW_COUNT
                      ? '시나리오는 최대 15개까지 추가할 수 있습니다.'
                      : '시나리오를 추가합니다'
              }
            >
              <Stack width="100%" minWidth={0}>
                <MIBaseButton
                  variant="outlined"
                  enableHoverBackground
                  disabled={criteriaEditingDisabled || rows.length >= SCENARIO_DESIGN_MAX_ROW_COUNT}
                  onClick={onAddRow}
                  sx={{
                    width: '100%',
                    minWidth: 0,
                    height: '30px',
                    marginTop: '4px',
                    padding: '0px',
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
            </MIFollowCursorTooltip>
            <ScenarioDesignCriteriaLoadingOverlay
              visible={criteriaEditingDisabled}
              message={isLoading ? '시나리오 설계를 불러오는 중입니다.' : '변경사항을 검토하고 있습니다.'}
            />
          </Stack>
          <ScenarioDesignReviewErrorPanel errors={reviewErrorItems} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" minHeight="60px" padding="12px 0">
            <MIBaseButton
              variant="outlined"
              prefix={<ReplayRoundedIcon sx={{ fontSize: '20px' }} />}
              disabled={criteriaEditingDisabled || resetDisabled}
              onClick={handleResetRequest}
              gap="4px"
              sx={{ height: '36px', padding: '8px 10px 8px 6px', borderRadius: '8px' }}
            >
              전체 초기화
            </MIBaseButton>

            <Stack direction="row" alignItems="center" gap="8px">
              <MIBaseButton variant="outlined" onClick={onCancel} sx={{ height: '36px', borderRadius: '8px' }}>
                취소
              </MIBaseButton>
              <MIBaseButton
                variant="contained"
                prefix={<ScenarioDesignReviewStatusPrefix status={reviewButtonStatus} />}
                disabled={reviewButtonDisabled}
                onClick={() => setReviewConfirmOpen(true)}
                gap="4px"
                sx={{
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'contentIcon.ActivePrimary',
                  '&:hover:not(:disabled)': {
                    backgroundColor: 'contentIcon.ActivePrimary',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'contentBG.Disabled',
                    color: reviewButtonStatusColor,
                  },
                  '&.Mui-disabled .MuiTypography-root, &.Mui-disabled svg': {
                    color: reviewButtonStatusColor,
                  },
                }}
              >
                변경사항 검토
              </MIBaseButton>
              <MIBaseButton
                variant="contained"
                suffix={<ChevronRightRoundedIcon sx={{ fontSize: '20px' }} />}
                disabled={criteriaEditingDisabled || !reviewed || !canCompleteScenarioDesignReview}
                onClick={onComplete}
                labelColor="contentText.White"
                sx={{
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'mari.Primary',
                  '&:hover:not(:disabled)': {
                    backgroundColor: 'mari.Primary',
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
      <ScenarioDesignConfirmDialog
        open={reviewConfirmOpen}
        content={{
          title: '변경사항을 검토하시겠습니까?',
          confirmLabel: '검토',
          confirmBgColor: 'contentIcon.ActivePrimary',
        }}
        onClose={() => setReviewConfirmOpen(false)}
        onConfirm={() => {
          setReviewConfirmOpen(false)
          onReviewConfirm()
        }}
      />
      <ScenarioDesignConfirmDialog
        open={criteriaConfirmType !== null}
        content={criteriaConfirmContent}
        onClose={handleCriteriaConfirmClose}
        onConfirm={handleCriteriaConfirm}
      />
    </>
  )
}

export default ScenarioDesignCriteriaStep
