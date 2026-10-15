import type { ScenarioGroupModelParamCompare } from '@/service/mi/nextGenMI/modelExecution'

import { formatPowerMixPercent } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionPowerMixValue'
import {
  buildCompareParamMatrixData,
  findCompareParameter,
  getCompareCellForScenario,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalMapping'

export interface PowerMixValidationError {
  scenarioId: number
  modelTableName: string | null
  parameterIndex: number
  groupKey: string
  groupLabel: string
  cells: Array<{ periodTimeKey: string; rowIndex: number; sourceRowIndex: number; value?: number }>
  totalPercent: string
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

export const getPowerMixGroupRecommendedValue = (error: PowerMixValidationError, periodTimeKey: string, rowIndex: number) => {
  const target = error.cells.find((cell) => cell.periodTimeKey === periodTimeKey && cell.rowIndex === rowIndex)
  if (!target) return undefined
  const otherValues = new Map(
    error.cells.filter((cell) => cell.sourceRowIndex !== target.sourceRowIndex).map((cell) => [cell.sourceRowIndex, cell.value]),
  )
  return getPowerMixRecommendedValue(Array.from(otherValues.values(), (value) => (value === undefined ? '' : String(value))))
}

export const getPowerMixValidationErrors = (compare: ScenarioGroupModelParamCompare | null): PowerMixValidationError[] => {
  if (!compare) return []

  return compare.parameterShapes.flatMap((shape) => {
    if (shape.modelFile !== 'Demand' || shape.modelSheet !== 'PowerMixAdjustment' || shape.parameterName !== 'PowerMix') return []

    const parameterIndex = compare.parameterShapes
      .filter((item) => item.modelFile === shape.modelFile && item.modelSheet === shape.modelSheet && item.modelTable === shape.modelTable)
      .indexOf(shape)
    const matched = findCompareParameter(compare, shape.modelFile, shape.modelSheet, shape.modelTable ?? null, parameterIndex)
    if (!matched) return []
    const { parameter } = matched
    const matrix = buildCompareParamMatrixData({
      compare,
      visibleScenarioIds: compare.scenarios.map((scenario) => scenario.scenarioId),
      modelFileName: shape.modelFile,
      modelSheetName: shape.modelSheet,
      modelTableName: shape.modelTable ?? null,
      parameterIndex,
    })
    if (!matrix) return []

    return compare.scenarios.flatMap(({ scenarioId }): PowerMixValidationError[] => {
      const groups = new Map<string, PowerMixValidationError>()
      matrix.periods.forEach((period) => {
        period.sourceRowIndexesByScenarioId[scenarioId]?.forEach((sourceRowIndex, rowIndex) => {
          const row = parameter.values?.[sourceRowIndex]
          if (!row) return
          const cell = getCompareCellForScenario(row, scenarioId, compare.scenarios)
          if (cell === null || cell === undefined) return
          const groupKey = period.powerMixGroupKeys[rowIndex]
          let group = groups.get(groupKey)
          if (!group) {
            const axes: Array<string | null> = JSON.parse(groupKey)
            group = {
              scenarioId,
              modelTableName: shape.modelTable ?? null,
              parameterIndex,
              groupKey,
              groupLabel: axes.filter((value) => value !== null).join(' · '),
              cells: [],
              totalPercent: '확인 불가',
            }
            groups.set(groupKey, group)
          }
          group.cells.push({ periodTimeKey: period.timeKey, rowIndex, sourceRowIndex, value: cell.proposedValue })
        })
      })

      return Array.from(groups.values()).filter((group) => {
        // 여러 표시 컬럼이 같은 API 행을 참조하더라도 한 번만 합산한다.
        const values = Array.from(new Map(group.cells.map((cell) => [cell.sourceRowIndex, cell.value])).values())
        const sum = sumPowerMixValues(values.map((value) => (typeof value === 'number' ? String(value) : '')))
        // 검증에 사용한 십진수 합계를 그대로 표시해 긴 소수 오차가 나타나지 않게 한다.
        group.totalPercent = sum ? formatPowerMixPercent(`${sum.total}e-${sum.scale}`) : '확인 불가'
        // 시나리오별 Year + Country 합계가 정확히 1인지 검사한다. 월은 구분하지 않는다.
        return !sum || sum.total !== sum.unit
      })
    })
  })
}
