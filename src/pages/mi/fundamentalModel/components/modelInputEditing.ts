import type { ModelInputTablePage } from '@/service/mi/fundamentalModel/inputDraft'

import { isModelInputObject, isSupportedModelInputField, getModelInputCreationRule } from '@/utils/modelInputValidation'

export {
  isModelInputObject,
  getModelInputCreationRule,
  validateModelInputValue,
  validateModelInputCreationValue,
} from '@/utils/modelInputValidation'

export const getModelInputField = (page: ModelInputTablePage, rowNumber: number, columnField: string, action: 'SET' | 'CLEAR' = 'SET') => {
  const field = page.editing.fields.find((item) => item.columnField === columnField)
  const binding = page.editing.rowBindings.find((item) => item.rowNumber === rowNumber)
  const columnIndex = Number(columnField.replace(/^column/, ''))
  if (
    page.editing.capabilities[action] !== 'READY' ||
    !field ||
    !binding?.rowId ||
    binding.origin === 'EMPTY_SLOT' ||
    !/^column\d+$/.test(columnField) ||
    !Number.isInteger(columnIndex) ||
    (action === 'SET' && !page.tableData.inputCells.includes(rowNumber * 16384 + columnIndex)) ||
    !isModelInputObject(field.policyStatus) ||
    field.policyStatus[action] !== 'READY' ||
    typeof field.fieldKey !== 'string' ||
    (action === 'SET' && !isSupportedModelInputField(field, field.setConstraints))
  )
    return undefined

  return field
}

export const getModelInputDeletableRowId = (page: ModelInputTablePage, rowNumber: number) => {
  if (page.editing.capabilities.DELETE_ROW !== 'READY') return undefined
  const binding = page.editing.rowBindings.find((item) => item.rowNumber === rowNumber)
  return binding?.origin === 'ADDED' && binding.rowId ? binding.rowId : undefined
}

export const getModelInputDeletableColumn = (page: ModelInputTablePage, columnField: string) => {
  if (page.editing.capabilities.DELETE_COLUMN !== 'READY') return undefined
  return page.editing.fields.find(
    (field) =>
      field.columnField === columnField &&
      /^column\d+$/.test(columnField) &&
      typeof field.fieldKey === 'string' &&
      isModelInputObject(field.policyStatus) &&
      field.policyStatus.DELETE_COLUMN === 'READY',
  )
}

export const getModelInputRowCreationFields = (page: ModelInputTablePage) => {
  if (page.editing.capabilities.ADD_ROW !== 'READY') return undefined
  const fields = page.editing.fields.filter((field) => isModelInputObject(field.policyStatus) && field.policyStatus.CREATE === 'READY')
  if (
    !fields.length ||
    fields.some((field) => typeof field.fieldKey !== 'string' || !getModelInputCreationRule(field)) ||
    new Set(fields.map((field) => field.fieldKey)).size !== fields.length ||
    page.editing.fields.some(
      (field) => !isModelInputObject(field.policyStatus) || !['READY', 'NOT_ALLOWED'].includes(String(field.policyStatus.CREATE)),
    )
  )
    return undefined
  return fields
}

export const getModelInputColumnCreationHeaders = (page: ModelInputTablePage) => {
  const creation = page.editing.columnCreation
  if (
    page.editing.capabilities.ADD_COLUMN !== 'READY' ||
    !isModelInputObject(creation) ||
    !isModelInputObject(creation.headerValues) ||
    !getModelInputCreationRule(creation.body)
  )
    return undefined
  const headers = creation.headerValues
  if (
    Object.entries(headers).some(
      ([key, field]) =>
        !['year', 'month'].includes(key) || !isModelInputObject(field) || field.dataType !== 'INTEGER' || !getModelInputCreationRule(field),
    )
  )
    return undefined
  return headers
}
