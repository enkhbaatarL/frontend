import type { ModelInputLocalEdit } from '@/pages/mi/fundamentalModel/hooks/useModelInputAutosave'
import type { ModelInputAddRowCommand, ModelInputChangeRequest } from '@/service/mi/fundamentalModel/inputDraft'

export const getModelInputChangeOperations = (
  edits: ModelInputLocalEdit[],
  addedRows: ModelInputAddRowCommand[],
): ModelInputChangeRequest['operations'] => [
  ...addedRows.map((command) => {
    const values = { ...command.values }
    for (const edit of edits) {
      if (edit.tableId !== command.tableId || edit.rowId !== command.clientRowKey) continue
      if (edit.type === 'CLEAR') delete values[edit.fieldKey]
      else if (edit.value !== null) values[edit.fieldKey] = edit.value
    }
    return { ...command, values }
  }),
  ...edits
    .filter((edit) => !addedRows.some((command) => command.tableId === edit.tableId && command.clientRowKey === edit.rowId))
    .map((edit) =>
      edit.type === 'CLEAR'
        ? {
          type: 'CLEAR' as const,
          commandId: `clear_${edit.id.replaceAll('-', '')}`,
          tableId: edit.tableId,
          rowRef: { rowId: edit.rowId },
          fieldKey: edit.fieldKey,
        }
        : {
          type: 'SET' as const,
          commandId: `set_${edit.id.replaceAll('-', '')}`,
          tableId: edit.tableId,
          rowRef: { rowId: edit.rowId },
          fieldKey: edit.fieldKey,
          value: edit.value!,
        },
    ),
]
