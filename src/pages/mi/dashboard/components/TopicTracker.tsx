import { useNavigate } from 'react-router-dom'

import tempTopicTrackerContainerImg from '@/assets/dashboard/temp/topic-tracker-container.png'
import topicTrackerIcon from '@/assets/dashboard/topic-tracker.svg'
import MIButton from '@/components/common/button/MIButton'
import DashboardCard from '@/pages/mi/dashboard/components/DashboardCard'

const TopicTracker = () => {
  const navigate = useNavigate()

  return (
    <DashboardCard
      icon={topicTrackerIcon}
      title="Topic Tracker"
      headerContent={
        <MIButton
          size="h32"
          color="gray"
          type="outlined"
          onClick={() => {
            navigate('/mi/topic-tracker')
          }}
        >
          Topic Tracker
        </MIButton>
      }
      sx={{
        overflow: 'visible',
      }}
      direction="column"
      collapsedHeight={570}
    >
      <img src={tempTopicTrackerContainerImg} width="100%" alt="topic-tracker" draggable={false} />
    </DashboardCard>
  )
}

export default TopicTracker
