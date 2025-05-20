import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IAuditInfo } from '@/service/admin/members'
import { ICommonResponse } from '@/types/api'

export interface PdfMetadata {
  fileNo: number
  originFileNm: string
  fileSize: number
  numberOfImages: number
  isImageConversionCompleted: boolean
  auditInfo: IAuditInfo
}

const pdfService = {
  /**
   * PDF 메타데이터 조회
   * @param fileNo 파일 번호
   * @return PdfMetadata 파일 메타데이터
   */
  async getPdfMetadata(fileNo: number): Promise<PdfMetadata> {
    const response: AxiosResponse<ICommonResponse<PdfMetadata>> = await api.get(`mi/pdf-viewer/files/${fileNo}/metadata`)

    return response.data.data
  },
  /**
   * PDF 이미지 조회
   * @param fileId 파일 번호
   * @param page 페이지 번호
   * @return 이미지 URL
   */
  async getPdfImage(fileId: number, page: number): Promise<string> {
    const response = await api.get(`mi/pdf-viewer/files/${fileId}/images`, {
      params: { page },
      responseType: 'blob',
    })

    return URL.createObjectURL(response.data)
  },
}
export default pdfService
