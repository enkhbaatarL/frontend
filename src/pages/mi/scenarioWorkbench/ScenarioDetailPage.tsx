import { EventNote, MonitorHeart, Summarize, Timeline } from '@mui/icons-material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import TokenIcon from '@mui/icons-material/Token'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { type ReactNode, useLayoutEffect, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'

import ImpactDotsCell from './components/ImpactDotsCell'
import ProbabilityGaugeCell from './components/ProbabilityGaugeCell'
import ScenarioKeyPredictionsSection from './components/scenario/ScenarioKeyPredictionsSection'
import ScenarioSummarySection from './components/scenario/ScenarioSummarySection'
import SignpostMonitoringSection from './components/scenario/SignpostMonitoringSection'
import { RelatedEvent, RelatedScenario, ScenarioDetail } from './components/scenario/types'
import ScenarioWorkbenchDetailHeader, {
  WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type WorkbenchDetailHeaderSection,
} from './components/ScenarioWorkbenchDetailHeader'
import ScenarioWorkbenchDataList from './components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from './components/table/ScenarioWorkbenchTableHeader'
import { getScenarioWorkbenchTabPath } from './scenarioWorkbenchRoutes'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'

const SCENARIO_DETAIL_MOCK: ScenarioDetail = {
  name: '호르무즈 봉쇄 3개월+ 유지',
  tags: ['장기봉쇄', '수요파괴'],
  summary: {
    impactRows: [
      { target: 'JKM', label: 'JKM', marketImpact: 3, direction: 'up', priceFlow: ['$21~23', '$19~20', '$19'] },
      { target: 'TTF', label: 'TTF', marketImpact: 2, direction: 'flat', priceFlow: ['$21~23', '$19~20', '$19'] },
      { target: 'HH', label: 'Henry Hub', marketImpact: 1, direction: 'down', priceFlow: ['$21~23', '$19~20', '$19'] },
    ],
    forecasts: [
      {
        target: 'JKM',
        title: 'JKM 영향 전망',
        body: '3월 11일 호르무즈 해협이 완전히 봉쇄된 이후 이 상황이 3개월 이상 지속될 경우, 4~6월에는 공급 충격으로 인해 JKM 가격이 $21~23 수준까지 상승할 것으로 예상됩니다. 이후 7~9월에는 인도와 동남아를 중심으로 $20 이상 가격에 대한 수요 저항이 발생하면서 수요 파괴가 나타나고, 동시에 미국의 증산 영향이 더해져 가격은 $19~20 수준으로 하향 안정화될 가능성이 있습니다. 4분기에는 겨울철 계절적 수요가 반영되며 $18.5~19.5 수준에서 반등이 예상되며, 전체 시나리오에서 가장 중요한 변수는 호르무즈 봉쇄 해소 시점입니다.',
        summary: '4~6월 $21~23 (공급 충격) → 7~9월 $19~20 (수요 파괴+증산) → 4Q $18.5~19.5 (겨울 반등)',
      },
      {
        target: 'TTF',
        title: 'TTF 영향 전망',
        body: '3월 11일 호르무즈 해협이 완전히 봉쇄된 이후 이 상황이 3개월 이상 지속될 경우, 4~6월에는 공급 충격으로 인해 JKM 가격이 $21~23 수준까지 상승할 것으로 예상됩니다. 이후 7~9월에는 인도와 동남아를 중심으로 $20 이상 가격에 대한 수요 저항이 발생하면서 수요 파괴가 나타나고, 동시에 미국의 증산 영향이 더해져 가격은 $19~20 수준으로 하향 안정화될 가능성이 있습니다. 4분기에는 겨울철 계절적 수요가 반영되며 $18.5~19.5 수준에서 반등이 예상되며, 전체 시나리오에서 가장 중요한 변수는 호르무즈 봉쇄 해소 시점입니다.',
        summary: '4~6월 $21~23 (공급 충격) → 7~9월 $19~20 (수요 파괴+증산) → 4Q $18.5~19.5 (겨울 반등)',
      },
      {
        target: 'HH',
        title: 'Henry Hub 영향 전망',
        body: '3월 11일 호르무즈 해협이 완전히 봉쇄된 이후 이 상황이 3개월 이상 지속될 경우, 4~6월에는 공급 충격으로 인해 JKM 가격이 $21~23 수준까지 상승할 것으로 예상됩니다. 이후 7~9월에는 인도와 동남아를 중심으로 $20 이상 가격에 대한 수요 저항이 발생하면서 수요 파괴가 나타나고, 동시에 미국의 증산 영향이 더해져 가격은 $19~20 수준으로 하향 안정화될 가능성이 있습니다. 4분기에는 겨울철 계절적 수요가 반영되며 $18.5~19.5 수준에서 반등이 예상되며, 전체 시나리오에서 가장 중요한 변수는 호르무즈 봉쇄 해소 시점입니다.',
        summary: '4~6월 $21~23 (공급 충격) → 7~9월 $19~20 (수요 파괴+증산) → 4Q $18.5~19.5 (겨울 반등)',
      },
    ],
    chartUnit: 'Unit: USD/MMBtu',
    chart: {
      months: ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'],
      series: [
        {
          target: 'JKM',
          values: [
            16, 15.5, 15, 14.6, 14.2, 13.8, 13.5, 13.2, 13, 12.8, 12.5, 12.3, 12.1, 12, 11.8, 11.7, 11.5, 11.3, 11.1, 10.9, 10.7, 10.5,
            10.3, 10.1, 9.9, 9.7, 9.5, 9.3, 9.2, 9.1, 9, 8.9, 8.8, 8.7, 8.6, 8.5, 8.5, 8.5, 8.5, 8.5, 8.6, 8.7, 8.8, 8.9, 9, 9.1, 9.2, 9.3,
            9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 11, 11, 10.9, 10.8, 10.7, 10.6, 10.5,
            10.4, 10.3, 10.2, 10.1, 10, 9.9, 9.8, 9.7, 9.6, 9.5, 9.4, 9.3, 9.2, 9.1, 9, 8.9, 8.8, 8.7, 8.6, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5,
          ],
        },
        {
          target: 'TTF',
          values: [
            14, 13.8, 13.6, 13.4, 13.2, 13, 12.8, 12.6, 12.4, 12.2, 12, 11.8, 11.6, 11.4, 11.2, 11, 10.8, 10.6, 10.4, 10.2, 10, 9.8, 9.6,
            9.4, 9.2, 9, 8.8, 8.6, 8.5, 8.4, 8.3, 8.2, 8.1, 8, 7.9, 7.8, 7.8, 7.8, 7.8, 7.8, 7.9, 8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8,
            8.9, 9, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10, 10.1, 10.2, 10.3, 10.3, 10.2, 10.1, 10, 9.9, 9.8, 9.7, 9.6, 9.5, 9.4,
            9.3, 9.2, 9.1, 9, 8.9, 8.8, 8.7, 8.6, 8.5, 8.4, 8.3, 8.2, 8.1, 8, 7.9, 7.8, 7.8, 7.8, 7.8, 7.8,
          ],
        },
        {
          target: 'HH',
          values: [
            5, 5.2, 5.4, 5.6, 5.8, 6, 6.2, 6.4, 6.6, 6.8, 7, 7.2, 7.4, 7.6, 7.8, 8, 8.2, 8.4, 8.6, 8.8, 9, 9.5, 10, 10.5, 11, 11.5, 12,
            12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22, 21.5, 21, 20.5, 20,
            19.5, 19, 18.5, 18, 17.5, 17, 16.5, 16, 15.5, 15, 14.5, 14, 13.5, 13, 12.8, 12.6, 12.4, 12.2, 12, 11.8, 11.6, 11.4, 11.2, 11,
            10.8, 10.6, 10.4, 10.2, 10, 9.8, 9.6, 9.4, 9.2, 9, 8.8, 8.6, 8.4, 8.2, 8, 7.8, 7.6, 7.4, 7.2, 7,
          ],
        },
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
      marketImpactSummary: 'LNG 및 원유 공급 블록 현실화 → 가격 상승 압력 지속',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 2,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpactSummary: 'LNG 및 원유 공급 블록 현실화 → 가격 상승 압력 지속',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 3,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpactSummary: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 4,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpactSummary: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 5,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpactSummary: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 6,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpactSummary: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
  ],
  relatedEvents: [
    {
      id: 1,
      name: '미국/이스라엘 이란 공습 개시 (Operation Epic Fury)',
      date: '00-00 00:00',
      category: 'category',
      jkm: 3,
      ttf: 2,
      hh: 1,
      jkmDirection: 'up',
      ttfDirection: 'flat',
      hhDirection: 'down',
    },
  ],
  relatedScenarios: [
    {
      id: 1,
      name: '1~2주 내 협상 완료 상황 해소',
      isCurrent: false,
      type: undefined,
      jkm: 1,
      ttf: 3,
      hh: 2,
      probability: 1,
    },
    {
      id: 2,
      name: '수주 내 호르무즈 정상화',
      isCurrent: false,
      type: undefined,
      jkm: 2,
      ttf: 1,
      hh: 3,
      probability: 2,
    },
    {
      id: 3,
      name: '호르무즈 봉쇄 3개월+ 유지',
      isCurrent: true,
      type: 'BC',
      jkm: 3,
      ttf: 2,
      hh: 1,
      probability: 3,
    },
    {
      id: 4,
      name: '걸프 LNG 인프라 타격, 복구',
      isCurrent: false,
      type: undefined,
      jkm: 3,
      ttf: 3,
      hh: 3,
      probability: 4,
    },
    {
      id: 5,
      name: '걸프 LNG 인프라 타격, 미복구',
      isCurrent: false,
      type: undefined,
      jkm: 3,
      ttf: 3,
      hh: 3,
      probability: 5,
    },
  ],
}

const DetailIconButton = () => (
  <MIBaseButton
    variant="outlined"
    enableHoverBackground
    sx={{
      width: '22px',
      minWidth: '0px',
      height: '22px',
      padding: '3px',
      borderRadius: '4px',
      backgroundColor: 'commonColor.White',
    }}
  >
    <OpenInNewIcon sx={{ fontSize: 14, color: 'contentIcon.Enabled' }} />
  </MIBaseButton>
)

const scenarioDetailRelatedEventColumns: GridColDef<RelatedEvent>[] = [
  {
    field: 'name',
    headerName: '이벤트명',
    flex: 1,
    minWidth: 192,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <Stack gap="4px" sx={{ py: '4px', minWidth: 0, width: '100%' }}>
        <Typography variant="body2M14" sx={{ color: 'contentText.Normal', minWidth: 0 }} noWrap>
          {params.row.name}
        </Typography>
        <Stack direction="row" alignItems="center" gap="8px">
          <Typography variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
            {params.row.date}
          </Typography>
          <Typography variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
            |
          </Typography>
          <Typography variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
            {params.row.category}
          </Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    field: 'jkm',
    headerName: 'JKM',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <ImpactDotsCell level={params.row.jkm} direction={params.row.jkmDirection} />
    ),
  },
  {
    field: 'ttf',
    headerName: 'TTF',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <ImpactDotsCell level={params.row.ttf} direction={params.row.ttfDirection} />
    ),
  },
  {
    field: 'hh',
    headerName: 'HH',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => <ImpactDotsCell level={params.row.hh} direction={params.row.hhDirection} />,
  },
  {
    field: 'id',
    headerName: '상세',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: () => <DetailIconButton />,
  },
]

