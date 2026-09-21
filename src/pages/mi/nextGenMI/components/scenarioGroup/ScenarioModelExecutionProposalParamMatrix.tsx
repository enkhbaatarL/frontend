import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

import type {
  ProposalParamColumnStatus,
  ProposalParamMatrixData,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalMapping'

import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import ReplayIcon from '@/components/common/icons/ReplayIcon'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioGroupStickyTable, {
  type ScenarioGroupStickyTableColumn,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupStickyTable'

export interface ProposalParamVisibleScenario {
  scenarioId: number
  displayOrder: number
  scenarioName: string
  status: ProposalParamColumnStatus
}

interface ScenarioModelExecutionProposalParamMatrixProps {
  visibleScenarios: ProposalParamVisibleScenario[]
  matrix: ProposalParamMatrixData | null
  scrollResetKey: string
  /** 증가 시 수정값을 추천값으로 전부 초기화 */
  resetToken?: number
  /** 수급모델 제출/초기화 중 Value 입력 잠금 - PopupContent NumericParameterValueInput 과 동일 */
  disabled?: boolean
  onHasEditsChange?: (hasEdits: boolean) => void
  onChangeScenarioValue?: (scenarioId: number, periodTimeKey: string, rowIndex: number, nextValue: number) => void
}

interface ProposalParamMatrixRow {
  rowKey: string
  rowIndex: number
  fixedValues: string[]
  recommendedValues: Record<string, string>
  recommendedRationales: Record<string, string>
}

const FIXED_COLUMN_WIDTH = '140px'
const MI_BASE_COLUMN_WIDTH = 88
const SCENARIO_COLUMN_WIDTH = 160
const EDITED_INPUT_BORDER = '#efa460'
const EDITED_INPUT_BG = 'rgba(245, 159, 0, 0.05)'

const getValueKey = (periodTimeKey: string, scenarioId: number, rowIndex: number) => `${periodTimeKey}::${scenarioId}::${rowIndex}`

/** 숫자 문자열 비교용 - 24.40 / 24.4 를 동일로 취급 */
const normalizeParamValue = (value: string) => {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '-') return trimmed
  const numeric = Number(trimmed)
  if (!Number.isFinite(numeric)) return trimmed
  return String(numeric)
}

const isParamValueEdited = (value: string, baselineValue: string) => normalizeParamValue(value) !== normalizeParamValue(baselineValue)

/** Event List / MIDataTableBody와 동일: MUI Skeleton opacity pulse */
const ParamInputSkeleton = () => <Skeleton variant="rounded" width="100%" height="28px" sx={{ maxWidth: '100%', borderRadius: '10px' }} />

const ProposalParamEditableCell = ({
  baselineValue,
  value,
  rationale,
  disabled = false,
  onChange,
  onReset,
}: {
  baselineValue: string
  value: string
  rationale?: string
  disabled?: boolean
  onChange: (nextValue: string) => void
  onReset: () => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  // 추천(초기)값 대비 변경 여부 - compare 반영 후에도 baseline 기준으로 주황 테두리/되돌리기 유지
  const isEdited = isParamValueEdited(value, baselineValue)

  useEffect(() => {
    if (globalThis.document?.activeElement === inputRef.current) return
    setDraftValue(value)
  }, [value])

  useEffect(() => {
    if (!isEditing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isEditing])

  // 수급모델 제출/실행 시작 시 편집 중이면 표시 모드로 복귀 (PopupContent NumericParameterValueInput 과 동일)
  useEffect(() => {
    if (!disabled) return
    setIsEditing(false)
    setDraftValue(value)
  }, [disabled, value])

  const commitDraft = () => {
    if (disabled) {
      setDraftValue(value)
      setIsEditing(false)
      return
    }
    const trimmed = draftValue.trim()
    if (trimmed === '' || trimmed === '-' || !/^-?\d*(?:\.\d*)?$/.test(trimmed) || !Number.isFinite(Number(trimmed))) {
      setDraftValue(value)
      setIsEditing(false)
      return
    }
    onChange(trimmed)
    setIsEditing(false)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitDraft()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setDraftValue(value)
      setIsEditing(false)
    }
  }

  const inputBorderColor = disabled ? 'contentBorder.Disabled' : isEdited ? EDITED_INPUT_BORDER : 'contentBorder.Normal'
  const inputBgColor = disabled ? 'contentBG.Disabled' : isEdited ? EDITED_INPUT_BG : 'commonColor.White'
  const inputTextColor = disabled ? 'contentText.Disabled' : 'contentText.Normal'

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" width="100%" minWidth={0}>
      {isEditing && !disabled ? (
        <Box
          component="input"
          ref={inputRef}
          value={draftValue}
          inputMode="decimal"
          disabled={disabled}
          onChange={(event) => {
            if (!/^-?\d*(?:\.\d*)?$/.test(event.target.value)) return
            setDraftValue(event.target.value)
          }}
          onBlur={commitDraft}
          onKeyDown={handleKeyDown}
          sx={{
            flex: '1 1 0',
            minWidth: '54px',
            width: '100%',
            height: '28px',
            padding: '8px 12px',
            border: '1px solid',
            borderColor: inputBorderColor,
            borderRadius: '10px',
            bgcolor: inputBgColor,
            color: inputTextColor,
            fontFamily: 'inherit',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: 1.4,
            textAlign: 'right',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <Box
          component="button"
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setIsEditing(true)
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: '1 1 0',
            minWidth: '54px',
            height: '28px',
            padding: '8px 12px',
            border: '1px solid',
            borderColor: inputBorderColor,
            borderRadius: '10px',
            bgcolor: inputBgColor,
            boxSizing: 'border-box',
            overflow: 'hidden',
            cursor: disabled ? 'default' : 'text',
            '&:hover:not(:disabled)': {
              bgcolor: isEdited ? EDITED_INPUT_BG : 'contentBG.Active',
            },
            '&:disabled': {
              borderColor: 'contentBorder.Disabled',
              bgcolor: 'contentBG.Disabled',
              color: 'contentText.Disabled',
              cursor: 'default',
            },
          }}
        >
          <Typography variant="body3M12" color={inputTextColor} noWrap textAlign="right" width="100%">
            {value}
          </Typography>
        </Box>
      )}
      {isEdited ? (
        <Box
          component="button"
          type="button"
          aria-label="추천값으로 되돌리기"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation()
            if (disabled) return
            onReset()
          }}
          onMouseDown={(event) => event.stopPropagation()}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            padding: 0,
            border: 0,
            bgcolor: 'transparent',
            color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled',
            cursor: disabled ? 'default' : 'pointer',
            flexShrink: 0,
            lineHeight: 0,
          }}
        >
          <ReplayIcon width="14px" height="14px" />
        </Box>
      ) : rationale?.trim() ? (
        <NextGenMIFollowCursorTooltip title={rationale.trim()} tooltipSx={{ maxWidth: '800px' }}>
          <Box
            component="span"
            role="img"
            aria-label={`추천 근거: ${rationale.trim()}`}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            width="18px"
            height="18px"
            color="contentIcon.Enabled"
            flexShrink={0}
            lineHeight={0}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <InfoOutlineIcon width="14px" height="14px" aria-hidden focusable="false" />
          </Box>
        </NextGenMIFollowCursorTooltip>
      ) : (
        <Box width="18px" height="18px" flexShrink={0} aria-hidden />
      )}
    </Stack>
  )
}

