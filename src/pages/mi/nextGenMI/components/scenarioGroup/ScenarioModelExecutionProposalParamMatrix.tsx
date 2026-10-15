import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

import type { PowerMixValidationError } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionPowerMixValidation'
import type {
  ProposalParamColumnStatus,
  ProposalParamMatrixData,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalMapping'
import type { ModelParamCompareScenario } from '@/service/mi/nextGenMI/modelExecution'

import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import ReplayIcon from '@/components/common/icons/ReplayIcon'
import WarningIconRed from '@/components/common/icons/WarningIconRed'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioGroupStickyTable, {
  type ScenarioGroupStickyTableColumn,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupStickyTable'
import { getPowerMixRecommendedValue } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionPowerMixValidation'
import { getNumericDisplayValue } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalMapping'

export interface ProposalParamVisibleScenario {
  scenarioId: number
  displayOrder: number
  scenarioName: string
  status: ProposalParamColumnStatus
}

interface ScenarioModelExecutionProposalParamMatrixProps {
  visibleScenarios: ProposalParamVisibleScenario[]
  proposalScenarios: ModelParamCompareScenario[]
  matrix: ProposalParamMatrixData | null
  receivedMatrix: ProposalParamMatrixData | null
  powerMixErrors: PowerMixValidationError[]
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
  /** fieldKey(`${timeKey}::${scenarioId}`) -> compare cells null 비활성 */
  cellDisabledByField: Record<string, boolean>
}

const FIXED_COLUMN_WIDTH = '140px'
const MI_BASE_COLUMN_WIDTH = 88
const SCENARIO_COLUMN_WIDTH = 160
const MI_BASE_BG = '#eef6ff'
const EDITED_INPUT_BORDER = '#efa460'
const EDITED_INPUT_BG = 'rgba(245, 159, 0, 0.05)'

const getValueKey = (periodTimeKey: string, scenarioId: number, rowIndex: number) => `${periodTimeKey}::${scenarioId}::${rowIndex}`

const snapshotBaselineFromMatrix = (source: ProposalParamMatrixData) => {
  const nextBaseline: Record<string, string> = {}
  source.periods.forEach((period) => {
    Object.keys(period.scenarioValuesById).forEach((scenarioIdKey) => {
      const scenarioId = Number(scenarioIdKey)
      if (!Number.isFinite(scenarioId)) return
      source.fixedRows.forEach((_, rowIndex) => {
        const valueKey = getValueKey(period.timeKey, scenarioId, rowIndex)
        nextBaseline[valueKey] = period.scenarioValuesById[scenarioId]?.[rowIndex] ?? ''
      })
    })
  })
  return nextBaseline
}

/** 숫자 문자열 비교용 - 24.40 / 24.4 를 동일로 취급 */
const normalizeParamValue = (value: string) => {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '-') return trimmed
  const numeric = Number(trimmed)
  if (!Number.isFinite(numeric)) return trimmed
  return String(numeric)
}

/** 생성 중 compare 미도착 등으로 들어간 자리표시값 */
const isParamValuePlaceholder = (value: string) => {
  const normalized = normalizeParamValue(value)
  return normalized === '' || normalized === '-'
}

const isParamValueEdited = (value: string, baselineValue: string) => normalizeParamValue(value) !== normalizeParamValue(baselineValue)

/** Event List / MIDataTableBody와 동일: MUI Skeleton opacity pulse */
const ParamInputSkeleton = () => <Skeleton variant="rounded" width="100%" height="28px" sx={{ maxWidth: '100%', borderRadius: '10px' }} />

const ProposalParamEditableCell = ({
  baselineValue,
  isMiBaseValue,
  value,
  showRawValue,
  rationale,
  validationError,
  disabled = false,
  onChange,
  onReset,
}: {
  baselineValue: string
  isMiBaseValue: boolean
  value: string
  showRawValue: boolean
  rationale?: string
  validationError?: string
  disabled?: boolean
  onChange: (nextValue: string) => void
  onReset: () => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  // 추천(초기)값 대비 변경 여부 - compare 반영 후에도 baseline 기준으로 주황 테두리/되돌리기 유지
  const isEdited = isParamValueEdited(value, baselineValue)
  const tooltipTitle = isMiBaseValue ? 'MI Base 값 적용' : rationale?.trim()

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

  if (normalizeParamValue(value) === '-' && !validationError) {
    return (
      <Stack width="100%" height="28px" justifyContent="center" padding="0 12px" boxSizing="border-box">
        <Typography variant="body3M12" color="contentText.Normal" textAlign="right">
          -
        </Typography>
      </Stack>
    )
  }

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
    if (isParamValueEdited(trimmed, value)) onChange(trimmed)
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

  const inputBorderColor = disabled
    ? 'contentBorder.Disabled'
    : validationError
      ? 'contentBorder.Error'
      : isEdited
        ? EDITED_INPUT_BORDER
        : 'contentBorder.Normal'
  const inputBgColor = disabled ? 'contentBG.Disabled' : isEdited && !validationError ? EDITED_INPUT_BG : 'commonColor.White'
  const inputTextColor = disabled ? 'contentText.Disabled' : 'contentText.Normal'

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      gap="2px"
      width="100%"
      minWidth={0}
      data-mi-base-matched={isMiBaseValue ? 'true' : undefined}
    >
      {isEditing && !disabled ? (
        <Box
          component="input"
          ref={inputRef}
          value={draftValue}
          inputMode="decimal"
          aria-invalid={Boolean(validationError)}
          aria-label={validationError}
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
          aria-invalid={Boolean(validationError)}
          aria-label={validationError}
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setDraftValue(value)
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
              bgcolor: validationError ? 'commonColor.White' : isEdited ? EDITED_INPUT_BG : 'contentBG.Active',
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
            {showRawValue || isParamValuePlaceholder(value) || !Number.isFinite(Number(value))
              ? value
              : getNumericDisplayValue(Number(value))}
          </Typography>
        </Box>
      )}
      {validationError ? (
        <NextGenMIFollowCursorTooltip
          title={validationError}
          followCursor={false}
          interactive
          placement="top"
          tooltipSx={{ bgcolor: 'contentText.Error', color: 'contentText.White' }}
        >
          <Box component="span" role="img" aria-label={validationError} display="inline-flex" width="18px" height="18px" flexShrink={0}>
            <WarningIconRed aria-hidden />
          </Box>
        </NextGenMIFollowCursorTooltip>
      ) : isEdited ? (
        <NextGenMIFollowCursorTooltip title={`기본값: ${baselineValue} → 변경값: ${value}`}>
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
        </NextGenMIFollowCursorTooltip>
      ) : tooltipTitle ? (
        <NextGenMIFollowCursorTooltip title={tooltipTitle} tooltipSx={{ maxWidth: '800px' }}>
          <Box
            component="span"
            role="img"
            aria-label={isMiBaseValue ? tooltipTitle : `추천 근거: ${tooltipTitle}`}
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
  proposalScenarios,
  matrix,
  receivedMatrix,
  powerMixErrors,
  scrollResetKey,
  resetToken = 0,
  disabled = false,
  onHasEditsChange,
  onChangeScenarioValue,
}: ScenarioModelExecutionProposalParamMatrixProps) => {
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [baselineValues, setBaselineValues] = useState<Record<string, string>>({})
  const [lastEditedRows, setLastEditedRows] = useState<Record<string, { rowIndex: number; proposalId?: number }>>({})
  const proposalIdsRef = useRef(new Map<number, number>())
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const [tableHeight, setTableHeight] = useState(0)
  const [tableViewportWidth, setTableViewportWidth] = useState(0)
  const hasMatrix = matrix !== null

  useLayoutEffect(() => {
    const container = tableContainerRef.current
    if (!container) return undefined

    // 부모가 배분한 높이 안에서만 표를 스크롤한다.
    const updateSize = () => {
      setTableHeight(container.clientHeight)
      setTableViewportWidth(tableScrollRef.current?.clientWidth ?? 0)
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [hasMatrix])

  useLayoutEffect(() => {
    if (!tableScrollRef.current) return
    tableScrollRef.current.scrollLeft = 0
    tableScrollRef.current.scrollTop = 0
  }, [scrollResetKey])

  // 표 구조(기간/슬롯)가 바뀔 때만 baseline 전체 재스냅샷.
  // scenarioIds는 키에 넣지 않음 - 표시 토글·시나리오 구성 변동으로 수정 상태(주황/초기화)가 초기화되면 안 됨.
  const matrixStructureKey = useMemo(() => {
    if (!matrix) return 'empty'
    return JSON.stringify({
      headers: matrix.fixedHeaders,
      rowCount: matrix.fixedRows.length,
      periods: matrix.periods.map((period) => period.timeKey),
    })
  }, [matrix])

  // 상태 조회와 compare는 도착 순서가 다를 수 있으므로, 값과 함께 받은 제안 ID로 재생성을 판별한다.
  // 재생성된 시나리오만 새 추천값으로 교체하고 나머지 시나리오의 직접 수정값은 유지한다.
  useEffect(() => {
    if (!matrix) return

    const regeneratedScenarioIds = new Set<number>()
    proposalScenarios.forEach(({ scenarioId, modelParamProposalId }) => {
      if (typeof modelParamProposalId !== 'number') return
      const previousProposalId = proposalIdsRef.current.get(scenarioId)
      if (previousProposalId !== undefined && previousProposalId !== modelParamProposalId) {
        regeneratedScenarioIds.add(scenarioId)
      }
      proposalIdsRef.current.set(scenarioId, modelParamProposalId)
    })
    if (regeneratedScenarioIds.size === 0) return

    const regeneratedValues: Record<string, string> = {}
    matrix.periods.forEach((period) => {
      regeneratedScenarioIds.forEach((scenarioId) => {
        matrix.fixedRows.forEach((_, rowIndex) => {
          regeneratedValues[getValueKey(period.timeKey, scenarioId, rowIndex)] = period.scenarioValuesById[scenarioId]?.[rowIndex] ?? ''
        })
      })
    })
    setBaselineValues((current) => ({ ...current, ...regeneratedValues }))
    setEditedValues((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !(key in regeneratedValues))))
  }, [matrix, proposalScenarios])

  useEffect(() => {
    if (!matrix) {
      setBaselineValues({})
      setEditedValues({})
      return
    }

    setBaselineValues(snapshotBaselineFromMatrix(matrix))
    setEditedValues({})
  }, [matrixStructureKey]) // eslint-disable-line react-hooks/exhaustive-deps -- matrix 값 변경이 아닌 구조 키만 의존

  // matrix에 새로 등장한 시나리오/셀만 baseline 보강. 기존 키·수정값은 유지.
  useEffect(() => {
    if (!matrix) return
    const fromMatrix = snapshotBaselineFromMatrix(matrix)
    setBaselineValues((current) => {
      let changed = false
      const next = { ...current }
      Object.entries(fromMatrix).forEach(([key, value]) => {
        if (next[key] !== undefined) return
        next[key] = value
        changed = true
      })
      return changed ? next : current
    })
  }, [matrix])

  // 초기화: 부모가 compare를 조회본으로 되돌린 뒤 토큰을 올리므로, 그 matrix 기준으로 baseline도 다시 맞춤.
  useEffect(() => {
    if (resetToken === 0) return
    setEditedValues({})
    setLastEditedRows({})
    if (!matrix) return
    setBaselineValues(snapshotBaselineFromMatrix(matrix))
  }, [resetToken]) // eslint-disable-line react-hooks/exhaustive-deps -- 토큰 증가 시에만 동기화

  // 생성 중 -> 완료로 값이 처음 채워질 때는 baseline을 갱신해 오탐 수정 표시를 막음
  // 생성 중 새 컬럼은 compare에 값이 없어 baseline이 '-'로 먼저 들어가므로, placeholder(-/'')도 실제값으로 승격
  useEffect(() => {
    if (!matrix) return

    setBaselineValues((current) => {
      let changed = false
      const next = { ...current }

      matrix.periods.forEach((period) => {
        Object.keys(period.scenarioValuesById).forEach((scenarioIdKey) => {
          const scenarioId = Number(scenarioIdKey)
          if (!Number.isFinite(scenarioId)) return
          const scenarioStatus = visibleScenarios.find((scenario) => scenario.scenarioId === scenarioId)?.status
          // 표시 중인 generating 컬럼만 스킵. 숨김 시나리오는 status 없으므로 기존 baseline 유지/보강만 수행
          if (scenarioStatus === 'generating') return
          matrix.fixedRows.forEach((_, rowIndex) => {
            const valueKey = getValueKey(period.timeKey, scenarioId, rowIndex)
            if (editedValues[valueKey] !== undefined) return
            const matrixValue = period.scenarioValuesById[scenarioId]?.[rowIndex] ?? ''
            const baselineValue = next[valueKey]
            if (baselineValue === undefined) {
              next[valueKey] = matrixValue
              changed = true
              return
            }
            if (isParamValuePlaceholder(baselineValue) && !isParamValuePlaceholder(matrixValue)) {
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

    // 숨긴 시나리오의 수정도 초기화 버튼 활성에 반영 (표시 토글과 무관하게 편집 유지)
    const hasEdits = matrix.periods.some((period) =>
      Object.keys(period.scenarioValuesById).some((scenarioIdKey) => {
        const scenarioId = Number(scenarioIdKey)
        if (!Number.isFinite(scenarioId)) return false
        return matrix.fixedRows.some((_, rowIndex) => {
          // cells null 비활성 슬롯은 편집 대상이 아님
          if (period.scenarioCellDisabledById[scenarioId]?.[rowIndex]) return false
          const valueKey = getValueKey(period.timeKey, scenarioId, rowIndex)
          const baselineValue = baselineValues[valueKey] ?? ''
          const currentValue = editedValues[valueKey] ?? period.scenarioValuesById[scenarioId]?.[rowIndex] ?? ''
          return isParamValueEdited(currentValue, baselineValue)
        })
      }),
    )
    onHasEditsChange?.(hasEdits)
  }, [baselineValues, editedValues, matrix, onHasEditsChange])

  const rows = useMemo<ProposalParamMatrixRow[]>(() => {
    if (!matrix) return []
    return matrix.fixedRows.map((fixedValues, rowIndex) => {
      const recommendedValues: Record<string, string> = {}
      const recommendedRationales: Record<string, string> = {}
      const cellDisabledByField: Record<string, boolean> = {}
      matrix.periods.forEach((period) => {
        recommendedValues[`${period.timeKey}::base`] = period.miBaseValues[rowIndex] ?? '-'
        visibleScenarios.forEach((scenario) => {
          const fieldKey = `${period.timeKey}::${scenario.scenarioId}`
          recommendedValues[fieldKey] = period.scenarioValuesById[scenario.scenarioId]?.[rowIndex] ?? ''
          recommendedRationales[fieldKey] = period.scenarioRationalesById[scenario.scenarioId]?.[rowIndex] ?? ''
          cellDisabledByField[fieldKey] = period.scenarioCellDisabledById[scenario.scenarioId]?.[rowIndex] ?? false
        })
      })
      return {
        rowKey: `row-${rowIndex}`,
        rowIndex,
        fixedValues,
        recommendedValues,
        recommendedRationales,
        cellDisabledByField,
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
        bgcolor: 'commonColor.White',
        color: 'contentText.Black',
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
      const receivedPeriod = receivedMatrix?.periods.find((item) => item.timeKey === period.timeKey)
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
          bgcolor: 'commonColor.White',
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
          bgcolor: MI_BASE_BG,
          color: 'contentText.Black',
          verticalAlign: 'middle',
          borderBottom: '1px solid',
          borderBottomColor: 'contentBorder.Normal',
          ...(visibleScenarios.length === 0 ? periodGroupDividerSx : undefined),
        },
        cellSx: {
          bgcolor: MI_BASE_BG,
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
        const editKey = JSON.stringify([scrollResetKey, period.timeKey, scenario.scenarioId])
        const proposalId = proposalScenarios.find((item) => item.scenarioId === scenario.scenarioId)?.modelParamProposalId
        const error = powerMixErrors.find((item) => item.scenarioId === scenario.scenarioId && item.periodTimeKey === period.timeKey)
        const lastEdit = lastEditedRows[editKey]
        const errorRowIndex =
          lastEdit && lastEdit.proposalId === proposalId && error?.rowIndexes.includes(lastEdit.rowIndex)
            ? lastEdit.rowIndex
            : error?.rowIndexes[0]

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
            bgcolor: 'commonColor.White',
            color: 'contentText.Black',
            verticalAlign: 'middle',
            borderBottom: '1px solid',
            borderBottomColor: 'contentBorder.Normal',
            ...(isLastScenarioInPeriod ? periodGroupDividerSx : undefined),
          },
          cellSx: {
            bgcolor: 'commonColor.White',
            '&:has([data-mi-base-matched="true"])': {
              bgcolor: MI_BASE_BG,
            },
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
            // compare cells null 슬롯: `-` 대신 빈 입력 + 비활성
            const isCellDisabled = row.cellDisabledByField[fieldKey] === true
            const cellDisabled = disabled || isCellDisabled
            const recommendedValue =
              error && row.rowIndex === errorRowIndex
                ? getPowerMixRecommendedValue(
                  error.rowIndexes
                    .filter((rowIndex) => rowIndex !== row.rowIndex)
                    .map((rowIndex) => period.scenarioValuesById[scenario.scenarioId]?.[rowIndex] ?? ''),
                )
                : undefined

            return (
              <ProposalParamEditableCell
                baselineValue={isCellDisabled ? '' : baselineValue}
                isMiBaseValue={!isCellDisabled && (receivedPeriod?.scenarioMiBaseMatchedById[scenario.scenarioId]?.[row.rowIndex] ?? false)}
                value={isCellDisabled ? '' : value}
                showRawValue={matrix.showRawValues}
                rationale={isCellDisabled ? '' : rationale}
                validationError={
                  error && row.rowIndex === errorRowIndex
                    ? `% Power Mix 합계를 100%로 맞춰 주세요\n${
                      recommendedValue === undefined
                        ? '다른 셀도 함께 조정해 주세요.'
                        : `이 셀을 ${recommendedValue}로 변경하면 합계가 1이 됩니다.`
                    }`
                    : undefined
                }
                disabled={cellDisabled}
                onChange={(nextValue) => {
                  if (cellDisabled) return
                  if (isParamValueEdited(nextValue, value)) {
                    setLastEditedRows((current) => ({ ...current, [editKey]: { rowIndex: row.rowIndex, proposalId } }))
                  }
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
                  if (cellDisabled) return
                  setLastEditedRows((current) => ({ ...current, [editKey]: { rowIndex: row.rowIndex, proposalId } }))
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
  }, [
    baselineValues,
    disabled,
    editedValues,
    lastEditedRows,
    matrix,
    onChangeScenarioValue,
    powerMixErrors,
    proposalScenarios,
    receivedMatrix,
    scrollResetKey,
    visibleScenarios,
  ])

  const fittedColumns = useMemo(() => {
    const contentWidth = columns.reduce((width, column) => width + Number.parseFloat(column.width), 0)
    const flexibleColumns = columns.filter((column) => column.headerGroup)
    if (contentWidth >= tableViewportWidth || flexibleColumns.length === 0) return columns

    const additionalWidth = (tableViewportWidth - contentWidth) / flexibleColumns.length

    return columns.map((column) => {
      if (!column.headerGroup) return column

      const width = `${Number.parseFloat(column.width) + additionalWidth}px`
      return { ...column, width, minWidth: width, maxWidth: width }
    })
  }, [columns, tableViewportWidth])

  const fixedLeftColumnIndexes = useMemo(() => matrix?.fixedHeaders.map((_, index) => index) ?? [], [matrix?.fixedHeaders])

  if (!matrix) {
    return (
      <Stack
        flex="1 1 0"
        minHeight={0}
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
    <Box ref={tableContainerRef} width="100%" flex="1 1 0" minWidth={0} minHeight={0} overflow="visible" bgcolor="commonColor.White">
      <ScenarioGroupStickyTable
        columns={fittedColumns}
        rows={rows}
        getRowKey={(row) => row.rowKey}
        scrollContainerRef={tableScrollRef}
        overlayVerticalScrollbar
        verticalScrollbarRight="-10px"
        fixedLeftColumnIndexes={fixedLeftColumnIndexes}
        headerHeight="48px"
        rowHeight="42px"
        maxHeight={`${tableHeight}px`}
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