const scenarioDetailScenarioTypeChip = (type: 'BC' | 'NOISE') => (
  <MIChip
    label={type}
    sx={{
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: type === 'BC' ? 'mari.Primary' : 'gray.20',
      color: type === 'BC' ? 'commonColor.White' : 'contentText.Normal',
    }}
    disableHover
  />
)

const scenarioDetailRelatedScenarioColumns: GridColDef<RelatedScenario>[] = [
  {
    field: 'name',
    headerName: '시나리오명',
    flex: 1,
    minWidth: 192,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Stack direction="row" alignItems="center" gap="8px" sx={{ minWidth: 0, width: '100%' }}>
        <Typography variant="body2M14" sx={{ color: 'contentText.Normal', minWidth: 0 }} noWrap>
          {params.row.name}
        </Typography>
        {params.row.isCurrent && params.row.type && scenarioDetailScenarioTypeChip(params.row.type)}
      </Stack>
    ),
  },
  {
    field: 'jkm',
    headerName: 'JKM',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.jkm} />,
  },
  {
    field: 'ttf',
    headerName: 'TTF',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.ttf} />,
  },
  {
    field: 'hh',
    headerName: 'HH',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.hh} />,
  },
  {
    field: 'probability',
    headerName: '가능성',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ProbabilityGaugeCell level={params.row.probability} />,
  },
  {
    field: 'id',
    headerName: '상세',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: () => <DetailIconButton />,
  },
]

