import { Box, Stack } from '@mui/material'

import type { EventsClassificationFilterValue } from '@/pages/mi/scenarioWorkbench/components/event/types'

/** 전체·신규·갱신 세그먼트 (공통 MIToggleButton 대신 로컬 스타일) */
interface EventsClassificationFilterProps {
  value: EventsClassificationFilterValue
  onChange: (value: EventsClassificationFilterValue) => void
}

const SEGMENT_KEYS = [
  { value: 'all' as const, label: '전체' },
  { value: '신규' as const, label: '신규' },
  { value: '갱신' as const, label: '갱신' },
]

const EventsClassificationFilter = ({ value, onChange }: EventsClassificationFilterProps) => (
  <Stack
    direction="row"
    alignItems="center"
    gap={0.5}
    sx={{
      flexShrink: 0,
      bgcolor: 'gray.20',
      p: 0.5,
      borderRadius: '6px',
    }}
  >
    {SEGMENT_KEYS.map(({ value: v, label }) => {
      const selected = value === v
      return (
        <Box
          key={v}
          component="button"
          type="button"
          onClick={() => onChange(v)}
          sx={{
            height: 28,
            px: 0.75,
            py: 0.5,
            borderRadius: '6px',
            border: selected ? '0.5px solid' : '0.5px solid transparent',
            borderColor: selected ? 'contentBorder.Normal' : 'transparent',
            bgcolor: selected ? 'common.white' : 'transparent',
            color: selected ? 'contentText.Black' : 'contentText.Subtext',
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.4,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Box>
      )
    })}
  </Stack>
)

export default EventsClassificationFilter
