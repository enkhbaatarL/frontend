import { CircularProgress, Stack, Typography } from '@mui/material'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import { v4 as uuid } from 'uuid'

import type {
  ModelInputDraftStructure,
  ModelInputChangeRequest,
  ModelInputTableInfo,
  ModelInputTablePage,
  ModelInputAddRowCommand,
  ModelInputSetControlCommand,
} from '@/service/mi/fundamentalModel/inputDraft'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import useSnackbar from '@/hooks/useSnackbar'
import formatFundamentalModelCellValue from '@/pages/mi/fundamentalModel/components/inputTable/formatFundamentalModelCellValue'
import { getNextFundamentalModelColumn } from '@/pages/mi/fundamentalModel/components/inputTable/fundamentalModelColumnEditing'
import FundamentalModelColumnMenu from '@/pages/mi/fundamentalModel/components/inputTable/FundamentalModelColumnMenu'
import FundamentalModelEditedCellInput from '@/pages/mi/fundamentalModel/components/inputTable/FundamentalModelEditedCellInput'
import { insertFundamentalModelRow } from '@/pages/mi/fundamentalModel/components/inputTable/fundamentalModelRowEditing'
import {
  createFundamentalModelColumnWidthCache,
  getFundamentalModelColumnWidth,
  getFundamentalModelColumnContentWidths,
  FUNDAMENTAL_MODEL_ROW_HEIGHT,
} from '@/pages/mi/fundamentalModel/components/inputTable/fundamentalModelTableLayout'
import FundamentalModelTemplateGrid from '@/pages/mi/fundamentalModel/components/inputTable/FundamentalModelTemplateGrid'
import getSheetCellTextAlign from '@/pages/mi/fundamentalModel/components/inputTable/getSheetCellTextAlign'
import useFundamentalModelTableActions from '@/pages/mi/fundamentalModel/components/inputTable/useFundamentalModelTableActions'
import {
  createModelInputEditIndex,
  createModelInputPageIndex,
  getModelInputColumnCreationHeaders,
  getModelInputDeletableColumn,
  getModelInputDeletableRowId,
  getModelInputCreationRule,
  getModelInputField,
  getModelInputRowCreationFields,
  isModelInputObject,
  indexModelInputFirstMatches,
  validateModelInputValue,
  validateModelInputCreationValue,
} from '@/pages/mi/fundamentalModel/components/modelInputEditing'
import { getModelInputChangesQueryOptions, getModelInputTableQueryOptions } from '@/pages/mi/fundamentalModel/hooks/modelInputTableQuery'
import { getModelInputErrorMessage, type ModelInputLocalEdit } from '@/pages/mi/fundamentalModel/hooks/useModelInputAutosave'
import { isModelInputValue, areModelInputValuesEqual } from '@/utils/modelInputValidation'

export interface FundamentalModelDraftTableRef {
  refresh: () => void
}

interface Props {
  onRestoresChange: (state: { draftId: string; revision: number; tableId: string; canRestore: boolean }) => void
  refreshRef: Ref<FundamentalModelDraftTableRef>
  scope: string
  draft: ModelInputDraftStructure
  table: ModelInputTableInfo
  edits: ModelInputLocalEdit[]
  addedRows: ModelInputAddRowCommand[]
  onStageRow: (command: ModelInputAddRowCommand, initialEdits: Omit<ModelInputLocalEdit, 'id'>[]) => Promise<boolean>
  onRemoveStagedRow: (clientRowKey: string) => void
  disabled: boolean
  structureDisabled: boolean
  isSavingStructure: boolean
  onEdit: (edit: Omit<ModelInputLocalEdit, 'id'>, originalValue: unknown) => void
  onCommands: (operations: ModelInputChangeRequest['operations']) => Promise<boolean>
  onControlChange: (command: ModelInputSetControlCommand, originalValue: string | number) => Promise<boolean>
}

const displayValue = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? value : isModelInputValue(value) ? String(value) : ''
const getRowId = (row: Record<string, unknown>) => String(row.id ?? row.rowNumber)

