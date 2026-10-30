import { AxiosError, type AxiosResponse } from 'axios'

import type { ICommonResponse } from '@/types/api'
import type { LosslessNumber } from 'lossless-json'

import api from '@/lib/axios'
import { parseModelInputJson, stringifyModelInputJson } from '@/utils/modelInputJson'

// ModelInputDraftController / ModelInputDraftResponses의 OpenAPI 계약.
// 숫자 계약은 유지하며 JS number로 표현할 수 없는 값만 LosslessNumber로 보관한다.
// JsonNode/map 항목은 Swagger가 상세 타입을 제공할 때까지 unknown을 유지한다.
export interface ModelInputTableInfo {
  id: string
  kind: string
  sheetName: string
  name: string
  description: string | null
  location: string
  rowPolicy: string
  columnPolicy: string
  coordinates: { headerRow: number; bodyStart: number }
  controlIds: string[]
}

export interface ModelInputSection {
  kind: 'DEMAND' | 'SUPPLY' | 'TRADE' | 'OUTPUT'
  inputId: string
  sheets: Array<{ sheetName: string; tables: ModelInputTableInfo[] }>
}

export interface ModelInputSource {
  sourceKey: string
  sourceVersion: string
  sections: ModelInputSection[]
  tableData: null
}

export interface ModelInputDraftSummary {
  draftId: string
  sourceCaseId: number | null
  sourceKey: string
  sourceVersion: string | null
  status: 'DRAFT' | 'FINALIZED' | 'DISCARDED'
  statusLabel: string
  revision: number
  activeOperationId: string | null
  activeOperationEndpoint: string | null
  finalizedCaseId: number | null
  draftEndpoint: string
}

export interface ModelInputDraftCreated extends ModelInputDraftSummary {
  created: boolean
}

export interface ModelInputDraftStructure extends ModelInputDraftSummary {
  uploadedKinds: string[]
  missingKinds: string[]
  canFinalize: boolean
  sections: ModelInputSection[]
  tableData: null
}

export interface ModelInputProblem {
  reason: string
  currentRevision: number | null
  issues: Record<string, unknown>[]
}

export interface ModelInputOperation {
  operationId: string
  requestId: string
  draftId: string
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
  statusLabel: string
  baseRevision: number
  resultRevision: number | null
  rowMappings: Record<string, unknown>[]
  columnMappings: Array<{
    commandId: string
    clientColumnKey: string
    tableId: string
    fieldKey: string
    columnState: 'ACTIVE' | 'DELETED'
  }>
  affectedTableIds: string[]
  failure: ModelInputProblem | null
  statusEndpoint: string
}

export interface ModelInputFinalization {
  operationId: string
  requestId: string
  draftId: string
  status: ModelInputOperation['status']
  statusLabel: string
  baseRevision: number
  finalizedCaseId: number | null
  files: Array<{ role: string; fileNo: number }>
  caseEndpoint: string | null
  failure: ModelInputProblem | null
  statusEndpoint: string
  execution: {
    status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
    statusLabel: string
    runId: string | null
    statusEndpoint: string
    failureReason: 'EXECUTION_REQUEST_FAILED' | 'JOB_SUBMIT_FAILED' | 'MODEL_EXECUTION_FAILED' | null
  } | null
}

export type ModelInputColumnReference = { fieldKey: string; clientColumnKey?: never } | { clientColumnKey: string; fieldKey?: never }

export type ModelInputSetCommand = {
  type: 'SET'
  commandId: string
  tableId: string
  rowRef: { rowId: string; clientRowKey?: never } | { clientRowKey: string; rowId?: never }
  value: string | number | LosslessNumber
} & ModelInputColumnReference

export type ModelInputClearCommand = {
  type: 'CLEAR'
  commandId: string
  tableId: string
  rowRef: ModelInputSetCommand['rowRef']
} & ModelInputColumnReference

