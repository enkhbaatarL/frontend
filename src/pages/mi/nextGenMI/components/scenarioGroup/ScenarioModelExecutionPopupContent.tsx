import { Box, Collapse, Stack, Tab, Tabs, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import type { CurrentModelParamLeaf, CurrentModelParamProposal, ModelParamColumn } from '@/service/mi/nextGenMI/modelExecution'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import CloseIcon from '@/components/common/icons/CloseIcon'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import ParameterSuggestionIcon from '@/components/common/icons/ParameterSuggestionIcon'
import ReplayIcon from '@/components/common/icons/ReplayIcon'
import ResetInitialDataIcon from '@/components/common/icons/ResetInitialDataIcon'
import ResetPreviousDataIcon from '@/components/common/icons/ResetPreviousDataIcon'
import RowParameterSuggestionIcon from '@/components/common/icons/RowParameterSuggestionIcon'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import ScenarioModelExecutionGeneratingState from '@/pages/mi/nextGenMI/components/common/ScenarioModelExecutionGeneratingState'
import ScenarioModelExecutionMatrixTable, {
  MatrixHeaderRow,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionMatrixTable'

export interface ScenarioModelExecutionOption {
  scenarioId: number
  scenarioName: string
  executed: boolean
  disabled: boolean
  badgeLabel?: string
}

const parameterSourceRowIndexes = Symbol('parameterSourceRowIndexes')

type ModelParamProposalRow = Record<string, unknown> & {
  [parameterSourceRowIndexes]?: Record<string, number>
}

interface MatrixTimeHeaderItem {
  label: string
  value: string
}

interface MatrixTimeColumn {
  field: string
  headerItems: MatrixTimeHeaderItem[]
  headerTooltipTitle: string
  timeKey: string
  valueColumn: CurrentModelParamLeaf['rendering']['columns'][number]
  valueColumnIndex: number
}

interface ScenarioModelExecutionPopupContentProps {
  scenarioOptions: ScenarioModelExecutionOption[]
  selectedScenarioId: number | null
  executingScenarioIds: Set<number>
  parameterProposal: CurrentModelParamProposal | null
  isLoading: boolean
  isGenerating: boolean
  isExecuting: boolean
  isSubmitting: boolean
  isResetting: boolean
  isDownloadingInputFiles: boolean
  isCloseDisabled: boolean
  canGenerate: boolean
  canReset: boolean
  canDownloadInputFiles: boolean
  canSubmit: boolean
  onSelectScenario: (scenarioId: number) => void
  onGenerateParameters: () => void
  onChangeParameterValue: (
    modelFileIndex: number,
    modelSheetIndex: number,
    modelTableIndex: number,
    parameterIndex: number,
    rowIndex: number,
    value: number,
  ) => void
  onDownloadInputFiles: () => void
  onReset: (source: 'confirmed' | 'proposed') => void
  onSubmit: () => void
  onCancel: () => void
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const getParameterRows = (parameters: unknown): ModelParamProposalRow[] => {
  if (Array.isArray(parameters)) return parameters.filter(isRecord)
  return isRecord(parameters) ? [parameters] : []
}

const getStringValue = (value: unknown) => (typeof value === 'string' ? value : undefined)

const getParameterValue = (row: ModelParamProposalRow, column: string, role: string | undefined, kind: ModelParamColumn['kind']) => {
  if (kind === 'VALUE') return row.proposedValue ?? row.basecaseValue
  if (row[column] !== undefined) return row[column]
  if (role && row[role] !== undefined) return row[role]
  return undefined
}

const getDisplayValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const getUniqueValues = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))))

const getColumnAlign = (align?: 'LEFT' | 'CENTER' | 'RIGHT') => align?.toLowerCase() as 'left' | 'center' | 'right' | undefined

const isEditableValueColumn = (column: ModelParamColumn, valueFieldNames: string[]) =>
  column.kind === 'VALUE' && [column.column, column.role].some((fieldName) => Boolean(fieldName && valueFieldNames.includes(fieldName)))

const getMatrixAxisValue = (row: ModelParamProposalRow, column: CurrentModelParamLeaf['rendering']['columns'][number]) =>
  getParameterValue(row, column.column ?? '', column.role, column.kind)

const createTextWidthMeasurer = () => {
  const context = globalThis.document?.createElement('canvas').getContext('2d')
  const fontFamily = globalThis.document?.body ? globalThis.getComputedStyle(globalThis.document.body).fontFamily : 'Pretendard, sans-serif'

  return (value: string, fontSize: number, fontWeight: number) => {
    if (!context) return Array.from(value).length * fontSize

    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    return context.measureText(value).width
  }
}

const getContentBasedColumnWidth = ({
  bodyValues,
  editable,
  headerValues,
  maximumWidth,
  measureTextWidth,
  minimumWidth,
  showUserFix,
}: {
  bodyValues: string[]
  editable: boolean
  headerValues: string[]
  maximumWidth: number
  measureTextWidth: (value: string, fontSize: number, fontWeight: number) => number
  minimumWidth: number
  showUserFix: boolean
}) => {
  const headerTextWidth = headerValues.reduce((width, value) => Math.max(width, measureTextWidth(value, 14, 500)), 0)
  const bodyTextWidth = bodyValues.reduce((width, value) => Math.max(width, measureTextWidth(value, 12, editable ? 400 : 500)), 0)

  return `${Math.min(
    maximumWidth,
    Math.max(minimumWidth, Math.ceil(headerTextWidth + 26 + (showUserFix ? 24 : 0)), Math.ceil(bodyTextWidth + 26 + (editable ? 22 : 0))),
  )}px`
}

