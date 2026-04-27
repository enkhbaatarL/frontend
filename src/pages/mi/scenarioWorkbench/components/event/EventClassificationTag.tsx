import { Chip } from '@mui/material'

import type { EventClassification } from './types'

/** Figma MI/ Events/ Table Row — 구분(신규·갱신·종료) 칩 토큰 */
const CLASSIFICATION_SX = {
  신규: {
    height: 'auto',
    minHeight: 28,
    px: 1,
    py: 0.5,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.4,
    backgroundColor: '#ECEDF4',
    color: '#364FC7',
    border: 'none',
    borderRadius: '8px',
  },
  갱신: {
    height: 'auto',
    minHeight: 28,
    px: 1,
    py: 0.5,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.4,
    backgroundColor: '#E8F4FD',
    color: '#1864AB',
    border: 'none',
    borderRadius: '8px',
  },
  종료: {
    height: 'auto',
    minHeight: 28,
    px: 1,
    py: 0.5,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.4,
    backgroundColor: '#F1F3F5',
    color: '#868E96',
    border: 'none',
    borderRadius: '8px',
  },
} as const

/** 이벤트 목록 구분 칩 (피그마 MI/ Events/ Table/ Row/EventStatus) */
interface EventClassificationTagProps {
  classification: EventClassification
}

const EventClassificationTag = ({ classification }: EventClassificationTagProps) => (
  <Chip label={classification} size="small" sx={{ ...CLASSIFICATION_SX[classification] }} />
)

export default EventClassificationTag
