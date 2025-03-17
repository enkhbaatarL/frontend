import { ISampleCompaniesResData, ISampleOption, ISampleRes } from '@/types/sample'
import Adapter from '@/utils/adapter'

export const testResAdapter = new Adapter((data: ISampleRes): ISampleOption[] => {
  return data.items.map((item) => {
    return {
      label: item,
      value: item,
    }
  })
})

export const sampleCompaniesAdapter = new Adapter((data: ISampleCompaniesResData[]) => {
  return data.map((item: ISampleCompaniesResData) => {
    return {
      companyName: item.companyName,
      companyEngName: item.companyEngName,
      createUserId: item.createUserId,
      createDt: item.createDt,
      modifyUserId: item.modifyUserId,
      modifyDt: item.modifyDt,
    }
  })
})
