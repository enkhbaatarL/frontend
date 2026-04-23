import { Chip } from '@mui/material'

import type { EventClassification } from './types'

const CLASSIFICATION_SX = {
  신규: {
    height: 24,
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#E7F1FF',
    color: '#0D6EFD',
    border: 'none',
  },
  갱신: {
    height: 24,
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#EDE7F6',
    color: '#6F42C1',
    border: 'none',
  },
} as const

interface EventClassificationTagProps {
  classification: EventClassification
}

const EventClassificationTag = ({ classification }: EventClassificationTagProps) => (
  <Chip label={classification} size="small" sx={{ borderRadius: '999px', ...CLASSIFICATION_SX[classification] }} />
)

export default EventClassificationTag
