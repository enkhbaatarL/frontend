import { useQuery } from '@tanstack/react-query'

import newsletterService from '@/service/mi/newsletter'

/**
 * 특정 범위 델타+스냅샷 조회 API (과거 시점 복원용)
 * 설계: GET /histories/{seq} → baseSnapshot + 그 스냅샷 이후부터 목표 seq까지의 histories 반환
 *
 * 윈도우 최적화: 최신 seq 한 번만 요청 → baseSnapshot + histories[1..seq] 확보
 * → 1~seq 모든 버전은 API 재호출 없이 캐시에서 파생
 *
 * @param seq
 * @param newsletterId
 * @param issueNo
 * @param revisionId
 */
export const useRevisionChangeDetail = (seq: number, newsletterId?: string, issueNo?: string, revisionId?: number) => {
  const { data, isLoading } = useQuery({
    queryKey: ['revisionChangeDetail', newsletterId, issueNo, revisionId, seq],
    queryFn: () => newsletterService.getRevisionChangeDetail(newsletterId!, issueNo!, revisionId!, seq),
    enabled: !!newsletterId && !!issueNo && !!revisionId && seq > 0,
  })

  return { data, isLoading }
}