const ScenarioModelExecutionProposalParamMatrix = ({
  visibleScenarios,
  matrix,
  scrollResetKey,
  resetToken = 0,
  disabled = false,
  onHasEditsChange,
  onChangeScenarioValue,
}: ScenarioModelExecutionProposalParamMatrixProps) => {
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [baselineValues, setBaselineValues] = useState<Record<string, string>>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const [tableHeight, setTableHeight] = useState<number | null>(null)
  const hasMatrix = matrix !== null

  useLayoutEffect(() => {
    const container = tableContainerRef.current
    if (!container) return undefined

    const updateHeight = () => {
      const height = Math.floor(container.getBoundingClientRect().height)
      setTableHeight((current) => (current === height ? current : height))
    }
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(container)
    return () => observer.disconnect()
  }, [hasMatrix])

  useLayoutEffect(() => {
    if (!tableScrollRef.current) return
    tableScrollRef.current.scrollLeft = 0
    tableScrollRef.current.scrollTop = 0
  }, [scrollResetKey])

  // 표 구조(기간/시나리오/슬롯) 또는 초기화 토큰이 바뀔 때만 baseline 재스냅샷.
  // compare 편집으로 matrix 값만 바뀌는 경우에는 baseline을 유지해야 주황 수정 표시가 유지됨.
  const matrixStructureKey = useMemo(() => {
    if (!matrix) return `empty:${resetToken}`
    return JSON.stringify({
      resetToken,
      headers: matrix.fixedHeaders,
      rowCount: matrix.fixedRows.length,
      periods: matrix.periods.map((period) => period.timeKey),
      scenarioIds: visibleScenarios.map((scenario) => scenario.scenarioId),
    })
  }, [matrix, resetToken, visibleScenarios])

  useEffect(() => {
    if (!matrix) {
      setBaselineValues({})
      setEditedValues({})
      return
    }

    const nextBaseline: Record<string, string> = {}
    matrix.periods.forEach((period) => {
      visibleScenarios.forEach((scenario) => {
        matrix.fixedRows.forEach((_, rowIndex) => {
          const valueKey = getValueKey(period.timeKey, scenario.scenarioId, rowIndex)
          nextBaseline[valueKey] = period.scenarioValuesById[scenario.scenarioId]?.[rowIndex] ?? ''
        })
      })
    })
    setBaselineValues(nextBaseline)
    setEditedValues({})
  }, [matrixStructureKey]) // eslint-disable-line react-hooks/exhaustive-deps -- matrix 값 변경이 아닌 구조 키만 의존

  // 생성 중 -> 완료로 값이 처음 채워질 때는 baseline을 갱신해 오탐 수정 표시를 막음
  useEffect(() => {
    if (!matrix) return

    setBaselineValues((current) => {
      let changed = false
      const next = { ...current }

      matrix.periods.forEach((period) => {
        visibleScenarios.forEach((scenario) => {
          if (scenario.status !== 'completed') return
          matrix.fixedRows.forEach((_, rowIndex) => {
            const valueKey = getValueKey(period.timeKey, scenario.scenarioId, rowIndex)
            if (editedValues[valueKey] !== undefined) return
            const matrixValue = period.scenarioValuesById[scenario.scenarioId]?.[rowIndex] ?? ''
            const baselineValue = next[valueKey]
            if (baselineValue === undefined) {
              next[valueKey] = matrixValue
              changed = true
              return
            }
            if (normalizeParamValue(baselineValue) === '' && normalizeParamValue(matrixValue) !== '') {
              next[valueKey] = matrixValue
              changed = true
            }
          })
        })
      })

      return changed ? next : current
    })
  }, [editedValues, matrix, visibleScenarios])

  useEffect(() => {
    if (!matrix) {
      onHasEditsChange?.(false)
      return
    }

    const hasEdits = matrix.periods.some((period) =>
      visibleScenarios.some((scenario) =>
        matrix.fixedRows.some((_, rowIndex) => {
          const valueKey = getValueKey(period.timeKey, scenario.scenarioId, rowIndex)
          const baselineValue = baselineValues[valueKey] ?? ''
          const currentValue = editedValues[valueKey] ?? period.scenarioValuesById[scenario.scenarioId]?.[rowIndex] ?? ''
          return isParamValueEdited(currentValue, baselineValue)
        }),
      ),
    )
    onHasEditsChange?.(hasEdits)
  }, [baselineValues, editedValues, matrix, onHasEditsChange, visibleScenarios])

  const rows = useMemo<ProposalParamMatrixRow[]>(() => {
    if (!matrix) return []
    return matrix.fixedRows.map((fixedValues, rowIndex) => {
      const recommendedValues: Record<string, string> = {}
      const recommendedRationales: Record<string, string> = {}
      matrix.periods.forEach((period) => {
        recommendedValues[`${period.timeKey}::base`] = period.miBaseValues[rowIndex] ?? '-'
        visibleScenarios.forEach((scenario) => {
          const fieldKey = `${period.timeKey}::${scenario.scenarioId}`
          recommendedValues[fieldKey] = period.scenarioValuesById[scenario.scenarioId]?.[rowIndex] ?? ''
          recommendedRationales[fieldKey] = period.scenarioRationalesById[scenario.scenarioId]?.[rowIndex] ?? ''
        })
      })
      return {
        rowKey: `row-${rowIndex}`,
        rowIndex,
        fixedValues,
        recommendedValues,
        recommendedRationales,
      }
    })
  }, [matrix, visibleScenarios])

  const columns = useMemo<ScenarioGroupStickyTableColumn<ProposalParamMatrixRow>[]>(() => {
    if (!matrix) return []

    const fixedColumns: ScenarioGroupStickyTableColumn<ProposalParamMatrixRow>[] = matrix.fixedHeaders.map((header, headerIndex) => ({
      field: `fixed-${headerIndex}`,
      headerName: header,
      width: FIXED_COLUMN_WIDTH,
      minWidth: FIXED_COLUMN_WIDTH,
      align: 'left',
      headerAlign: 'left',
      tooltipWhenHeaderTruncated: true,
      headerTooltipTitle: header,
      headerCellSx: {
        bgcolor: 'gray.5',
        color: 'contentText.Subtext',
        fontWeight: 600,
        verticalAlign: 'bottom',
        borderBottom: '1px solid',
        borderColor: 'contentBorder.Normal',
      },
      cellSx: {
        bgcolor: 'commonColor.White',
        color: 'contentText.Normal',
        borderBottom: '1px solid',
        borderBottomColor: 'contentBorder.Normal',
      },
      // 좌측 고정(독립) 컬럼: StickyTable이 ellipsis만 하고 툴팁을 안 주므로 본문에서 말줄임 hover 처리
      renderCell: ({ row }) => (
        <NextGenMITableBodyText
          value={row.fixedValues[headerIndex] ?? '-'}
          variant="body3M12"
          color="contentText.Normal"
          tooltipWhenTruncated
        />
      ),
    }))

    const valueColumns = matrix.periods.flatMap((period, periodIndex) => {
      const isLastPeriod = periodIndex === matrix.periods.length - 1
      const periodGroupDividerSx = isLastPeriod
        ? undefined
        : {
          borderRight: '1px solid',
          borderRightColor: 'contentBorder.Normal',
        }

      const periodHeaderGroup = {
        id: period.timeKey,
        label: period.periodLabel,
        align: 'center' as const,
        headerCellSx: {
          bgcolor: 'gray.5',
          ...periodGroupDividerSx,
        },
      }

      const baseColumn: ScenarioGroupStickyTableColumn<ProposalParamMatrixRow> = {
        field: `${period.timeKey}::base`,
        headerName: 'MI Base',
        headerGroup: periodHeaderGroup,
        width: `${MI_BASE_COLUMN_WIDTH}px`,
        minWidth: `${MI_BASE_COLUMN_WIDTH}px`,
        align: 'center',
        headerAlign: 'center',
        headerCellSx: {
          bgcolor: '#eef6ff',
          verticalAlign: 'middle',
          borderBottom: '1px solid',
          borderBottomColor: 'contentBorder.Normal',
          ...(visibleScenarios.length === 0 ? periodGroupDividerSx : undefined),
        },
        cellSx: {
          bgcolor: '#eef6ff',
          borderBottom: '1px solid',
          borderBottomColor: 'contentBorder.Normal',
          ...(visibleScenarios.length === 0 ? periodGroupDividerSx : undefined),
        },
        renderCell: ({ row }) => (
          <Stack width="100%" height="28px" alignItems="center" justifyContent="center" boxSizing="border-box">
            <Typography variant="body3M12" color="contentText.Normal" noWrap textAlign="center" width="100%">
              {row.recommendedValues[`${period.timeKey}::base`] ?? '-'}
            </Typography>
          </Stack>
        ),
      }

      const scenarioColumns: ScenarioGroupStickyTableColumn<ProposalParamMatrixRow>[] = visibleScenarios.map((scenario, scenarioIndex) => {
        const isLastScenarioInPeriod = scenarioIndex === visibleScenarios.length - 1

        return {
          field: `${period.timeKey}::${scenario.scenarioId}`,
          headerName: scenario.scenarioName,
          headerGroup: periodHeaderGroup,
          headerPrefix: <NextGenMIDisplayOrderBadge value={scenario.displayOrder} height="16px" borderRadius="6px" compact />,
          tooltipWhenHeaderTruncated: true,
          headerTooltipTitle: `${scenario.displayOrder} ${scenario.scenarioName}`,
          width: `${SCENARIO_COLUMN_WIDTH}px`,
          minWidth: `${SCENARIO_COLUMN_WIDTH}px`,
          align: 'center',
          headerAlign: 'center',
          headerCellSx: {
            bgcolor: 'gray.5',
            verticalAlign: 'middle',
            borderBottom: '1px solid',
            borderBottomColor: 'contentBorder.Normal',
            ...(isLastScenarioInPeriod ? periodGroupDividerSx : undefined),
          },
          cellSx: {
            bgcolor: 'commonColor.White',
            borderBottom: '1px solid',
            borderBottomColor: 'contentBorder.Normal',
            ...(isLastScenarioInPeriod ? periodGroupDividerSx : undefined),
          },
          renderCell: ({ row }) => {
            if (scenario.status === 'generating') {
              return (
                <Stack width="100%" height="100%" alignItems="center" justifyContent="center">
                  <ParamInputSkeleton />
                </Stack>
              )
            }

            const fieldKey = `${period.timeKey}::${scenario.scenarioId}`
            const valueKey = getValueKey(period.timeKey, scenario.scenarioId, row.rowIndex)
            const matrixValue = row.recommendedValues[fieldKey] ?? ''
            const baselineValue = baselineValues[valueKey] ?? matrixValue
            const value = editedValues[valueKey] ?? matrixValue
            const rationale = row.recommendedRationales[fieldKey] ?? ''

            return (
              <ProposalParamEditableCell
                baselineValue={baselineValue}
                value={value}
                rationale={rationale}
                disabled={disabled}
                onChange={(nextValue) => {
                  if (disabled) return
                  setEditedValues((current) => {
                    if (!isParamValueEdited(nextValue, baselineValue)) {
                      const { [valueKey]: _removed, ...rest } = current
                      return rest
                    }
                    return { ...current, [valueKey]: nextValue }
                  })
                  const numeric = Number(nextValue)
                  if (Number.isFinite(numeric)) onChangeScenarioValue?.(scenario.scenarioId, period.timeKey, row.rowIndex, numeric)
                }}
                onReset={() => {
                  if (disabled) return
                  setEditedValues((current) => {
                    const { [valueKey]: _removed, ...rest } = current
                    return rest
                  })
                  const numeric = Number(baselineValue)
                  if (Number.isFinite(numeric)) onChangeScenarioValue?.(scenario.scenarioId, period.timeKey, row.rowIndex, numeric)
                }}
              />
            )
          },
        }
      })

      return [baseColumn, ...scenarioColumns]
    })

    return [...fixedColumns, ...valueColumns]
  }, [baselineValues, disabled, editedValues, matrix, onChangeScenarioValue, visibleScenarios])

  const fixedLeftColumnIndexes = useMemo(() => matrix?.fixedHeaders.map((_, index) => index) ?? [], [matrix?.fixedHeaders])

  if (!matrix) {
    return (
      <Stack
        height="240px"
        alignItems="center"
        justifyContent="center"
        border="1px solid"
        borderColor="contentBorder.Normal"
        borderRadius="8px"
      >
        <Typography variant="body3SB12" color="gray.60">
          파라미터 데이터가 없습니다.
        </Typography>
      </Stack>
    )
  }

  return (
    <Box ref={tableContainerRef} width="100%" flex="1 1 0" minWidth={0} minHeight={0} overflow="hidden" bgcolor="commonColor.White">
      <ScenarioGroupStickyTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.rowKey}
        scrollContainerRef={tableScrollRef}
        fixedLeftColumnIndexes={fixedLeftColumnIndexes}
        headerHeight="48px"
        rowHeight="42px"
        maxHeight={tableHeight === null ? '468px' : `${tableHeight}px`}
        cellPaddingX="8px"
        cellPaddingY="6px"
        headerFontSize="12px"
        bodyFontSize="12px"
        containerShell={false}
        noRowMessage="파라미터 데이터가 없습니다."
      />
    </Box>
  )
}

export default ScenarioModelExecutionProposalParamMatrix
