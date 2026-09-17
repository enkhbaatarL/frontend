import type {
  ModelParamColumn,
  ModelParamCompareCell,
  ModelParamCompareParameter,
  ModelParamCompareShape,
  ModelParamCompareValue,
  ModelParamPayloadItem,
  ModelParamProposalCurrentState,
  ScenarioGroupModelParamCompare,
} from '@/service/mi/nextGenMI/modelExecution'

export type ModelParamProposalRowStatus = 'idle' | 'generating' | 'completed' | 'failed' | 'retryable'

export type ProposalParamColumnStatus = 'completed' | 'generating'

/** @deprecated 재시도는 currentState=PROPOSAL_RETRYABLE 로 판별. failureReason 텍스트 매칭은 하위 호환용 */
export const isRetryableFailureReason = (failureReason?: string) => {
  const reason = failureReason?.trim() ?? ''
  if (!reason) return false
  return /네트워크\s*\/\s*시스템\s*일시\s*오류|네트워크.*일시|시스템\s*일시\s*오류|일시\s*오류|통신\s*오류/i.test(reason)
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export const getDisplayValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export const getNumericDisplayValue = (value: number) => value.toFixed(2)

/**
 * 그룹/단건 currentState -> 팝업 상태 컬럼 5종
 * - NOT_REQUESTED -> 생성
 * - GENERATING -> 생성 중
 * - PROPOSAL_READY / CONFIRMED_PENDING_EXECUTION / EXECUTING / EXECUTED_CONFIRMED / EXECUTION_FAILED -> 완료
 * - PROPOSAL_FAILED / PROPOSAL_NO_CHANGES -> 실패
 * - PROPOSAL_RETRYABLE -> 재시도
 */
export const mapProposalStateToRowStatus = (
  currentState: ModelParamProposalCurrentState | undefined,
  _hasCompareScenario: boolean,
  failureReason?: string | null,
): ModelParamProposalRowStatus => {
  switch (currentState) {
    case 'GENERATING':
      return 'generating'
    case 'PROPOSAL_RETRYABLE':
      return 'retryable'
    case 'PROPOSAL_FAILED':
    case 'PROPOSAL_NO_CHANGES':
      return isRetryableFailureReason(failureReason ?? undefined) ? 'retryable' : 'failed'
    case 'PROPOSAL_READY':
    case 'CONFIRMED_PENDING_EXECUTION':
    case 'EXECUTING':
    case 'EXECUTED_CONFIRMED':
    case 'EXECUTION_FAILED':
      return 'completed'
    case 'NOT_REQUESTED':
    default:
      return 'idle'
  }
}

export const canShowVisibilityToggle = (status: ModelParamProposalRowStatus) => status === 'completed' || status === 'generating'

export const isDimmedStatus = (status: ModelParamProposalRowStatus) => status === 'failed' || status === 'retryable'

export const getUniqueModelNames = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))))

const getAxisValue = (row: Record<string, unknown>, column: ModelParamColumn) => {
  const key = column.role ?? column.column
  if (!key) return undefined
  if (row[key] !== undefined) return row[key]
  if (column.column && row[column.column] !== undefined) return row[column.column]
  return undefined
}

const normalizeAxisKey = (column: ModelParamColumn) => (column.role ?? column.column ?? '').trim().toLowerCase()

const isYearAxisKey = (key: string) => key.includes('year')
const isMonthAxisKey = (key: string) => key.includes('month')
const isPeriodIndexAxisKey = (key: string) =>
  /period|index|seq|step|timeindex|time_index|timestep|time_step/.test(key) && !isMonthAxisKey(key) && !isYearAxisKey(key)

/** MATRIX_TIME_COLUMNS 기간 그룹 헤더 - Figma `2026-09 (105)` 형식 */
export const formatMatrixPeriodLabel = (
  timeAxisColumns: ModelParamColumn[],
  row: Record<string, unknown>,
  semanticAxes?: string,
): string => {
  const entries = timeAxisColumns.map((column) => ({
    column,
    value: getAxisValue(row, column),
    key: normalizeAxisKey(column),
  }))

  const semanticAxisKeys = (semanticAxes ?? '')
    .split(',')
    .map((axis) => axis.trim().toLowerCase())
    .filter(Boolean)

  const findValueBySemantic = (predicate: (key: string) => boolean) => {
    const semanticIndex = semanticAxisKeys.findIndex(predicate)
    if (semanticIndex >= 0 && semanticIndex < entries.length) return entries[semanticIndex]?.value
    return entries.find((entry) => predicate(entry.key))?.value
  }

  let year = findValueBySemantic(isYearAxisKey)
  let month = findValueBySemantic(isMonthAxisKey)
  let periodIndex = findValueBySemantic(isPeriodIndexAxisKey)

  if ((year === undefined || month === undefined || periodIndex === undefined) && entries.length === 3) {
    year ??= entries[0]?.value
    month ??= entries[1]?.value
    periodIndex ??= entries[2]?.value
  }

  if (year !== undefined && month !== undefined && periodIndex !== undefined) {
    const yearText = getDisplayValue(year)
    const monthNumber = typeof month === 'number' ? month : Number(month)
    const periodText = getDisplayValue(periodIndex)
    if (yearText !== '-' && Number.isFinite(monthNumber) && periodText !== '-') {
      return `${yearText}-${String(Math.trunc(monthNumber)).padStart(2, '0')} (${periodText})`
    }
  }

  return entries.map((entry) => getDisplayValue(entry.value)).join(' / ')
}

