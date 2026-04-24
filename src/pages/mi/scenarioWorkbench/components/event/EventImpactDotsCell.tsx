import { Box, Stack } from '@mui/material'

import type { EventMarketImpactLevel } from './types'

interface EventImpactDotsCellProps {
  level: EventMarketImpactLevel
}

/** Figma MI/ Canvas/ Event/ Impact Analysis — 시장영향 3-dot 표현 */
const EventImpactDotsCell = ({ level }: EventImpactDotsCellProps) => (
  <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" height={22}>
    {([0, 1, 2] as const).map((i) => (
      <Box
        key={i}
        width={10}
        height={10}
        borderRadius="50%"
        bgcolor={i < level ? 'primary.main' : 'gray.40'}
      />
    ))}
  </Stack>
)

export default EventImpactDotsCell
