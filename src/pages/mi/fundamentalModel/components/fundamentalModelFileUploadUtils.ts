import type { ModelInputSection } from '@/service/mi/fundamentalModel/inputDraft'

export const FUNDAMENTAL_UPLOAD_POPUP_WIDTH = 640
export const FUNDAMENTAL_UPLOAD_MAX_FILES = 4
export const FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB = 50
export const FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES = FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024
export const FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH = 50
export const FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH = 500
const REQUIRED_MODEL_FILE_KEYWORDS: readonly ModelInputSection['kind'][] = ['DEMAND', 'SUPPLY', 'TRADE', 'OUTPUT']

export const getFundamentalModelFileKind = (fileName: string): ModelInputSection['kind'] | undefined => {
  const matches = REQUIRED_MODEL_FILE_KEYWORDS.filter((kind) => fileName.toUpperCase().includes(kind))
  return matches.length === 1 ? matches[0] : undefined
}
