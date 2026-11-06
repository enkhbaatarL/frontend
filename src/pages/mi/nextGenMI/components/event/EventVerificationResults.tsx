import { Divider, Link, Stack, Typography } from '@mui/material'

import type { VerificationUpdateState } from '@/pages/mi/nextGenMI/hooks/useEventVerificationUpdates'
import type {
  EventVerificationResult,
  StoredEventVerification,
  VerificationAspect,
  VerificationCheck,
  VerificationReason,
  VerificationVerdict,
} from '@/service/mi/nextGenMI/event'

import MIAccordion from '@/components/common/accordion/MIAccordion'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'

const reasonLabels: Record<VerificationReason, string> = {
  verified: '핵심 주장 일치',
  no_contradiction: '명확한 불일치 없음',
  review_required: '검토 필요',
  no_evidence: '근거 부족',
  search_error: '검색 미완료 · 재검증 가능',
  verification_error: '비교 미완료 · 재검증 가능',
  contradicted: '근거와 불일치',
  outdated: '최신 정보와 차이',
}

const aspectLabels: Record<VerificationAspect, string> = {
  entity: '사건·대상',
  location: '장소·지역',
  time: '시점·기간',
  quantity: '수치·단위',
  freshness: '최신성',
  attribution: '발표 주체·귀속',
}

const verdictLabels: Record<VerificationVerdict, string> = {
  matched: '일치',
  caution: '주의',
  contradicted: '불일치',
  outdated: '후속 정보로 대체',
  unverified: '확인 불가',
  not_applicable: '해당 없음',
}

const cautionReasonLabels: Record<NonNullable<VerificationCheck['cautionReason']>, string> = {
  as_of_limitation: '확인 시점 한계',
  source_conflict: '출처 간 상충',
  insufficient_evidence: '근거 부족',
  other: '기타 주의 사항',
}

const getVerificationLinkLabel = (url: string, index: number) => {
  try {
    return new URL(url).hostname.replace(/^www\./i, '') || `근거 링크 ${index + 1}`
  } catch {
    return `근거 링크 ${index + 1}`
  }
}

