/**
 * 과거(레거시) 테스트 데이터에 존재하던 `issueDetail` 기반 구조.
 * 현재 서비스 타입에서 제거되었지만, 스냅샷/리비전 테스트 유틸로는 여전히 유용해
 * 파일 내부에 최소 타입만 유지합니다.
 */
export type ILegacyNewsletterIssueDetail = {
  newsletterId: string
  frequency: 'DAILY' | 'WEEKLY' | 'ON_DEMAND' | (string & {})
  name: string
  description: string
  subscribed: boolean
  imageBase64: string
  enabled: boolean
  issueDetail: {
    no: string
    emailSubject: string
    title: string
    date: string
    subInfo?: string | null
    marketOpenTime: number
    marketCloseTime: number
    summary: string
    newsFlowChart: {
      title: string
      aggregationTime: string
      chartData: { timestamps: number[]; series: unknown[] }
    }
    relatedNews: {
      aggregationTime: string
      newsEventItems: unknown[]
    }
    references: unknown[]
  }
}

/** issueDetail이 있는 객체인지 확인 (snake_case 포함) */
const hasIssueDetail = (obj: unknown): obj is Record<string, unknown> => {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  return 'issueDetail' in o || 'issue_detail' in o
}

/** 이미 ILegacyNewsletterIssueDetail 형식에 가까운지 확인 */
const isValidStructure = (obj: unknown): obj is ILegacyNewsletterIssueDetail => {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  const issueDetail = o.issueDetail ?? o.issue_detail
  if (!issueDetail || typeof issueDetail !== 'object') return false
  const id = issueDetail as Record<string, unknown>
  return 'newsFlowChart' in id || 'news_flow_chart' in id || 'title' in id
}

/** snapshot을 ILegacyNewsletterIssueDetail로 정규화 (필요 시). 리비전 diff 등에서 재사용 */
export const normalizeNewsletterSnapshot = (snapshot: unknown): ILegacyNewsletterIssueDetail | null => {
  if (!snapshot || typeof snapshot !== 'object') return null

  const base = snapshot as Record<string, unknown>

  // 이미 올바른 구조면 보완만 하고 반환
  if (hasIssueDetail(base) && isValidStructure(base)) {
    const b = base as ILegacyNewsletterIssueDetail
    const raw = base as Record<string, unknown>
    const issueDetail = (raw.issueDetail ?? raw.issue_detail) as Record<string, unknown> | undefined
    return {
      ...b,
      name: b.name ?? b.issueDetail?.title ?? '',
      description: String(b.description ?? (issueDetail as Record<string, unknown>)?.description ?? ''),
    }
  }

  // issue_detail 등 snake_case 처리
  const issueDetail = (base.issueDetail ?? base.issue_detail) as Record<string, unknown> | undefined
  if (!issueDetail || typeof issueDetail !== 'object') return null

  const newsFlowChart = (issueDetail.newsFlowChart ?? issueDetail.news_flow_chart) as
    | ILegacyNewsletterIssueDetail['issueDetail']['newsFlowChart']
    | undefined
  const relatedNews = (issueDetail.relatedNews ?? issueDetail.related_news) as Record<string, unknown> | undefined
  const newsEventItems = relatedNews ? (relatedNews['newsEventItems'] ?? relatedNews['news_event_items'] ?? []) : []

  return {
    newsletterId: String(base.newsletterId ?? base.newsletter_id ?? ''),
    frequency: (base.frequency as ILegacyNewsletterIssueDetail['frequency']) ?? ('DAILY' as const),
    name: String(base.name ?? issueDetail.title ?? ''),
    description: String(base.description ?? (issueDetail as Record<string, unknown>)?.description ?? ''),
    subscribed: Boolean(base.subscribed ?? false),
    imageBase64: String(base.imageBase64 ?? base.image_base64 ?? ''),
    enabled: Boolean(base.enabled ?? true),
    issueDetail: {
      no: String(issueDetail.no ?? ''),
      emailSubject: String(issueDetail.emailSubject ?? issueDetail.email_subject ?? ''),
      title: String(issueDetail.title ?? ''),
      date: String(issueDetail.date ?? ''),
      subInfo: (issueDetail.subInfo ?? issueDetail.sub_info) as string | null | undefined,
      marketOpenTime: Number(issueDetail.marketOpenTime ?? issueDetail.market_open_time ?? 0),
      marketCloseTime: Number(issueDetail.marketCloseTime ?? issueDetail.market_close_time ?? 0),
      summary: String(issueDetail.summary ?? ''),
      newsFlowChart: newsFlowChart ?? {
        title: '',
        aggregationTime: '',
        chartData: { timestamps: [], series: [] },
      },
      relatedNews: {
        aggregationTime: String(relatedNews?.['aggregationTime'] ?? relatedNews?.['aggregation_time'] ?? ''),
        newsEventItems: Array.isArray(newsEventItems) ? newsEventItems : [],
      },
      references: Array.isArray(issueDetail.references) ? issueDetail.references : [],
    },
  }
}

/**
 * 저장/테스트용 중첩 응답에서 ILegacyNewsletterIssueDetail 추출.
 * 응답 구조가 다양할 수 있어 여러 경로를 시도.
 */
export const extractNewsletterFromTestData = (testData: unknown): ILegacyNewsletterIssueDetail | null => {
  if (!testData || typeof testData !== 'object') return null

  const t = testData as Record<string, unknown>

  // 경로 1: testData.data.content.latestSnapshot.data (ICommonResponse로 한 번 감싼 경우)
  const fromDataContent = (t.data as Record<string, unknown>)?.content as Record<string, unknown> | undefined
  const latest1 = fromDataContent?.latestSnapshot as Record<string, unknown> | undefined
  const original1 = fromDataContent?.originalSnapshot as Record<string, unknown> | undefined
  let snapshot = latest1?.data ?? original1?.data

  // 경로 2: testData.content.latestSnapshot.data (data 래핑 없이 직접 content인 경우)
  if (snapshot === null || snapshot === undefined) {
    const content = t.content as Record<string, unknown> | undefined
    const latest2 = content?.latestSnapshot as Record<string, unknown> | undefined
    const original2 = content?.originalSnapshot as Record<string, unknown> | undefined
    snapshot = latest2?.data ?? original2?.data
  }

  // 경로 3: testData 자체가 snapshot인 경우 (최상위에 issueDetail 있음)
  if ((snapshot === null || snapshot === undefined) && hasIssueDetail(t)) {
    snapshot = t
  }

  // 경로 4: content가 직접 snapshot인 경우 (latestSnapshot/originalSnapshot 없이 content 자체가 뉴스레터 데이터)
  if (snapshot === null || snapshot === undefined) {
    const directContent = (t.data as Record<string, unknown>)?.content ?? t.content
    if (directContent && typeof directContent === 'object') {
      const c = directContent as Record<string, unknown>
      if (hasIssueDetail(c) || ('name' in c && ('frequency' in c || 'issueDetail' in c || 'issue_detail' in c))) {
        snapshot = c
      }
    }
  }

  if (snapshot === null || snapshot === undefined) return null

  return normalizeNewsletterSnapshot(snapshot)
}
