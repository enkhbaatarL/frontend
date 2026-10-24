import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { getModelInputSessionSignal, isModelInputSessionCurrent } from '@/pages/mi/fundamentalModel/hooks/modelInputSession'
import fundamentalModelCaseService from '@/service/mi/fundamentalModel/case'
import inputDraftService from '@/service/mi/fundamentalModel/inputDraft'

export const getModelInputTableQueryOptions = (scope: string, draftId: string, revision: number, tableId: string) => {
  const session = getModelInputSessionSignal()
  return infiniteQueryOptions({
    queryKey: ['fundamentalModel', 'inputDraftTable', scope, draftId, revision, tableId],
    initialPageParam: undefined as number | undefined,
    // 같은 revision의 표는 변경되지 않으며, 명시적인 새로고침은 refetch로 처리한다.
    staleTime: Infinity,
    // 전역 gcTime: 0 설정에서도 미리 조회한 표가 화면에 연결될 때까지 보관한다.
    gcTime: 60_000,
    queryFn: async ({ pageParam, signal }) => {
      session.throwIfAborted()
      if (!isModelInputSessionCurrent(session, scope)) throw new Error('사용자 또는 회사가 변경되었습니다.')
      const page = await inputDraftService.getTable(draftId, revision, tableId, pageParam, AbortSignal.any([signal, session]))
      signal.throwIfAborted()
      session.throwIfAborted()
      if (!isModelInputSessionCurrent(session, scope)) throw new Error('사용자 또는 회사가 변경되었습니다.')
      if (page.draftId !== draftId || page.revision !== revision || page.tableData.tableId !== tableId) {
        throw new Error('표 데이터를 불러오지 못했습니다.')
      }
      if (
        page.page.hasNext &&
        (page.page.returnedBodyRows === 0 ||
          page.page.nextStartRow === null ||
          page.page.nextStartRow <= (page.page.endRow ?? pageParam ?? 0))
      ) {
        throw new Error('표 데이터를 불러오지 못했습니다.')
      }
      return page
    },
    getNextPageParam: (page) => (page.page.hasNext ? (page.page.nextStartRow ?? undefined) : undefined),
  })
}

export const getModelInputSourceQueryOptions = (scope: string) => {
  const session = getModelInputSessionSignal()
  return queryOptions({
    queryKey: ['fundamentalModel', 'inputSourceCases', scope],
    queryFn: async ({ signal }) => {
      if (!isModelInputSessionCurrent(session, scope)) throw new Error('사용자 또는 회사가 변경되었습니다.')
      const sources = await fundamentalModelCaseService.listCases(undefined, AbortSignal.any([signal, session]))
      signal.throwIfAborted()
      if (!isModelInputSessionCurrent(session, scope)) throw new Error('사용자 또는 회사가 변경되었습니다.')
      return sources
    },
  })
}
