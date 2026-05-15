import type {
  FundamentalModelDetail,
  FundamentalModelMetricRow,
  FundamentalModelRunListItem,
} from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

/** 지연(ms)으로 로딩 - 스켈레톤 UX를 검증하기 위한 헬퍼 */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const MONTH_LABELS_FULL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** 표 - 스켈레톤에서 공통으로 쓰는 월 헤더 라벨 */
export const FUNDAMENTAL_MODEL_MONTH_LABELS: string[] = [...MONTH_LABELS_FULL]

const BASE_SUMMARY_ROWS: FundamentalModelMetricRow[] = [
  {
    id: 'year',
    label: '2023',
    values: Array.from({ length: MONTH_LABELS_FULL.length }, () => '2026'),
  },
  {
    id: 'unite',
    label: 'Unite',
    values: ['1', '2', '3', '4', '5', '6', '7', null, null, null, null, null],
  },
  {
    id: 'mtpa',
    label: 'mtpa',
    values: MONTH_LABELS_FULL.map((_, i) => `2026-${i + 1}`),
  },
]

/** 상세 표용 확장 행 생성 */
const buildExtendedRows = (): FundamentalModelMetricRow[] => {
  const extra: FundamentalModelMetricRow[] = Array.from({ length: 12 }, (_, idx) => ({
    id: `cat-${idx + 1}`,
    label: `Category ${idx + 1}`,
    values: MONTH_LABELS_FULL.map((__, col) => `${(idx + 1) * 100 + col}`),
  }))
  return [...BASE_SUMMARY_ROWS, ...extra]
}

const SUMMARY_ONLY_ROWS: FundamentalModelMetricRow[] = BASE_SUMMARY_ROWS

/** 목 실행 목록(이전 run-* 순서·내용 유지, id만 URL용 `1`…`7`) */
const MOCK_RUNS: FundamentalModelRunListItem[] = [
  {
    id: '1',
    status: 'in_progress',
    title: '시뮬레이션 케이스 5',
    createdAtLabel: 'MM-DD 00:00',
    updatedAtLabel: 'MM-DD 00:00',
    managerName: '홍길동',
  },
  {
    id: '2',
    status: 'done',
    title: 'SKGAS_수급데이터',
    createdAtLabel: 'MM-DD 00:00',
    updatedAtLabel: 'MM-DD 00:00',
    managerName: '홍길동',
  },
  {
    id: '3',
    status: 'done',
    title: '시뮬레이션 케이스 3',
    createdAtLabel: 'MM-DD 00:00',
    updatedAtLabel: 'MM-DD 00:00',
    managerName: '홍길동',
  },
  {
    id: '4',
    status: 'error',
    title: '시뮬레이션 케이스 2',
    createdAtLabel: 'MM-DD 00:00',
    updatedAtLabel: 'MM-DD 00:00',
    managerName: '홍길동',
  },
  {
    id: '5',
    status: 'done',
    title: '시뮬레이션 케이스 1',
    createdAtLabel: 'MM-DD 00:00',
    updatedAtLabel: 'MM-DD 00:00',
    managerName: '홍길동',
  },
  {
    id: '6',
    status: 'done',
    title: '시뮬레이션 케이스 3',
    createdAtLabel: 'MM-DD 00:00',
    updatedAtLabel: 'MM-DD 00:00',
    managerName: '김철수',
  },
  {
    id: '7',
    status: 'in_progress',
    title: 'Price 구간 위아래 10으로 했을때',
    createdAtLabel: 'MM-DD 00:00',
    updatedAtLabel: 'MM-DD 00:00',
    managerName: '담당자명',
  },
]

/** 목 실행 -> 상세 DTO */
const buildDetail = (run: FundamentalModelRunListItem): FundamentalModelDetail => ({
  ...run,
  subtitle: '테스트 실험 -> 미국-이란 종전 (4월 종전 케이스)',
  scenarioYearLabel: '2023',
  monthLabels: FUNDAMENTAL_MODEL_MONTH_LABELS,
  summaryRows: SUMMARY_ONLY_ROWS,
  detailRows: buildExtendedRows(),
  attachmentNames: [
    '복호화_복호화_(SC1) Demand Model_input .xlsm',
    '복호화_복호화_(SC1) Supply Model_input .xlsm',
    '복호화_복호화_(SC1) Trade Model_input .xlsm',
  ],
  durationLabel: '09:15:45 - 13초 소요',
})

/** 목록 API를 흉내 낸 비동기 호출 */
export const fetchFundamentalModelRuns = async (): Promise<FundamentalModelRunListItem[]> => {
  await delay(520)
  return MOCK_RUNS
}

/** 상세 API를 흉내 낸 비동기 호출 */
export const fetchFundamentalModelDetail = async (runId: string): Promise<FundamentalModelDetail | null> => {
  await delay(420)
  const run = MOCK_RUNS.find((r) => r.id === runId)
  if (!run) return null
  return buildDetail(run)
}
