import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'

import tempNewslettersContainerImg from '@/assets/dashboard/temp/newsletters-container.png'
import tempNewslettersContainerJaImg from '@/assets/dashboard/temp/newsletters-container_ja.png'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'

const Newsletters = () => {
  const { i18n } = useTranslation()

  return (
    <DashboardCard
      title="Newsletters"
      link="/mi/newsletters"
      sx={{
        overflow: 'visible',
      }}
      direction="column"
    >
      <Box pb="24px">
        <img
          src={i18n.language === 'ja' ? tempNewslettersContainerJaImg : tempNewslettersContainerImg}
          width="100%"
          alt="newsletters"
          draggable={false}
        />
      </Box>
    </DashboardCard>
  )
}

export default Newsletters
