import type {
  FundamentalModelAnnualPriceRow,
  FundamentalModelDetail,
  FundamentalModelMetricRow,
  FundamentalModelMonthlyPriceRow,
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

const PRICE_REGIONS = ['East Asia Spot', 'TTF', 'HH'] as const
const PRICE_YEARS = ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'] as const

const getEastAsiaAnnualPrice = (year: string): string => {
  if (year === '2023') return '15.71'
  if (year === '2024') return '14.59'
  if (year === '2025') return '14.81'
  return '9.95'
}

const getEastAsiaMonthlyPrice = (year: string, month: number): { base: string; adjusted: string } => {
  if (year === '2023') {
    if (month === 10) return { base: '13.71', adjusted: '13.71' }
    if (month === 11) return { base: '14.10', adjusted: '14.30' }
    if (month === 12) return { base: '14.81', adjusted: '14.91' }
  }
  if (year === '2024' && month <= 9) return { base: '0.00', adjusted: '8.30' }
  return { base: '9.95', adjusted: '9.95' }
}

const buildAnnualPriceRows = (): FundamentalModelAnnualPriceRow[] =>
  PRICE_REGIONS.flatMap((region) =>
    PRICE_YEARS.map((year) => {
      const price = region === 'East Asia Spot' ? getEastAsiaAnnualPrice(year) : '9.95'
      return {
        id: `annual-${region}-${year}`,
        year,
        priceRegion: region,
        baseCasePrice: price,
        userAdjustedPrice: price,
      }
    }),
  )

const buildMonthlyPriceRows = (): FundamentalModelMonthlyPriceRow[] => {
  let seq = 0
  return PRICE_REGIONS.flatMap((region) =>
    PRICE_YEARS.flatMap((year) =>
      Array.from({ length: 12 }, (_, monthIdx) => {
        const month = String(monthIdx + 1)
        const prices = region === 'East Asia Spot' ? getEastAsiaMonthlyPrice(year, monthIdx + 1) : { base: '9.95', adjusted: '9.95' }
        seq += 1
        return {
          id: `monthly-${seq}`,
          year,
          month,
          priceRegion: region,
          baseCasePrice: prices.base,
          userAdjustedPrice: prices.adjusted,
        }
      }),
    ),
  )
}

const ANNUAL_PRICE_ROWS = buildAnnualPriceRows()
const MONTHLY_PRICE_ROWS = buildMonthlyPriceRows()

/** 메모 2줄 초과·더보기 팝업 검증용 긴 설명(최대 500자) */
const MOCK_MEMO_LONG =
  '500자 이서샤오, 아네 스맨저호로 말엔패이가, 틶사우아의 아안엔에 처사를 탄개엉. 치으쳬깄까지 게라사르산이 섬힝기넌은 몌아댓랄 한차시알힝단 일짰도죠웅에서 담러타맘다 오라고 가몬모곤 마튼이나. 앝하딘자갬다 아아라 가라악다 칸속거다 렝겜어 렸앙에 뇨만악이. 애기다 갸치쵼사 둥딩트기체와 라마속은, 명갈인겐 소루안다 뜌크로 고자 우소몊승다. 트창일 뇨희로골음 탕바뇽통다 디아도 놈고는 후나자. 서간오넙닌게 살읙아도 긋도에오조에 에록친은 닙바젠앤히지 타히눌 으내 투히슬에 실겡룹한에 쾔만찰보가. 안심셀라뵤 차홀녀 컬더냐, 고후어서 시앤올이는 잔디라 오마눌너는 이이걸을. 샚탈게를 무리궉즈미각 칸안리내다 가학린앙곤오다 귾오아퇬의 벤싀깉울 걸즈개사는 채라는 셔힝은 키셔은을. 헉강과 이서샤오, 아네 스맨저호로 말엔패이가, 틶사우아의 아안엔에 처사를 탄개엉. 치으쳬깄까지 게라사르산이 섬힝기넌은 몌아댓랄 한차시알힝단 일짰도죠웅에서 담러타맘다 오라고 가몬모곤 마튼이나. 앝하딘자갬다 아아라 가라악다 칸속거다'

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
    title:
      '제목이 길어지는 경우 말줄임 표시 제목이 길어지는 경우 말줄임 표시 제목이 길어지는 경우 말줄임 표시 제목이 길어지는 경우 말줄임 표시 제목이 길어지는 경우 말줄임 표시',
    createdAtLabel: 'MM-DD 00:00',
    updatedAtLabel: 'MM-DD 00:00',
    managerName:
      '작성자명이 길어지는 경우 말줄임 표시 작성자명이 길어지는 경우 말줄임 표시 작성자명이 길어지는 경우 말줄임 표시 작성자명이 길어지는 경우 말줄임 표시 작성자명이 길어지는 경우 말줄임 표시',
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
  subtitle: run.id === '2' ? MOCK_MEMO_LONG : '테스트 실험 -> 미국-이란 종전 (4월 종전 케이스)',
  scenarioYearLabel: '2023',
  monthLabels: FUNDAMENTAL_MODEL_MONTH_LABELS,
  summaryRows: SUMMARY_ONLY_ROWS,
  detailRows: buildExtendedRows(),
  annualPriceRows: ANNUAL_PRICE_ROWS,
  monthlyPriceRows: MONTHLY_PRICE_ROWS,
  attachmentNames:
    run.id === '2'
      ? [
        '복호화_복호화_(SC1) Demand Model_input .xlsm',
        '복호화_복호화_(SC1) Supply Model_input복호화_복호화_(SC1) Supply Model_input복호화_복호화_(SC1) Supply Model_input복호화_복호화_(SC1) Supply Model_input복호화_복호화_(SC1) Supply Model_input .xlsm',
        '복호화_복호화_(SC1) Trade Model_input .xlsm',
      ]
      : [
        '복호화_복호화_(SC1) Demand Model_input .xlsm',
        '복호화_복호화_(SC1) Supply Model_input .xlsm',
        '복호화_복호화_(SC1) Trade Model_input .xlsm',
      ],
  durationLabel: '09:15:45 · 13초 소요',
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
