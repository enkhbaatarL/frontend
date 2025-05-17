import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'

import MISignalMap from '@/components/common/signal-map/MISignalMap'
import SampleChart from '@/components/mi/chart/SampleChart'
import ChartComponent from '@/pages/mi/dataVisualization/components/ChartComponent'

const UserChartSamplePage = () => {
  const [tab, setTab] = useState(0)

  return (
    <div className="p-14">
      Chart.js Test
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, tabId) => setTab(tabId)} aria-label="basic tabs example">
          <Tab label="Sample" />
          <Tab label="Detail" />
          <Tab label="Signal Map" />
        </Tabs>
      </Box>
      {tab === 0 && <SampleChart />}
      {tab === 1 && <ChartComponent />}
      {tab === 2 && (
        <Box height="600px" marginTop="6px">
          <MISignalMap
            data={Array.from({ length: 41 }, (_, i) => ({
              sector: `SECTOR_${i + 1}_이름이 길어지면 ... 처리가 됩니다`,
              change: Number((1 - i * 0.05).toFixed(2)),
            }))}
            useAnimation
          />
        </Box>
      )}
    </div>
  )
}

export default UserChartSamplePage
