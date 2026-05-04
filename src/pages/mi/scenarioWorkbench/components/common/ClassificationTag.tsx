import type { EventClassification } from '@/pages/mi/scenarioWorkbench/components/event/types'
import type { CreateType } from '@/service/mi/scenarioWorkbench'

import MIChip from '@/components/common/chip/MIChip'

export interface ScenarioWorkbenchTypeBadgeProps {
  type: CreateType
}

export const ScenarioWorkbenchTypeBadge = ({ type }: ScenarioWorkbenchTypeBadgeProps) => {
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
        boxSizing: 'border-box',
        backgroundColor: isNew ? 'contentBG.PrimaryFade' : '#F7EFDF',
        color: isNew ? 'mari.Primary' : '#EB670F',
        border: 'none',
        '& .MuiChip-label': { padding: 0 },
      }}
    />
  )
}

interface ClassificationTagProps {
  classification: EventClassification
}

const ClassificationTag = ({ classification }: ClassificationTagProps) => {
  if (classification === '신규') {
    return <ScenarioWorkbenchTypeBadge type="new" />
  }
  if (classification === '갱신') {
    return <ScenarioWorkbenchTypeBadge type="updated" />
  }
  return (
    <MIChip
      type="filled"
      fontType="body2SB14"
      disableHover
      label="종료"
      sx={{
        height: '28px',
        borderRadius: '8px',
        padding: '4px 8px',
        boxSizing: 'border-box',
        backgroundColor: 'contentBG.Disabled',
        color: 'contentText.Subtext',
        border: 'none',
        '& .MuiChip-label': { padding: 0 },
      }}
    />
  )
}

export default ClassificationTag
