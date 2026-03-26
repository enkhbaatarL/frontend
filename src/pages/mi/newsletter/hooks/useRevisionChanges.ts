import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import type { RevisionVersion } from '@/pages/mi/newsletter/components/view/RevisionToolbar'

import newsletterService, { type IRevisionChangeItem } from '@/service/mi/newsletter'

const mapToRevisionVersion = (item: IRevisionChangeItem): RevisionVersion => {
  const label = item.updatedAt ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm') : '최초버전'
  return {
    id: String(item.seq),
    label,
    date: item.updatedAt ?? '',
  }
}

/**
 * 수정 이력 목록을 조회합니다.
 * @param newsletterId - 뉴스레터 ID
 * @param issueNo - 발행호 번호
 * @param revisionId - 리비전 ID (testData.revisionId)
 */
export const useRevisionChanges = (newsletterId: string | undefined, issueNo: string | undefined, revisionId: number | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ['revisionChanges', newsletterId, issueNo, revisionId],
    queryFn: () => newsletterService.getRevisionChanges(newsletterId!, issueNo!, revisionId!),
    enabled: !!newsletterId && !!issueNo && !!revisionId,
  })

  const versions: RevisionVersion[] = data?.items?.map(mapToRevisionVersion) ?? []

  return { versions, isLoading }
}
