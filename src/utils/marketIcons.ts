import crudeOilIcon from '@/assets/icons/crude-oil.png'
import defaultIcon from '@/assets/icons/default.png'
import evBatteryIcon from '@/assets/icons/ev-battery.png'
import lngIcon from '@/assets/icons/lng.png'
import semiconductorIcon from '@/assets/icons/semiconductor.png'

export enum MarketCategoryCode {
  CROIL = 'CROIL',
  BTRY = 'BTRY',
  LNG = 'LNG',
  SCDT = 'SCDT',
}

export interface MarketIconInfo {
  icon: string
  label: string
}

export const MARKET_ICON_MAP: Record<string, MarketIconInfo> = {
  [MarketCategoryCode.CROIL]: {
    icon: crudeOilIcon,
    label: 'Crude Oil',
  },
  [MarketCategoryCode.LNG]: {
    icon: lngIcon,
    label: 'Natural Gas',
  },
  [MarketCategoryCode.SCDT]: {
    icon: semiconductorIcon,
    label: 'Semiconductor',
  },
  [MarketCategoryCode.BTRY]: {
    icon: evBatteryIcon,
    label: 'EV Battery',
  },
}

/**
 * 마켓 카테고리 코드에 해당하는 아이콘 정보를 반환합니다.
 * @param codeId 마켓 카테고리 코드
 * @returns 아이콘 정보 또는 기본값
 */
export const getMarketIconInfo = (codeId: string): MarketIconInfo =>
  MARKET_ICON_MAP[codeId] || {
    icon: defaultIcon,
    label: 'Unknown',
  }

/**
 * 마켓 카테고리 코드에 해당하는 아이콘만 반환합니다.
 * @param codeId 마켓 카테고리 코드
 * @returns 아이콘 경로 또는 undefined
 */
export const getMarketIcon = (codeId: string): string | undefined => MARKET_ICON_MAP[codeId]?.icon

/**
 * 마켓 카테고리 코드에 해당하는 라벨만 반환합니다.
 * @param codeId 마켓 카테고리 코드
 * @returns 라벨 또는 undefined
 */
export const getMarketLabel = (codeId: string): string | undefined => MARKET_ICON_MAP[codeId]?.label
