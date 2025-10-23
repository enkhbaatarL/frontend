import api from '@/lib/axios.ts'

interface ICode {
  codeId: string
  codeNm: string
  codeExpn: string
}

const apiUrl = 'common/codes'

const codeService = {
  async getMarketCategoryCode(): Promise<ICode[]> {
    const response = await api.get(`${apiUrl}/nws_mrkt_ctgr_cd`)
    return response.data.data
  },
}

export default codeService
