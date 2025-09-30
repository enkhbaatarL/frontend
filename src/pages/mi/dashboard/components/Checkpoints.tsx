import { Stack } from '@mui/material'
import { useState } from 'react'

import DashboardSelect from '@/pages/mi/dashboard/components/DashboardSelect'
import SectionHeader from '@/pages/mi/dashboard/components/SectionHeader'

const options = [
  { label: 'Detailed', value: 'detailed' },
  { label: 'Focused', value: 'focused' },
  { label: 'Narrative', value: 'narrative' },
]

const Checkpoints = () => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['detailed'])

  return (
    <Stack padding="6px 12px 14px" borderRadius="10px" sx={{ backgroundColor: '#F8F9FA' }}>
      <SectionHeader
        title="Checkpoints"
        tooltipTitle="시장 데이터와 뉴스 흐름을 종합해, 단기 대응과 리스크 관리를 위해 확인해야 할 전략 체크리스트를 제공합니다."
        padding="7.5px 0 7.5px 6px"
      >
        <DashboardSelect items={options} selectedItems={selectedOptions} setSelectedItems={setSelectedOptions} />
      </SectionHeader>
    </Stack>
  )
}

export default Checkpoints
