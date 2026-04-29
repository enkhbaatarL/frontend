import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import TokenIcon from '@mui/icons-material/Token'
import TungstenRoundedIcon from '@mui/icons-material/TungstenRounded'
import { Stack, Typography } from '@mui/material'
import { type ReactNode, useLayoutEffect, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'

import RelatedEventsAndScenariosSection from './components/scenario/RelatedEventsAndScenariosSection'
import ScenarioKeyPredictionsSection from './components/scenario/ScenarioKeyPredictionsSection'
import ScenarioSummarySection from './components/scenario/ScenarioSummarySection'
import SignpostMonitoringSection from './components/scenario/SignpostMonitoringSection'
import { ScenarioDetail } from './components/scenario/types'
import ScenarioWorkbenchDetailHeader, {
  WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type WorkbenchDetailHeaderSection,
} from './components/ScenarioWorkbenchDetailHeader'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'

const SCENARIO_DETAIL_SECTIONS: WorkbenchDetailHeaderSection[] = [
  { id: 'scenario-detail-section-summary', label: '시나리오 요약' },
  { id: 'scenario-detail-section-key-predictions', label: '시나리오 주요 가정' },
  { id: 'scenario-detail-section-signpost', label: 'Signpost 모니터링' },
  { id: 'scenario-detail-section-related', label: '관련 이벤트 및 시나리오' },
]

const SCENARIO_DETAIL_MOCK: ScenarioDetail = {
  name: '호르무즈 봉쇄 3개월+ 유지',
  tags: ['장기봉쇄', '수요파괴'],
  summary: {
    priceFlowTitle: 'JKM 가격 흐름',
    priceSteps: [{ label: '$21~23' }, { label: '$19~20' }, { label: '$19' }],
    flowDescription: '4~6월 $21~23 (공급 충격) → 7~9월 $19~20 (수요 파괴+증산) → 4Q $18.5~19.5 (겨울 반등)',
    forecastTitle: 'JKM 영향 전망',
    forecastBody:
      '3월 11일 호르무즈 해협이 완전히 봉쇄된 이후 이 상황이 3개월 이상 지속될 경우, 4~6월에는 공급 충격으로 인해 JKM 가격이 $21~23 수준까지 상승할 것으로 예상됩니다. 이후 7~9월에는 인도와 동남아를 중심으로 $20 이상 가격에 대한 수요 저항이 발생하면서 수요 파괴가 나타나고, 동시에 미국의 증산 영향이 더해져 가격은 $19~20 수준으로 하향 안정화될 가능성이 있습니다. 4분기에는 겨울철 계절적 수요가 반영되며 $18.5~19.5 수준에서 반등이 예상되며, 전체 시나리오에서 가장 중요한 변수는 호르무즈 봉쇄 해소 시점입니다.',
    chartUnit: 'Unit: USD/MMBtu',
    chart: {
      months: ['26.05', '06', '07', '08', '09', '10', '11', '12', '27.01', '02', '03', '04'],
      weeklyValues: [
        26.0, 26.4, 27.0, 27.6, 28.0, 28.4, 28.2, 29.0, 30.0, 30.6, 31.0, 30.7, 31.4, 32.8, 33.5, 32.8, 34.8, 36.4, 35.2, 34.0, 33.0, 31.6,
        30.4, 30.0, 30.6, 31.4, 30.8, 30.2, 31.2, 38.4, 40.4, 41.6, 40.6, 40.0, 40.4, 40.1, 40.8, 41.2, 40.0, 39.4, 40.4, 41.0, 40.4, 39.4,
        41.6, 42.0, 40.4, 39.2,
      ],
    },
  },
  keyPredictions: [
    { title: '갈등 기간', value: '6개월 이상' },
    { title: '피해 수준', value: '대규모 인프라 파괴' },
    { title: '복구 전망', value: '3~5년 예상', description: '완전 복구 기준 text' },
    { title: 'LNG 수출 영향', value: '20 MTPA+ (25%+)', direction: 'down' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text', hidden: true },
  ],
  signposts: [
    {
      id: 1,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승 압력 지속',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 2,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승 압력 지속',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 3,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 4,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 5,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 6,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
  ],
  relatedEvents: [
    {
      id: 1,
      name: '미국/이스라엘 이란 공습 개시 (Operation Epic Fury)',
      date: '02-28 09:00',
      category: '지정학적 리스크',
      marketImpact: '높음',
      marketImpactColor: '#364FC7',
      direction: 'up',
      directionLabel: '상승',
    },
    {
      id: 2,
      name: 'EU 가스 재고 39.2% — 5년 평균 63% 대비 하회',
      date: '02-27 09:00',
      category: '수급 밸런스',
      marketImpact: '중간',
      marketImpactColor: '#7384D9',
      direction: 'neutral',
      directionLabel: '보합',
    },
  ],
  relatedScenarios: [
    {
      id: 1,
      name: '1~2주 내 협상 완료 상황 해소',
      isCurrent: false,
      marketImpact: '낮음',
      marketImpactColor: '#A7B2E5',
      priceImpact: '낮음',
      priceImpactColor: '#A7B2E5',
      initialProbability: '100%',
    },
    {
      id: 2,
      name: '수주 내 호르무즈 정상화',
      isCurrent: false,
      marketImpact: '낮음',
      marketImpactColor: '#A7B2E5',
      priceImpact: '높음',
      priceImpactColor: '#364FC7',
      initialProbability: '100%',
    },
    {
      id: 3,
      name: '호르무즈 봉쇄 3개월+ 유지',
      isCurrent: true,
      marketImpact: '중간',
      marketImpactColor: '#7384D9',
      priceImpact: '중간',
      priceImpactColor: '#7384D9',
      initialProbability: '100%',
    },
    {
      id: 4,
      name: '걸프 LNG 인프라 타격, 복구',
      isCurrent: false,
      marketImpact: '높음',
      marketImpactColor: '#364FC7',
      priceImpact: '높음',
      priceImpactColor: '#364FC7',
      initialProbability: '100%',
    },
    {
      id: 5,
      name: '걸프 LNG 인프라 타격, 미복구',
      isCurrent: false,
      marketImpact: '높음',
      marketImpactColor: '#364FC7',
      priceImpact: '높음',
      priceImpactColor: '#364FC7',
      initialProbability: '100%',
    },
  ],
}

interface SectionHeadingProps {
  title: string
}

const SectionHeading = ({ title }: SectionHeadingProps) => (
  <Stack direction="row" alignItems="center" gap="8px">
    <TungstenRoundedIcon sx={{ fontSize: 30, color: 'contentText.Black' }} />
    <Typography sx={{ fontSize: 20, fontWeight: 600, color: 'contentText.Black' }}>{title}</Typography>
    <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Normal' }} />
  </Stack>
)

interface ScenarioDetailHeaderContent {
  backLabel: string
  onBack: () => void
  titleSlot: ReactNode
  rightAction?: ReactNode
}

let scenarioDetailHeaderContent: ScenarioDetailHeaderContent | null = null
const scenarioDetailHeaderListeners = new Set<() => void>()

const subscribeScenarioDetailHeaderContent = (listener: () => void) => {
  scenarioDetailHeaderListeners.add(listener)
  return () => scenarioDetailHeaderListeners.delete(listener)
}

const getScenarioDetailHeaderContentSnapshot = () => scenarioDetailHeaderContent

const publishScenarioDetailHeaderContent = (next: ScenarioDetailHeaderContent) => {
  scenarioDetailHeaderContent = next
  scenarioDetailHeaderListeners.forEach((l) => l())
}

/** `setStickyHeader` 한 번만 호출하고 콘텐츠 변경 시 이 컴포넌트만 리렌더 — 스크롤·스파이 시 본문 패딩 흔들림 방지 */
const ScenarioDetailHeaderView = () => {
  const content = useSyncExternalStore(
    subscribeScenarioDetailHeaderContent,
    getScenarioDetailHeaderContentSnapshot,
    getScenarioDetailHeaderContentSnapshot,
  )
  if (!content) return null

  return (
    <ScenarioWorkbenchDetailHeader
      sections={SCENARIO_DETAIL_SECTIONS}
      backLabel={content.backLabel}
      onBack={content.onBack}
      titleSlot={content.titleSlot}
      rightAction={content.rightAction}
    />
  )
}

const ScenarioDetailPage = () => {
  const navigate = useNavigate()
  const { setStickyHeader } = useStickyHeader()
  const data = SCENARIO_DETAIL_MOCK

  useLayoutEffect(() => {
    publishScenarioDetailHeaderContent({
      backLabel: 'Scenarios',
      onBack: () => navigate('/mi/scenario-workbench'),
      titleSlot: (
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" width="100%">
          <Stack flex={1} minWidth={0} gap="10px" alignItems="flex-start" pt="20px">
            <Typography variant="body1B16" color="contentText.Black">
              Scenario
            </Typography>
            <Typography variant="titleLarge" fontSize="26px" fontWeight={600} display="block" sx={{ lineHeight: 1.4 }}>
              {data.name}
            </Typography>
            {data.tags.length > 0 && (
              <Stack direction="row" gap="8px" flexWrap="wrap">
                {data.tags.map((tag) => (
                  <MIChip
                    key={tag}
                    label={tag}
                    fontType="body2M14"
                    sx={{ height: '28px', padding: '4px 8px', backgroundColor: '#E9ECEF', color: '#212529', borderRadius: '100px' }}
                    disableHover
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      ),
      rightAction: (
        <MIBaseButton
          variant="contained"
          prefix={<TokenIcon sx={{ fontSize: 20 }} />}
          disableRipple
          sx={{
            height: '36px',
            position: 'relative',
            zIndex: 3,
          }}
        >
          모델 시뮬레이션
        </MIBaseButton>
      ),
    })
  }, [data.name, data.tags, navigate])

  useLayoutEffect(() => {
    setStickyHeader(<ScenarioDetailHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
    })
    return () => {
      setStickyHeader(null)
      scenarioDetailHeaderContent = null
    }
  }, [setStickyHeader])

  return (
    <Stack maxWidth="1380px" margin="auto" px="12px" position="relative" sx={{ userSelect: 'none', overflowX: 'hidden' }}>
      <Stack py="24px" gap="12px">
        <Stack id={SCENARIO_DETAIL_SECTIONS[0].id} gap="12px" py="30px">
          <SectionHeading title={SCENARIO_DETAIL_SECTIONS[0].label} />
          <ScenarioSummarySection data={data.summary} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[1].id} gap="12px" pt="30px" pb="30px">
          <SectionHeading title={SCENARIO_DETAIL_SECTIONS[1].label} />
          <ScenarioKeyPredictionsSection predictions={data.keyPredictions} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[2].id} gap="12px" pt="30px" pb="30px">
          <SectionHeading title={SCENARIO_DETAIL_SECTIONS[2].label} />
          <SignpostMonitoringSection rows={data.signposts} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[3].id} gap="12px">
          <SectionHeading title={SCENARIO_DETAIL_SECTIONS[3].label} />
          <RelatedEventsAndScenariosSection events={data.relatedEvents} scenarios={data.relatedScenarios} />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioDetailPage
