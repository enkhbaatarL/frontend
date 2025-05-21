import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'
export interface IFile {
  fileNo: number
  fileNm: string
  fileSize: number
  fileUrl: string
}

const fileService = {
  /**
   * 파일을 다운로드합니다.
   * @param fileNo
   */
  async downloadFile(fileNo: number): Promise<IFile> {
    const response: AxiosResponse<ICommonResponse<IFile>> = await api.get(`/admin/file-management/${fileNo}`)
    return response.data.data
  },
}

export default fileService