export interface ModelInputSetControlCommand {
  type: 'SET'
  commandId: string
  tableId: string
  controlId: string
  value: string | number
}

export type ModelInputSetHeaderCommand = {
  type: 'SET'
  commandId: string
  tableId: string
  headerKey: 'year'
  value: number
} & ModelInputColumnReference

export interface ModelInputAddColumnCommand {
  type: 'ADD_COLUMN'
  commandId: string
  tableId: string
  clientColumnKey: string
  headerValues: { year?: number; month?: number }
}

export type ModelInputDeleteColumnCommand = {
  type: 'DELETE_COLUMN'
  commandId: string
  tableId: string
} & ModelInputColumnReference

export interface ModelInputAddRowCommand {
  type: 'ADD_ROW'
  commandId: string
  tableId: string
  clientRowKey: string
  values: Record<string, string | number | LosslessNumber>
}

export interface ModelInputDeleteRowCommand {
  type: 'DELETE_ROW'
  commandId: string
  tableId: string
  rowRef: ModelInputSetCommand['rowRef']
}

export interface ModelInputRestoreRowCommand {
  type: 'RESTORE_ROW'
  commandId: string
  tableId: string
  rowId: string
}

export interface ModelInputRestoreColumnCommand {
  type: 'RESTORE_COLUMN'
  commandId: string
  tableId: string
  fieldKey: string
}

interface ModelInputChangeStatus {
  restoreStatus: 'READY' | 'INCOMPLETE' | 'NOT_ALLOWED' | 'UNSUPPORTED'
  restoreReason: string | null
}

// table-data / changes의 EMPTY와 VALUE 계약. 숫자 토큰의 정밀도는 그대로 보존한다.
export type ModelInputComparisonValue = { kind: 'EMPTY' } | { kind: 'VALUE'; value: string | number | LosslessNumber }

export interface ModelInputCellRestore extends ModelInputChangeStatus {
  rowId: string
  fieldKey: string
  baseline: ModelInputComparisonValue
  current: ModelInputComparisonValue
}

export type ModelInputChange = ModelInputChangeStatus &
  (
    | {
        kind: 'CELL'
        change: 'MODIFIED'
        rowId: string
        fieldKey: string
        baseline: ModelInputComparisonValue
        current: ModelInputComparisonValue
      }
    | { kind: 'ROW'; change: 'ADDED' | 'DELETED'; rowId: string; origin: string; originalRowNumber: number | null }
    | { kind: 'COLUMN'; change: 'ADDED' | 'DELETED'; fieldKey: string; origin: string; originalColumnNumber: number | null }
    | {
        kind: 'HEADER'
        change: 'MODIFIED'
        fieldKey: string
        headerKey: string
        baseline: ModelInputComparisonValue
        current: ModelInputComparisonValue
      }
    | {
        kind: 'CONTROL'
        change: 'MODIFIED'
        controlId: string
        sourceTableId: string
        sourceControlId: string
        baseline: ModelInputComparisonValue
        current: ModelInputComparisonValue
      }
  )

export interface ModelInputChanges {
  draftId: string
  tableId: string
  revision: number
  items: ModelInputChange[]
  nextCursor: string | null
}

export interface ModelInputRestorePreview {
  draftId: string
  tableId: string
  revision: number
  kind: 'ROW' | 'COLUMN'
  targetId: string
  preview: true
  tableData: ModelInputTablePage['tableData']
  page: ModelInputTablePage['page']
  editing: ModelInputTablePage['editing']
}

export interface ModelInputChangeRequest {
  requestId: string
  baseRevision: number
  operations: Array<
    | ModelInputRestoreRowCommand
    | ModelInputRestoreColumnCommand
    | ModelInputSetCommand
    | ModelInputClearCommand
    | ModelInputAddRowCommand
    | ModelInputDeleteRowCommand
    | ModelInputAddColumnCommand
    | ModelInputDeleteColumnCommand
    | ModelInputSetControlCommand
    | ModelInputSetHeaderCommand
  >
}

