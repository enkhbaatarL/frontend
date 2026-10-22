export const isModelInputObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

export const isSupportedModelInputField = (field: Record<string, unknown>, constraints: unknown) => {
  if (!['TEXT', 'INTEGER', 'DECIMAL'].includes(String(field.dataType)) || !isModelInputObject(constraints)) return false
  if (Object.keys(constraints).some((key) => !['minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'options'].includes(key)))
    return false
  if (
    'options' in constraints &&
    (!Array.isArray(constraints.options) ||
      constraints.options.some((value) =>
        field.dataType === 'TEXT' ? typeof value !== 'string' : typeof value !== 'number' || !Number.isFinite(value),
      ))
  )
    return false
  if (
    ['minimum', 'maximum'].some((key) => key in constraints && (typeof constraints[key] !== 'number' || !Number.isFinite(constraints[key])))
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

const normalizeDecimal = (text: string) => {
  const match = text.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i)
  if (!match || !(match[2] || match[3])) return null
  const digits = `${match[2]}${match[3] ?? ''}`.replace(/^0+/, '').replace(/0+$/, '')
  if (!digits) return '0'
  const original = `${match[2]}${match[3] ?? ''}`.replace(/^0+/, '')
  const exponent = Number(match[4] ?? 0) - (match[3]?.length ?? 0) + original.length - digits.length
  return `${match[1] === '-' ? '-' : ''}${digits}e${exponent}`
}

export const validateModelInputValue = (
  text: string,
  field: Record<string, unknown>,
  inputConstraints: unknown = field.setConstraints,
): { value: string | number | null; error: string | null } => {
  const constraints = isModelInputObject(inputConstraints) ? inputConstraints : {}
  let value: string | number = text
  if (field.dataType !== 'TEXT') {
    value = Number(text)
    if (!text.trim() || !Number.isFinite(value) || normalizeDecimal(text.trim()) === null)
      return { value: null, error: '숫자를 입력하세요.' }
    if (normalizeDecimal(text.trim()) !== normalizeDecimal(String(value)))
      return { value: null, error: '정밀도 손실 없이 저장할 수 있는 숫자를 입력하세요.' }
    if (field.dataType === 'INTEGER' && !Number.isSafeInteger(value))
      return { value: null, error: '안전하게 저장할 수 있는 정수를 입력하세요.' }
    if (
      (typeof constraints.minimum === 'number' && value < constraints.minimum) ||
      (typeof constraints.maximum === 'number' && value > constraints.maximum)
    ) {
      return {
        value: null,
        error:
          typeof constraints.minimum === 'number' && typeof constraints.maximum === 'number'
            ? `${constraints.minimum} ~ ${constraints.maximum} 범위의 값을 입력하세요.`
            : typeof constraints.minimum === 'number'
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
  if (Array.isArray(constraints.options) && !constraints.options.includes(value))
    return { value: null, error: '허용된 선택지 중 하나를 입력하세요.' }
  return { value, error: null }
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
  if (initial.kind !== 'VALUE' || (field.dataType === 'TEXT' ? typeof initial.value !== 'string' : typeof initial.value !== 'number'))
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
