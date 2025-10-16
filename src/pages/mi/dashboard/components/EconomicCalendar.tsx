import { useNavigate } from 'react-router-dom'

import economicCalendarIcon from '@/assets/dashboard/economic-calendar.svg'
import tempEconomicCalenderContainerImg from '@/assets/dashboard/temp/economic-calendar-container.png'
import MIButton from '@/components/common/button/MIButton'
import DashboardCard from '@/pages/mi/dashboard/components/DashboardCard'

const EconomicCalendar = () => {
  const navigate = useNavigate()

  return (
    <DashboardCard
      icon={economicCalendarIcon}
      title="Economic Calendar"
      headerContent={
        <MIButton
          size="h32"
          color="gray"
          type="outlined"
          onClick={() => {
            navigate('/mi/economic-event')
          }}
        >
          Economic Calendar
        </MIButton>
      }
      sx={{
        overflow: 'visible',
      }}
      direction="column"
      collapsedHeight={660}
    >
      <img src={tempEconomicCalenderContainerImg} width="100%" alt="economic-calender" draggable={false} />
    </DashboardCard>
  )
}

export default EconomicCalendar
