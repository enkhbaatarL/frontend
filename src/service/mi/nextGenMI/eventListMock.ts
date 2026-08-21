// #DELETE: API 적용후엔 목데이터 삭제
import dayjs from 'dayjs'

import type { EventDetail, EventImpactIndex, EventList, EventListItem, EventTypeL1, GetEventsParams } from '@/service/mi/nextGenMI/event'
import type { IPaginationResponse } from '@/types/api'

import { MarketDirection, MarketImpactLevel } from '@/service/mi/nextGenMI/common'

/** 멀티선택 액션바 - 다른 사용자 진행 중(잠금) 확인용 occupant */
const MOCK_OTHER_OCCUPANT_USER_NO = 999001
const MOCK_OTHER_OCCUPANT_USER_NAME = 'SKCC001'

const IMPACT_LEVEL_LABEL: Record<MarketImpactLevel.LOW | MarketImpactLevel.MEDIUM | MarketImpactLevel.HIGH, string> = {
  [MarketImpactLevel.LOW]: '낮음',
  [MarketImpactLevel.MEDIUM]: '중간',
  [MarketImpactLevel.HIGH]: '높음',
}

const DIRECTION_LABEL: Record<MarketDirection, string> = {
  [MarketDirection.BULLISH]: '상승',
  [MarketDirection.BEARISH]: '하락',
  [MarketDirection.NEGLIGIBLE]: '영향 미미',
}

const createIndexImpact = (
  indexName: string,
  marketImpactLevel: MarketImpactLevel.LOW | MarketImpactLevel.MEDIUM | MarketImpactLevel.HIGH,
  direction: MarketDirection,
  impactTerm: 'short' | 'mid_long' = 'short',
): EventImpactIndex => ({
  indexName,
  marketImpactLevel,
  marketImpactLevelLabel: IMPACT_LEVEL_LABEL[marketImpactLevel],
  direction,
  directionLabel: DIRECTION_LABEL[direction],
  impactTerm,
  impactTermLabel: impactTerm === 'short' ? '단기' : '중장기',
})

const bullishTriplet = (
  jkm: MarketImpactLevel.LOW | MarketImpactLevel.MEDIUM | MarketImpactLevel.HIGH,
  ttf: MarketImpactLevel.LOW | MarketImpactLevel.MEDIUM | MarketImpactLevel.HIGH,
  hh: MarketImpactLevel.LOW | MarketImpactLevel.MEDIUM | MarketImpactLevel.HIGH,
): EventImpactIndex[] => [
  createIndexImpact('JKM', jkm, MarketDirection.BULLISH),
  createIndexImpact('TTF', ttf, MarketDirection.BULLISH),
  createIndexImpact('HH', hh, MarketDirection.BEARISH),
]

type EventListMockSeed = Omit<EventListItem, 'updatedAt' | 'createdAt' | 'latestRecordFirstCreated'> & {
  daysAgo: number
  /** true면 로그인 사용자 userNo를 occupant로 넣어 본인 진행 중 CTA 확인 */
  useCurrentUserAsOccupant?: boolean
  scenarioDesignStatus?: string
  scenarioDesignStatusLabel?: string
  designStep?: string | null
  designStepLabel?: string | null
  scenarioGroupId?: number | null
  occupied?: boolean
  occupantUserId?: number | null
  occupantUserName?: string | null
  connectedScenarioGroups?: Array<{
    scenarioGroupId: number
    groupName: string
    designStep?: string | null
    designStepLabel?: string | null
    scenarioDesignStatus?: string | null
    occupied?: boolean
    occupantUserId?: number | null
    occupantUserName?: string | null
    events: Array<{ eventId: number; eventName: string }>
  }>
}

