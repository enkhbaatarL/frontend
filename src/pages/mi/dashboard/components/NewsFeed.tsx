import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import newsFeedIcon from '@/assets/dashboard/news-feed.svg'
import tempFeedImg from '@/assets/dashboard/temp/feed.png'
import tempFeedJaImg from '@/assets/dashboard/temp/feed_ja.png'
import MIButton from '@/components/common/button/MIButton'
import DashboardCard from '@/pages/mi/dashboard/components/DashboardCard'
import Timeline from '@/pages/mi/dashboard/components/Timeline'

const NewsFeed = () => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  return (
    <DashboardCard
      icon={newsFeedIcon}
      title="News Feed"
      headerContent={
        <MIButton
          size="h32"
          color="gray"
          type="outlined"
          onClick={() => {
            navigate('/mi/news-list')
          }}
        >
          Market News
        </MIButton>
      }
      sx={{
        overflow: 'visible',
      }}
      direction="column"
    >
      <Timeline my="12px" />
      <Box pb="12px">
        <img src={i18n.language === 'ja' ? tempFeedJaImg : tempFeedImg} width={692} alt="feed" draggable={false} />
      </Box>
    </DashboardCard>
  )
}

export default NewsFeed
