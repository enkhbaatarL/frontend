import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'

import SampleChart from '@/components/mi/chart/SampleChart'
import ChartComponent from '@/pages/mi/dataVisualization/components/ChartComponent'

const UserChartSamplePage = () => {
  const [tab, setTab] = useState(0)

  return (
    <div className="p-14">
      Chart.js Test
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, tabId) => setTab(tabId)} aria-label="basic tabs example">
          <Tab label="Item 1" />
          <Tab label="Item 2" />
        </Tabs>
      </Box>
      {tab === 0 && <SampleChart />}
      {tab === 1 && <ChartComponent />}
    </div>
  )
}

export default UserChartSamplePage
