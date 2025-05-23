import { AxiosResponse } from 'axios'

import api from '@/lib/axios'

export interface IFile {
  fileNo: number
  fileNm: string
  fileSize: number
  fileUrl: string
}

interface IFileDownloadRequest {
  fileNo: number
  fileNm: string
  fileSize: number
}

const fileService = {
  /**
   * 파일을 다운로드합니다.
   * @param fileData - 파일 정보 객체
   */
  async downloadFile(fileData: IFileDownloadRequest): Promise<string> {
    const response: AxiosResponse<string> = await api.post('file-management/download/file', fileData)
    return response.data
  },
}

export default fileService
