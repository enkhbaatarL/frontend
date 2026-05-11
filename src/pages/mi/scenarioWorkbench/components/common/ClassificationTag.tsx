import type { EventClassification } from '@/pages/mi/scenarioWorkbench/components/event/types'

import MIChip from '@/components/common/chip/MIChip'
import { ScenarioWorkbenchStatus } from '@/service/mi/scenarioWorkbench/common'

/** 신규,갱신,소음 뱃지 variant (종료는 별도 스타일) */
export type ScenarioWorkbenchClassificationBadgeVariant = ScenarioWorkbenchStatus.NEW | ScenarioWorkbenchStatus.UPDATED | 'noise'

/** 신규,갱신,소음 칩 공통 레이아웃 스타일 */
const SCENARIO_WORKBENCH_TYPE_BADGE_BASE_SX = {
  height: '28px',
  borderRadius: '8px',
  padding: '4px 8px',
  boxSizing: 'border-box',
  border: 'none',
  '& .MuiChip-label': { padding: 0 },
} as const

export interface ScenarioWorkbenchTypeBadgeProps {
  type: ScenarioWorkbenchClassificationBadgeVariant
}

/** 시나리오 워크벤치 이벤트 타입 뱃지 (신규,갱신,소음) */
export const ScenarioWorkbenchTypeBadge = ({ type }: ScenarioWorkbenchTypeBadgeProps) => {
  const isNoise = type === 'noise'
  const isNew = type === ScenarioWorkbenchStatus.NEW
  const label = isNoise ? '소음' : isNew ? '신규' : '갱신'
  return (
    <MIChip
      type="filled"
      fontType="body2SB14"
      disableHover
      label={label}
      sx={{
        ...SCENARIO_WORKBENCH_TYPE_BADGE_BASE_SX,
        backgroundColor: isNoise ? 'gray.20' : isNew ? 'contentBG.PrimaryFade' : '#F7EFDF',
        color: isNoise ? 'contentText.Subtext' : isNew ? 'mari.Primary' : '#EB670F',
      }}
    />
  )
}

interface ClassificationTagProps {
  classification: EventClassification
}

/** 이벤트 분류(신규,갱신,종료,소음) 칩 */
const ClassificationTag = ({ classification }: ClassificationTagProps) => {
  if (classification === '소음') {
    return <ScenarioWorkbenchTypeBadge type="noise" />
  }
  if (classification === '신규') {
    return <ScenarioWorkbenchTypeBadge type={ScenarioWorkbenchStatus.NEW} />
  }
  if (classification === '갱신') {
    return <ScenarioWorkbenchTypeBadge type={ScenarioWorkbenchStatus.UPDATED} />
  }
  return (
    <MIChip
      type="filled"
      fontType="body2SB14"
      disableHover
      label="종료"
      sx={{
        ...SCENARIO_WORKBENCH_TYPE_BADGE_BASE_SX,
        backgroundColor: 'contentBG.Disabled',
        color: 'contentText.Subtext',
      }}
    />
  )
}

export default ClassificationTag
