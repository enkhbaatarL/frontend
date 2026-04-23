import type { EventsClassificationFilterValue } from './types'

import MIToggleButton from '@/components/common/button/MIToggleButton'

interface EventsClassificationFilterProps {
  value: EventsClassificationFilterValue
  onChange: (value: EventsClassificationFilterValue) => void
}

const EventsClassificationFilter = ({ value, onChange }: EventsClassificationFilterProps) => (
  <MIToggleButton
    value={value}
    onChange={(_, newValue) => {
      if (newValue === 'all' || newValue === '신규' || newValue === '갱신') {
        onChange(newValue)
      }
    }}
    options={[
      { label: '전체', value: 'all' },
      { label: '신규', value: '신규' },
      { label: '갱신', value: '갱신' },
    ]}
  />
)

export default EventsClassificationFilter
