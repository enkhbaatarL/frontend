import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { getMuiFontFamily } from '@/utils/font'

/**
 * 현재 언어에 따른 MUI 테마 폰트 설정을 반환하는 훅
 */
export const useFontTheme = () => {
  const { i18n } = useTranslation()

  const fontFamily = useMemo(() => getMuiFontFamily(i18n.language), [i18n.language])

  return {
    fontFamily,
    typography: {
      fontFamily: fontFamily.join(','),
    },
  }
}
