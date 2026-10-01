import * as XLSX from 'xlsx-js-style'

import type { FundamentalModelSheetData } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'

import { getFundamentalModelSheetData } from '@/pages/mi/fundamentalModel/components/fundamentalModelSheetDataParser'
import { getPlatformInputGuideRules } from '@/pages/mi/fundamentalModel/components/platformInputGuide'

interface LoadSheetDataMessage {
  requestId: string
  fileId: string
  file: File
  sheetName: string
}

interface WorkerSuccessMessage {
  requestId: string
  data: FundamentalModelSheetData
}

interface WorkerErrorMessage {
  requestId: string
  error: string
}

const workbooksByFileId = new Map<string, Promise<XLSX.WorkBook>>()
const sheetDataByKey = new Map<string, FundamentalModelSheetData>()

const getWorkbook = (fileId: string, file: File) => {
  const currentWorkbook = workbooksByFileId.get(fileId)
  if (currentWorkbook) return currentWorkbook

  const workbook = file
    .arrayBuffer()
    .then((data) => XLSX.read(data, { cellDates: true, cellStyles: true, type: 'array' }))
    .catch((error) => {
      workbooksByFileId.delete(fileId)
      throw error
    })
  workbooksByFileId.set(fileId, workbook)
  return workbook
}

self.onmessage = async (event: MessageEvent<LoadSheetDataMessage>) => {
  const { requestId, fileId, file, sheetName } = event.data

  try {
    const sheetDataKey = `${fileId}:${sheetName}`
    const cachedSheetData = sheetDataByKey.get(sheetDataKey)
    if (cachedSheetData) {
      const message: WorkerSuccessMessage = { requestId, data: cachedSheetData }
      self.postMessage(message)
      return
    }

    const workbook = await getWorkbook(fileId, file)
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      const availableSheetNames = workbook.SheetNames.join(', ')
      throw new Error(
        `업로드한 파일에서 '${sheetName}' 시트를 찾을 수 없습니다.${availableSheetNames ? ` 사용 가능 시트: ${availableSheetNames}` : ''}`,
      )
    }

    const guide = workbook.Sheets['플랫폼 입력 안내']
    const rules = guide ? getPlatformInputGuideRules(guide).filter((rule) => rule.sheetName === sheetName) : undefined
    const data = getFundamentalModelSheetData(worksheet, rules)
    sheetDataByKey.set(sheetDataKey, data)
    const message: WorkerSuccessMessage = { requestId, data }
    self.postMessage(message)
  } catch (error) {
    const message: WorkerErrorMessage = {
      requestId,
      error: error instanceof Error ? error.message : '엑셀 파일을 읽을 수 없습니다.',
    }
    self.postMessage(message)
  }
}
