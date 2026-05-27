import type { FundamentalModelRunPlaceholderMode } from '@/pages/mi/fundamentalModel/components/FundamentalModelRunPlaceholder'
import type { FundamentalModelCaseStatus, IFundamentalModelCaseLatestRun } from '@/service/mi/fundamentalModel/case'

import { formatWorkbenchDateTime } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'

/** Case API status -> Placeholder 모드 (COMPLETED 이면 null) */
export const caseStatusToPlaceholderMode = (status: FundamentalModelCaseStatus | undefined): FundamentalModelRunPlaceholderMode | null => {
  if (status === 'PENDING') return 'pending'
  if (status === 'RUNNING') return 'running'
  if (status === 'FAILED') return 'error'
  return null
}

/** 목록/헤더 상태 배지 스타일 */
export const caseStatusVisual = (status: FundamentalModelCaseStatus) => {
  if (status === 'PENDING') {
    return { bg: 'gray.20', color: 'gray.70', label: 'PENDING' }
  }
  if (status === 'RUNNING') {
    return { bg: 'contentBG.PrimaryFade', color: 'mari.Primary', label: 'IN PROGRESS' }
  }
  if (status === 'FAILED') {
    return { bg: 'rgba(214, 51, 108, 0.1)', color: '#D6336C', label: 'ERROR' }
  }
  return { bg: 'rgba(42, 141, 62, 0.1)', color: '#2A8D3E', label: 'DONE' }
}

/** latestRun 기준 실행 소요 라벨 */
export const formatCaseLatestRunDuration = (latestRun: IFundamentalModelCaseLatestRun | null | undefined): string => {
  if (!latestRun?.finishedAt) return '-'

  const finishedLabel = formatWorkbenchDateTime(latestRun.finishedAt, 'HH:mm:ss')
  if (!latestRun.startedAt) return finishedLabel

  const elapsedMs = new Date(latestRun.finishedAt).getTime() - new Date(latestRun.startedAt).getTime()
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return finishedLabel

  const elapsedSec = Math.round(elapsedMs / 1000)
  return `${finishedLabel} · ${elapsedSec}초 소요`
}