const EVENT_LIST_MOCK_SEEDS: EventListMockSeed[] = [
  // --- Scenario Design (12266:72778) 대표이벤트/시나리오유형/인포 툴팁 확인용 ---
  {
    eventId: 9001,
    daysAgo: 0,
    eventName: '[설계/대표] 중동 지정학 리스크 — 긴장 완화 뒤 유럽 가스가격 추가 하락',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 긴장 및 전쟁·군사분쟁',
    isScenarioSuggested: true,
    scenarioSuggestReason:
      '복수 이벤트 조합에서 Agent가 추천한 대표 이벤트입니다.\n공급·운송 차질과 지정학 리스크가 동시에 반영되어 시나리오 분기 기준으로 적합합니다.',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM),
  },
  {
    eventId: 9002,
    daysAgo: 0,
    eventName: '[설계/멀티] 아시아 냉방수요 — JKM 강세 + 프리미엄 상방 리스크 유지',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'weather_climate',
    eventTypeLv1Label: '기상/기후',
    isScenarioSuggested: false,
    scenarioSuggestReason: '대표 이벤트와 함께 수요 측 분기 근거를 보완합니다.',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  {
    eventId: 9003,
    daysAgo: 0,
    eventName: '[설계/멀티] 아프리카 LNG 공급 — 나이지리아 감산 상쇄로 공급 리스크 완화',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'supply_balance',
    eventTypeLv1Label: '수급 밸런스',
    isScenarioSuggested: false,
    scenarioSuggestReason: '대표 이벤트와 함께 공급 측 완화 경로를 보완합니다.',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: bullishTriplet(MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW, MarketImpactLevel.LOW),
  },
  // --- 멀티선택 액션바 CTA 확인용 (동일 scenarioGroupId 2개 이상 선택) ---
  // Case 1. 신규 생성 가능: designable 2개 이상 선택 → `시나리오 설계`
  {
    eventId: 9101,
    daysAgo: 0,
    eventName: '[액션바/신규] LNG 선박 호르무즈 통항 중단 — 희망봉 우회',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'logistics_shipping',
    eventTypeLv1Label: '물류/해운',
    isScenarioSuggested: true,
    scenarioSuggestReason: '멀티선택 신규 생성 CTA 확인용',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  {
    eventId: 9102,
    daysAgo: 0,
    eventName: '[액션바/신규] 북해 가스전 유지보수 연장 — TTF 타이트',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'infrastructure_facility',
    eventTypeLv1Label: '인프라/설비',
    isScenarioSuggested: true,
    scenarioSuggestReason: '멀티선택 신규 생성 CTA 확인용',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: bullishTriplet(MarketImpactLevel.MEDIUM, MarketImpactLevel.HIGH, MarketImpactLevel.LOW),
  },
  // Case 2. 다른 사용자 진행 중: 동일 그룹 + creating + 타인 occupant → 잠금 + N단계
  {
    eventId: 9103,
    daysAgo: 0,
    eventName: '[액션바/진행-타인] 카타르 LNG 공급 차질 확산 (A)',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: true,
    scenarioSuggestReason: '멀티선택 타인 진행 중 CTA 확인용',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step1',
    designStepLabel: '1단계',
    scenarioGroupId: 601,
    occupied: true,
    occupantUserId: MOCK_OTHER_OCCUPANT_USER_NO,
    occupantUserName: MOCK_OTHER_OCCUPANT_USER_NAME,
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM),
  },
  {
    eventId: 9104,
    daysAgo: 0,
    eventName: '[액션바/진행-타인] 카타르 LNG 공급 차질 확산 (B)',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: true,
    scenarioSuggestReason: '멀티선택 타인 진행 중 CTA 확인용',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step1',
    designStepLabel: '1단계',
    scenarioGroupId: 601,
    occupied: true,
    occupantUserId: MOCK_OTHER_OCCUPANT_USER_NO,
    occupantUserName: MOCK_OTHER_OCCUPANT_USER_NAME,
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.HIGH, MarketImpactLevel.LOW),
  },
  // Case 3. 내가 진행 중: 동일 그룹 + creating + 본인 occupant → N단계 (잠금 없음)
  {
    eventId: 9105,
    daysAgo: 0,
    eventName: '[액션바/진행-본인] 동아시아 폭염 LNG 수요 (A)',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'weather_climate',
    eventTypeLv1Label: '기상/기후',
    isScenarioSuggested: true,
    scenarioSuggestReason: '멀티선택 본인 진행 중 CTA 확인용',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step2',
    designStepLabel: '2단계',
    scenarioGroupId: 602,
    occupied: true,
    useCurrentUserAsOccupant: true,
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  {
    eventId: 9106,
    daysAgo: 0,
    eventName: '[액션바/진행-본인] 동아시아 폭염 LNG 수요 (B)',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'weather_climate',
    eventTypeLv1Label: '기상/기후',
    isScenarioSuggested: true,
    scenarioSuggestReason: '멀티선택 본인 진행 중 CTA 확인용',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step2',
    designStepLabel: '2단계',
    scenarioGroupId: 602,
    occupied: true,
    useCurrentUserAsOccupant: true,
    indexImpacts: bullishTriplet(MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW, MarketImpactLevel.LOW),
  },
  // Case 4. 동일 조합 완료: 동일 그룹 + created → `>` 보기 CTA
  {
    eventId: 9107,
    daysAgo: 0,
    eventName: '[액션바/완료] 노르웨이 수출 인프라 점검 완료 (A)',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'infrastructure_facility',
    eventTypeLv1Label: '인프라/설비',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    scenarioGroupId: 603,
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('TTF', MarketImpactLevel.MEDIUM, MarketDirection.BEARISH),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },
  {
    eventId: 9108,
    daysAgo: 0,
    eventName: '[액션바/완료] 노르웨이 수출 인프라 점검 완료 (B)',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'infrastructure_facility',
    eventTypeLv1Label: '인프라/설비',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    scenarioGroupId: 603,
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('TTF', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },

  // --- 연결 그룹 팝오버 상태별 분기 확인용 (Figma 상태별 분기) ---
  // Case 1. 내가 진행 중
  {
    eventId: 9201,
    daysAgo: 0,
    eventName: '[분기/본인-1단계] 카타르 LNG 공급 차질 확산',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: true,
    scenarioSuggestReason: '팝오버 Case1 본인 1단계',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step1',
    designStepLabel: '1단계',
    scenarioGroupId: 801,
    occupied: true,
    useCurrentUserAsOccupant: true,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 801,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step1',
        designStepLabel: '1단계',
        scenarioDesignStatus: 'creating',
        occupied: true,
        events: [{ eventId: 9201, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' }],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM),
  },
  {
    eventId: 9202,
    daysAgo: 0,
    eventName: '[분기/본인-2단계] 카타르 LNG 공급 차질 확산',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: true,
    scenarioSuggestReason: '팝오버 Case1 본인 2단계',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step2',
    designStepLabel: '2단계',
    scenarioGroupId: 802,
    occupied: true,
    useCurrentUserAsOccupant: true,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 802,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step2',
        designStepLabel: '2단계',
        scenarioDesignStatus: 'creating',
        occupied: true,
        events: [{ eventId: 9202, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' }],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  {
    eventId: 9203,
    daysAgo: 0,
    eventName: '[분기/본인-완료] 카타르 LNG 공급 차질 확산',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    scenarioGroupId: 803,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 803,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        scenarioDesignStatus: 'created',
        events: [{ eventId: 9203, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' }],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.MEDIUM, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  // Case 2. 다른 사용자가 진행 중
  {
    eventId: 9204,
    daysAgo: 0,
    eventName: '[분기/타인-1단계] 카타르 LNG 공급 차질 확산',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: true,
    scenarioSuggestReason: '팝오버 Case2 타인 1단계(락)',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step1',
    designStepLabel: '1단계',
    scenarioGroupId: 804,
    occupied: true,
    occupantUserId: MOCK_OTHER_OCCUPANT_USER_NO,
    occupantUserName: MOCK_OTHER_OCCUPANT_USER_NAME,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 804,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step1',
        designStepLabel: '1단계',
        scenarioDesignStatus: 'creating',
        occupied: true,
        occupantUserId: MOCK_OTHER_OCCUPANT_USER_NO,
        occupantUserName: MOCK_OTHER_OCCUPANT_USER_NAME,
        events: [{ eventId: 9204, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' }],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.HIGH, MarketImpactLevel.LOW),
  },
  {
    eventId: 9205,
    daysAgo: 0,
    eventName: '[분기/타인-2단계] 카타르 LNG 공급 차질 확산',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: true,
    scenarioSuggestReason: '팝오버 Case2 타인 2단계(락)',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step2',
    designStepLabel: '2단계',
    scenarioGroupId: 805,
    occupied: true,
    occupantUserId: MOCK_OTHER_OCCUPANT_USER_NO,
    occupantUserName: MOCK_OTHER_OCCUPANT_USER_NAME,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 805,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step2',
        designStepLabel: '2단계',
        scenarioDesignStatus: 'creating',
        occupied: true,
        occupantUserId: MOCK_OTHER_OCCUPANT_USER_NO,
        occupantUserName: MOCK_OTHER_OCCUPANT_USER_NAME,
        events: [{ eventId: 9205, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' }],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.MEDIUM),
  },
  {
    eventId: 9206,
    daysAgo: 0,
    eventName: '[분기/타인-완료] 카타르 LNG 공급 차질 확산',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    scenarioGroupId: 806,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 806,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        scenarioDesignStatus: 'created',
        events: [{ eventId: 9206, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' }],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW, MarketImpactLevel.LOW),
  },
  // Case 3. 복수 시나리오 그룹 연결
  {
    eventId: 9207,
    daysAgo: 0,
    eventName: '[분기/복수-단계혼합] 호르무즈 연계 이벤트',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: true,
    scenarioSuggestReason: '팝오버 Case3 1단계+2단계',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step1',
    designStepLabel: '1단계',
    scenarioGroupId: 807,
    occupied: true,
    useCurrentUserAsOccupant: true,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 807,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step1',
        designStepLabel: '1단계',
        scenarioDesignStatus: 'creating',
        occupied: true,
        events: [
          { eventId: 9207, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9207, eventName: '이벤트 02 - LNG 선박 호르무즈 통항 중단 — 희망봉 우회 전환 개시' },
        ],
      },
      {
        scenarioGroupId: 808,
        groupName: '시나리오 그룹명 02 - 외교 정상화 / 물리 점진 복구',
        designStep: 'step2',
        designStepLabel: '2단계',
        scenarioDesignStatus: 'creating',
        occupied: true,
        events: [
          { eventId: 9207, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9207, eventName: '이벤트 03 - [카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세' },
          { eventId: 9207, eventName: '이벤트 04 - 미군 항모전단 호르무즈 인근 집결 — 이란과 군사적 긴장 고조' },
        ],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM),
  },
  {
    eventId: 9208,
    daysAgo: 0,
    eventName: '[분기/복수-일부완료] 호르무즈 연계 이벤트',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: true,
    scenarioSuggestReason: '팝오버 Case3 1단계+완료(>)',
    scenarioDesignStatus: 'creating',
    scenarioDesignStatusLabel: '설계 중',
    designStep: 'step1',
    designStepLabel: '1단계',
    scenarioGroupId: 809,
    occupied: true,
    useCurrentUserAsOccupant: true,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 809,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step1',
        designStepLabel: '1단계',
        scenarioDesignStatus: 'creating',
        occupied: true,
        events: [
          { eventId: 9208, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9208, eventName: '이벤트 02 - LNG 선박 호르무즈 통항 중단 — 희망봉 우회 전환 개시' },
        ],
      },
      {
        scenarioGroupId: 810,
        groupName: '시나리오 그룹명 02 - 외교 정상화 / 물리 점진 복구',
        scenarioDesignStatus: 'created',
        events: [
          { eventId: 9208, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9208, eventName: '이벤트 03 - [카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세' },
          { eventId: 9208, eventName: '이벤트 04 - 미군 항모전단 호르무즈 인근 집결 — 이란과 군사적 긴장 고조' },
        ],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  {
    eventId: 9209,
    daysAgo: 0,
    eventName: '[분기/복수-모두완료] 호르무즈 연계 이벤트',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    scenarioGroupId: 811,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 811,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        scenarioDesignStatus: 'created',
        events: [
          { eventId: 9209, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9209, eventName: '이벤트 02 - LNG 선박 호르무즈 통항 중단 — 희망봉 우회 전환 개시' },
        ],
      },
      {
        scenarioGroupId: 812,
        groupName: '시나리오 그룹명 02 - 외교 정상화 / 물리 점진 복구',
        scenarioDesignStatus: 'created',
        events: [
          { eventId: 9209, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9209, eventName: '이벤트 03 - [카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세' },
          { eventId: 9209, eventName: '이벤트 04 - 미군 항모전단 호르무즈 인근 집결 — 이란과 군사적 긴장 고조' },
        ],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.MEDIUM, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },

  {
    eventId: 9001,
    daysAgo: 1,
    eventName: '[카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'supply_demand_balance',
    eventTypeLv1Label: '수급 밸런스',
    isScenarioSuggested: true,
    scenarioSuggestReason: '단기 공급 차질이 가격에 유의미한 영향을 줄 가능성이 높음',
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    designStep: 'step1',
    designStepLabel: '1단계',
    scenarioGroupId: 701,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 701,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step1',
        designStepLabel: '1단계',
        scenarioDesignStatus: 'created',
        events: [
          { eventId: 9002, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9003, eventName: '이벤트 02 - LNG 선박 호르무즈 통항 중단 — 희망봉 우회 전환 개시' },
        ],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM),
  },
  {
    eventId: 9002,
    daysAgo: 1,
    eventName: '미국/이스라엘 이란 공습 개시 (Operation Epic Fury)',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    designStep: 'step2',
    designStepLabel: '2단계',
    scenarioGroupId: 702,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 701,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        scenarioDesignStatus: 'created',
        events: [
          { eventId: 9002, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9003, eventName: '이벤트 02 - LNG 선박 호르무즈 통항 중단 — 희망봉 우회 전환 개시' },
        ],
      },
      {
        scenarioGroupId: 702,
        groupName: '시나리오 그룹명 02 - 외교 정상화 / 물리 점진 복구',
        scenarioDesignStatus: 'created',
        events: [
          { eventId: 9002, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9001, eventName: '이벤트 03 - [카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세' },
          { eventId: 9004, eventName: '이벤트 04 - 미군 항모전단 호르무즈 인근 집결 — 이란과 군사적 긴장 고조' },
        ],
      },
      {
        scenarioGroupId: 703,
        groupName: '시나리오 그룹명 03 - 호르무즈 장기 봉쇄 / 아시아 재고 소진',
        scenarioDesignStatus: 'created',
        events: [
          { eventId: 9002, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9003, eventName: '이벤트 02 - LNG 선박 호르무즈 통항 중단 — 희망봉 우회 전환 개시' },
          { eventId: 9001, eventName: '이벤트 03 - [카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세' },
        ],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.HIGH, MarketImpactLevel.LOW),
  },
  {
    eventId: 9003,
    daysAgo: 2,
    eventName: 'LNG 선박 호르무즈 해협 통행 중단 — 희망봉 우회 시작, 운임·도착 지연 확대',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'logistics_shipping',
    eventTypeLv1Label: '물류/해운',
    isScenarioSuggested: true,
    scenarioSuggestReason: '물류 병목으로 아시아 도착 일정 변동 가능',
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    designStep: 'step1',
    designStepLabel: '1단계',
    scenarioGroupId: 701,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 701,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step1',
        designStepLabel: '1단계',
        events: [
          { eventId: 9002, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9003, eventName: '이벤트 02 - LNG 선박 호르무즈 통항 중단 — 희망봉 우회 전환 개시' },
        ],
      },
    ],
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  {
    eventId: 9004,
    daysAgo: 2,
    eventName: '북해 가스전 유지보수 연장 — TTF 단기 수급 타이트 우려',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'infrastructure_facility',
    eventTypeLv1Label: '인프라/설비',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    designStep: 'step2',
    designStepLabel: '2단계',
    scenarioGroupId: 702,
    connectedScenarioGroups: [
      {
        scenarioGroupId: 701,
        groupName: '시나리오 그룹명 01 - 카타르 LNG 공급 차질 확산',
        designStep: 'step1',
        designStepLabel: '1단계',
        events: [
          { eventId: 9002, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9004, eventName: '이벤트 04 - 미군 항모전단 호르무즈 인근 집결 — 이란과 군사적 긴장 고조' },
        ],
      },
      {
        scenarioGroupId: 702,
        groupName: '시나리오 그룹명 02 - 외교 정상화 / 물리 점진 복구',
        designStep: 'step2',
        designStepLabel: '2단계',
        events: [
          { eventId: 9002, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9001, eventName: '이벤트 03 - [카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세' },
          { eventId: 9004, eventName: '이벤트 04 - 미군 항모전단 호르무즈 인근 집결 — 이란과 군사적 긴장 고조' },
        ],
      },
      {
        scenarioGroupId: 703,
        groupName: '시나리오 그룹명 03 - 호르무즈 장기 봉쇄 / 아시아 재고 소진',
        designStep: 'step2',
        designStepLabel: '2단계',
        events: [
          { eventId: 9004, eventName: '이벤트 04 - 북해 가스전 유지보수 연장 — TTF 단기 수급 타이트 우려' },
          { eventId: 9002, eventName: '이벤트 01 - 미국/이스라엘 이란 공습 개시 (Operation Epic Fury)' },
          { eventId: 9001, eventName: '이벤트 03 - [카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세' },
        ],
      },
    ],
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      createIndexImpact('TTF', MarketImpactLevel.HIGH, MarketDirection.BULLISH),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },
  {
    eventId: 9005,
    daysAgo: 3,
    eventName: '중국 동부 폭염 지속 — 전력용 LNG 수요 급증 관측',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'weather_climate',
    eventTypeLv1Label: '기상/기후',
    isScenarioSuggested: true,
    scenarioSuggestReason: '동아시아 수요 급증이 JKM에 직접 반영될 가능성',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  {
    eventId: 9006,
    daysAgo: 3,
    eventName: '미국 가스 생산 회복세 — HH 약세 압력 지속',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'supply_demand_balance',
    eventTypeLv1Label: '수급 밸런스',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('TTF', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('HH', MarketImpactLevel.HIGH, MarketDirection.BEARISH),
    ],
  },
  {
    eventId: 9007,
    daysAgo: 4,
    eventName: 'EU 가스 저장률 목표 상향 논의 — 재고 확보 경쟁 심화 전망',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'macroeconomy_policy',
    eventTypeLv1Label: '거시경제/정책',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      createIndexImpact('TTF', MarketImpactLevel.HIGH, MarketDirection.BULLISH),
      createIndexImpact('HH', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
    ],
  },
  {
    eventId: 9008,
    daysAgo: 5,
    eventName: '호주 동부 LNG 설비 트립 — 아시아 스팟 카고 가용성 축소',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'infrastructure_facility',
    eventTypeLv1Label: '인프라/설비',
    isScenarioSuggested: true,
    scenarioSuggestReason: '아시아 공급 차질로 JKM 민감도 상승',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: bullishTriplet(MarketImpactLevel.HIGH, MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW),
  },
  {
    eventId: 9009,
    daysAgo: 6,
    eventName: '파나마 운하 통행 제한 완화 — 대서양-아시아 아비트리지 정상화 조짐',
    status: 'new',
    statusLabel: '신규',
    signalType: 'noise',
    signalTypeLabel: '노이즈',
    eventTypeLv1: 'logistics_shipping',
    eventTypeLv1Label: '물류/해운',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'unavailable',
    scenarioDesignStatusLabel: '설계 불가',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('TTF', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },
  {
    eventId: 9010,
    daysAgo: 7,
    eventName: '일본 원전 재가동 일정 지연 — LNG 수요 하방 제한 요인 약화',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'energy_mix_transition',
    eventTypeLv1Label: '에너지 믹스 전환',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      createIndexImpact('TTF', MarketImpactLevel.LOW, MarketDirection.BULLISH),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },
  {
    eventId: 9011,
    daysAgo: 8,
    eventName: 'TTF-JKM 스프레드 확대 — 유럽향 카고 유인 강화',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'market_trading_structure',
    eventTypeLv1Label: '시장/거래 구조',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      createIndexImpact('TTF', MarketImpactLevel.HIGH, MarketDirection.BULLISH),
      createIndexImpact('HH', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
    ],
  },
  {
    eventId: 9012,
    daysAgo: 9,
    eventName: '카타르 North Field 확장 일정 재확인 — 중장기 공급 안도감',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'noise',
    signalTypeLabel: '노이즈',
    eventTypeLv1: 'supply_demand_balance',
    eventTypeLv1Label: '수급 밸런스',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.BEARISH, 'mid_long'),
      createIndexImpact('TTF', MarketImpactLevel.LOW, MarketDirection.BEARISH, 'mid_long'),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE, 'mid_long'),
    ],
  },
  {
    eventId: 9013,
    daysAgo: 10,
    eventName: '미국 Freeport LNG 가동률 회복 — 대서양 공급 여력 확대',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'infrastructure_facility',
    eventTypeLv1Label: '인프라/설비',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('TTF', MarketImpactLevel.MEDIUM, MarketDirection.BEARISH),
      createIndexImpact('HH', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
    ],
  },
  {
    eventId: 9014,
    daysAgo: 11,
    eventName: '인도 몬순 강수 부진 — 발전용 가스 수요 증가 가능성',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'weather_climate',
    eventTypeLv1Label: '기상/기후',
    isScenarioSuggested: true,
    scenarioSuggestReason: '남아시아 수요 증가가 스팟 시장에 영향',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: bullishTriplet(MarketImpactLevel.MEDIUM, MarketImpactLevel.LOW, MarketImpactLevel.LOW),
  },
  {
    eventId: 9015,
    daysAgo: 12,
    eventName: '러시아 파이프 가스 공급 변동성 재부각 — 유럽 리스크 프리미엄 재점화',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'geopolitical_risk',
    eventTypeLv1Label: '지정학적 리스크',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      createIndexImpact('TTF', MarketImpactLevel.HIGH, MarketDirection.BULLISH),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.BULLISH),
    ],
  },
  {
    eventId: 9016,
    daysAgo: 13,
    eventName: '한국 도시가스 요금 조정 논의 — 수요 탄력성 점검 필요',
    status: 'new',
    statusLabel: '신규',
    signalType: 'noise',
    signalTypeLabel: '노이즈',
    eventTypeLv1: 'macroeconomy_policy',
    eventTypeLv1Label: '거시경제/정책',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'unavailable',
    scenarioDesignStatusLabel: '설계 불가',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
      createIndexImpact('TTF', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },
  {
    eventId: 9017,
    daysAgo: 14,
    eventName: '동남아 신규 수입터미널 상업가동 — 지역 수요 흡수력 확대',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'infrastructure_facility',
    eventTypeLv1Label: '인프라/설비',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      createIndexImpact('TTF', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },
  {
    eventId: 9018,
    daysAgo: 16,
    eventName: '미국 허리케인 시즌 조기 경보 — 걸프만 생산/수출 차질 리스크',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'weather_climate',
    eventTypeLv1Label: '기상/기후',
    isScenarioSuggested: true,
    scenarioSuggestReason: '수출 차질 시 대서양/아시아 스프레드 변동 가능',
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      createIndexImpact('TTF', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      createIndexImpact('HH', MarketImpactLevel.HIGH, MarketDirection.BULLISH),
    ],
  },
  {
    eventId: 9019,
    daysAgo: 18,
    eventName: '노르웨이 수출 인프라 점검 완료 — 유럽 공급 안정성 개선',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '시그널',
    eventTypeLv1: 'infrastructure_facility',
    eventTypeLv1Label: '인프라/설비',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'created',
    scenarioDesignStatusLabel: '설계 완료',
    scenarioGroupId: 501,
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('TTF', MarketImpactLevel.MEDIUM, MarketDirection.BEARISH),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },
  {
    eventId: 9020,
    daysAgo: 20,
    eventName: '글로벌 LNG 선대 가동률 상승 — 단기 운임 하방 압력',
    status: 'new',
    statusLabel: '신규',
    signalType: 'noise',
    signalTypeLabel: '노이즈',
    eventTypeLv1: 'logistics_shipping',
    eventTypeLv1Label: '물류/해운',
    isScenarioSuggested: false,
    scenarioDesignStatus: 'designable',
    scenarioDesignStatusLabel: '설계 가능',
    indexImpacts: [
      createIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('TTF', MarketImpactLevel.LOW, MarketDirection.BEARISH),
      createIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
  },
]

const buildMockEventListItems = (): EventListItem[] =>
  EVENT_LIST_MOCK_SEEDS.map(({ daysAgo, useCurrentUserAsOccupant: _useCurrentUserAsOccupant, ...seed }) => {
    const at = dayjs().subtract(daysAgo, 'day').hour(17).minute(0).second(0).millisecond(0)
    const iso = at.toISOString()
    const {
      connectedScenarioGroups,
      scenarioDesignStatus: _scenarioDesignStatus,
      scenarioDesignStatusLabel: _scenarioDesignStatusLabel,
      designStep: _designStep,
      designStepLabel: _designStepLabel,
      scenarioGroupId: _scenarioGroupId,
      occupied: _occupied,
      occupantUserId: _occupantUserId,
      occupantUserName: _occupantUserName,
      ...listFields
    } = seed

    return {
      ...listFields,
      scenarioGroupCount: listFields.scenarioGroupCount ?? connectedScenarioGroups?.length ?? 0,
      updatedAt: iso,
      createdAt: iso,
      latestRecordFirstCreated: iso,
    }
  })

/** #DELETE: API 적용후엔 목데이터 삭제 */
export const MOCK_EVENT_TYPE_L1_LIST: EventTypeL1[] = [
  { eventTypeL1Id: 1, code: 'geopolitical_risk', label: '지정학적 리스크' },
  { eventTypeL1Id: 2, code: 'weather_climate', label: '기상/기후' },
  { eventTypeL1Id: 3, code: 'infrastructure_facility', label: '인프라/설비' },
  { eventTypeL1Id: 4, code: 'supply_demand_balance', label: '수급 밸런스' },
  { eventTypeL1Id: 5, code: 'logistics_shipping', label: '물류/해운' },
  { eventTypeL1Id: 6, code: 'energy_mix_transition', label: '에너지 믹스 전환' },
  { eventTypeL1Id: 7, code: 'macroeconomy_policy', label: '거시경제/정책' },
  { eventTypeL1Id: 8, code: 'market_trading_structure', label: '시장/거래 구조' },
]

const EVENT_TYPE_L1_ID_BY_CODE = new Map(MOCK_EVENT_TYPE_L1_LIST.map((item) => [item.code, item.eventTypeL1Id]))

const paginate = <T>(items: T[], page: number, size: number): IPaginationResponse<T> => {
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * size
  const detail = items.slice(start, start + size)

  return {
    totalPages,
    totalElements,
    currentPage: safePage,
    numberOfElements: detail.length,
    size,
    isFirst: safePage <= 1,
    isLast: safePage >= totalPages,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
    detail,
  }
}

/** API 서버 비가용 시 Event List 화면 확인용 더미 응답 */
/** #DELETE: API 적용후엔 목데이터 삭제 */
export const buildMockEventList = (params: GetEventsParams = {}): EventList => {
  const page = params.page ?? 1
  const size = params.size ?? 20
  const sort = params.sort ?? 'latest'
  const keyword = params.keyword?.trim().toLowerCase()
  const selectedTypeIds = new Set(params.eventTypeL1Id ?? [])

  let rows = buildMockEventListItems()

  if (params.eventStatus && params.eventStatus !== 'all') {
    rows = rows.filter((row) => row.status === params.eventStatus)
  }

  if (selectedTypeIds.size > 0) {
    rows = rows.filter((row) => {
      const typeId = row.eventTypeLv1 ? EVENT_TYPE_L1_ID_BY_CODE.get(row.eventTypeLv1) : undefined
      return typeId !== undefined && selectedTypeIds.has(typeId)
    })
  }

  if (keyword) {
    rows = rows.filter((row) => row.eventName.toLowerCase().includes(keyword))
  }

  if (params.suggestedOnly) {
    rows = rows.filter((row) => row.isScenarioSuggested)
  }

  rows = [...rows].sort((a, b) => {
    const aTime = dayjs(a.updatedAt).valueOf()
    const bTime = dayjs(b.updatedAt).valueOf()
    return sort === 'oldest' ? aTime - bTime : bTime - aTime
  })

  return {
    appliedFilter: {
      eventStatus: params.eventStatus,
      eventTypeL1Id: params.eventTypeL1Id,
      startDate: params.startDate,
      endDate: params.endDate,
      sort,
      keyword: params.keyword,
      suggestedOnly: params.suggestedOnly,
    },
    events: paginate(rows, page, size),
  }
}

/** API 서버 비가용 시 Event Detail 화면/시나리오 설계 진입용 더미 */
/** #DELETE: API 적용후엔 목데이터 삭제 */
export const buildMockEventDetail = (eventId: string | number): EventDetail => {
  const numericId = Number(eventId)
  const listItem = buildMockEventListItems().find((item) => item.eventId === numericId) ?? buildMockEventListItems()[0]

  return {
    eventId: listItem.eventId,
    eventName: listItem.eventName,
    status: listItem.status,
    statusLabel: listItem.statusLabel,
    signalType: listItem.signalType,
    signalTypeLabel: listItem.signalTypeLabel,
    isScenarioSuggested: listItem.isScenarioSuggested,
    scenarioSuggestReason: listItem.scenarioSuggestReason,
    latestRecordFirstCreated: listItem.latestRecordFirstCreated,
    createdAt: listItem.createdAt,
    updatedAt: listItem.updatedAt,
    aiInsights: {
      keySummaries: [
        '단기 공급 차질과 운임 상승이 동시에 관측됩니다.',
        '유럽·아시아 스프레드 확대로 카고 유인 구조가 재편될 수 있습니다.',
        '중장기적으로는 외교·운영 정상화 시나리오와 병행해 해석이 필요합니다.',
      ],
      detailedAnalysis:
        '현재 이벤트는 단기적으로 JKM/TTF 상승 압력과 HH의 상대적 약세가 동시에 나타날 수 있는 구조입니다. 공급 차질 지속 여부와 우회 운송 비용이 핵심 관찰 포인트입니다.',
    },
    impactAnalysis: {
      indexImpacts: listItem.indexImpacts.map((impact) => ({
        indexName: impact.indexName,
        shortTerm: {
          marketImpactLevel: impact.marketImpactLevel,
          marketImpactLevelLabel: impact.marketImpactLevelLabel,
          direction: impact.direction,
          directionLabel: impact.directionLabel,
        },
        midLongTerm: {
          marketImpactLevel: MarketImpactLevel.LOW,
          marketImpactLevelLabel: '낮음',
          direction: MarketDirection.NEGLIGIBLE,
          directionLabel: '영향 미미',
        },
      })),
      analysisText: '단기 영향이 중장기 영향보다 크게 나타날 가능성이 높습니다.',
      eventTypeLv1: listItem.eventTypeLv1,
      eventTypeLv1Label: listItem.eventTypeLv1Label,
      sources: ['MI Agent', 'Market Desk'],
    },
    relatedEventScenarios: [],
  }
}
