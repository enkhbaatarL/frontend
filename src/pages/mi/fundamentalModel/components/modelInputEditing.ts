import type { ModelInputLocalEdit } from '@/pages/mi/fundamentalModel/hooks/useModelInputAutosave'
import type { ModelInputTablePage } from '@/service/mi/fundamentalModel/inputDraft'

import { isModelInputObject, isSupportedModelInputField, getModelInputCreationRule } from '@/utils/modelInputValidation'

export {
  isModelInputObject,
  getModelInputCreationRule,
  validateModelInputValue,
  validateModelInputCreationValue,
} from '@/utils/modelInputValidation'

export const indexModelInputFirstMatches = <Item, Key>(items: Item[], getKey: (item: Item) => Key) => {
  const index = new Map<Key, Item>()
  for (const item of items) {
    const key = getKey(item)
    // find의 === 비교는 NaN에 일치하지 않는다. 중복 키는 첫 항목을 유지한다.
    if ((typeof key === 'number' && Number.isNaN(key)) || index.has(key)) continue
    index.set(key, item)
  }
  return index
}

export const createModelInputPageIndex = (page: ModelInputTablePage) => ({
  fieldByColumn: indexModelInputFirstMatches(page.editing.fields, (field) => field.columnField),
  bindingByRowNumber: indexModelInputFirstMatches(page.editing.rowBindings, (binding) => binding.rowNumber),
  editValuesByRowId: indexModelInputFirstMatches(page.editing.editValues, (item) => item.rowId),
  inputCells: new Set(page.tableData.inputCells),
})

export const createModelInputEditIndex = (edits: ModelInputLocalEdit[], tableId: string) => {
  const index = new Map<string, Map<string, ModelInputLocalEdit>>()
  for (const edit of edits) {
    if (edit.tableId !== tableId) continue
    let row = index.get(edit.rowId)
    if (!row) {
      row = new Map<string, ModelInputLocalEdit>()
      index.set(edit.rowId, row)
    }
    if (!row.has(edit.fieldKey)) row.set(edit.fieldKey, edit)
  }
  return index
}

export const getModelInputField = (
  page: ModelInputTablePage,
  rowNumber: number,
  columnField: string,
  action: 'SET' | 'CLEAR' = 'SET',
  index?: ReturnType<typeof createModelInputPageIndex>,
) => {
  const field = index ? index.fieldByColumn.get(columnField) : page.editing.fields.find((item) => item.columnField === columnField)
  const binding = index ? index.bindingByRowNumber.get(rowNumber) : page.editing.rowBindings.find((item) => item.rowNumber === rowNumber)
  const columnIndex = Number(columnField.replace(/^column/, ''))
  if (
    page.editing.capabilities[action] !== 'READY' ||
    !field ||
    !binding?.rowId ||
    binding.origin === 'EMPTY_SLOT' ||
    !/^column\d+$/.test(columnField) ||
    !Number.isInteger(columnIndex) ||
    (action === 'SET' &&
      !(index
        ? index.inputCells.has(rowNumber * 16384 + columnIndex)
        : page.tableData.inputCells.includes(rowNumber * 16384 + columnIndex))) ||
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