const ScenarioDetailRelatedEventsAndScenariosSection = ({
  events,
  scenarios,
}: {
  events: RelatedEvent[]
  scenarios: RelatedScenario[]
}) => (
  <Box sx={{ bgcolor: 'gray.5', p: '24px', borderRadius: '10px' }}>
    <Stack direction="row" gap="12px" alignItems="flex-start">
      <Box flex="1" minWidth={0}>
        <Typography
          variant="body1SB16"
          sx={{ color: 'contentText.Black', px: '12px', height: '36px', display: 'flex', alignItems: 'center' }}
        >
          관련 이벤트
        </Typography>

        <Box sx={{ px: '12px', minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <ScenarioWorkbenchTableHeader<RelatedEvent> columns={scenarioDetailRelatedEventColumns} sx={{ mb: 0 }} />
          <ScenarioWorkbenchDataList<RelatedEvent>
            rowId="id"
            columns={scenarioDetailRelatedEventColumns}
            rows={events}
            rowHeight={50}
            noRowMessage="관련 이벤트가 없습니다."
          />
        </Box>
      </Box>

      <Box flex="1" minWidth={0}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: '12px' }}>
          <Typography variant="body1SB16" sx={{ color: 'contentText.Black', height: '36px', display: 'flex', alignItems: 'center' }}>
            관련 시나리오
          </Typography>
          <Typography variant="body3R12" sx={{ color: 'contentText.Normal', textAlign: 'right' }}>
            동일 이벤트로부터 생성된 시나리오 목록
          </Typography>
        </Stack>
        <Box sx={{ px: '12px', minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <ScenarioWorkbenchTableHeader<RelatedScenario> columns={scenarioDetailRelatedScenarioColumns} sx={{ mb: 0 }} />
          <ScenarioWorkbenchDataList<RelatedScenario>
            rowId="id"
            columns={scenarioDetailRelatedScenarioColumns}
            rows={scenarios}
            rowHeight={50}
            noRowMessage="관련 시나리오가 없습니다."
          />
        </Box>
      </Box>
    </Stack>
  </Box>
)

type ScenarioDetailSection = WorkbenchDetailHeaderSection & {
  Icon: typeof Summarize
}

const SCENARIO_DETAIL_SECTIONS: ScenarioDetailSection[] = [
  { id: 'scenario-detail-section-summary', label: '시나리오 요약', Icon: Summarize },
  { id: 'scenario-detail-section-key-predictions', label: '시나리오 주요 가정', Icon: Timeline },
  { id: 'scenario-detail-section-signpost', label: 'Signpost 모니터링', Icon: MonitorHeart },
  { id: 'scenario-detail-section-related', label: '관련 이벤트 및 시나리오', Icon: EventNote },
]

const SectionHeading = ({ sectionId }: { sectionId: WorkbenchDetailHeaderSection['id'] }) => {
  const section = SCENARIO_DETAIL_SECTIONS.find((item) => item.id === sectionId)
  if (!section) return null
  const { Icon } = section

  return (
    <Stack direction="row" alignItems="center" gap="8px">
      <Icon sx={{ fontSize: 30, color: 'contentText.Black' }} />
      <Typography sx={{ fontSize: 20, fontWeight: 600, color: 'contentText.Black' }}>{section.label}</Typography>
      <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Normal' }} />
    </Stack>
  )
}

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
      sections={SCENARIO_DETAIL_SECTIONS.map(({ id, label }) => ({ id, label }))}
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
      onBack: () => navigate(getScenarioWorkbenchTabPath('scenarios')),
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
    <Stack maxWidth="1380px" margin="auto" px="12px" pt="12px" position="relative" sx={{ userSelect: 'none', overflowX: 'hidden' }}>
      <Stack py="24px" gap="12px">
        <Stack id={SCENARIO_DETAIL_SECTIONS[0].id} gap="12px" py="30px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[0].id} />
          <ScenarioSummarySection data={data.summary} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[1].id} gap="12px" py="30px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[1].id} />
          <ScenarioKeyPredictionsSection predictions={data.keyPredictions} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[2].id} gap="12px" py="30px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[2].id} />
          <SignpostMonitoringSection rows={data.signposts} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[3].id} gap="12px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[3].id} />
          <ScenarioDetailRelatedEventsAndScenariosSection events={data.relatedEvents} scenarios={data.relatedScenarios} />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioDetailPage
