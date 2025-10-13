import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

import { getCurrentFontFamily } from '@/utils/font'

/**
 * 언어 변경 시 폰트 패밀리를 업데이트하는 함수
 */
const updateFontFamily = (language: string) => {
  const fontFamily = getCurrentFontFamily(language)

  document.documentElement.style.setProperty('--font-family-primary', fontFamily)
  document.body.style.fontFamily = fontFamily

  // MUI 컴포넌트 클래스 업데이트
  const muiElements = document.querySelectorAll(
    '.MuiTypography-root, .MuiButton-root, .MuiTextField-root, .MuiInputBase-root, .MuiFormControl-root, .MuiFormLabel-root, .MuiSelect-root, .MuiMenuItem-root, .MuiDialog-root, .MuiDialogTitle-root, .MuiDialogContent-root, .MuiDialogActions-root, .MuiAlert-root, .MuiAlertTitle-root, .MuiBreadcrumbs-root, .MuiTooltip-root, .MuiIconButton-root, .MuiPagination-root, .MuiSwitch-root, .MuiCheckbox-root, .MuiLinearProgress-root, .MuiSkeleton-root',
  )
  muiElements.forEach((element) => {
    ;(element as HTMLElement).style.fontFamily = fontFamily
  })
}

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'ko',
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    updateFontFamily(i18n.language) // 초기 설정

    i18n.on('languageChanged', (lng) => {
      updateFontFamily(lng)
    })
  })

export default i18n
