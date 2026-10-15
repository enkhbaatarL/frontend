export const FUNDAMENTAL_UPLOAD_POPUP_WIDTH = 640
export const FUNDAMENTAL_UPLOAD_MAX_FILES = 4
export const FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB = 50
export const FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES = FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024
export const FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH = 50
export const FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH = 500
export const FUNDAMENTAL_UPLOAD_GUIDE_TEXT = `(Demand, Supply, Trade, Output이 각각 포함된 ${FUNDAMENTAL_UPLOAD_MAX_FILES}개의 파일을 모두 업로드해주세요. 각 파일은 ${FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB}MB까지 가능합니다.)`
export const UPLOAD_FILE_REQUIRED_TITLE = 'MI Fundamental Model을 실행하려면 파일 4개가 필요합니다.'
export const UPLOAD_FILE_REQUIRED_BODY = 'Demand, Supply, Trade, Output이 각각 포함된 4개의 파일을 모두 업로드해주세요.'
export const FUNDAMENTAL_UPLOAD_ACCEPT =
  '.xls,.xlsx,.xlsm,application/vnd.ms-excel,application/vnd.ms-excel.sheet.macroenabled.12,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const EXCEL_FILE_EXTENSIONS = ['xls', 'xlsx', 'xlsm'] as const
const EXCEL_MIME_TYPES = new Set([
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroenabled.12',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])
const REQUIRED_MODEL_FILE_KEYWORDS = ['DEMAND', 'SUPPLY', 'TRADE', 'OUTPUT'] as const

const getFileExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() ?? ''

export const isFundamentalUploadExcelFile = (file: File) => {
  const extension = getFileExtension(file.name)
  return EXCEL_FILE_EXTENSIONS.includes(extension as (typeof EXCEL_FILE_EXTENSIONS)[number]) || EXCEL_MIME_TYPES.has(file.type)
}

export const isSameFundamentalUploadFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

const getFundamentalModelFileKind = (fileName: string) => {
  const matches = REQUIRED_MODEL_FILE_KEYWORDS.filter((kind) => fileName.toUpperCase().includes(kind))
  return matches.length === 1 ? matches[0] : undefined
}

export const hasRequiredFundamentalModelFiles = (files: File[]) =>
  files.length === FUNDAMENTAL_UPLOAD_MAX_FILES &&
  REQUIRED_MODEL_FILE_KEYWORDS.every((kind) => files.some((file) => getFundamentalModelFileKind(file.name) === kind))
