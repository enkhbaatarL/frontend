import { createContext, useContext } from 'react'

export interface MIMorphingPopupContextValue {
  /** 팝업 콘텐츠가 실제로 스크롤되는 컨테이너 엘리먼트 */
  scrollContainer: HTMLDivElement | null
  /** 팝업 내부에서 닫기를 트리거 */
  close: () => void
}

export const MIMorphingPopupContext = createContext<MIMorphingPopupContextValue | null>(null)

export const useMIMorphingPopupContext = () => useContext(MIMorphingPopupContext)
