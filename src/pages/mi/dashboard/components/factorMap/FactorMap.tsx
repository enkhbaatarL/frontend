import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Stack, Typography } from '@mui/material'
// import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import FactorMapIcon from '@/assets/dashboard/factor-map.svg'
import tempFactorMapImg from '@/assets/dashboard/temp/temp-factor-map.svg'
// import MITopic from '@/components/common/topic/MITopic'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'
import UpdatedInfoChip from '@/pages/mi/dashboard/components/common/UpdatedInfoChip'

// const topics = [
//   {
//     label: 'Aramid',
//     value: 'aramid',
//   },
//   {
//     label: 'Tire Cords',
//     value: 'tire_cords',
//   },
//   {
//     label: 'PET Film',
//     value: 'pet_film',
//   },
// ]

const FactorMap = () => {
  const { t } = useTranslation()

  // const [selectedTopic, setSelectedTopic] = useState(topics[0].value)

  return (
    <DashboardCard
      icon={FactorMapIcon}
      title="Factor Map"
      link="/mi/factor-map"
      headerContent={
        <Stack direction="row" alignItems="center" gap={'8px'}>
          <UpdatedInfoChip label={'Last Week'} color={{ backgroundColor: '#FAEBE3', color: '#B74306' }} />
          <UpdatedInfoChip label={'Sep 8 - 15'} color={{ backgroundColor: '#F1F3F5', color: '#495057' }} />
        </Stack>
      }
      direction="column"
      gap="0px"
    >
      {/*<MITopic topics={topics} selectedTopic={selectedTopic} onClick={(topic) => setSelectedTopic(topic.value)} />*/}
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
            {t('dashboard.factorMap.information')}
          </Typography>
        </Stack>
      </Box>
    </DashboardCard>
  )
}

export default FactorMap
