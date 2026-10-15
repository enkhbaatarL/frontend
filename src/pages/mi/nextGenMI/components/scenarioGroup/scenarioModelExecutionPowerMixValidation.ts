import type { ScenarioGroupModelParamCompare } from '@/service/mi/nextGenMI/modelExecution'

import {
  buildCompareParamMatrixData,
  getCompareCellForScenario,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalMapping'

export interface PowerMixValidationError {
  scenarioId: number
  modelTableName: string | null
  parameterIndex: number
  periodTimeKey: string
  rowIndexes: number[]
  total: number
}

/** 원본 소숫값의 합계를 십진수로 계산해 검증과 추천값에 같은 정밀도를 사용한다. */
const sumPowerMixValues = (values: readonly string[]) => {
  if (values.some((value) => value.trim() === '' || !Number.isFinite(Number(value)))) return undefined

  const decimals = values.map((value) => {
    const [coefficient, exponent = '0'] = String(Number(value)).toLowerCase().split('e')
    const [integer, fraction = ''] = coefficient.split('.')
    return { value: BigInt(`${integer}${fraction}`), scale: fraction.length - Number(exponent) }
  })
  const scale = Math.max(0, ...decimals.map((decimal) => decimal.scale))
  const unit = 10n ** BigInt(scale)
  const total = decimals.reduce((sum, decimal) => sum + decimal.value * 10n ** BigInt(scale - decimal.scale), 0n)
  return { scale, unit, total }
}

/** 다른 활성 셀의 합계를 제외한 값. */
export const getPowerMixRecommendedValue = (otherValues: readonly string[]): string | undefined => {
  const sum = sumPowerMixValues(otherValues)
  if (!sum) return undefined
  const { scale, unit, total } = sum
  const remaining = unit - total
  // 이 셀 하나로 0~1 비율을 맞출 수 없는 경우에는 숫자를 추천하지 않는다.
  if (remaining < 0n || remaining > unit) return undefined
  if (scale === 0) return String(remaining)

  const digits = String(remaining).padStart(scale + 1, '0')
  const fraction = digits.slice(-scale).replace(/0+$/, '')
  return fraction ? `${digits.slice(0, -scale)}.${fraction}` : digits.slice(0, -scale)
}

export const getPowerMixValidationErrors = (compare: ScenarioGroupModelParamCompare | null): PowerMixValidationError[] => {
  if (!compare) return []

  return compare.parameterShapes.flatMap((shape) => {
    if (shape.modelFile !== 'Demand' || shape.modelSheet !== 'PowerMixAdjustment' || shape.parameterName !== 'PowerMix') return []

    const parameter = compare.parameters.find((item) => item.parameterName === shape.parameterName)
    if (!parameter) return []

    const parameterIndex = compare.parameterShapes
      .filter((item) => item.modelFile === shape.modelFile && item.modelSheet === shape.modelSheet && item.modelTable === shape.modelTable)
      .indexOf(shape)
    const matrix = buildCompareParamMatrixData({
      compare,
      visibleScenarioIds: compare.scenarios.map((scenario) => scenario.scenarioId),
      modelFileName: shape.modelFile,
      modelSheetName: shape.modelSheet,
      modelTableName: shape.modelTable ?? null,
      parameterIndex,
    })
    if (!matrix) return []

    return matrix.periods.flatMap((period) =>
      compare.scenarios.flatMap(({ scenarioId }): PowerMixValidationError[] => {
        const rowIndexes: number[] = []
        const values: string[] = []
        let total = 0
        let hasMissingValue = false
        period.sourceRowIndexesByScenarioId[scenarioId]?.forEach((sourceRowIndex, rowIndex) => {
          const row = parameter.values?.[sourceRowIndex]
          if (!row) return
          const cell = getCompareCellForScenario(row, scenarioId, compare.scenarios)
          if (cell === null || cell === undefined) return
          rowIndexes.push(rowIndex)
          if (typeof cell.proposedValue !== 'number' || !Number.isFinite(cell.proposedValue)) {
            hasMissingValue = true
          } else {
            total += cell.proposedValue
            values.push(String(cell.proposedValue))
          }
        })
        const sum = sumPowerMixValues(values)
        // PowerMix는 0~1 비율로 전달되므로 합계 1이 100%다. null 슬롯과 생성 전 시나리오는 제외한다.
        if (rowIndexes.length === 0 || (!hasMissingValue && sum && sum.total === sum.unit)) return []

        return [{ scenarioId, modelTableName: shape.modelTable ?? null, parameterIndex, periodTimeKey: period.timeKey, rowIndexes, total }]
      }),
    )
  })
}
