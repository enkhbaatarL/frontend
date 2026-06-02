import { Box, Skeleton } from '@mui/material'

import KpiCard from '@/pages/mi/nextGenMI/components/common/KpiCard'
import { IScenarioAssumption } from '@/service/mi/nextGenMI/scenario'

interface ScenarioKeyPredictionsSectionProps {
  assumptions: IScenarioAssumption[]
  loading?: boolean
}

const SKELETON_KPI_COUNT = 3

const ScenarioKeyPredictionsSection = ({ assumptions, loading = false }: ScenarioKeyPredictionsSectionProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
    }}
  >
    {loading
      ? Array.from({ length: SKELETON_KPI_COUNT }).map((_, index) => (
        <Box key={`skeleton-${index}`}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: '10px' }} />
        </Box>
      ))
      : assumptions.map((a, index) => (
        <Box key={index}>
          <KpiCard title={a.label} content={a.value} description="" />
        </Box>
      ))}
  </Box>
)

export default ScenarioKeyPredictionsSection
