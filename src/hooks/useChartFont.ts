import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { getChartFontConfig } from '../utils/font'

/**
 * 현재 언어에 따른 Chart.js 폰트 설정을 반환하는 훅
 */
export const useChartFont = () => {
  const { i18n } = useTranslation()

  const chartFontConfig = useMemo(() => getChartFontConfig(i18n.language), [i18n.language])

  return chartFontConfig
}