/** compare values.cells에서 시나리오 셀 조회 (scenarioId 없으면 scenarios 순서 매칭) */
export const getCompareCellForScenario = (
  value: ModelParamCompareValue,
  scenarioId: number,
  compareScenarios: Array<{ scenarioId: number }>,
): ModelParamCompareCell | undefined => {
  const cells = value.cells ?? []
  const byId = cells.find((cell) => cell.scenarioId === scenarioId)
  if (byId) return byId
  const index = compareScenarios.findIndex((scenario) => scenario.scenarioId === scenarioId)
  if (index >= 0 && cells[index] && cells[index].scenarioId === undefined) return cells[index]
  if (cells.length === 1 && compareScenarios.length === 1 && compareScenarios[0]?.scenarioId === scenarioId) return cells[0]
  return undefined
}

export interface ProposalParamPeriodColumn {
  periodLabel: string
  timeKey: string
  miBaseValues: string[]
  scenarioValuesById: Record<number, string[]>
  sourceRowIndexesByScenarioId: Record<number, number[]>
}

export interface ProposalParamMatrixData {
  fixedHeaders: string[]
  fixedRows: string[][]
  periods: ProposalParamPeriodColumn[]
  readMode?: ModelParamCompareShape['readMode']
}

const findCompareParameter = (
  compare: ScenarioGroupModelParamCompare | null | undefined,
  modelFileName: string | null,
  modelSheetName: string | null,
  modelTableName: string | null,
  parameterIndex: number,
): { parameter: ModelParamCompareParameter; shape: ModelParamCompareShape } | null => {
  if (!compare) return null
  const shapes = compare.parameterShapes.filter(
    (shape) => shape.modelFile === modelFileName && shape.modelSheet === modelSheetName && shape.modelTable === modelTableName,
  )
  const shape = shapes[parameterIndex]
  if (!shape) return null
  const parameter = compare.parameters.find((item) => item.parameterName === shape.parameterName)
  if (!parameter) return null
  return { parameter, shape }
}

/** compare API 응답으로 시나리오 비교 매트릭스 구성 */
export const buildCompareParamMatrixData = ({
  compare,
  visibleScenarioIds,
  modelFileName,
  modelSheetName,
  modelTableName,
  parameterIndex,
}: {
  compare: ScenarioGroupModelParamCompare | null | undefined
  visibleScenarioIds: number[]
  modelFileName: string | null
  modelSheetName: string | null
  modelTableName: string | null
  parameterIndex: number
}): ProposalParamMatrixData | null => {
  const matched = findCompareParameter(compare, modelFileName, modelSheetName, modelTableName, parameterIndex)
  if (!matched) return null

  const { parameter, shape } = matched
  const columns = shape.columns ?? []
  const slotColumns = columns.filter((column) => column.kind === 'SLOT')
  const timeAxisColumns = columns.filter((column) => column.kind === 'TIME_AXIS')
  const valueColumns = columns.filter((column) => column.kind === 'VALUE')
  if (valueColumns.length === 0) return null

  const referenceRows = parameter.values ?? []
  const isMatrix = shape.readMode === 'MATRIX_TIME_COLUMNS'
  const compareScenarios = compare?.scenarios ?? []

  const fixedHeaders = slotColumns.map((column) => column.role ?? column.column ?? '-')
  const slots = new Map<string, string[]>()
  const periods = new Map<string, string>()

  referenceRows.forEach((row) => {
    const slotKey = JSON.stringify(slotColumns.map((column) => getAxisValue(row, column)))
    if (!slots.has(slotKey)) {
      slots.set(
        slotKey,
        slotColumns.map((column) => getDisplayValue(getAxisValue(row, column))),
      )
    }

    if (isMatrix) {
      const timeKey = JSON.stringify(timeAxisColumns.map((column) => getAxisValue(row, column)))
      if (!periods.has(timeKey)) {
        periods.set(timeKey, formatMatrixPeriodLabel(timeAxisColumns, row, shape.semanticAxes))
      }
    }
  })

  if (!isMatrix) periods.set('fixed', 'Value')

  const slotKeys = Array.from(slots.keys())
  const periodEntries = Array.from(periods.entries())

  const periodColumns: ProposalParamPeriodColumn[] = periodEntries.map(([timeKey, periodLabel]) => {
    const miBaseValues = slotKeys.map((slotKey) => {
      const match = referenceRows.find((row) => {
        const rowSlotKey = JSON.stringify(slotColumns.map((column) => getAxisValue(row, column)))
        if (rowSlotKey !== slotKey) return false
        if (!isMatrix) return true
        const rowTimeKey = JSON.stringify(timeAxisColumns.map((column) => getAxisValue(row, column)))
        return rowTimeKey === timeKey
      })
      const base = match?.basecaseValue
      return typeof base === 'number' ? getNumericDisplayValue(base) : getDisplayValue(base)
    })

    const scenarioValuesById: Record<number, string[]> = {}
    const sourceRowIndexesByScenarioId: Record<number, number[]> = {}

    visibleScenarioIds.forEach((scenarioId) => {
      scenarioValuesById[scenarioId] = slotKeys.map((slotKey) => {
        const matchIndex = referenceRows.findIndex((row) => {
          const rowSlotKey = JSON.stringify(slotColumns.map((column) => getAxisValue(row, column)))
          if (rowSlotKey !== slotKey) return false
          if (!isMatrix) return true
          const rowTimeKey = JSON.stringify(timeAxisColumns.map((column) => getAxisValue(row, column)))
          return rowTimeKey === timeKey
        })
        if (!sourceRowIndexesByScenarioId[scenarioId]) sourceRowIndexesByScenarioId[scenarioId] = []
        sourceRowIndexesByScenarioId[scenarioId].push(matchIndex)
        if (matchIndex < 0) return ''
        const cell = getCompareCellForScenario(referenceRows[matchIndex], scenarioId, compareScenarios)
        const value = cell?.proposedValue
        return typeof value === 'number' ? getNumericDisplayValue(value) : getDisplayValue(value)
      })
    })

    return {
      periodLabel,
      timeKey,
      miBaseValues,
      scenarioValuesById,
      sourceRowIndexesByScenarioId,
    }
  })

  return {
    fixedHeaders,
    fixedRows: slotKeys.map((slotKey) => slots.get(slotKey) ?? []),
    periods: periodColumns,
    readMode: shape.readMode,
  }
}

