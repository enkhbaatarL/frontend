import Decimal from 'decimal.js'
import { isLosslessNumber, LosslessNumber } from 'lossless-json'

export const isModelInputNumber = (value: unknown): value is number | LosslessNumber =>
  (typeof value === 'number' && Number.isFinite(value)) || isLosslessNumber(value)

export const isModelInputValue = (value: unknown): value is string | number | LosslessNumber =>
  typeof value === 'string' || isModelInputNumber(value)

export const isModelInputObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const parseDecimal = (text: string) => {
  if (text.length > 4096 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null
  try {
    const value = new Decimal(text)
    if (!value.isFinite() || value.precision() + Math.abs(value.precision() - value.e - 1) + 2 > 1_048_576) return null
    return value
  } catch {
    return null
  }
}

export const compareModelInputDecimals = (left: string, right: string): number | null => {
  const a = parseDecimal(left)
  const b = parseDecimal(right)
  return a && b ? a.comparedTo(b) : null
}

export const isSupportedModelInputField = (field: Record<string, unknown>, constraints: unknown) => {
  if (!['TEXT', 'INTEGER', 'DECIMAL'].includes(String(field.dataType)) || !isModelInputObject(constraints)) return false
  if (Object.keys(constraints).some((key) => !['minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'options'].includes(key)))
    return false
  if (
    'options' in constraints &&
    (!Array.isArray(constraints.options) ||
      constraints.options.some((value) =>
        field.dataType === 'TEXT' ? typeof value !== 'string' : !isModelInputNumber(value) || !parseDecimal(String(value)),
      ))
  )
    return false
  if (
    ['minimum', 'maximum'].some(
      (key) => key in constraints && (!isModelInputNumber(constraints[key]) || !parseDecimal(String(constraints[key]))),
    )
  )
    return false
  if (
    ['minLength', 'maxLength'].some(
      (key) =>
        key in constraints &&
        (typeof constraints[key] !== 'number' || !Number.isSafeInteger(constraints[key]) || Number(constraints[key]) < 0),
    )
  )
    return false
  if ('pattern' in constraints) {
    if (typeof constraints.pattern !== 'string') return false
    try {
      new RegExp(constraints.pattern)
    } catch {
      return false
    }
  }
  return true
}

export const validateModelInputValue = (
  text: string,
  field: Record<string, unknown>,
  inputConstraints: unknown = field.setConstraints,
): { value: string | number | LosslessNumber | null; error: string | null; dataType?: 'DECIMAL' } => {
  const constraints = isModelInputObject(inputConstraints) ? inputConstraints : {}
  let value: string | number | LosslessNumber = text
  if (field.dataType !== 'TEXT') {
    const decimal = parseDecimal(text.trim())
    if (!decimal) return { value: null, error: '숫자를 입력하세요.' }
    if (field.dataType === 'INTEGER' && (!decimal.isInteger() || decimal.abs().greaterThan(Number.MAX_SAFE_INTEGER)))
      return { value: null, error: '안전하게 저장할 수 있는 정수를 입력하세요.' }
    value = field.dataType === 'DECIMAL' ? new LosslessNumber(decimal.toString()) : Number(text)
    if (
      (isModelInputNumber(constraints.minimum) && decimal.lessThan(String(constraints.minimum))) ||
      (isModelInputNumber(constraints.maximum) && decimal.greaterThan(String(constraints.maximum)))
    ) {
      return {
        value: null,
        error:
          constraints.minimum !== undefined && constraints.maximum !== undefined
            ? `${constraints.minimum} ~ ${constraints.maximum} 범위의 값을 입력하세요.`
            : constraints.minimum !== undefined
              ? `${constraints.minimum} 이상의 값을 입력하세요.`
              : `${constraints.maximum} 이하의 값을 입력하세요.`,
      }
    }
  } else {
    if (text.length > 4096 || (typeof constraints.maxLength === 'number' && text.length > constraints.maxLength))
      return { value: null, error: '입력 가능한 글자 수를 초과했습니다.' }
    if (typeof constraints.minLength === 'number' && text.length < constraints.minLength)
      return { value: null, error: `${constraints.minLength}자 이상 입력하세요.` }
    if (typeof constraints.pattern === 'string') {
      try {
        if (!new RegExp(constraints.pattern).test(text)) return { value: null, error: '입력 형식을 확인하세요.' }
      } catch {
        return { value: null, error: '서버의 입력 형식을 확인할 수 없습니다.' }
      }
    }
  }
  if (
    Array.isArray(constraints.options) &&
    !constraints.options.some((option) =>
      field.dataType !== 'TEXT'
        ? isModelInputNumber(option) && compareModelInputDecimals(String(value), String(option)) === 0
        : option === value,
    )
  )
    return { value: null, error: '허용된 선택지 중 하나를 입력하세요.' }
  return { value, error: null, ...(field.dataType === 'DECIMAL' && { dataType: 'DECIMAL' as const }) }
}

// CREATE uses its own required/default/constraints metadata, independently of SET.
export const getModelInputCreationRule = (field: unknown) => {
  if (!isModelInputObject(field) || !isModelInputObject(field.create)) return undefined
  const { required, initial, constraints } = field.create
  if (
    typeof required !== 'boolean' ||
    Object.keys(field.create).some((key) => !['required', 'initial', 'constraints'].includes(key)) ||
    !isModelInputObject(initial) ||
    !isModelInputObject(constraints) ||
    !isSupportedModelInputField(field, constraints)
  )
    return undefined
  if (initial.kind === 'EMPTY') return Object.keys(initial).length === 1 ? { required, initialValue: '', constraints } : undefined
  if (Object.keys(initial).some((key) => !['kind', 'value'].includes(key))) return undefined
  if (initial.kind !== 'VALUE' || (field.dataType === 'TEXT' ? typeof initial.value !== 'string' : !isModelInputNumber(initial.value)))
    return undefined
  if (validateModelInputValue(String(initial.value), field, constraints).error) return undefined
  return { required, initialValue: String(initial.value), constraints }
}

export const validateModelInputCreationValue = (text: string, field: Record<string, unknown>) => {
  const rule = getModelInputCreationRule(field)
  if (!rule) return { value: null, error: '생성 정책을 확인할 수 없습니다.' }
  if (!text) return { value: null, error: rule.required ? '필수 항목을 입력하세요.' : null }
  return validateModelInputValue(text, field, rule.constraints)
}
