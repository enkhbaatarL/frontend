export type SupportedLanguage = 'ko' | 'en' | 'ja'

export const languageList: { label: string; value: SupportedLanguage }[] = [
  { label: '한국어', value: 'ko' },
  // { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
]

/**
 * 언어 코드에 따른 폰트 패밀리를 반환합니다.
 * @param language - 언어 코드 ('ko', 'en', 'ja')
 * @returns 해당 언어에 맞는 폰트 패밀리
 */
export const getFontFamilyByLanguage = (language: string): string => {
  switch (language) {
    case 'ja':
      return 'PretendardJP, sans-serif'
    case 'ko':
    case 'en':
    default:
      return 'Pretendard, sans-serif'
  }
}

/**
 * 현재 i18n 언어에 따른 폰트 패밀리를 반환합니다.
 * @param i18nLanguage - i18n.language 값
 * @returns 해당 언어에 맞는 폰트 패밀리
 */
export const getCurrentFontFamily = (i18nLanguage?: string): string => getFontFamilyByLanguage(i18nLanguage ?? 'ko')

/**
 * 언어별 폰트 패밀리 매핑 객체
 */
export const FONT_FAMILY_MAP: Record<SupportedLanguage, string> = {
  ko: 'Pretendard, sans-serif',
  en: 'Pretendard, sans-serif',
  ja: 'PretendardJP, sans-serif',
}

/**
 * Chart.js용 폰트 설정을 반환합니다.
 * @param language - 언어 코드
 * @returns Chart.js 폰트 설정 객체
 */
export const getChartFontConfig = (language: string) => ({
  family: getFontFamilyByLanguage(language),
})

/**
 * MUI 테마용 폰트 설정을 반환합니다.
 * @param language - 언어 코드
 * @returns MUI 폰트 설정 배열
 */
export const getMuiFontFamily = (language: string): string[] => {
  const fontFamily = getFontFamilyByLanguage(language)
  return fontFamily.split(',').map((font) => font.trim())
}
