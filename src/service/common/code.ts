import api from '@/lib/axios.ts'

export interface ICode {
  codeId: string
  codeNm: string
  codeExpn: string
}

const apiUrl = 'common/codes'

const codeService = {
  async getNewsMarketCategoryCode(): Promise<ICode[]> {
    const response = await api.get(`${apiUrl}/nws_mrkt_ctgr_cd`)
    return response.data.data
  },
  async getNewsRegionCategoryCode(): Promise<ICode[]> {
    const response = await api.get(`${apiUrl}/nws_rgn_spt_cd`)
    return response.data.data
  },
  async getNewsIndustrySectorCode(): Promise<ICode[]> {
    const response = await api.get(`${apiUrl}/nws_ind_sctr_cd`)
    return response.data.data
  },
}

export default codeService