// 텍스트와 숫자를 구분한 채 원래 숫자 토큰을 정확한 평문 십진수로 전송한다.
export const serializeModelInputChange = (body: ModelInputChangeRequest) => stringifyModelInputJson(body)

export interface ModelInputFinalizationRequest {
  requestId: string
  baseRevision: number
  title: string
  description?: string | null
}

export interface ModelInputTablePage {
  draftId: string
  revision: number
  sourceKey: string
  sourceVersion: string | null
  tableData: {
    tableId: string
    columns: Array<{ field: string; headerName: string }>
    rows: Record<string, unknown>[]
    inputCells: number[]
    inputGuideRules: unknown
    controls: Record<string, unknown>[]
    displayUpdateRules: unknown
  }
  page: {
    totalBodyRows: number
    returnedBodyRows: number
    startRow: number | null
    endRow: number | null
    hasNext: boolean
    nextStartRow: number | null
  }
  editing: {
    capabilities: Record<string, string>
    columnCreation?: unknown
    fields: Record<string, unknown>[]
    rowBindings: Array<{ rowNumber: number; rowId: string | null; origin: 'SOURCE' | 'ADDED' | 'EMPTY_SLOT' }>
    editValues: Array<{ rowId: string; values: Record<string, unknown> }>
    cellRestores: ModelInputCellRestore[]
  }
}

export interface ModelInputUploadMetadata {
  sourceKey: string
  requestId: string
  baseRevision?: number
  replaceConfirmed?: boolean
}

export interface ModelInputUploadOperation {
  operationId: string
  requestId: string
  status: ModelInputOperation['status']
  statusEndpoint: string
  result: {
    kind: string
    draftId: string
    revision: number
    draftEndpoint: string
    structure: ModelInputDraftStructure
    selection: ModelInputTablePage | null
  } | null
  failure: {
    reason: string
    currentRevision: number | null
    issues: Array<{
      scope: 'FILE' | 'SHEET' | 'TABLE' | 'HEADER'
      kind: ModelInputSection['kind'] | null
      sheetName: string | null
      tableId: string | null
      cellRef: string | null
      reason: string
    }>
  } | null
}

const requestOptions = { suppressGlobalErrorHandler: true } as Parameters<typeof api.get>[1] & {
  suppressGlobalErrorHandler: boolean
}

const tableResponseOptions = {
  ...requestOptions,
  responseType: 'text' as const,
  transformResponse: [(data: string) => (data ? parseModelInputJson(data) : data)],
}

const readResponse = <T>(response: AxiosResponse<ICommonResponse<T>>) => {
  if (!response.data.status) {
    throw new AxiosError('입력 요청을 처리하지 못했습니다.', response.data.code, response.config, response.request, response)
  }
  return response.data.data
}