const ParameterValueInput = styled('input')(({ theme }) => ({
  width: '100%',
  minWidth: 0,
  height: '28px',
  padding: '8px 12px',
  border: `1px solid ${theme.palette.contentBorder.Normal}`,
  borderRadius: '10px',
  boxSizing: 'border-box',
  backgroundColor: theme.palette.commonColor.White,
  color: theme.palette.contentText.Normal,
  fontFamily: 'inherit',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: 1.4,
  outline: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '&:hover:not(:disabled)': {
    borderColor: theme.palette.contentBorder.Normal,
    backgroundColor: theme.palette.contentBG.Active,
    color: theme.palette.contentText.Black,
  },
  '&:focus:not(:disabled)': {
    borderColor: theme.palette.contentBorder.Active,
    backgroundColor: theme.palette.gray[5],
    color: theme.palette.contentText.Black,
  },
  '&:disabled': {
    borderColor: theme.palette.contentBorder.Disabled,
    backgroundColor: theme.palette.contentBG.Disabled,
    color: theme.palette.contentText.Disabled,
    cursor: 'default',
  },
}))

const NumericParameterValueInput = ({
  disabled,
  onChange,
  textAlign,
  value,
}: {
  disabled: boolean
  onChange: (value: number) => void
  textAlign: 'left' | 'center' | 'right' | undefined
  value: number
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(String(value))

  useEffect(() => {
    if (globalThis.document?.activeElement === inputRef.current) return
    setInputValue(String(value))
  }, [value])

  return (
    <ParameterValueInput
      ref={inputRef}
      inputMode="decimal"
      value={inputValue}
      disabled={disabled}
      style={{ textAlign }}
      onChange={(event) => {
        if (!/^-?\d*(?:\.\d*)?$/.test(event.target.value)) return
        setInputValue(event.target.value)
        if (event.target.value !== '' && event.target.value !== '-' && Number.isFinite(Number(event.target.value))) {
          onChange(Number(event.target.value))
        }
      }}
      onBlur={() => setInputValue(String(value))}
    />
  )
}

const ScenarioOptionBadge = ({ label, disabled }: { label: string; disabled: boolean }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
    padding="4px 6px"
    borderRadius="8px"
    border={disabled ? '1px solid' : 'none'}
    bgcolor={disabled ? 'gray.5' : 'gray.20'}
    borderColor={disabled ? 'contentBorder.Normal' : undefined}
  >
    <Typography
      fontSize="12px"
      fontWeight={600}
      lineHeight={1.4}
      color={disabled ? 'contentText.Disabled' : 'contentText.Normal'}
      whiteSpace="nowrap"
    >
      {label}
    </Typography>
  </Stack>
)

const ParameterState = ({ message, loading = false }: { message: string; loading?: boolean }) => (
  <Stack flex="1 1 0" minHeight={0} alignItems="center" justifyContent="center" gap="10px">
    {loading ? (
      <MIAgentSpinner size={24} tone="gray" sx={{ '& svg': { width: '24px', height: '24px' } }} />
    ) : (
      <ErrorOutlineIcon width={24} height={24} />
    )}
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} width="336px" textAlign="center" sx={{ wordBreak: 'break-word' }}>
      {message}
    </Typography>
  </Stack>
)

const ResetMenuLabel = ({
  children,
  icon = <ReplayIcon width={20} height={20} />,
  semibold = false,
}: {
  children: string
  icon?: ReactNode
  semibold?: boolean
}) => (
  <Stack component="span" direction="row" alignItems="center" gap={semibold ? '4px' : '8px'}>
    {icon}
    <Typography component="span" variant={semibold ? 'body2SB14' : 'body2M14'}>
      {children}
    </Typography>
  </Stack>
)

const ParameterChip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <MIBaseButton
    variant="outlined"
    onClick={onClick}
    disableRipple
    sx={{
      maxWidth: '260px',
      minWidth: '0px',
      flexShrink: 0,
      height: '28px',
      padding: '6px 10px',
      borderRadius: '100px',
      bgcolor: selected ? 'contentBG.PrimaryFade' : 'commonColor.White',
      borderColor: selected ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
      '&:hover:not(:disabled)': {
        bgcolor: selected ? 'contentBG.PrimaryFade' : 'contentBG.Active',
        borderColor: selected ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
      },
    }}
  >
    <Typography variant="body2SB14" color={selected ? 'contentText.Black' : 'contentText.Normal'} noWrap>
      {label}
    </Typography>
  </MIBaseButton>
)

const MatrixSlotColumnHeader = ({
  label,
  timeHeaderLabels,
  rowCount,
  showTimeHeaderLabels,
}: {
  label: string
  timeHeaderLabels: string[]
  rowCount: number
  showTimeHeaderLabels: boolean
}) => (
  <Stack component="span" width="100%" minWidth={0}>
    {Array.from({ length: rowCount }, (_, index) => (
      <MatrixHeaderRow
        key={`${timeHeaderLabels[index] ?? 'empty'}-${index}`}
        value={showTimeHeaderLabels ? timeHeaderLabels[index] : undefined}
        border={showTimeHeaderLabels}
      />
    ))}
    <MatrixHeaderRow value={label} align="left" />
  </Stack>
)

const MatrixTimeColumnHeader = ({ items, rowCount }: { items: MatrixTimeHeaderItem[]; rowCount: number }) => (
  <Stack component="span" width="100%" minWidth={0}>
    {Array.from({ length: rowCount }, (_, index) => (
      <MatrixHeaderRow key={`${items[index]?.label ?? 'empty'}-${index}`} value={items[index]?.value} />
    ))}
    <MatrixHeaderRow />
  </Stack>
)

