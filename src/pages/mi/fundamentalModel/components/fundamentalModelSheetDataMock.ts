import type { FundamentalModelSheetData } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'

import FundamentalModelSheetDataWorker from '@/pages/mi/fundamentalModel/components/fundamentalModelSheetData.worker?worker'

interface WorkerResponse {
  requestId: string
  data?: FundamentalModelSheetData
  error?: string
}

interface PendingRequest {
  reject: (reason?: unknown) => void
  resolve: (data: FundamentalModelSheetData) => void
}

const pendingRequests = new Map<string, PendingRequest>()
const cachedSheetDataByFile = new WeakMap<File, Map<string, FundamentalModelSheetData>>()
let sheetDataWorker: Worker | undefined
let nextRequestId = 0

export const getCachedFundamentalModelSheetData = (file: File, sheetName: string) => cachedSheetDataByFile.get(file)?.get(sheetName)

const getSheetDataWorker = () => {
  if (sheetDataWorker) return sheetDataWorker

  sheetDataWorker = new FundamentalModelSheetDataWorker()
  sheetDataWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const pendingRequest = pendingRequests.get(event.data.requestId)
    if (!pendingRequest) return

    pendingRequests.delete(event.data.requestId)
    if (event.data.error) {
      pendingRequest.reject(new Error(event.data.error))
      return
    }
    if (event.data.data) pendingRequest.resolve(event.data.data)
  }
  sheetDataWorker.onerror = () => {
    pendingRequests.forEach(({ reject }) => reject(new Error('시트 데이터를 불러오지 못했습니다.')))
    pendingRequests.clear()
    sheetDataWorker?.terminate()
    sheetDataWorker = undefined
  }
  return sheetDataWorker
}

// Temporary preview response from the uploaded workbook. Replace this boundary with the backend API.
export const getFundamentalModelSheetDataPreview = (file: File, sheetName: string): Promise<FundamentalModelSheetData> => {
  const cachedData = getCachedFundamentalModelSheetData(file, sheetName)
  if (cachedData) return Promise.resolve(cachedData)

  return new Promise<FundamentalModelSheetData>((resolve, reject) => {
    const requestId = String(++nextRequestId)
    pendingRequests.set(requestId, { resolve, reject })
    getSheetDataWorker().postMessage({
      requestId,
      fileId: `${file.name}:${file.size}:${file.lastModified}`,
      file,
      sheetName,
    })
  }).then((data) => {
    const fileSheets = cachedSheetDataByFile.get(file) ?? new Map<string, FundamentalModelSheetData>()
    fileSheets.set(sheetName, data)
    cachedSheetDataByFile.set(file, fileSheets)
    return data
  })
}