const VerificationLinks = ({ urls }: { urls: string[] }) => (
  <Stack direction="row" flexWrap="wrap" columnGap="16px" rowGap="4px" minWidth={0}>
    {urls.map((url, index) => (
      <Link
        key={`${index}-${url}`}
        href={/^https?:\/\//i.test(url) ? url : undefined}
        target="_blank"
        rel="noopener noreferrer"
        variant="body2R14"
        whiteSpace="nowrap"
        maxWidth="100%"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {getVerificationLinkLabel(url, index)}
      </Link>
    ))}
  </Stack>
)

interface EventVerificationResultsProps {
  result: EventVerificationResult
  getUpdateState: (item: StoredEventVerification) => VerificationUpdateState
  onRetryRefresh: (item: StoredEventVerification) => void
}

const VerificationChecks = ({ checks }: { checks: VerificationCheck[] }) => (
  <Stack gap="10px" divider={<Divider />}>
    {checks.map((check) => (
      <Stack key={check.aspect} gap="4px">
        <Typography variant="body2SB14">{aspectLabels[check.aspect]}</Typography>
        <Typography variant="body2R14">판정: {verdictLabels[check.verdict]}</Typography>
        <Typography variant="body2R14">Event 주장: {check.eventClaim}</Typography>
        <Typography variant="body2R14">확인 내용: {check.finding}</Typography>
        {check.cautionReason && <Typography variant="body2R14">주의 사유: {cautionReasonLabels[check.cautionReason]}</Typography>}
        {check.qualificationQuote && <Typography variant="body2R14">{check.qualificationQuote}</Typography>}
        {check.sourceUrls.length > 0 && (
          <Stack gap="4px">
            <Typography variant="body3SB12">근거 링크</Typography>
            <VerificationLinks urls={check.sourceUrls} />
          </Stack>
        )}
      </Stack>
    ))}
  </Stack>
)

const EventVerificationResults = ({ result, getUpdateState, onRetryRefresh }: EventVerificationResultsProps) => (
  <Stack gap="10px" maxHeight="240px" overflow="auto">
    <Typography variant="body3R12" color="contentText.Subtext">
      검증 기준 시각 (UTC): {result.checkedAt}
    </Typography>
    {result.items.map((originalItem) => {
      const updateState = getUpdateState(originalItem)
      const updateResult = updateState.result
      const unsavedVerification = updateResult?.updateStatus === 'skipped' ? updateResult.postVerification : null
      // 미저장 수정안의 판정은 현재 Event의 검증 결과로 표시하지 않는다.
      const item = updateResult
        ? updateResult.updateStatus === 'updated'
          ? (updateResult.postVerification ?? updateResult.verification)
          : updateResult.verification
        : originalItem
      return (
        <Stack key={item.miEventId} gap="8px">
          <Stack direction="row" alignItems="center" gap="8px">
            <Typography variant="body2SB14">{item.title}</Typography>
            <MIChip
              label={item.status}
              color={item.status === 'pass' ? 'green' : item.status === 'warning' ? 'orange' : 'red'}
              disableHover
            />
          </Stack>
          {updateState.message && <Typography variant="body2R14">{updateState.message}</Typography>}
          {updateState.isApplied && !updateResult && <Typography variant="body3R12">변경 전 검증 결과</Typography>}
          {updateState.errorMessage && (
            <Typography variant="body2R14" color="contentText.Error" role="alert">
              {updateState.errorMessage}
            </Typography>
          )}
          {updateState.refreshErrorMessage && (
            <Stack direction="row" alignItems="center" gap="8px">
              <Typography variant="body2R14" color="contentText.Error" role="alert">
                {updateState.refreshErrorMessage}
              </Typography>
              <MIBaseButton
                variant="outlined"
                disabled={updateState.isRefreshing}
                aria-busy={updateState.isRefreshing}
                onClick={() => onRetryRefresh(originalItem)}
              >
                다시 조회
              </MIBaseButton>
            </Stack>
          )}
          <Typography variant="body2SB14">
            {reasonLabels[item.reasonCode]}
            {updateState.isApplied
              ? ' · 저장 완료'
              : updateResult?.updateStatus === 'skipped'
                ? ' · 수정 생략'
                : updateResult?.updateStatus === 'unchanged'
                  ? ' · 변경 없음'
                  : ''}
          </Typography>
          <Typography variant="body2R14">{item.review}</Typography>
          <Typography variant="body3R12" color="contentText.Subtext">
            검증한 Event 수정 시각: {updateResult?.updateStatus === 'updated' ? updateResult.updatedAt : (item.sourceUpdatedAt ?? '-')}
          </Typography>
          <Typography variant="body3R12" color="contentText.Subtext">
            검증 ID: {originalItem.verificationId ?? '-'}
          </Typography>
          <Typography variant="body3R12" color="contentText.Subtext">
            검증 만료 시각: {originalItem.expiresAt ?? '-'}
          </Typography>
          {item.links.length > 0 && (
            <Stack gap="4px">
              <Typography variant="body3SB12">근거 링크</Typography>
              <VerificationLinks urls={item.links} />
            </Stack>
          )}
          {(item.checks.length > 0 || unsavedVerification) && (
            <MIAccordion
              items={[
                ...(item.checks.length > 0
                  ? [
                    {
                      key: `event-verification-${item.miEventId}`,
                      title: '상세 비교',
                      content: <VerificationChecks checks={item.checks} />,
                    },
                  ]
                  : []),
                ...(unsavedVerification
                  ? [
                    {
                      key: `event-verification-proposal-${item.miEventId}`,
                      title: '수정안 검증 결과 (미저장)',
                      content: (
                        <Stack gap="10px">
                          <Stack direction="row" alignItems="center" gap="8px">
                            <Typography variant="body2SB14">{unsavedVerification.title}</Typography>
                            <MIChip
                              label={unsavedVerification.status}
                              color={
                                unsavedVerification.status === 'pass'
                                  ? 'green'
                                  : unsavedVerification.status === 'warning'
                                    ? 'orange'
                                    : 'red'
                              }
                              disableHover
                            />
                          </Stack>
                          <Typography variant="body2SB14">{reasonLabels[unsavedVerification.reasonCode]}</Typography>
                          <Typography variant="body2R14">{unsavedVerification.review}</Typography>
                          {unsavedVerification.links.length > 0 && <VerificationLinks urls={unsavedVerification.links} />}
                          <VerificationChecks checks={unsavedVerification.checks} />
                        </Stack>
                      ),
                    },
                  ]
                  : []),
              ]}
            />
          )}
          <Divider />
        </Stack>
      )
    })}
  </Stack>
)

export default EventVerificationResults
