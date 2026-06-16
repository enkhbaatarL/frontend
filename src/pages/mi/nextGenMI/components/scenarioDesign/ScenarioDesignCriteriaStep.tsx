import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { Collapse, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { type ReactNode, type RefObject, useMemo, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import ArrowDown from '@/components/common/icons/ArrowDown'
import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import MIInputErrorIcon from '@/components/common/input/MIInputErrorIcon'
import MIMenu from '@/components/common/menu/MIMenu'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import MIFollowCursorTooltip from '@/components/common/table/MIFollowCursorTooltip'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMIInlineEditableInput from '@/pages/mi/nextGenMI/components/common/NextGenMIInlineEditableInput'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import {
  getInitialScenarioDesignColumnValue,
  getScenarioDesignColumnItems,
  isScenarioDesignRequiredColumn,
  scenarioDesignAgentItem,
  scenarioDesignManualItem,
  SCENARIO_DESIGN_BASE_EVENT_TABS,
  SCENARIO_DESIGN_MAX_ROW_COUNT,
  SCENARIO_DESIGN_SECTIONS,
  SCENARIO_DESIGN_SELECT_COMMON_ACTIONS,
  type ScenarioDesignBaseEventTabKey,
  type ScenarioDesignColumn,
  type ScenarioDesignColumnKey,
  type ScenarioDesignRow,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignModel'
import ScenarioDesignStatusBadge from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignStatusBadge'

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
      selectionIconPosition="left"
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

type ScenarioDesignCriteriaStepProps = {
  rows: ScenarioDesignRow[]
  visibleScenarioDesignColumns: ScenarioDesignColumn[]
  hiddenScenarioDesignColumns: ScenarioDesignColumn[]
  scenarioNameErrorMessages: Map<number, string>
  reviewed: boolean
  canCompleteScenarioDesignReview: boolean
  criteriaTableScrollRef: RefObject<HTMLDivElement | null>
  addCriteriaMenuOpen: boolean
  selectedAddCriteriaColumnKeys: ScenarioDesignColumnKey[]
  eventTitle: string
  isLoading: boolean
  isScenarioSuggested: boolean
  createdAtLabel: string
  eventTypeLabel: string
  baseEventExpanded: boolean
  selectedBaseEventTab: ScenarioDesignBaseEventTabKey
  baseEventDetailContent: ReactNode
  showDesignRationale: boolean
  designRationale: string
  onEventClick: () => void
  onBaseEventToggle: () => void
  onBaseEventTabChange: (tab: ScenarioDesignBaseEventTabKey) => void
  onRowValueChange: (rowId: number, key: keyof ScenarioDesignRow, value: string) => void
  onDeleteRowRequest: (rowId: number) => void
  onDeleteCriteriaColumn: (key: ScenarioDesignColumnKey) => void
  onAddCriteriaMenuOpenChange: (open: boolean) => void
  onToggleAddCriteriaColumn: (key: ScenarioDesignColumnKey) => void
  onAddCriteriaMenuClose: () => void
  onAddSelectedCriteria: () => void
  onAddRow: () => void
  onReset: () => void
  onCancel: () => void
  onReview: () => void
  onComplete: () => void
}

const ScenarioDesignCriteriaStep = ({
  rows,
  visibleScenarioDesignColumns,
  hiddenScenarioDesignColumns,
  scenarioNameErrorMessages,
  reviewed,
  canCompleteScenarioDesignReview,
  criteriaTableScrollRef,
  addCriteriaMenuOpen,
  selectedAddCriteriaColumnKeys,
  eventTitle,
  isLoading,
  isScenarioSuggested,
  createdAtLabel,
  eventTypeLabel,
  baseEventExpanded,
  selectedBaseEventTab,
  baseEventDetailContent,
  showDesignRationale,
  designRationale,
  onEventClick,
  onBaseEventToggle,
  onBaseEventTabChange,
  onRowValueChange,
  onDeleteRowRequest,
  onDeleteCriteriaColumn,
  onAddCriteriaMenuOpenChange,
  onToggleAddCriteriaColumn,
  onAddCriteriaMenuClose,
  onAddSelectedCriteria,
  onAddRow,
  onReset,
  onCancel,
  onReview,
  onComplete,
}: ScenarioDesignCriteriaStepProps) => {
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
        renderCell: ({ row }) => {
          const scenarioNameErrorMessage = reviewed ? scenarioNameErrorMessages.get(row.id) : undefined

          return (
            <Stack direction="row" alignItems="center" gap="8px" width="100%" minWidth={0}>
              <ScenarioDesignIconButton
                label={`${row.scenarioName || '시나리오'} 삭제`}
                disabled={rows.length <= 1}
                onClick={() => onDeleteRowRequest(row.id)}
              />
              <NextGenMIInlineEditableInput
                value={row.scenarioName}
                autoFocus
                showEditButton={false}
                editOnClick
                commitOnBlur
                commitOnEnter
                suffix={
                  row.recommended || scenarioNameErrorMessage ? (
                    <Stack component="span" direction="row" alignItems="center" gap="4px" flexShrink={0}>
                      {row.recommended && (
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
                      )}
                      {scenarioNameErrorMessage && (
                        <MIFollowCursorTooltip
                          title={scenarioNameErrorMessage}
                          tooltipSx={{
                            bgcolor: 'contentText.Error',
                            color: 'contentText.White',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 400,
                          }}
                        >
                          <MIInputErrorIcon width="20px" height="20px" aria-label="시나리오명 오류" />
                        </MIFollowCursorTooltip>
                      )}
                    </Stack>
                  ) : undefined
                }
                onCommit={(value) => {
                  if (value !== row.scenarioName) onRowValueChange(row.id, 'scenarioName', value)
                }}
                sx={{
                  borderColor: scenarioNameErrorMessage ? 'contentBorder.Error' : 'contentBorder.Normal',
                  bgcolor: 'commonColor.White',
                  '&:hover:not(:focus-within)': {
                    backgroundColor: 'contentBG.Hover',
                    borderColor: scenarioNameErrorMessage ? 'contentBorder.Error' : 'contentBorder.Hover',
                  },
                  '&:focus-within': {
                    borderColor: scenarioNameErrorMessage ? 'contentBorder.Error' : 'contentBorder.Active',
                    backgroundColor: 'commonColor.White',
                  },
                }}
              />
            </Stack>
          )
        },
      },
      ...visibleScenarioDesignColumns.map((column): NextGenMIStickyTableColumn<ScenarioDesignRow> => {
        const required = isScenarioDesignRequiredColumn(column.key)

        return {
          field: column.key,
          headerName: (
            <ScenarioDesignCriteriaHeader
              label={column.label}
              required={required}
              onDelete={required ? undefined : () => onDeleteCriteriaColumn(column.key)}
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
                onSelected={(value) => onRowValueChange(row.id, column.key, value)}
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
      onDeleteCriteriaColumn,
      onDeleteRowRequest,
      onRowValueChange,
      reviewed,
      rows.length,
      scenarioNameErrorMessages,
      visibleScenarioDesignColumns,
    ],
  )

  return (
    <Stack gap="38px" padding="24px 0px">
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
            onClick={onBaseEventToggle}
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
                      onClick={onEventClick}
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
                onBaseEventToggle()
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
                    onClick={() => onBaseEventTabChange(tab.key)}
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
              scrollContainerRef={criteriaTableScrollRef}
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
                open={addCriteriaMenuOpen}
                onOpenChange={onAddCriteriaMenuOpenChange}
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
                        onClick={() => onToggleAddCriteriaColumn(column.key)}
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
                  <MIBaseButton variant="outlined" onClick={onAddCriteriaMenuClose} sx={{ height: '32px', borderRadius: '8px' }}>
                    취소
                  </MIBaseButton>
                  <MIBaseButton
                    variant="contained"
                    disabled={selectedAddCriteriaColumnKeys.length === 0}
                    onClick={onAddSelectedCriteria}
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
            title={rows.length >= SCENARIO_DESIGN_MAX_ROW_COUNT ? '시나리오는 최대 15개까지 추가할 수 있습니다.' : '시나리오를 추가합니다'}
          >
            <Stack width="100%" minWidth={0}>
              <MIBaseButton
                variant="outlined"
                enableHoverBackground
                disabled={rows.length >= SCENARIO_DESIGN_MAX_ROW_COUNT}
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
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between" minHeight="60px" padding="12px 0">
          <MIBaseButton
            variant="outlined"
            prefix={<ReplayRoundedIcon sx={{ fontSize: '20px' }} />}
            onClick={onReset}
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
              disabled={reviewed && canCompleteScenarioDesignReview}
              onClick={onReview}
              sx={{
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'contentIcon.ActivePrimary',
                '&:hover:not(:disabled)': {
                  backgroundColor: 'contentIcon.ActivePrimary',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'contentIcon.Disabled',
                  color: 'contentText.White',
                },
                '&.Mui-disabled .MuiTypography-root': {
                  color: 'contentText.White',
                },
              }}
            >
              변경사항 검토
            </MIBaseButton>
            <MIBaseButton
              variant="contained"
              suffix={<ChevronRightRoundedIcon sx={{ fontSize: '20px' }} />}
              disabled={!reviewed || !canCompleteScenarioDesignReview}
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
  )
}

export default ScenarioDesignCriteriaStep
