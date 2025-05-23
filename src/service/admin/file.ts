import api from '@/lib/axios'
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
  async downloadFile(fileNo: number) {
    return await api.get(`/admin/file-management/download/${fileNo}`, {
      responseType: 'blob',
    })
  },

  /**
   * 1개 이상의 파일을 zip으로 압축하여 다운로드합니다.
   * @param prefix - 다운 받을 파일명의 Prefix
   * @param fileNos - 다운 받을 파일번호
   */
  async downloadFiles(fileNos: string, prefix?: string) {
    return await api.get('/admin/file-management/download', {
      params: { fileNos, prefix },
      responseType: 'blob',
    })
  },
}

export default fileService
