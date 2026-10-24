import type { QueryClient } from '@tanstack/react-query'

import useAuthStore from '@/store/useAuthStore'

export const getModelInputAuthScope = (state = useAuthStore.getState()) => {
  const { user, accessCompanyInfo } = state
  return `${user?.userNo ?? ''}:${user?.isOtherServiceAccessPossible ? (accessCompanyInfo?.customerCompanyNo ?? user.companyNo) : (user?.companyNo ?? '')}`
}

const identity = (state = useAuthStore.getState()) => ({
  scope: getModelInputAuthScope(state),
  baseUrl: state.customBaseUrl,
  authenticated: Boolean(state.token),
})

let session: (ReturnType<typeof identity> & { controller: AbortController }) | undefined

// 기능 내부에서 요청을 만들 때만 현재 공개 인증 상태를 확인한다.
export const getModelInputSessionSignal = () => {
  const current = identity()
  if (
    !session ||
    session.scope !== current.scope ||
    session.baseUrl !== current.baseUrl ||
    session.authenticated !== current.authenticated
  ) {
    const previous = session
    session = { ...current, controller: new AbortController() }
    previous?.controller.abort()
  }
  return session.controller.signal
}

export const isModelInputSessionCurrent = (signal: AbortSignal, scope: string) =>
  signal === getModelInputSessionSignal() && !signal.aborted && getModelInputAuthScope() === scope

export const observeModelInputSession = (queryClient: QueryClient) => {
  getModelInputSessionSignal()
  const clearScope = (scope: string) => {
    const filters = {
      predicate: (query: { queryKey: readonly unknown[] }) =>
        query.queryKey[0] === 'fundamentalModel' &&
        ['inputDraftTable', 'inputSourceCases'].includes(String(query.queryKey[1])) &&
        query.queryKey[2] === scope,
    }
    void queryClient.cancelQueries(filters)
    queryClient.removeQueries(filters)
  }
  // 페이지가 마운트된 동안만 관측한다. AuthStore의 갱신/토큰/회사 선택 동작은 변경하지 않는다.
  const unsubscribe = useAuthStore.subscribe((state, previous) => {
    const current = identity(state)
    const before = identity(previous)
    if (current.scope === before.scope && current.baseUrl === before.baseUrl && current.authenticated === before.authenticated) return
    getModelInputSessionSignal()
    clearScope(before.scope)
  })
  return () => {
    unsubscribe()
    clearScope(getModelInputAuthScope())
  }
}
