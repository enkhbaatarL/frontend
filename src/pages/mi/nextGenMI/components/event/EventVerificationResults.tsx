import { Divider, Link, Stack, Typography } from '@mui/material'

import type {
  EventVerificationResult,
  EventVerificationUpdate,
  VerificationAspect,
  VerificationReason,
  VerificationVerdict,
} from '@/service/mi/nextGenMI/event'

import MIAccordion from '@/components/common/accordion/MIAccordion'
import MIChip from '@/components/common/chip/MIChip'

const reasonLabels: Record<VerificationReason, string> = {
  verified: '핵심 주장 일치',
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

const VerificationLinks = ({ urls }: { urls: string[] }) => (
  <Stack gap="4px" minWidth={0}>
    {urls.map((url, index) => (
      <Link
        key={`${index}-${url}`}
        href={/^https?:\/\//i.test(url) ? url : undefined}
        target="_blank"
        rel="noopener noreferrer"
        variant="body2R14"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {url}
      </Link>
    ))}
  </Stack>
)

interface EventVerificationResultsProps {
  result: EventVerificationResult
  getUpdateResult: (miEventId: number) => EventVerificationUpdate | undefined
  getUpdateErrorMessage: (miEventId: number) => string
}

const EventVerificationResults = ({ result, getUpdateResult, getUpdateErrorMessage }: EventVerificationResultsProps) => (
  <Stack gap="10px" maxHeight="240px" overflow="auto">
    <Typography variant="body3R12" color="contentText.Subtext">
      검증 기준 시각 (UTC): {result.checkedAt}
    </Typography>
    {result.items.map((originalItem) => {
      const updateResult = getUpdateResult(originalItem.miEventId)
      const updateErrorMessage = getUpdateErrorMessage(originalItem.miEventId)
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
          {updateResult && (
            <>
              <Typography variant="body2R14">{updateResult.message}</Typography>
              <Typography variant="body3R12" color="contentText.Subtext">
                검증 기준 시각 (UTC): {updateResult.checkedAt}
              </Typography>
            </>
          )}
          {updateErrorMessage && (
            <Typography variant="body2R14" color="contentText.Error" role="alert">
              {updateErrorMessage}
            </Typography>
          )}
          <Typography variant="body2SB14">{reasonLabels[item.reasonCode]}</Typography>
          <Typography variant="body2R14">{item.review}</Typography>
          <Typography variant="body3R12" color="contentText.Subtext">
            검증한 Event 수정 시각: {updateResult?.updateStatus === 'updated' ? updateResult.updatedAt : (item.sourceUpdatedAt ?? '-')}
          </Typography>
          {item.links.length > 0 && (
            <Stack gap="4px">
              <Typography variant="body3SB12">근거 링크</Typography>
              <VerificationLinks urls={item.links} />
            </Stack>
          )}
          {item.checks.length > 0 && (
            <MIAccordion
              items={[
                {
                  key: `event-verification-${item.miEventId}`,
                  title: '상세 비교',
                  content: (
                    <Stack gap="10px" divider={<Divider />}>
                      {item.checks.map((check) => (
                        <Stack key={check.aspect} gap="4px">
                          <Typography variant="body2SB14">{aspectLabels[check.aspect]}</Typography>
                          <Typography variant="body2R14">판정: {verdictLabels[check.verdict]}</Typography>
                          <Typography variant="body2R14">Event 주장: {check.eventClaim}</Typography>
                          <Typography variant="body2R14">확인 내용: {check.finding}</Typography>
                          {check.sourceUrls.length > 0 && (
                            <Stack gap="4px">
                              <Typography variant="body3SB12">근거 링크</Typography>
                              <VerificationLinks urls={check.sourceUrls} />
                            </Stack>
                          )}
                        </Stack>
                      ))}
                    </Stack>
                  ),
                },
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
