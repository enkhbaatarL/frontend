import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import FactorMapIcon from '@/assets/dashboard/factor-map.svg'
import tempFactorMapImg from '@/assets/dashboard/temp-factor-map.svg'
import MITopic from '@/components/common/topic/MITopic'
import DashboardCard from '@/pages/mi/dashboard/components/DashboardCard'
import UpdatedInfoChip from '@/pages/mi/dashboard/components/UpdatedInfoChip'

const topics = [
  {
    label: 'Aramid',
    value: 'aramid',
  },
  {
    label: 'Tire Cords',
    value: 'tire_cords',
  },
  {
    label: 'PET Film',
    value: 'pet_film',
  },
]

const FactorMap = () => {
  const [selectedTopic, setSelectedTopic] = useState(topics[0].value)

  return (
    <DashboardCard
      icon={FactorMapIcon}
      title="Factor Map"
      headerContent={
        <Stack direction="row" alignItems="center" gap={'8px'}>
          <UpdatedInfoChip label={'Last Week'} color={{ backgroundColor: '#FAEBE3', color: '#B74306' }} />
          <UpdatedInfoChip label={'Sep 8 - 15'} color={{ backgroundColor: '#F1F3F5', color: '#495057' }} />
        </Stack>
      }
      direction="column"
      gap="0px"
    >
      <MITopic topics={topics} selectedTopic={selectedTopic} onClick={(topic) => setSelectedTopic(topic.value)} />
      <Box padding="40px 6px 28px">
        <img src={tempFactorMapImg} alt="factor-map" draggable={false} />
      </Box>
      <Box py="24px" boxSizing="border-box" sx={{ userSelect: 'none' }}>
        <Stack
          direction="row"
          alignItems="start"
          borderRadius="10px"
          padding="12px 20px"
          boxSizing="border-box"
          bgcolor="#F1F3F5"
          gap="6px"
        >
          <InfoOutlinedIcon sx={{ fontSize: 16, color: '#868E96', paddingTop: '1px' }} />
          <Typography variant="subtext2" color="#868E96" flexGrow={1}>
            Factor Map은 AI가 분석한 시장 요인의 성격을 위치로, 관련성을 거리로, 영향도를 크기로, 가격 방향성을 색상으로 변환하여
            표현합니다. 이를 통해 복잡한 시장 동향을 한눈에 입체적으로 분석할 수 있습니다.
          </Typography>
        </Stack>
      </Box>
    </DashboardCard>
  )
}

export default FactorMap
