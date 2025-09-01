import { useMemo, useLayoutEffect, RefObject } from 'react'
import { useLocation } from 'react-router-dom'

interface ScrollRestorationProps {
  /** 스크롤 복원 전 화면에 적용할 최소 높이 (기본값: '100vh') */
  minHeight?: string
  /** 스크롤 위치 저장 및 복원을 적용할 경로 목록 (pathname 배열) */
  urls: string[]
  /** 스크롤을 관리할 요소의 ref (선택사항) */
  ref?: RefObject<HTMLDivElement | null>
}

interface ScrollRestorationReturn {
  /** 스크롤 위치를 sessionStorage에 저장하는 함수 */
  saveScroll: (callback?: () => void) => void
  /** 현재 복원된 scrollY 값 */
  currentScroll: number
  /** 렌더링 전 적용할 동적 minHeight 값 */
  preRenderMinHeight: string
}

/**
 * 특정 URL(pathname)에 대해 스크롤 위치를 복원하고 저장하는 커스텀 훅
 *
 * @param minHeight - 스크롤 복원 전 화면에 적용할 최소 높이 (기본값: '100vh')
 *                    복원하려는 scrollY 값이 현재 문서 높이보다 클 경우,
 *                    화면이 먼저 충분히 렌더링되도록 하기 위한 용도
 * @param urls - 스크롤 위치 저장 및 복원을 적용할 경로 목록 (pathname 배열)
 * @param ref - 스크롤을 관리할 요소의 ref (선택사항)
 *
 * @returns {
 *   saveScroll: 스크롤 위치를 sessionStorage에 저장하는 함수
 *   currentScroll: 현재 복원된 scrollY 값
 *   preRenderMinHeight: 렌더링 전 적용할 동적 minHeight 값
 * }
 */
export const useScrollRestoration = ({ minHeight = '100vh', urls, ref }: ScrollRestorationProps): ScrollRestorationReturn => {
  const { pathname } = useLocation()
  /** 스크롤을 적용할 url 주소인지 여부 */
  const isTarget = useMemo(() => urls.includes(pathname.replace('/mi/', '')), [pathname, urls])

  /** 저장된 scrollY */
  const savedY = useMemo(() => (isTarget ? Number(sessionStorage.getItem(`scroll-${pathname}`) ?? 0) : 0), [isTarget, pathname])

  /** 스크롤이 랜더링 중인 화면의 스크롤 보다 큰경우 preHeight 지정  */
  const preRenderMinHeight = useMemo(() => {
    if (!savedY) return minHeight
    return `${savedY + window.innerHeight}px`
  }, [minHeight, savedY])

  useLayoutEffect(() => {
    const target = ref?.current || window
    target.scrollTo({ top: savedY, behavior: 'instant' })
  }, [savedY, ref])

  /** 언마운트 전 스크롤 저장 */
  const saveScroll = (callback?: () => void) => {
    callback?.()
    if (!isTarget) return

    const target = ref?.current || window
    const scrollY = 'scrollTop' in target ? target.scrollTop : window.scrollY

    if (scrollY === 0) sessionStorage.removeItem(`scroll-${pathname}`)
    else sessionStorage.setItem(`scroll-${pathname}`, scrollY.toString())
  }

  return { saveScroll, currentScroll: savedY, preRenderMinHeight }
}
