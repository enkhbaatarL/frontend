import api from '@/lib/axios.ts'

export interface ICode {
  codeId: string
  codeNm: string
  codeExpn: string
}

const codeService = {
  async getCodeFromKey(key: string): Promise<ICode[]> {
    const response = await api.get(`common/codes/${key}`)
    return response.data.data
  },
}

export default codeService
