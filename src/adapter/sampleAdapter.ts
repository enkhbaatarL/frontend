import { ISampleOption, ISampleRes } from '@/types/sample'
import Adapter from '@/utils/adapter'

export const testResAdapter = new Adapter((data: ISampleRes): ISampleOption[] => {
  return data.items.map((item) => {
    return {
      label: item,
      value: item,
    }
  })
})
