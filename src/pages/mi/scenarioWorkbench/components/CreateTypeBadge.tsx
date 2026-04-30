import type { CreateType } from '@/service/mi/scenarioWorkbench'

import MIChip from '@/components/common/chip/MIChip'

export interface ScenarioWorkbenchTypeBadgeProps {
  type: CreateType
}

/** 시나리오 워크벤치 — 생성 타입(신규/갱신) 칩 */
const ScenarioWorkbenchTypeBadge = ({ type }: ScenarioWorkbenchTypeBadgeProps) => {
  const isNew = type === 'new'
  return (
    <MIChip
      type="filled"
      fontType="body2SB14"
      disableHover
      label={isNew ? '신규' : '갱신'}
      sx={{
        height: '28px',
        borderRadius: '8px',
        padding: '4px 8px',
        backgroundColor: isNew ? '#ECEDF4' : '#F7EFDF',
        color: isNew ? 'mari.Primary' : '#EB670F',
      }}
    />
  )
}

export default ScenarioWorkbenchTypeBadge
