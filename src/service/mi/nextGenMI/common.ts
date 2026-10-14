export type NextGenMIIndexName = 'JKM' | 'TTF' | 'HH'

/** 이벤트 출처. platform: 플랫폼 등록, user: 사용자 등록 */
export type EventSourceType = 'platform' | 'user'

export enum NextGenMIStatus {
  ALL = 'all',
  NEW = 'new',
  UPDATED = 'updated',
}

export enum MarketDirection {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  NEGLIGIBLE = 'negligible',
}

export enum EventCategoryLv1 {
  GEOPOLITICAL_RISK = 'geopolitical_risk',
  WEATHER_CLIMATE = 'weather_climate',
  INFRASTRUCTURE_FACILITY = 'infrastructure_facility',
  SUPPLY_DEMAND_BALANCE = 'supply_demand_balance',
  LOGISTICS_SHIPPING = 'logistics_shipping',
  ENERGY_MIX_TRANSITION = 'energy_mix_transition',
  MACROECONOMY_POLICY = 'macroeconomy_policy',
  MARKET_TRADING_STRUCTURE = 'market_trading_structure',
}

export enum ListSort {
  LATEST = 'latest',
  OLDEST = 'oldest',
}

export const EVENT_CATEGORY_LV1_KO: Record<EventCategoryLv1, string> = {
  [EventCategoryLv1.GEOPOLITICAL_RISK]: '지정학적 리스크',
  [EventCategoryLv1.WEATHER_CLIMATE]: '기상/기후',
  [EventCategoryLv1.INFRASTRUCTURE_FACILITY]: '인프라/설비',
  [EventCategoryLv1.SUPPLY_DEMAND_BALANCE]: '수급밸런스',
  [EventCategoryLv1.LOGISTICS_SHIPPING]: '물류/해운',
  [EventCategoryLv1.ENERGY_MIX_TRANSITION]: '에너지 믹스 전환',
  [EventCategoryLv1.MACROECONOMY_POLICY]: '거시경제/정책',
  [EventCategoryLv1.MARKET_TRADING_STRUCTURE]: '시장/거래 구조',
}

export enum MarketImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXTREME = 'extreme',
}

export const MARKET_IMPACT_LEVEL_KO: Record<MarketImpactLevel, string> = {
  [MarketImpactLevel.NONE]: '없음',
  [MarketImpactLevel.LOW]: '낮음',
  [MarketImpactLevel.MEDIUM]: '중간',
  [MarketImpactLevel.HIGH]: '높음',
  [MarketImpactLevel.EXTREME]: '높음',
}

export enum SignpostImpactLevel {
  STRONG = 'strong',
  MODERATE = 'moderate',
  WEAK = 'weak',
}