const FundamentalModelDraftTable = ({
  onRestoresChange,
  refreshRef,
  scope,
  draft,
  table,
  edits,
  addedRows,
  disabled,
  structureDisabled,
  isSavingStructure,
  onEdit,
  onCommands,
  onControlChange,
  onStageRow,
  onRemoveStagedRow,
}: Props) => {
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const query = useInfiniteQuery(getModelInputTableQueryOptions(scope, draft.draftId, draft.revision, table.id))
  // 부속 컨트롤은 기존 changes 흐름을 유지한다. 셀 정보는 각 table-data 페이지에서 읽는다.
  const hasControls = Boolean(query.data?.pages[0]?.tableData.controls.length)
  const changesQuery = useQuery({
    ...getModelInputChangesQueryOptions(scope, draft.draftId, draft.revision, table.id),
    enabled: hasControls,
  })
  const { refetch: refetchChanges } = changesQuery
  const queryKey = useMemo(
    () => getModelInputTableQueryOptions(scope, draft.draftId, draft.revision, table.id).queryKey,
    [scope, draft.draftId, draft.revision, table.id],
  )
  const queryIdentity = JSON.stringify(queryKey)
  const pendingRefreshRef = useRef<string | undefined>(undefined)
  const [refreshRequest, setRefreshRequest] = useState(0)
  useImperativeHandle(
    refreshRef,
    () => ({
      refresh: () => {
        // 진행 중 조회를 취소하지 않고, 연속 새로고침 의도를 한 번의 후속 조회로 합친다.
        pendingRefreshRef.current = queryIdentity
        setRefreshRequest((current) => current + 1)
      },
    }),
    [queryIdentity],
  )
  const { isFetching, fetchStatus, refetch } = query
  useEffect(() => {
    if (pendingRefreshRef.current !== queryIdentity) {
      pendingRefreshRef.current = undefined
      return
    }
    if (isFetching || fetchStatus !== 'idle' || queryClient.getQueryState(queryKey)?.fetchStatus !== 'idle') return
    pendingRefreshRef.current = undefined
    void refetch({ cancelRefetch: false })
    if (hasControls) void refetchChanges({ cancelRefetch: false })
  }, [fetchStatus, hasControls, isFetching, queryClient, queryIdentity, queryKey, refetch, refetchChanges, refreshRequest])
  const pages = query.data?.pages
  const firstPage = pages?.[0]
  const canEdit = draft.status === 'DRAFT' && !disabled && !query.isError && !query.isPending
  const canChangeStructure = canEdit && !structureDisabled
  const [isChangingStructure, setIsChangingStructure] = useState(false)
  const isProcessingStructure = isChangingStructure || isSavingStructure
  const [scrollTarget, setScrollTarget] = useState<{ rowIndex?: number; columnIndex?: number }>()
  const structureRequestRef = useRef(false)
  const creationFields = useMemo(() => firstPage && getModelInputRowCreationFields(firstPage), [firstPage])
  const creationHeaders = useMemo(() => firstPage && getModelInputColumnCreationHeaders(firstPage), [firstPage])
  const pageIndexCache = useMemo(() => new WeakMap<ModelInputTablePage, ReturnType<typeof createModelInputPageIndex>>(), [])
  const pageIndexes = useMemo(() => {
    const indexes = new Map<ModelInputTablePage, ReturnType<typeof createModelInputPageIndex>>()
    for (const page of pages ?? []) {
      let index = pageIndexCache.get(page)
      if (!index) {
        index = createModelInputPageIndex(page)
        pageIndexCache.set(page, index)
      }
      indexes.set(page, index)
    }
    return indexes
  }, [pageIndexCache, pages])
  const editsByRow = useMemo(() => createModelInputEditIndex(edits, table.id), [edits, table.id])
  const canRestoreCells =
    pages?.some((page) =>
      page.editing.cellRestores?.some((cell) => cell.restoreStatus === 'READY' || editsByRow.get(cell.rowId)?.has(cell.fieldKey)),
    ) ?? false
  useEffect(() => {
    onRestoresChange({ draftId: draft.draftId, revision: draft.revision, tableId: table.id, canRestore: canRestoreCells })
  }, [canRestoreCells, draft.draftId, draft.revision, onRestoresChange, table.id])
  const addedRowsByKey = useMemo(() => indexModelInputFirstMatches(addedRows, (row) => row.clientRowKey), [addedRows])
  const creationFieldsByColumn = useMemo(
    () => indexModelInputFirstMatches(creationFields ?? [], (field) => field.columnField),
    [creationFields],
  )
  const { bodyRows, headerRows, pageByRow, canUsePageWidths } = useMemo(() => {
    const allRows = new Map<number, Record<string, unknown>>()
    const rowPages = new Map<number, ModelInputTablePage>()
    const bodyRowNumbers = new Set<number>()
    let canReuseWidths = true
    for (const page of pages ?? []) {
      for (const binding of page.editing.rowBindings) rowPages.set(binding.rowNumber, page)
    }
    for (const page of pages ?? []) {
      for (const row of page.tableData.rows) {
        if (typeof row.rowNumber !== 'number') continue
        if (rowPages.has(row.rowNumber)) {
          if (bodyRowNumbers.has(row.rowNumber) || !pageIndexes.get(page)?.bindingByRowNumber.has(row.rowNumber)) canReuseWidths = false
          bodyRowNumbers.add(row.rowNumber)
        }
        allRows.set(row.rowNumber, row)
      }
    }
    return {
      bodyRows: [...allRows.values()].filter((row) => rowPages.has(Number(row.rowNumber))),
      headerRows: [...allRows.values()].filter((row) => !rowPages.has(Number(row.rowNumber))),
      pageByRow: rowPages,
      canUsePageWidths: canReuseWidths,
    }
  }, [pageIndexes, pages])
  const columns = useMemo(
    () =>
      (firstPage?.tableData.columns ?? []).map((column) => ({
        ...column,
        isNew: Boolean(firstPage && getModelInputDeletableColumn(firstPage, column.field)),
        label: column.headerName,
        headerValues: headerRows.length ? headerRows.map((row) => String(displayValue(row[column.field]))) : [column.headerName],
      })),
    [firstPage, headerRows],
  )
  const rows = useMemo(() => {
    if (!firstPage || query.hasNextPage) return bodyRows
    let nextRows = bodyRows
    let rowNumber = bodyRows.reduce((last, row) => Math.max(last, Number(row.rowNumber)), table.coordinates.bodyStart - 1)
    for (const command of addedRows) {
      const row = {
        id: command.clientRowKey,
        rowNumber: ++rowNumber,
        ...Object.fromEntries(
          (creationFields ?? []).map((field) => [String(field.columnField), command.values[String(field.fieldKey)] ?? '']),
        ),
      }
      nextRows = nextRows.length ? insertFundamentalModelRow(nextRows, getRowId(nextRows.at(-1)!), 'below', row, getRowId) : [row]
    }
    return nextRows.length || !creationFields ? nextRows : [{ id: 'empty-row', rowNumber: table.coordinates.bodyStart }]
  }, [addedRows, bodyRows, creationFields, firstPage, query.hasNextPage, table.coordinates.bodyStart])
  const getPageContentWidths = useMemo(createFundamentalModelColumnWidthCache, [])
  const columnWidths = useMemo(() => {
    // 중첩 행/다른 페이지의 binding은 기존 마지막 행 선택 의미를 보존하는 전체 계산으로 처리한다.
    if (!canUsePageWidths) return columns.map((column) => getFundamentalModelColumnWidth(column, rows))
    const fields = columns.map((column) => column.field)
    const widthsByPage = (pages ?? []).map((page) =>
      getPageContentWidths(page, fields, () =>
        page.tableData.rows.filter(
          (row) => typeof row.rowNumber === 'number' && pageIndexes.get(page)?.bindingByRowNumber.has(row.rowNumber),
        ),
      ),
    )
    const serverRows = rows === bodyRows ? undefined : new Set(bodyRows)
    const addedWidths = getFundamentalModelColumnContentWidths(fields, serverRows ? rows.filter((row) => !serverRows.has(row)) : [])
    return columns.map((column) =>
      getFundamentalModelColumnWidth(
        column,
        [],
        Math.max(addedWidths.get(column.field) ?? 0, ...widthsByPage.map((widths) => widths.get(column.field) ?? 0)),
      ),
    )
  }, [bodyRows, canUsePageWidths, columns, getPageContentWidths, pageIndexes, pages, rows])
  const isNewRow = (row: Record<string, unknown>) =>
    addedRows.some((command) => command.clientRowKey === row.id) ||
    pageByRow
      .get(Number(row.rowNumber))
      ?.editing.rowBindings.some((binding) => binding.rowNumber === Number(row.rowNumber) && binding.origin === 'ADDED') === true
  const headerHeight = Math.max(1, headerRows.length) * 24
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query
  useEffect(() => {
    if (!query.error) return
    const message = getModelInputErrorMessage(query.error)
    if (message) showSnackbar(message, { variant: 'error' })
  }, [query.error, showSnackbar])
  const loadVisibleRows = useCallback(
    (viewport: { height: number; scrollTop: number }) => {
      if (
        !disabled &&
        hasNextPage &&
        !isFetching &&
        fetchStatus === 'idle' &&
        pendingRefreshRef.current !== queryIdentity &&
        queryClient.getQueryState(queryKey)?.fetchStatus === 'idle' &&
        !isError &&
        viewport.scrollTop + viewport.height >= headerHeight + bodyRows.length * FUNDAMENTAL_MODEL_ROW_HEIGHT - 240
      ) {
        void fetchNextPage({ cancelRefetch: false })
      }
    },
    [
      bodyRows.length,
      disabled,
      fetchNextPage,
      fetchStatus,
      hasNextPage,
      headerHeight,
      isError,
      isFetching,
      queryClient,
      queryIdentity,
      queryKey,
    ],
  )

  const changeStructure = async (operations: ModelInputChangeRequest['operations']) => {
    if (!canChangeStructure || structureRequestRef.current) return false
    structureRequestRef.current = true
    setIsChangingStructure(true)
    try {
      const success = await onCommands(operations)
      return success
    } finally {
      structureRequestRef.current = false
      setIsChangingStructure(false)
    }
  }
  const insertRow = async (row: Record<string, unknown>, position: 'above' | 'below') => {
    if (!canChangeStructure || !creationFields || structureRequestRef.current) return
    const clientRowKey = `row_${uuid()}`
    const values: ModelInputAddRowCommand['values'] = {}
    const initialEdits: Omit<ModelInputLocalEdit, 'id'>[] = []
    for (const field of creationFields) {
      const fieldKey = String(field.fieldKey)
      const initial = getModelInputCreationRule(field)!.initialValue
      const result = validateModelInputCreationValue(initial, field)
      if (result.value !== null) values[fieldKey] = result.value
      if (result.error) initialEdits.push({ tableId: table.id, rowId: clientRowKey, fieldKey, text: initial, ...result })
    }
    structureRequestRef.current = true
    setIsChangingStructure(true)
    try {
      const added = await onStageRow(
        { type: 'ADD_ROW', commandId: `add_row_${uuid()}`, tableId: table.id, clientRowKey, values },
        initialEdits,
      )
      if (added && (row.id === 'empty-row' || (position === 'below' && row === rows.at(-1)))) {
        setScrollTarget({ rowIndex: bodyRows.length + addedRows.length })
      }
    } finally {
      structureRequestRef.current = false
      setIsChangingStructure(false)
    }
  }
  const addColumn = () => {
    if (!creationHeaders) return
    const last = columns.at(-1)
    const yearIndex = last?.headerValues.findIndex((value) => /^\d{4}$/.test(value.trim())) ?? -1
    const next = getNextFundamentalModelColumn({
      field: '',
      monthly: 'month' in creationHeaders,
      year: yearIndex >= 0 ? last?.headerValues[yearIndex] : undefined,
      month: yearIndex >= 0 ? last?.headerValues[yearIndex + 1] : undefined,
      period: yearIndex >= 0 ? last?.headerValues[yearIndex + 2] : undefined,
      lastLabel: last?.headerValues.find((value) => /\d{4}/.test(value)) ?? '',
      addedCount: 0,
    })
    const headerValues: { year?: number; month?: number } = {}
    for (const [key, field] of Object.entries(creationHeaders)) {
      if (!isModelInputObject(field)) return
      const rule = getModelInputCreationRule(field)!
      const value = rule.initialValue || (key === 'year' ? (next?.year ?? next?.label) : next?.month) || ''
      const result = validateModelInputCreationValue(value, field)
      if (result.error) {
        showSnackbar(result.error, { variant: 'error' })
        return
      }
      if (typeof result.value === 'number') headerValues[key as 'year' | 'month'] = result.value
    }
    void changeStructure([
      { type: 'ADD_COLUMN', commandId: `add_column_${uuid()}`, tableId: table.id, clientColumnKey: `column_${uuid()}`, headerValues },
    ]).then((success) => {
      if (success) setScrollTarget({ columnIndex: columns.length })
    })
  }
  const canDeleteRow = (row: Record<string, unknown>) => {
    if (hasNextPage || row !== rows.at(-1)) return false
    if (addedRows.some((command) => command.clientRowKey === row.id)) return true
    const page = pageByRow.get(Number(row.rowNumber))
    return Boolean(page && getModelInputDeletableRowId(page, Number(row.rowNumber)))
  }
  const tableActions = useFundamentalModelTableActions<Record<string, unknown>>({
    disabled: !canChangeStructure || isChangingStructure,
    getRowId,
    getRowNumber: (row) => Number(row.rowNumber),
    onAddColumn: creationHeaders ? addColumn : undefined,
    onInsertAbove: creationFields ? (row) => insertRow(row, 'above') : undefined,
    onInsertBelow: creationFields ? (row) => insertRow(row, 'below') : undefined,
    canInsertAbove: (row) => addedRows.some((command) => command.clientRowKey === row.id),
    canInsertBelow: (row) =>
      addedRows.some((command) => command.clientRowKey === row.id) || (!hasNextPage && row === bodyRows.at(-1)) || row.id === 'empty-row',
    canDeleteRow,
    onDeleteRow: (row) => {
      if (!canChangeStructure || isChangingStructure || !canDeleteRow(row)) return
      const localRow = addedRows.find((command) => command.clientRowKey === row.id)
      if (localRow) {
        onRemoveStagedRow(localRow.clientRowKey)
        return
      }
      const page = pageByRow.get(Number(row.rowNumber))
      const rowId = page && getModelInputDeletableRowId(page, Number(row.rowNumber))
      if (rowId) void changeStructure([{ type: 'DELETE_ROW', commandId: `delete_row_${uuid()}`, tableId: table.id, rowRef: { rowId } }])
    },
  })

  const renderCell = (row: Record<string, unknown>, column: (typeof columns)[number]) => {
    const rowNumber = Number(row.rowNumber)
    const page = pageByRow.get(rowNumber)
    const pageIndex = page && pageIndexes.get(page)
    const localRow = typeof row.id === 'string' ? addedRowsByKey.get(row.id) : undefined
    const field = localRow
      ? creationFieldsByColumn.get(column.field)
      : page && getModelInputField(page, rowNumber, column.field, 'SET', pageIndex)
    const clearField = page && getModelInputField(page, rowNumber, column.field, 'CLEAR', pageIndex)
    const editableField = field ?? clearField
    const binding = pageIndex?.bindingByRowNumber.get(rowNumber)
    const rowId = localRow?.clientRowKey ?? binding?.rowId
    const fieldKey = editableField?.fieldKey
    const edit = typeof rowId === 'string' && typeof fieldKey === 'string' ? editsByRow.get(rowId)?.get(fieldKey) : undefined
    const original =
      rowId && typeof editableField?.fieldKey === 'string'
        ? localRow
          ? localRow.values[editableField.fieldKey]
          : pageIndex?.editValuesByRowId.get(rowId)?.values[editableField.fieldKey]
        : undefined
    const restore = rowId && typeof fieldKey === 'string' ? pageIndex?.cellRestoresByRowId.get(rowId)?.get(fieldKey) : undefined
    const baseline = restore?.baseline
    const initialValue = baseline?.kind === 'EMPTY' ? null : baseline?.value
    const current = restore?.current
    const currentValue = current?.kind === 'EMPTY' ? null : current?.value
    const isModified = restore
      ? Boolean(edit?.error) || !areModelInputValuesEqual(edit ? edit.value : currentValue, initialValue)
      : undefined
    const canRestore = restore?.restoreStatus === 'READY'
    const value = edit?.text ?? displayValue(row[column.field])
    const textAlign = getSheetCellTextAlign(value)
    const constraints = localRow && field ? getModelInputCreationRule(field)?.constraints : field?.setConstraints
    const options = isModelInputObject(constraints) && Array.isArray(constraints.options) ? constraints.options : undefined
    if (
      !editableField ||
      !rowId ||
      draft.status !== 'DRAFT' ||
      (original !== undefined && original !== null && !isModelInputValue(original))
    ) {
      return (
        <Stack height="100%" minWidth={0} justifyContent="center">
          <Typography variant="body2M14" color="contentText.Normal" textAlign={textAlign} noWrap title={String(value)}>
            {editableField?.dataType === 'TEXT' ? value : formatFundamentalModelCellValue(value)}
          </Typography>
        </Stack>
      )
    }
    const updateValue = (text: string) => {
      if (localRow && field) {
        const result = validateModelInputCreationValue(text, field)
        onEdit(
          {
            tableId: table.id,
            rowId,
            fieldKey: String(field.fieldKey),
            text,
            ...result,
            type: result.value === null && !result.error ? 'CLEAR' : 'SET',
          },
          original,
        )
        return
      }
      if (!text && clearField && original !== '' && original !== null && original !== undefined) {
        onEdit(
          { type: 'CLEAR', tableId: table.id, rowId, fieldKey: String(clearField.fieldKey), text: '', value: null, error: null },
          original,
        )
        return
      }
      if (!field) return
      onEdit({ tableId: table.id, rowId, fieldKey: String(field.fieldKey), text, ...validateModelInputValue(text, field) }, original)
    }
    return (
      <Stack direction="row" alignItems="center" gap="2px" minWidth={0} inert={!canEdit || isChangingStructure}>
        {field ? (
          <FundamentalModelEditedCellInput
            value={edit?.text ?? String(original ?? '')}
            isNumeric={field.dataType === 'DECIMAL'}
            isNew={Boolean(localRow) || binding?.origin === 'ADDED' || column.isNew}
            originalValue={initialValue === null ? '' : isModelInputValue(initialValue) ? String(initialValue) : undefined}
            modified={isModified}
            restoreAllowed={canRestore}
            textAlign={textAlign}
            ariaLabel={`${table.name} ${rowNumber}행 ${column.headerName}`}
            errorMessage={edit?.error}
            options={options?.filter(isModelInputValue).map((option) => ({ value: String(option), label: String(option) }))}
            onChange={(nextValue) => updateValue(String(nextValue))}
            onBlur={() => undefined}
            onRestore={() => {
              if (!canRestore || !baseline || !restore) return
              onEdit(
                {
                  type: baseline.kind === 'EMPTY' ? 'CLEAR' : 'SET',
                  tableId: table.id,
                  rowId: restore.rowId,
                  fieldKey: restore.fieldKey,
                  text: baseline.kind === 'EMPTY' ? '' : String(baseline.value),
                  value: baseline.kind === 'EMPTY' ? null : baseline.value,
                  error: null,
                  ...(field.dataType === 'DECIMAL' ? { dataType: 'DECIMAL' as const } : {}),
                },
                original,
              )
            }}
          />
        ) : (
          <Typography variant="body2M14" noWrap>
            {editableField.dataType === 'TEXT' ? value : formatFundamentalModelCellValue(value)}
          </Typography>
        )}
      </Stack>
    )
  }

  return (
    <Stack position="relative" flex={1} minWidth={0} minHeight={0} gap="12px" padding="10px 8px 10px 20px">
      {firstPage?.tableData.controls.map((control, index) => {
        const value = displayValue(control.value)
        const savedChange = changesQuery.data?.find((change) => change.kind === 'CONTROL' && change.controlId === control.id)
        const baseline =
          savedChange && 'baseline' in savedChange
            ? savedChange.baseline.kind === 'VALUE'
              ? savedChange.baseline.value
              : undefined
            : undefined
        const originalValue =
          savedChange && savedChange.restoreStatus === 'READY' && (typeof baseline === 'string' || typeof baseline === 'number')
            ? baseline
            : undefined
        const updateControl = (nextValue: string | number) => {
          if (typeof control.id !== 'string' || nextValue === value) return
          void onControlChange(
            { type: 'SET', commandId: `mode_${uuid().replaceAll('-', '')}`, tableId: table.id, controlId: control.id, value: nextValue },
            value,
          )
        }
        return (
          <Stack key={typeof control.id === 'string' ? control.id : index} direction="row" alignItems="center" gap="12px">
            <Typography variant="body2M14">{displayValue(control.label)}</Typography>
            {Array.isArray(control.options) ? (
              <Stack width="180px" minWidth={0}>
                <FundamentalModelEditedCellInput
                  disabled={
                    !canChangeStructure ||
                    isProcessingStructure ||
                    firstPage.editing.capabilities.SET !== 'READY' ||
                    control.editable !== true ||
                    typeof control.id !== 'string'
                  }
                  value={value}
                  originalValue={originalValue}
                  textAlign="left"
                  ariaLabel={String(displayValue(control.label))}
                  onChange={updateControl}
                  onBlur={() => undefined}
                  onRestore={() => {
                    if (originalValue !== undefined) updateControl(originalValue)
                  }}
                  options={control.options
                    .filter(isModelInputObject)
                    .filter(
                      (option): option is Record<string, unknown> & { value: string | number } =>
                        typeof option.value === 'string' || typeof option.value === 'number',
                    )
                    .map((option) => ({ value: option.value, label: displayValue(option.label) }))}
                />
              </Stack>
            ) : (
              <Typography variant="body2M14">{value}</Typography>
            )}
          </Stack>
        )
      })}
      <Stack
        flex={1}
        minWidth={0}
        minHeight={0}
        overflow="hidden"
        bgcolor="commonColor.White"
        aria-busy={isProcessingStructure}
        inert={isProcessingStructure}
      >
        {query.isPending && (
          <Stack flex={1} alignItems="center" justifyContent="center" padding="40px">
            <CircularProgress size={24} aria-label="표 조회 중" />
          </Stack>
        )}
        {firstPage && (
          <Stack position="relative" flex={1} minWidth={0} minHeight={0} overflow="hidden">
            <FundamentalModelTemplateGrid
              rows={rows}
              totalRowCount={Math.max(rows.length, firstPage.page.totalBodyRows + addedRows.length)}
              columns={columns}
              columnWidths={columnWidths}
              headerHeight={headerHeight}
              getRowId={getRowId}
              scrollTarget={scrollTarget}
              isNewRow={isNewRow}
              renderCell={renderCell}
              onViewportChange={loadVisibleRows}
              actionHeader={tableActions.actionHeader}
              renderRowAction={tableActions.renderRowAction}
              renderColumnAction={(column) => {
                const field = getModelInputDeletableColumn(firstPage, column.field)
                if (!field || column.field !== columns.at(-1)?.field) return null
                return (
                  <FundamentalModelColumnMenu
                    label={column.headerValues.find((value) => /^\d{4}$/.test(value.trim())) ?? column.label}
                    disabled={!canChangeStructure || isChangingStructure}
                    onDelete={() => {
                      if (!canChangeStructure || isChangingStructure || column.field !== columns.at(-1)?.field) return
                      void changeStructure([
                        {
                          type: 'DELETE_COLUMN',
                          commandId: `delete_column_${uuid()}`,
                          tableId: table.id,
                          fieldKey: String(field.fieldKey),
                        },
                      ])
                    }}
                  />
                )
              }}
              isRowMenuOpen={tableActions.isRowMenuOpen}
            />
            {rows.length === 0 && (
              <Stack
                position="absolute"
                top={`${headerHeight + 10}px`}
                right="8px"
                bottom="10px"
                left="20px"
                alignItems="center"
                justifyContent="center"
                padding="20px"
                style={{ pointerEvents: 'none' }}
              >
                <Typography variant="body2M14" color="contentText.Subtext">
                  표시할 데이터가 없습니다.
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
        {isFetchingNextPage && (
          <Stack alignItems="center" padding="12px">
            <CircularProgress size={20} aria-label="추가 행 조회 중" />
          </Stack>
        )}
      </Stack>
      {isProcessingStructure && (
        <Stack
          position="absolute"
          top="0px"
          right="0px"
          bottom="0px"
          left="0px"
          zIndex={8}
          bgcolor="rgba(255, 255, 255, 0.7)"
          alignItems="center"
          justifyContent="center"
          gap="12px"
          role="status"
          aria-live="polite"
        >
          <MIAgentSpinner size={32} tone="gray" />
          <Typography variant="body2SB14" color="contentText.Normal">
            처리 중입니다
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}

export default FundamentalModelDraftTable
