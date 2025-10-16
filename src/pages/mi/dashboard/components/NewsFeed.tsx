import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import newsFeedIcon from '@/assets/dashboard/news-feed.svg'
import MIButton from '@/components/common/button/MIButton'
import DashboardCard, { DashboardCardRef } from '@/pages/mi/dashboard/components/DashboardCard'
import Feed from '@/pages/mi/dashboard/components/Feed'
import Timeline from '@/pages/mi/dashboard/components/Timeline'

const NewsFeed = () => {
  const navigate = useNavigate()
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const dashboardCardRef = useRef<DashboardCardRef>(null)

  const handleItemClick = async (id: string) => {
    setSelectedItemId(null)
    // DashboardCard가 펼쳐질 때까지 기다린 후 스크롤 시작
    await dashboardCardRef.current?.expand()
    setSelectedItemId(id)
  }

  return (
    <DashboardCard
      ref={dashboardCardRef}
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
      collapsedHeight={1300}
    >
      <Timeline my="12px" onItemClick={handleItemClick} />
      <Feed selectedItemId={selectedItemId} onItemHighlighted={() => setSelectedItemId(null)} />
    </DashboardCard>
  )
}

export default NewsFeed
