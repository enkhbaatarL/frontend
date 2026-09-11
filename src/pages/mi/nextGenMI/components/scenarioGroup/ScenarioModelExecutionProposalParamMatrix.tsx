/** #DELETE: 추천 파라미터 표 목 UI (API 연동 후 파일 삭제) */
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import ReplayIcon from '@/components/common/icons/ReplayIcon'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
// #DELETE: 파라미터 표 목 데이터 (API 연동 후 ParamMatrix와 함께 삭제)
import {
  createProposalParamMatrixMock,
  type ProposalParamColumnStatus,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalParamMock'

export interface ProposalParamVisibleScenario {
  scenarioId: number
  scenarioName: string
  status: ProposalParamColumnStatus
}

interface ScenarioModelExecutionProposalParamMatrixProps {
  visibleScenarios: ProposalParamVisibleScenario[]
  /** 증가 시 수정값을 추천값으로 전부 초기화 */
  resetToken?: number
  onHasEditsChange?: (hasEdits: boolean) => void
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

/** Event List / MIDataTableBody와 동일: MUI Skeleton opacity pulse */
const ParamInputSkeleton = () => <Skeleton variant="rounded" width="100%" height="28px" sx={{ maxWidth: '100%', borderRadius: '10px' }} />

const ProposalParamEditableCell = ({
  recommendedValue,
  value,
  onChange,
  onReset,
}: {
  recommendedValue: string
  value: string
  onChange: (nextValue: string) => void
  onReset: () => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const isEdited = value !== recommendedValue

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
  resetToken = 0,
  onHasEditsChange,
}: ScenarioModelExecutionProposalParamMatrixProps) => {
  // #DELETE: 시나리오별 추천 파라미터 표 목
  const matrix = useMemo(() => createProposalParamMatrixMock(visibleScenarios.map((scenario) => scenario.scenarioId)), [visibleScenarios])
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  useEffect(() => {
    setEditedValues({})
  }, [resetToken, visibleScenarios])

  useEffect(() => {
    onHasEditsChange?.(Object.keys(editedValues).length > 0)
  }, [editedValues, onHasEditsChange])

  const rows = useMemo<ProposalParamMatrixRow[]>(
    () =>
      matrix.fixedRows.map((fixedValues, rowIndex) => {
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
      }),
    [matrix.fixedRows, matrix.periods, visibleScenarios],
  )

  const columns = useMemo<NextGenMIStickyTableColumn<ProposalParamMatrixRow>[]>(() => {
    const fixedColumns: NextGenMIStickyTableColumn<ProposalParamMatrixRow>[] = matrix.fixedHeaders.map((header, headerIndex) => ({
      field: `fixed-${headerIndex}`,
      headerName: header,
      width: FIXED_COLUMN_WIDTH,
      minWidth: FIXED_COLUMN_WIDTH,
      align: 'left',
      headerAlign: 'left',
      headerCellSx: {
        bgcolor: 'gray.5',
        color: 'contentText.Subtext',
        fontWeight: 600,
        verticalAlign: 'bottom',
        borderBottom: '1px solid',
        borderColor: 'contentBorder.Normal',
      },
      cellSx: { bgcolor: 'commonColor.White', color: 'contentText.Normal' },
      renderCell: ({ row }) => row.fixedValues[headerIndex] ?? '-',
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

      const baseColumn: NextGenMIStickyTableColumn<ProposalParamMatrixRow> = {
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

      const scenarioColumns: NextGenMIStickyTableColumn<ProposalParamMatrixRow>[] = visibleScenarios.map((scenario, scenarioIndex) => {
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
            const recommendedValue = row.recommendedValues[fieldKey] ?? ''
            const value = editedValues[valueKey] ?? recommendedValue

            return (
              <ProposalParamEditableCell
                recommendedValue={recommendedValue}
                value={value}
                onChange={(nextValue) => {
                  setEditedValues((current) => {
                    if (nextValue === recommendedValue) {
                      const { [valueKey]: _removed, ...rest } = current
                      return rest
                    }
                    return { ...current, [valueKey]: nextValue }
                  })
                }}
                onReset={() => {
                  setEditedValues((current) => {
                    const { [valueKey]: _removed, ...rest } = current
                    return rest
                  })
                }}
              />
            )
          },
        }
      })

      return [baseColumn, ...scenarioColumns]
    })

    return [...fixedColumns, ...valueColumns]
  }, [editedValues, matrix.fixedHeaders, matrix.periods, visibleScenarios])

  const fixedLeftColumnIndexes = useMemo(() => matrix.fixedHeaders.map((_, index) => index), [matrix.fixedHeaders])

  return (
    <Box width="100%" minWidth={0} overflow="hidden" bgcolor="commonColor.White">
      <NextGenMIStickyTable
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
