import { useQuery } from '@tanstack/react-query'

import { parseNewsletterIssueSnapshotData } from '@/pages/mi/newsletter/utils/snapshotUtils'
import newsletterService, { getOriginalSnapshotRoot } from '@/service/mi/newsletter'

/**
 * 발행 호의 org_snpsht_json 원본만 조회합니다.
 * 응답은 `NewsletterIssueOriginalSnapshotRes` — `snapshot`이 SnapshotRoot입니다.
 * GET /mi/newsletter/{newsletterId}/{issueNo}/original-snapshot
 */
export const useNewsletterOriginalSnapshot = (newsletterId: string | undefined, issueNo: string | undefined, customerCompanyNo: number) => {
  const { data, isLoading } = useQuery({
    queryKey: ['newsletterOriginalSnapshot', newsletterId, issueNo, customerCompanyNo],
    queryFn: () => {
      if (!newsletterId || !issueNo) {
        return Promise.reject(new Error('newsletterId and issueNo are required'))
      }
      return newsletterService.getNewsletterOriginalSnapshot(customerCompanyNo, newsletterId, issueNo)
    },
    select: (res) => {
      const root = getOriginalSnapshotRoot(res)
      if (!root) return null
      return parseNewsletterIssueSnapshotData(root) ?? root
    },
    enabled: !!newsletterId && !!issueNo && !!customerCompanyNo,
  })

  return { data, isLoading }
}