const ScenarioModelExecutionPopupContent = ({
  scenarioOptions,
  selectedScenarioId,
  executingScenarioIds,
  parameterProposal,
  isLoading,
  isGenerating,
  isExecuting,
  isSubmitting,
  isResetting,
  isDownloadingInputFiles,
  isCloseDisabled,
  canGenerate,
  canReset,
  canDownloadInputFiles,
  canSubmit,
  onSelectScenario,
  onGenerateParameters,
  onChangeParameterValue,
  onDownloadInputFiles,
  onReset,
  onSubmit,
  onCancel,
}: ScenarioModelExecutionPopupContentProps) => {
  const [selectedModelFile, setSelectedModelFile] = useState<string | null>(null)
  const [selectedModelSheet, setSelectedModelSheet] = useState<string | null>(null)
  const [selectedModelTable, setSelectedModelTable] = useState<string | null>(null)
  const [selectedParameterIndex, setSelectedParameterIndex] = useState<number | null>(null)
  const [closedParameterInformationKeys, setClosedParameterInformationKeys] = useState<Set<string>>(new Set())
  const [tableViewportHeight, setTableViewportHeight] = useState<number>()
  const [tableViewportWidth, setTableViewportWidth] = useState(0)
  const popupContentRef = useRef<HTMLDivElement>(null)
  const tableViewportRef = useRef<HTMLDivElement>(null)
  const tableScrollContainerRef = useRef<HTMLDivElement>(null)
  const matrixLeftScrollContainerRef = useRef<HTMLDivElement>(null)
  const matrixRightScrollContainerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const scenarioItems: SelectMenuItem<number>[] = scenarioOptions.map((option) => ({
    value: option.scenarioId,
    disabled: option.disabled,
    label: option.scenarioName,
    suffix: option.badgeLabel ? <ScenarioOptionBadge label={option.badgeLabel} disabled={option.disabled} /> : undefined,
  }))
  const selectedScenarioExecuted = scenarioOptions.some((option) => option.scenarioId === selectedScenarioId && option.executed)
  const selectedScenarioExecuting = executingScenarioIds.has(selectedScenarioId ?? -1)
  const modelFileNames = useMemo(
    () => getUniqueValues(parameterProposal?.modelFiles.map((modelFile) => modelFile.modelFile) ?? []),
    [parameterProposal?.modelFiles],
  )
  const activeModelFile = selectedModelFile && modelFileNames.includes(selectedModelFile) ? selectedModelFile : (modelFileNames[0] ?? null)
  const activeModelFileIndex = parameterProposal?.modelFiles.findIndex((modelFile) => modelFile.modelFile === activeModelFile) ?? -1
  const activeModelFileNode = parameterProposal?.modelFiles[activeModelFileIndex]
  const modelSheetNames = useMemo(
    () => getUniqueValues(activeModelFileNode?.modelSheets.map((modelSheet) => modelSheet.modelSheet) ?? []),
    [activeModelFileNode?.modelSheets],
  )
  const activeModelSheet =
    selectedModelSheet && modelSheetNames.includes(selectedModelSheet) ? selectedModelSheet : (modelSheetNames[0] ?? null)
  const activeModelSheetIndex = activeModelFileNode?.modelSheets.findIndex((modelSheet) => modelSheet.modelSheet === activeModelSheet) ?? -1
  const activeModelSheetNode = activeModelFileNode?.modelSheets[activeModelSheetIndex]
  const modelTableNames = useMemo(
    () => getUniqueValues(activeModelSheetNode?.modelTables.map((modelTable) => modelTable.tableName) ?? []),
    [activeModelSheetNode?.modelTables],
  )
  const activeModelTable =
    selectedModelTable && modelTableNames.includes(selectedModelTable) ? selectedModelTable : (modelTableNames[0] ?? null)
  const activeModelTableIndex = activeModelSheetNode?.modelTables.findIndex((modelTable) => modelTable.tableName === activeModelTable) ?? -1
  const activeModelTableNode = activeModelSheetNode?.modelTables[activeModelTableIndex]
  const modelParameters = activeModelTableNode?.parameters ?? []
  const activeParameterIndex =
    selectedParameterIndex !== null && selectedParameterIndex < modelParameters.length ? selectedParameterIndex : 0
  const parameterInformationKey = `${activeModelFileIndex}-${activeModelSheetIndex}-${activeModelTableIndex}-${activeParameterIndex}`
  const isParameterInformationOpen = !closedParameterInformationKeys.has(parameterInformationKey)
  const selectedParameter: CurrentModelParamLeaf | undefined = modelParameters[activeParameterIndex]
  const selectedParameterRows = useMemo(() => getParameterRows(selectedParameter?.parameter.values), [selectedParameter?.parameter.values])
  const isMatrixTimeColumns = selectedParameter?.rendering.readMode === 'MATRIX_TIME_COLUMNS'
  const matrixTimeHeaderLabels = useMemo(() => {
    if (!selectedParameter || !isMatrixTimeColumns) return []

    const timeAxisColumns = selectedParameter.rendering.columns.filter((column) => column.kind === 'TIME_AXIS')
    const valueColumns = selectedParameter.rendering.columns.filter((column) => column.kind === 'VALUE')

    return [...(valueColumns.length > 1 ? ['Value'] : []), ...timeAxisColumns.map((column) => column.role ?? column.column ?? 'Time')]
  }, [isMatrixTimeColumns, selectedParameter])
  const matrixHeaderRowCount = matrixTimeHeaderLabels.length
  const matrixTimeColumns = useMemo<MatrixTimeColumn[]>(() => {
    if (!selectedParameter || !isMatrixTimeColumns) return []

    const timeAxisColumns = selectedParameter.rendering.columns.filter((column) => column.kind === 'TIME_AXIS')
    const valueColumns = selectedParameter.rendering.columns.filter((column) => column.kind === 'VALUE')
    const timePoints = new Map<string, MatrixTimeHeaderItem[]>()

    selectedParameterRows.forEach((row) => {
      const timeAxisValues = timeAxisColumns.map((column) => getMatrixAxisValue(row, column))
      const timeKey = JSON.stringify(timeAxisValues)
      if (timePoints.has(timeKey)) return

      timePoints.set(
        timeKey,
        timeAxisColumns.map((column, index) => ({
          label: column.role ?? column.column ?? 'Time',
          value: getDisplayValue(timeAxisValues[index]),
        })),
      )
    })

    return Array.from(timePoints.entries()).flatMap(([timeKey, timeHeaderItems], timeIndex) =>
      valueColumns.map((valueColumn, valueColumnIndex) => {
        const headerItems = [
          ...(valueColumns.length > 1 ? [{ label: 'Value', value: valueColumn.role ?? valueColumn.column ?? 'Value' }] : []),
          ...timeHeaderItems,
        ]

        return {
          field: `matrix-time-${timeIndex}-value-${valueColumnIndex}`,
          headerItems,
          headerTooltipTitle: headerItems.map((item) => `${item.label} ${item.value}`).join(' / '),
          timeKey,
          valueColumn,
          valueColumnIndex,
        }
      }),
    )
  }, [isMatrixTimeColumns, selectedParameter, selectedParameterRows])
  const parameterTableRows = useMemo<ModelParamProposalRow[]>(() => {
    if (!selectedParameter || !isMatrixTimeColumns) return selectedParameterRows

    const slotColumns = selectedParameter.rendering.columns.filter((column) => column.kind === 'SLOT')
    const timeAxisColumns = selectedParameter.rendering.columns.filter((column) => column.kind === 'TIME_AXIS')
    const valueColumns = selectedParameter.rendering.columns.filter((column) => column.kind === 'VALUE')
    const matrixColumnFields = new Map(matrixTimeColumns.map((column) => [`${column.timeKey}-${column.valueColumnIndex}`, column.field]))
    const rowsBySlot = new Map<string, ModelParamProposalRow>()
    const groupedRationalesBySlot = new Map(
      getParameterRows(selectedParameter.parameter.groupedRationales).map((groupedRationale) => [
        JSON.stringify(slotColumns.map((column) => getMatrixAxisValue(groupedRationale, column))),
        getStringValue(groupedRationale.rationale),
      ]),
    )

    selectedParameterRows.forEach((row, sourceRowIndex) => {
      const slotKey = JSON.stringify(slotColumns.map((column) => getMatrixAxisValue(row, column)))
      const matrixRow = rowsBySlot.get(slotKey) ?? { ...row, [parameterSourceRowIndexes]: {} }
      const timeKey = JSON.stringify(timeAxisColumns.map((column) => getMatrixAxisValue(row, column)))
      const groupedRationale = groupedRationalesBySlot.get(slotKey)

      if (groupedRationale) matrixRow.rationale = groupedRationale

      valueColumns.forEach((column, valueColumnIndex) => {
        const field = matrixColumnFields.get(`${timeKey}-${valueColumnIndex}`)
        if (field) {
          matrixRow[field] = getMatrixAxisValue(row, column)
          matrixRow[parameterSourceRowIndexes]![field] = sourceRowIndex
        }
      })

      rowsBySlot.set(slotKey, matrixRow)
    })

    return Array.from(rowsBySlot.values())
  }, [isMatrixTimeColumns, matrixTimeColumns, selectedParameter, selectedParameterRows])

  useEffect(() => {
    setSelectedModelFile(activeModelFile)
  }, [activeModelFile])

  useEffect(() => {
    setSelectedModelSheet(activeModelSheet)
  }, [activeModelSheet])

  useEffect(() => {
    setSelectedModelTable(activeModelTable)
  }, [activeModelTable])

  useEffect(() => {
    setSelectedParameterIndex(0)
  }, [activeModelTable])

  const tableColumns = useMemo<NextGenMIStickyTableColumn<ModelParamProposalRow>[]>(() => {
    if (!selectedParameter) return []

    const parameterInformationButton = (
      <MIBaseButton
        variant="text"
        aria-label="파라미터 정보 열기"
        disabled={!selectedParameter.parameter.rationale || isParameterInformationOpen}
        onClick={() =>
          setClosedParameterInformationKeys((keys) => {
            const nextKeys = new Set(keys)
            nextKeys.delete(parameterInformationKey)
            return nextKeys
          })
        }
        disableRipple
        buttonHoverBgColor="transparent"
        sx={{ width: '40px', minWidth: '40px', height: isMatrixTimeColumns ? '24px' : '40px', padding: 0, borderRadius: 0 }}
      >
        <ParameterSuggestionIcon width={20} height={20} color="#868E96" />
      </MIBaseButton>
    )
    const displayedColumns = isMatrixTimeColumns
      ? selectedParameter.rendering.columns.filter((column) => column.kind === 'SLOT' && Boolean(column.column))
      : selectedParameter.rendering.columns.filter((column) => column.column)
    const measureTextWidth = createTextWidthMeasurer()

    return [
      {
        field: 'rationale',
        headerName: selectedParameter.parameter.rationale ? (
          <NextGenMIFollowCursorTooltip title={selectedParameter.parameter.rationale ?? ''} tooltipSx={{ maxWidth: '800px' }}>
            <Box component="span" display="inline-flex">
              {parameterInformationButton}
            </Box>
          </NextGenMIFollowCursorTooltip>
        ) : (
          parameterInformationButton
        ),
        width: '40px',
        minWidth: '40px',
        maxWidth: '40px',
        fixedWidth: true,
        align: 'center',
        headerAlign: 'center',
        headerCellSx: { padding: 0, verticalAlign: isMatrixTimeColumns ? 'bottom' : 'middle' },
        headerContentSx: {
          display: isMatrixTimeColumns ? 'flex' : 'block',
          alignItems: isMatrixTimeColumns ? 'flex-end' : undefined,
          height: '100%',
        },
        cellSx: { padding: 0 },
        renderCell: ({ row }) => {
          const rationale = getStringValue(row.rationale) ?? selectedParameter.parameter.rationale
          if (!rationale) return null

          return (
            <NextGenMIFollowCursorTooltip title={rationale} tooltipSx={{ maxWidth: '800px' }}>
              <Stack width="100%" alignItems="center" justifyContent="center">
                <RowParameterSuggestionIcon width={20} height={20} color="#868E96" />
              </Stack>
            </NextGenMIFollowCursorTooltip>
          )
        },
      },
      ...displayedColumns.flatMap((column, columnIndex): NextGenMIStickyTableColumn<ModelParamProposalRow>[] => {
        if (!column.column) return []

        const editable = isEditableValueColumn(column, selectedParameter.parameter.modelTarget?.valueFieldNames ?? [])
        const headerLabel = column.role || column.column
        const headerAlign = isMatrixTimeColumns ? 'left' : getColumnAlign(column.align)

        return [
          {
            field: column.column,
            headerName: isMatrixTimeColumns ? (
              <MatrixSlotColumnHeader
                label={headerLabel}
                timeHeaderLabels={matrixTimeHeaderLabels}
                rowCount={matrixHeaderRowCount}
                showTimeHeaderLabels={columnIndex === displayedColumns.length - 1}
              />
            ) : (
              headerLabel
            ),
            tooltipWhenHeaderTruncated: true,
            headerTooltipTitle: headerLabel,
            width: getContentBasedColumnWidth({
              bodyValues: parameterTableRows.map((row) =>
                getDisplayValue(getParameterValue(row, column.column ?? '', column.role, column.kind)),
              ),
              editable,
              headerValues: [
                headerLabel,
                ...(isMatrixTimeColumns && columnIndex === displayedColumns.length - 1 ? matrixTimeHeaderLabels : []),
              ],
              maximumWidth: 180,
              measureTextWidth,
              minimumWidth: 100,
              showUserFix: !isMatrixTimeColumns,
            }),
            minWidth: '100px',
            maxWidth: '180px',
            align: getColumnAlign(column.align),
            headerAlign,
            headerCellSx: isMatrixTimeColumns ? { padding: 0, verticalAlign: 'top' } : { fontWeight: 500 },
            headerContentSx: isMatrixTimeColumns
              ? { height: '100%', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' }
              : undefined,
            renderCell: ({ row, rowIndex }) => {
              const value = getParameterValue(row, column.column ?? '', column.role, column.kind)
              const isUnavailable = value === null

              if (editable && typeof value === 'number') {
                return (
                  <NumericParameterValueInput
                    value={value}
                    disabled={isSubmitting || isResetting}
                    textAlign={headerAlign}
                    onChange={(nextValue) =>
                      onChangeParameterValue(
                        activeModelFileIndex,
                        activeModelSheetIndex,
                        activeModelTableIndex,
                        activeParameterIndex,
                        rowIndex,
                        nextValue,
                      )
                    }
                  />
                )
              }

              return (
                <Typography variant="body3M12" color="contentText.Normal" noWrap width="100%">
                  {isUnavailable ? 'N/A' : getDisplayValue(value)}
                </Typography>
              )
            },
          },
        ]
      }),
      ...matrixTimeColumns.map((column): NextGenMIStickyTableColumn<ModelParamProposalRow> => {
        const editable = isEditableValueColumn(column.valueColumn, selectedParameter.parameter.modelTarget?.valueFieldNames ?? [])

        return {
          field: column.field,
          headerName: <MatrixTimeColumnHeader items={column.headerItems} rowCount={matrixHeaderRowCount} />,
          tooltipWhenHeaderTruncated: true,
          headerTooltipTitle: column.headerTooltipTitle,
          width: getContentBasedColumnWidth({
            bodyValues: parameterTableRows.map((row) => getDisplayValue(row[column.field])),
            editable,
            headerValues: column.headerItems.map((item) => item.value),
            maximumWidth: 180,
            measureTextWidth,
            minimumWidth: 100,
            showUserFix: false,
          }),
          minWidth: '100px',
          maxWidth: '180px',
          align: getColumnAlign(column.valueColumn.align),
          headerAlign: 'right',
          headerCellSx: { padding: 0, verticalAlign: 'top' },
          headerContentSx: { height: '100%', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' },
          renderCell: ({ row }) => {
            const value = row[column.field]
            const sourceRowIndex = row[parameterSourceRowIndexes]?.[column.field]
            const isUnavailable = value === null

            if (editable && sourceRowIndex !== undefined && typeof value === 'number') {
              return (
                <NumericParameterValueInput
                  value={value}
                  disabled={isSubmitting || isResetting}
                  textAlign="right"
                  onChange={(nextValue) =>
                    onChangeParameterValue(
                      activeModelFileIndex,
                      activeModelSheetIndex,
                      activeModelTableIndex,
                      activeParameterIndex,
                      sourceRowIndex,
                      nextValue,
                    )
                  }
                />
              )
            }

            return (
              <Typography variant="body3M12" color="contentText.Normal" noWrap width="100%">
                {isUnavailable ? 'N/A' : getDisplayValue(value)}
              </Typography>
            )
          },
        }
      }),
    ]
  }, [
    activeModelFileIndex,
    activeModelSheetIndex,
    activeModelTableIndex,
    activeParameterIndex,
    isMatrixTimeColumns,
    isParameterInformationOpen,
    isResetting,
    isSubmitting,
    matrixHeaderRowCount,
    matrixTimeHeaderLabels,
    matrixTimeColumns,
    onChangeParameterValue,
    parameterTableRows,
    parameterInformationKey,
    selectedParameter,
  ])
  const matrixXAxisStartColumnIndex = matrixTimeColumns.length > 0 ? tableColumns.length - matrixTimeColumns.length : -1
  const showMatrixSplitTable =
    Boolean(isMatrixTimeColumns) &&
    matrixXAxisStartColumnIndex > 0 &&
    matrixXAxisStartColumnIndex < tableColumns.length &&
    parameterTableRows.length > 0
  const fittedTableColumns = useMemo(() => {
    if (showMatrixSplitTable || tableViewportWidth === 0) return tableColumns

    const contentWidth = tableColumns.reduce((width, column) => width + Number.parseFloat(column.width), 0)
    const flexibleColumns = tableColumns.filter((column) => !column.fixedWidth)
    if (contentWidth >= tableViewportWidth || flexibleColumns.length === 0) return tableColumns

    const additionalWidth = Math.floor((tableViewportWidth - contentWidth) / flexibleColumns.length)

    return tableColumns.map((column) => {
      if (column.fixedWidth) return column

      const width = `${Number.parseFloat(column.width) + additionalWidth}px`
      return { ...column, width, minWidth: width, maxWidth: width }
    })
  }, [showMatrixSplitTable, tableColumns, tableViewportWidth])

  useEffect(() => {
    const popupContent = popupContentRef.current
    const element = tableViewportRef.current
    const footer = footerRef.current
    const tableContainer = element?.parentElement
    const scrollContainers = (
      showMatrixSplitTable
        ? [matrixLeftScrollContainerRef.current, matrixRightScrollContainerRef.current]
        : [tableScrollContainerRef.current]
    ).filter((scrollContainer): scrollContainer is HTMLDivElement => scrollContainer !== null)
    if (!popupContent || !element || !footer || !tableContainer || scrollContainers.length === 0) return undefined

    let animationFrameId = 0
    const updateTableViewportHeight = () => {
      animationFrameId = 0
      const nextWidth = Math.floor(scrollContainers[0].clientWidth)
      setTableViewportWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth))

      const dialogPaper = element.closest<HTMLElement>('.MuiDialog-paper')
      if (!dialogPaper) return

      const dialogPaperMaxHeight = Number.parseFloat(globalThis.getComputedStyle(dialogPaper).maxHeight)
      if (!Number.isFinite(dialogPaperMaxHeight)) return

      const popupContentRect = popupContent.getBoundingClientRect()
      const dialogPaperRect = dialogPaper.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const footerRect = footer.getBoundingClientRect()
      const tableContainerPaddingBottom = Number.parseFloat(globalThis.getComputedStyle(tableContainer).paddingBottom) || 0
      const availableHeight =
        dialogPaperMaxHeight -
        (popupContentRect.top - dialogPaperRect.top) -
        (elementRect.top - popupContentRect.top) -
        footerRect.height -
        tableContainerPaddingBottom
      const naturalHeight = Math.max(
        ...scrollContainers.map((scrollContainer) => {
          const frame = scrollContainer.parentElement?.parentElement
          const framePaddingBottom = frame ? Number.parseFloat(globalThis.getComputedStyle(frame).paddingBottom) || 0 : 0
          return scrollContainer.scrollHeight + framePaddingBottom
        }),
      )
      const nextHeight = Math.max(0, Math.floor(Math.min(availableHeight, naturalHeight)))
      setTableViewportHeight((currentHeight) => (currentHeight === nextHeight ? currentHeight : nextHeight))
    }
    const scheduleTableViewportHeightUpdate = () => {
      if (animationFrameId) return
      animationFrameId = globalThis.requestAnimationFrame(updateTableViewportHeight)
    }

    scheduleTableViewportHeightUpdate()

    const resizeObserver = new ResizeObserver(scheduleTableViewportHeightUpdate)
    resizeObserver.observe(popupContent)
    resizeObserver.observe(element)
    resizeObserver.observe(tableContainer)
    scrollContainers.forEach((scrollContainer) => resizeObserver.observe(scrollContainer))
    globalThis.addEventListener('resize', scheduleTableViewportHeightUpdate)

    return () => {
      if (animationFrameId) globalThis.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      globalThis.removeEventListener('resize', scheduleTableViewportHeightUpdate)
    }
  }, [parameterTableRows.length, selectedParameter, showMatrixSplitTable])

  const showParameterNavigation = modelFileNames.length > 0
  const showParameterTable = Boolean(selectedParameter && tableColumns.length > 1)
  const emptyMessage =
    parameterProposal?.failureReason?.trim() ||
    (modelFileNames.length > 0 ? '선택한 테이블의 파라미터 정의가 없습니다.' : '시나리오 선택 후 파라미터를 생성해 주세요')

  return (
    <Stack ref={popupContentRef} width="100%" height="100%" minHeight={0} overflow="hidden">
      <Stack direction="row" alignItems="center" flexShrink={0} padding="4px 20px">
        <Stack direction="row" alignItems="flex-start" gap="12px" width="575px" padding="12px" borderRadius="8px" bgcolor="gray.5">
          <Box flex="1 1 0" minWidth={0}>
            <MISelectMenu<number>
              variant="outlined"
              selectionIconPosition="left"
              selected={selectedScenarioId ?? -1}
              onSelected={onSelectScenario}
              items={scenarioItems}
              placeholder="시나리오를 선택해 주세요"
              showSelectedSuffix
              disabled={isLoading || isGenerating || isExecuting || isSubmitting || isResetting}
              zIndex={1401}
              maxHeight={244}
              sx={{ width: '100%', height: '36px', borderRadius: '8px', justifyContent: 'space-between', bgcolor: 'commonColor.White' }}
            />
          </Box>
          <MIBaseButton
            variant="contained"
            disabled={
              selectedScenarioId === null ||
              isLoading ||
              isGenerating ||
              isExecuting ||
              isSubmitting ||
              isResetting ||
              !canGenerate ||
              selectedScenarioExecuting
            }
            onClick={onGenerateParameters}
            sx={{ height: '36px', borderRadius: '8px', padding: '0 10px' }}
          >
            파라미터 생성
          </MIBaseButton>
        </Stack>
      </Stack>

      {isLoading ? (
        <ParameterState message="파라미터 상태를 확인하고 있습니다" loading />
      ) : isGenerating ? (
        <ParameterState message="파라미터를 생성하고 있습니다" loading />
      ) : isSubmitting || isExecuting ? (
        <Stack flex="1 1 0" minHeight={0}>
          <ScenarioModelExecutionGeneratingState />
        </Stack>
      ) : !showParameterNavigation ? (
        <ParameterState message={emptyMessage} />
      ) : (
        <Stack width="100%" flex="1 1 auto" minHeight={0} overflow="hidden">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexShrink={0}
            height="54px"
            padding="16px 24px"
            borderBottom="1px solid"
            borderColor="contentBorder.Normal"
          >
            <Tabs
              value={activeModelFile ?? false}
              onChange={(_, value: string) => setSelectedModelFile(value)}
              sx={{
                height: '100%',
                minHeight: 0,
                borderBottom: 'none',
                '.MuiTabs-indicator': { height: '2px', bgcolor: 'commonColor.Black' },
                '& .MuiTab-root': {
                  minWidth: 0,
                  minHeight: 0,
                  height: '100%',
                  padding: '16px 20px',
                  color: 'contentText.Black',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  textTransform: 'none',
                  '&.Mui-selected': { color: 'commonColor.Black', fontWeight: 700 },
                },
              }}
            >
              {modelFileNames.map((modelFile) => (
                <Tab key={modelFile} label={modelFile} value={modelFile} disableRipple />
              ))}
            </Tabs>
            <MIBaseButton
              variant="outlined"
              prefix={<FileDownloadIcon width={20} height={20} />}
              disabled={!canDownloadInputFiles}
              isLoading={isDownloadingInputFiles}
              onClick={onDownloadInputFiles}
              sx={{ height: '36px', borderRadius: '8px', padding: '8px 10px 8px 6px' }}
            >
              인풋 파일 다운로드
            </MIBaseButton>
          </Stack>

          {modelSheetNames.length > 0 && (
            <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.10">
              <HorizontalScrollContainer
                alignItems="center"
                gap="5px"
                gradientWidth={63}
                scrollAmount={0.85}
                containerSx={{
                  width: '100%',
                  '& .scroll-button': {
                    borderRadius: '100px',
                    borderColor: 'contentBorder.Normal',
                    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                {modelSheetNames.map((modelSheet) => (
                  <ParameterChip
                    key={modelSheet}
                    label={modelSheet}
                    selected={modelSheet === activeModelSheet}
                    onClick={() => setSelectedModelSheet(modelSheet)}
                  />
                ))}
              </HorizontalScrollContainer>
            </Stack>
          )}

          {modelTableNames.length > 1 && (
            <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.5">
              <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
                {modelTableNames.map((modelTable) => (
                  <ParameterChip
                    key={modelTable}
                    label={modelTable}
                    selected={modelTable === activeModelTable}
                    onClick={() => setSelectedModelTable(modelTable)}
                  />
                ))}
              </HorizontalScrollContainer>
            </Stack>
          )}

          {modelParameters.length > 1 && (
            <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.10">
              <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
                {modelParameters.map((modelParameter, index) => (
                  <ParameterChip
                    key={`${modelParameter.parameter.parameterName ?? 'parameter'}-${index}`}
                    label={modelParameter.parameter.parameterName ?? `파라미터 ${index + 1}`}
                    selected={index === activeParameterIndex}
                    onClick={() => setSelectedParameterIndex(index)}
                  />
                ))}
              </HorizontalScrollContainer>
            </Stack>
          )}

          {selectedParameter?.parameter.rationale && (
            <Collapse in={isParameterInformationOpen} timeout={220} unmountOnExit sx={{ flexShrink: 0 }}>
              <Stack flexShrink={0} padding="12px 24px">
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  width="100%"
                  padding="8px"
                  border="1px solid"
                  borderColor="#414C93"
                  borderRadius="8px"
                  bgcolor="#E9ECFF"
                  gap="8px"
                  boxSizing="border-box"
                >
                  <Stack flex="1 1 0" minWidth={0} justifyContent="center" gap="4px" padding="4px">
                    <Stack direction="row" alignItems="center" gap="2px">
                      <Box aria-hidden display="flex" flexShrink={0} color="mari.Primary">
                        <ParameterSuggestionIcon width={24} height={24} />
                      </Box>
                      <Typography fontSize="13px" fontWeight={600} lineHeight={1.4} color="mari.Primary" noWrap>
                        {selectedParameter.parameter.parameterName} 파라미터 정보
                      </Typography>
                    </Stack>
                    {selectedParameter.parameter.rationale && (
                      <Typography fontSize="13px" fontWeight={400} lineHeight={1.4} color="contentText.Black">
                        {selectedParameter.parameter.rationale}
                      </Typography>
                    )}
                  </Stack>
                  <MIBaseButton
                    variant="text"
                    aria-label="파라미터 정보 닫기"
                    onClick={() => setClosedParameterInformationKeys((keys) => new Set(keys).add(parameterInformationKey))}
                    disableRipple
                    buttonHoverBgColor="transparent"
                    sx={{ flexShrink: 0, width: '36px', minWidth: '36px', height: '36px', padding: '8px', borderRadius: '8px' }}
                  >
                    <CloseIcon width={20} height={20} />
                  </MIBaseButton>
                </Stack>
              </Stack>
            </Collapse>
          )}

          {showParameterTable ? (
            <Stack flex="1 1 auto" minHeight={0} padding="10px 24px" overflow="hidden">
              <Box ref={tableViewportRef} flex="1 1 auto" alignSelf="stretch" width="100%" maxWidth="100%" minHeight={0} overflow="hidden">
                {showMatrixSplitTable ? (
                  <ScenarioModelExecutionMatrixTable<ModelParamProposalRow>
                    key={`${activeModelFileIndex}-${activeModelSheetIndex}-${activeModelTableIndex}-${activeParameterIndex}`}
                    columns={tableColumns}
                    rows={parameterTableRows}
                    xAxisStartColumnIndex={matrixXAxisStartColumnIndex}
                    xAxisHeaderLabels={matrixTimeHeaderLabels}
                    rowKeyPrefix={selectedParameter?.parameter.parameterName ?? 'parameter'}
                    headerHeight={`${Math.max(40, (matrixHeaderRowCount + 1) * 24)}px`}
                    maxHeight={tableViewportHeight === undefined ? undefined : `${tableViewportHeight}px`}
                    leftScrollContainerRef={matrixLeftScrollContainerRef}
                    rightScrollContainerRef={matrixRightScrollContainerRef}
                  />
                ) : (
                  <NextGenMIStickyTable<ModelParamProposalRow>
                    columns={fittedTableColumns}
                    rows={parameterTableRows}
                    getRowKey={(_, index) => `${selectedParameter?.parameter.parameterName ?? 'parameter'}-${index}`}
                    fixedLeftColumnIndexes={[0]}
                    // userFix={!isMatrixTimeColumns}
                    rowHeight="42px"
                    headerHeight={isMatrixTimeColumns ? `${Math.max(40, (matrixHeaderRowCount + 1) * 24)}px` : '40px'}
                    cellPaddingX="8px"
                    cellPaddingY="6px"
                    headerFontSize="14px"
                    bodyFontSize="12px"
                    noRowMessage="파라미터 데이터가 없습니다."
                    maxHeight={tableViewportHeight === undefined ? undefined : `${tableViewportHeight}px`}
                    containerShell={false}
                    scrollContainerRef={tableScrollContainerRef}
                    fitContentWidth
                    // hoverType="vertical"
                    oddBackground
                  />
                )}
              </Box>
            </Stack>
          ) : (
            <ParameterState message="선택한 테이블의 파라미터 정의가 없습니다." />
          )}
        </Stack>
      )}

      <Stack ref={footerRef} direction="row" alignItems="center" justifyContent="space-between" flexShrink={0} padding="20px">
        <MIDropdownMenu
          label={<ResetMenuLabel semibold>초기화</ResetMenuLabel>}
          variant="outlined"
          placement="bottom-start"
          menuPositionOffset={{ top: 4 }}
          groupDisplayType="none"
          items={[
            {
              label: <ResetMenuLabel icon={<ResetPreviousDataIcon />}>직전 데이터로 초기화</ResetMenuLabel>,
              disabled: !selectedScenarioExecuted,
              action: () => onReset('confirmed'),
            },
            {
              label: <ResetMenuLabel icon={<ResetInitialDataIcon />}>최초 생성 데이터로 초기화</ResetMenuLabel>,
              action: () => onReset('proposed'),
            },
          ]}
          disabled={!canReset || isLoading || isGenerating || isExecuting || isSubmitting || isResetting || selectedScenarioExecuting}
          isLoading={isResetting}
          zIndex={1401}
          paperProps={{ sx: { width: '242px' } }}
          sx={{ height: '36px', borderRadius: '8px', padding: '8px 10px 8px 6px' }}
        />
        <Stack direction="row" alignItems="center" gap="8px">
          <MIBaseButton
            variant="outlined"
            disabled={isCloseDisabled}
            onClick={onCancel}
            sx={{ height: '36px', borderRadius: '8px', padding: '0 10px' }}
          >
            취소
          </MIBaseButton>
          <MIBaseButton
            variant="contained"
            disabled={!canSubmit || isLoading || isGenerating || isExecuting || isSubmitting || isResetting}
            isLoading={isSubmitting}
            onClick={onSubmit}
            sx={{ height: '36px', bgcolor: 'mari.Primary', borderRadius: '8px' }}
          >
            MI 수급모델 실행
          </MIBaseButton>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioModelExecutionPopupContent
