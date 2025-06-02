import { AxiosResponse } from 'axios'

import api from '@/lib/axios'

export interface IFile {
  fileNo: number
  fileNm: string
  fileSize: number
  fileUrl: string
}

export interface IFileDownloadRequest {
  fileNo: number
  fileNm: string
  fileSize: number
}

const fileService = {
  /**
   * 파일을 다운로드합니다.
   * @param fileData - 파일 정보 객체
   */
  async downloadFile(fileData: IFileDownloadRequest): Promise<Blob> {
    const response: AxiosResponse<Blob> = await api.post('file-management/download/file', fileData, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * 1개 이상의 파일을 zip으로 압축하여 다운로드합니다.
   * @param prefix - 다운 받을 파일명의 Prefix
   * @param fileData - 파일 정보 객체
   */
  async downloadFiles(prefix?: string, fileData?: IFileDownloadRequest[]) {
    const response: AxiosResponse<Blob> = await api.post('/file-management/download', fileData, {
      params: { prefix },
      responseType: 'blob',
    })
    return response.data
  },
}

export default fileService
