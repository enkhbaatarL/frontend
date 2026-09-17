import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

import type {
  ProposalParamColumnStatus,
  ProposalParamMatrixData,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalMapping'

import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import ReplayIcon from '@/components/common/icons/ReplayIcon'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioGroupStickyTable, {
  type ScenarioGroupStickyTableColumn,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupStickyTable'

export interface ProposalParamVisibleScenario {
  scenarioId: number
  scenarioName: string
  status: ProposalParamColumnStatus
}

interface ScenarioModelExecutionProposalParamMatrixProps {
  visibleScenarios: ProposalParamVisibleScenario[]
  matrix: ProposalParamMatrixData | null
  /** 증가 시 수정값을 추천값으로 전부 초기화 */
  resetToken?: number
  onHasEditsChange?: (hasEdits: boolean) => void
  onChangeScenarioValue?: (scenarioId: number, periodTimeKey: string, rowIndex: number, nextValue: number) => void
}

interface ProposalParamMatrixRow {
  rowKey: string
  rowIndex: number
  fixedValues: string[]
  recommendedValues: Record<string, string>
}

const FIXED_COLUMN_WIDTH = '95px'
const MI_BASE_COLUMN_WIDTH = 88
const SCENARIO_COLUMN_WIDTH = 100
const EDITED_INPUT_BORDER = '#efa460'
const EDITED_INPUT_BG = 'rgba(245, 159, 0, 0.05)'

const getValueKey = (periodLabel: string, scenarioId: number, rowIndex: number) => `${periodLabel}::${scenarioId}::${rowIndex}`

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
  onChange,
  onReset,
}: {
  baselineValue: string
  value: string
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

  const commitDraft = () => {
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

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" width="100%" minWidth={0}>
      {isEditing ? (
        <Box
          component="input"
          ref={inputRef}
          value={draftValue}
          inputMode="decimal"
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
            borderColor: isEdited ? EDITED_INPUT_BORDER : 'contentBorder.Normal',
            borderRadius: '10px',
            bgcolor: isEdited ? EDITED_INPUT_BG : 'commonColor.White',
            color: 'contentText.Normal',
            fontFamily: 'inherit',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: 1.4,
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <Box
          component="button"
          type="button"
          onClick={() => setIsEditing(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '1 1 0',
            minWidth: '54px',
            height: '28px',
            padding: '8px 12px',
            border: '1px solid',
            borderColor: isEdited ? EDITED_INPUT_BORDER : 'contentBorder.Normal',
            borderRadius: '10px',
            bgcolor: isEdited ? EDITED_INPUT_BG : 'commonColor.White',
            boxSizing: 'border-box',
            overflow: 'hidden',
            cursor: 'text',
            '&:hover': {
              bgcolor: isEdited ? EDITED_INPUT_BG : 'contentBG.Active',
            },
          }}
        >
          <Typography variant="body3M12" color="contentText.Normal" noWrap textAlign="center" width="100%">
            {value}
          </Typography>
        </Box>
      )}
      {isEdited ? (
        <Box
          component="button"
          type="button"
          aria-label="추천값으로 되돌리기"
          onClick={(event) => {
            event.stopPropagation()
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
            color: 'contentIcon.Enabled',
            cursor: 'pointer',
            flexShrink: 0,
            lineHeight: 0,
          }}
        >
          <ReplayIcon width="14px" height="14px" />
        </Box>
      ) : (
        <Box
          component="span"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          width="18px"
          height="18px"
          color="contentIcon.Enabled"
          flexShrink={0}
          aria-hidden
        >
          <InfoOutlineIcon width="14px" height="14px" />
        </Box>
      )}
    </Stack>
  )
}

const ScenarioModelExecutionProposalParamMatrix = ({
  visibleScenarios,
  matrix,
  resetToken = 0,
  onHasEditsChange,
  onChangeScenarioValue,
}: ScenarioModelExecutionProposalParamMatrixProps) => {
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [baselineValues, setBaselineValues] = useState<Record<string, string>>({})

  // 표 구조(기간/시나리오/슬롯) 또는 초기화 토큰이 바뀔 때만 baseline 재스냅샷.
  // compare 편집으로 matrix 값만 바뀌는 경우에는 baseline을 유지해야 주황 수정 표시가 유지됨.
  const matrixStructureKey = useMemo(() => {
    if (!matrix) return `empty:${resetToken}`
    return JSON.stringify({
      resetToken,
      headers: matrix.fixedHeaders,
      rowCount: matrix.fixedRows.length,
      periods: matrix.periods.map((period) => period.periodLabel),
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
          const valueKey = getValueKey(period.periodLabel, scenario.scenarioId, rowIndex)
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
            const valueKey = getValueKey(period.periodLabel, scenario.scenarioId, rowIndex)
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
          const valueKey = getValueKey(period.periodLabel, scenario.scenarioId, rowIndex)
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
      matrix.periods.forEach((period) => {
        recommendedValues[`${period.periodLabel}::base`] = period.miBaseValues[rowIndex] ?? '-'
        visibleScenarios.forEach((scenario) => {
          recommendedValues[`${period.periodLabel}::${scenario.scenarioId}`] =
            period.scenarioValuesById[scenario.scenarioId]?.[rowIndex] ?? ''
        })
      })
      return {
        rowKey: `row-${rowIndex}`,
        rowIndex,
        fixedValues,
        recommendedValues,
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
      cellSx: { bgcolor: 'commonColor.White', color: 'contentText.Normal' },
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
        id: period.periodLabel,
        label: period.periodLabel,
        align: 'center' as const,
        headerCellSx: {
          bgcolor: 'gray.5',
          ...periodGroupDividerSx,
        },
      }

      const baseColumn: ScenarioGroupStickyTableColumn<ProposalParamMatrixRow> = {
        field: `${period.periodLabel}::base`,
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
          ...(visibleScenarios.length === 0 ? periodGroupDividerSx : undefined),
        },
        renderCell: ({ row }) => (
          <Stack width="100%" height="28px" alignItems="center" justifyContent="center" boxSizing="border-box">
            <Typography variant="body3M12" color="contentText.Normal" noWrap textAlign="center" width="100%">
              {row.recommendedValues[`${period.periodLabel}::base`] ?? '-'}
            </Typography>
          </Stack>
        ),
      }

      const scenarioColumns: ScenarioGroupStickyTableColumn<ProposalParamMatrixRow>[] = visibleScenarios.map((scenario, scenarioIndex) => {
        const isLastScenarioInPeriod = scenarioIndex === visibleScenarios.length - 1

        return {
          field: `${period.periodLabel}::${scenario.scenarioId}`,
          headerName: scenario.scenarioName,
          headerGroup: periodHeaderGroup,
          tooltipWhenHeaderTruncated: true,
          headerTooltipTitle: scenario.scenarioName,
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
            ...(isLastScenarioInPeriod ? periodGroupDividerSx : undefined),
          },
          renderCell: ({ row }) => {
            if (scenario.status === 'generating') {
              return (
                <Stack width="100%" height="100%" alignItems="center" justifyContent="center">
                  <Box width="72px">
                    <ParamInputSkeleton />
                  </Box>
                </Stack>
              )
            }

            const fieldKey = `${period.periodLabel}::${scenario.scenarioId}`
            const valueKey = getValueKey(period.periodLabel, scenario.scenarioId, row.rowIndex)
            const matrixValue = row.recommendedValues[fieldKey] ?? ''
            const baselineValue = baselineValues[valueKey] ?? matrixValue
            const value = editedValues[valueKey] ?? matrixValue

            return (
              <ProposalParamEditableCell
                baselineValue={baselineValue}
                value={value}
                onChange={(nextValue) => {
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
  }, [baselineValues, editedValues, matrix, onChangeScenarioValue, visibleScenarios])

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
    <Box width="100%" minWidth={0} overflow="hidden" bgcolor="commonColor.White">
      <ScenarioGroupStickyTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.rowKey}
        fixedLeftColumnIndexes={fixedLeftColumnIndexes}
        headerHeight="48px"
        rowHeight="42px"
        maxHeight="468px"
        cellPaddingX="8px"
        cellPaddingY="6px"
        headerFontSize="12px"
        bodyFontSize="12px"
        containerShell={false}
        fitContentWidth
        noRowMessage="파라미터 데이터가 없습니다."
      />
    </Box>
  )
}

export default ScenarioModelExecutionProposalParamMatrix
