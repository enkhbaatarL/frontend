import { useNavigate } from 'react-router-dom'

import newsFeedIcon from '@/assets/dashboard/news-feed.svg'
import MIButton from '@/components/common/button/MIButton'
import DashboardCard from '@/pages/mi/dashboard/components/DashboardCard'
import Timeline from '@/pages/mi/dashboard/components/Timeline'

const NewsFeed = () => {
  const navigate = useNavigate()

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
    >
      <Timeline />
    </DashboardCard>
  )
}

export default NewsFeed