export const updateCompareProposedValue = (
  compare: ScenarioGroupModelParamCompare,
  modelFileName: string | null,
  modelSheetName: string | null,
  modelTableName: string | null,
  parameterIndex: number,
  scenarioId: number,
  rowIndex: number,
  value: number,
): ScenarioGroupModelParamCompare => {
  const matched = findCompareParameter(compare, modelFileName, modelSheetName, modelTableName, parameterIndex)
  if (!matched) return compare

  const targetName = matched.parameter.parameterName

  return {
    ...compare,
    parameters: compare.parameters.map((parameter) => {
      if (parameter.parameterName !== targetName) return parameter

      return {
        ...parameter,
        values: (parameter.values ?? []).map((row, index) => {
          if (index !== rowIndex || !isRecord(row)) return row
          const cells = [...(row.cells ?? [])]
          const compareScenarios = compare.scenarios
          let cellIndex = cells.findIndex((cell) => cell.scenarioId === scenarioId)
          if (cellIndex < 0) {
            const orderIndex = compareScenarios.findIndex((scenario) => scenario.scenarioId === scenarioId)
            if (orderIndex >= 0 && cells[orderIndex] && cells[orderIndex].scenarioId === undefined) cellIndex = orderIndex
            else if (cells.length === 1 && compareScenarios.length === 1) cellIndex = 0
          }
          if (cellIndex < 0) {
            cells.push({ scenarioId, proposedValue: value })
          } else {
            cells[cellIndex] = { ...cells[cellIndex], scenarioId: cells[cellIndex].scenarioId ?? scenarioId, proposedValue: value }
          }
          return { ...row, cells }
        }),
      }
    }),
  }
}

/** compare 편집값을 시나리오별 confirmationParameters로 변환 */
export const buildConfirmationParametersFromCompare = (
  compare: ScenarioGroupModelParamCompare,
  scenarioId: number,
): ModelParamPayloadItem[] =>
  compare.parameters.map((parameter) => {
    const rationale = parameter.scenarioRationales?.find((item) => item.scenarioId === scenarioId)?.rationale
    return {
      parameterName: parameter.parameterName,
      modelTarget: parameter.modelTarget,
      rationale,
      values: (parameter.values ?? []).map((row) => {
        const { cells, ...rest } = row
        const cell = getCompareCellForScenario(row, scenarioId, compare.scenarios)
        return {
          ...rest,
          proposedValue: cell?.proposedValue,
          rationale: cell?.rationale,
        }
      }),
    }
  })

export const getCompareParameterChips = (
  compare: ScenarioGroupModelParamCompare | null | undefined,
  modelFileName: string | null,
  modelSheetName: string | null,
  modelTableName: string | null,
) => {
  if (!compare) return []
  return compare.parameterShapes
    .filter((shape) => shape.modelFile === modelFileName && shape.modelSheet === modelSheetName && shape.modelTable === modelTableName)
    .map((shape, index) => ({
      index,
      label: shape.parameterName ?? `Parameter ${index + 1}`,
    }))
}
