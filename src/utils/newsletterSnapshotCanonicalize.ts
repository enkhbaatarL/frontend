import { cloneDeep } from 'lodash-es'

import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

/**
 * 백엔드 `SnapshotCanonicalizer`와 동일 규칙으로 스냅샷을 맞춥니다.
 * 저장 시 `compare(base, current)` 전에 양쪽에 적용하면 content/fieldDefs 불일치·
 * 타임스탬프 문자열/숫자 혼재로 인한 거대 델타를 줄입니다.
 */

type JsonObject = Record<string, unknown>

const isBlankString = (v: unknown): boolean => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')

const resolveSectionCode = (section: JsonObject): string | null => {
  const code = section.code
  if (typeof code === 'string' && code.trim() !== '') return code
  const name = section.name
  if (typeof name === 'string' && name.trim() !== '') return name
  const id = section.id
  if (typeof id === 'string' && id.startsWith('sec-') && id.length > 4) {
    const body = id.slice(4)
    const lastDash = body.lastIndexOf('-')
    return lastDash > 0 ? body.slice(0, lastDash) : body
  }
  return null
}

const buildFieldDefNode = (editable: boolean): { editable: boolean; required: boolean } => ({
  editable,
  required: false,
})

const containsEditableField = (editableFields: unknown[] | null | undefined, fieldName: string): boolean =>
  (editableFields ?? []).some((n) => n === fieldName || String(n) === fieldName)

/** 숫자만 담긴 문자열 배열 요소 → number (차트 timestamps / series.values) */
const coerceNumericArray = (arr: unknown[]): unknown[] =>
  arr.map((el) => {
    if (typeof el === 'string' && /^-?\d+(?:\.\d+)?$/.test(el.trim())) {
      const n = Number(el.trim())
      return Number.isFinite(n) ? n : el
    }
    return el
  })

const normalizeChartNumericFieldsInBlock = (block: JsonObject): void => {
  const fields = block.fields
  if (fields === null || fields === undefined || typeof fields !== 'object' || Array.isArray(fields)) return
  const f = fields as JsonObject
  if (Array.isArray(f.timestamps)) {
    f.timestamps = coerceNumericArray(f.timestamps as unknown[])
  }
  if (Array.isArray(f.series)) {
    f.series = (f.series as unknown[]).map((s) => {
      if (s === null || s === undefined || typeof s !== 'object' || Array.isArray(s)) return s
      const ser = { ...(s as JsonObject) }
      if (Array.isArray(ser.values)) {
        ser.values = coerceNumericArray(ser.values as unknown[])
      }
      return ser
    })
  }
}

const canonicalizeBlock = (block: JsonObject): void => {
  const contentNode = block.content

  if (
    contentNode !== null &&
    typeof contentNode === 'object' &&
    !Array.isArray(contentNode) &&
    (block.fields === null || block.fields === undefined)
  ) {
    block.fields = cloneDeep(contentNode) as JsonObject
  }

  const fieldDefs = block.fieldDefs
  if (
    (fieldDefs === null || fieldDefs === undefined) &&
    contentNode !== null &&
    typeof contentNode === 'object' &&
    !Array.isArray(contentNode)
  ) {
    const contentObj = contentNode as JsonObject
    const editableArr = Array.isArray(block.editableFields) ? (block.editableFields as unknown[]) : null
    const generated: JsonObject = {}
    for (const fieldName of Object.keys(contentObj)) {
      generated[fieldName] = buildFieldDefNode(containsEditableField(editableArr, fieldName))
    }
    if (Object.keys(generated).length > 0) block.fieldDefs = generated
  }

  delete block.content
  delete block.editableFields

  normalizeChartNumericFieldsInBlock(block)
}

const moveSectionRemoved = (section: JsonObject): void => {
  if (section.removed !== null && section.removed !== undefined) {
    delete section.state
    return
  }
  if (section.state !== null && typeof section.state === 'object' && !Array.isArray(section.state)) {
    const st = section.state as JsonObject
    if (st.removed !== undefined && st.removed !== null) {
      section.removed = cloneDeep(st.removed)
    }
  }
  delete section.state
}

const canonicalizeSection = (section: JsonObject): void => {
  const sectionCode = resolveSectionCode(section)
  if (sectionCode && sectionCode.trim() !== '') {
    if (isBlankString(section.code)) section.code = sectionCode
    const title = section.title
    if (isBlankString(section.name) && typeof title === 'string' && title.trim() !== '') {
      section.name = title
    }
  }

  moveSectionRemoved(section)

  delete section.title

  const content = section.content
  if (
    (section.fields === null || section.fields === undefined) &&
    content !== null &&
    typeof content === 'object' &&
    !Array.isArray(content)
  ) {
    section.fields = cloneDeep(content) as JsonObject
  }
  delete section.content

  const blocks = section.blocks
  if (!Array.isArray(blocks)) return
  for (const b of blocks) {
    if (b !== null && typeof b === 'object' && !Array.isArray(b)) {
      canonicalizeBlock(b as JsonObject)
    }
  }
}

export const canonicalizeSnapshotLikeServer = (snapshot: INewsletterIssueSnapshotData): INewsletterIssueSnapshotData => {
  const root = cloneDeep(snapshot) as unknown as JsonObject
  const sections = root.sections
  if (!Array.isArray(sections)) return root as unknown as INewsletterIssueSnapshotData
  for (const sec of sections) {
    if (sec !== null && typeof sec === 'object' && !Array.isArray(sec)) {
      canonicalizeSection(sec as JsonObject)
    }
  }
  return root as unknown as INewsletterIssueSnapshotData
}