const inputDraftService = {
  async upload(file: File, metadata: ModelInputUploadMetadata, draftId?: string, signal?: AbortSignal) {
    const form = new FormData()
    form.append('file', file)
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    const response = await api.post<ICommonResponse<ModelInputUploadOperation>>(
      draftId ? `mi/fundamental-model/input-upload-drafts/${draftId}/files` : 'mi/fundamental-model/input-upload-drafts',
      form,
      { ...tableResponseOptions, signal },
    )
    return readResponse(response)
  },
  async getUpload(operationId: string, signal?: AbortSignal) {
    const response = await api.get<ICommonResponse<ModelInputUploadOperation>>(
      `mi/fundamental-model/input-upload-requests/${operationId}`,
      { ...tableResponseOptions, signal },
    )
    return readResponse(response)
  },
  async discardUpload(draftId: string, baseRevision: number, signal?: AbortSignal) {
    const response = await api.post<ICommonResponse<ModelInputDraftStructure>>(
      `mi/fundamental-model/input-upload-drafts/${draftId}/discard`,
      { baseRevision, discardConfirmed: true },
      { ...requestOptions, signal },
    )
    return readResponse(response)
  },
  async getSource(caseId: number, signal?: AbortSignal) {
    const response = await api.get<ICommonResponse<ModelInputSource>>(`mi/fundamental-model/cases/${caseId}/inputs/structure`, {
      ...requestOptions,
      signal,
    })
    return readResponse(response)
  },
  async createDraft(caseId: number, sourceVersion: string, signal?: AbortSignal) {
    const response = await api.post<ICommonResponse<ModelInputDraftCreated>>(
      `mi/fundamental-model/cases/${caseId}/input-drafts`,
      { sourceVersion },
      { ...requestOptions, signal },
    )
    return readResponse(response)
  },
  async getDraft(draftId: string, signal?: AbortSignal) {
    const response = await api.get<ICommonResponse<ModelInputDraftStructure>>(`mi/fundamental-model/input-drafts/${draftId}`, {
      ...requestOptions,
      signal,
    })
    return readResponse(response)
  },
  async getTable(draftId: string, revision: number, tableId: string, startRow?: number, signal?: AbortSignal) {
    const response = await api.get<ICommonResponse<ModelInputTablePage>>(`mi/fundamental-model/input-drafts/${draftId}/table-data`, {
      ...tableResponseOptions,
      params: { revision, tableId, startRow },
      signal,
    })
    return readResponse(response)
  },
  async getChanges(draftId: string, revision: number, tableId: string, cursor?: string, signal?: AbortSignal) {
    const response = await api.get<ICommonResponse<ModelInputChanges>>(`mi/fundamental-model/input-drafts/${draftId}/changes`, {
      ...tableResponseOptions,
      params: { revision, tableId, cursor },
      signal,
    })
    return readResponse(response)
  },
  async getRestorePreview(
    draftId: string,
    revision: number,
    tableId: string,
    kind: ModelInputRestorePreview['kind'],
    targetId: string,
    startRow?: number,
    signal?: AbortSignal,
  ) {
    const response = await api.get<ICommonResponse<ModelInputRestorePreview>>(
      `mi/fundamental-model/input-drafts/${draftId}/restore-preview`,
      { ...tableResponseOptions, params: { revision, tableId, kind, targetId, startRow }, signal },
    )
    return readResponse(response)
  },
  async change(draftId: string, body: ModelInputChangeRequest, keepalive = false) {
    const response = await api.post<ICommonResponse<ModelInputOperation>>(
      `mi/fundamental-model/input-drafts/${draftId}/change-requests`,
      serializeModelInputChange(body),
      {
        ...requestOptions,
        headers: { 'Content-Type': 'application/json' },
        ...(keepalive ? { adapter: 'fetch', fetchOptions: { keepalive: true } } : {}),
      },
    )
    return readResponse(response)
  },
  async getChange(draftId: string, operationId: string, statusEndpoint?: string) {
    const response = await api.get<ICommonResponse<ModelInputOperation>>(
      statusEndpoint?.replace(/^\/api\/v1\//, '') ?? `mi/fundamental-model/input-drafts/${draftId}/change-requests/${operationId}`,
      requestOptions,
    )
    return readResponse(response)
  },
  async finalize(draftId: string, body: ModelInputFinalizationRequest) {
    const response = await api.post<ICommonResponse<ModelInputFinalization>>(
      `mi/fundamental-model/input-drafts/${draftId}/finalizations`,
      body,
      requestOptions,
    )
    return readResponse(response)
  },
  async getFinalization(draftId: string, operationId: string) {
    const response = await api.get<ICommonResponse<ModelInputFinalization>>(
      `mi/fundamental-model/input-drafts/${draftId}/finalizations/${operationId}`,
      requestOptions,
    )
    return readResponse(response)
  },
}

export default inputDraftService
