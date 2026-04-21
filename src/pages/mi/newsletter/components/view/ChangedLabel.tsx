import { Typography } from '@mui/material'
import { useId, ReactNode } from 'react'

import { getChangeTypeFromDiffHtml } from '@/pages/mi/newsletter/utils/getChangeTypeFromDiffHtml'

const CHANGE_LABEL_STYLES = {
  added: {
    label: '추가됨',
    bgcolor: '#E8F7EE',
    textColor: '#1f8a4c',
    strikethrough: false,
  },
  deleted: {
    label: '삭제됨',
    bgcolor: '#FDECEC',
    textColor: '#d64545',
    strikethrough: false,
  },
  modified: {
    label: '수정됨',
    bgcolor: '#FFF6E5',
    textColor: '#b26a00',
    strikethrough: false,
  },
  reordered: {
    label: '변경됨',
    bgcolor: '#EEF3FF',
    textColor: '#3451b2',
    strikethrough: false,
  },
} as const

export type ChangedLabelProps = {
  diffHtmls?: (string | undefined)[]
  /** diff HTML 없이 고정 라벨 */
  labelKind?: 'added' | 'modified' | 'reordered' | 'deleted'
  top?: number | string
}

const LABEL_PATH =
  'M0,0.167 C0,0.075 0.028,0 0.063,0 L0.777,0 C0.793,0 0.808,0.016 0.82,0.046 L0.976,0.439 C0.989,0.472 0.989,0.528 0.976,0.56 L0.827,0.954 C0.808,0.984 0.793,1 0.777,1 L0.063,1 C0.028,1 0,0.925 0,0.833 L0,0.167 Z'

const LabelShapeBox = ({
  children,
  bgcolor,
  textColor,
  clipPathId,
}: {
  children: ReactNode
  bgcolor: string
  textColor: string
  clipPathId: string
}) => (
  <>
    <svg width={0} height={0} aria-hidden>
      <defs>
        <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
          <path d={LABEL_PATH} />
        </clipPath>
      </defs>
    </svg>
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 20px 5px 12px',
        backgroundColor: bgcolor,
        color: textColor,
        clipPath: `url(#${clipPathId})`,
        WebkitClipPath: `url(#${clipPathId})`,
      }}
    >
      {children}
    </div>
  </>
)

/**
 * 추가: "추가됨"
 * 삭제: "삭제됨"
 * 추가+삭제: "수정됨"
 */
const ChangedLabel = ({ diffHtmls = [], labelKind, top = 0 }: ChangedLabelProps) => {
  const clipPathId = useId()
  const changeType = labelKind ?? getChangeTypeFromDiffHtml(...diffHtmls)
  const style = CHANGE_LABEL_STYLES[changeType]

  return (
    <div style={{ position: 'absolute', top, left: 0, width: 0, overflow: 'visible' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 16,
          whiteSpace: 'nowrap',
        }}
      >
        <LabelShapeBox clipPathId={clipPathId} bgcolor={style.bgcolor} textColor={style.textColor}>
          <Typography
            variant="body3"
            sx={{
              fontSize: 14,
              color: style.textColor,
              textDecoration: style.strikethrough ? 'line-through' : 'none',
              fontWeight: 500,
            }}
          >
            {style.label}
          </Typography>
        </LabelShapeBox>
      </div>
    </div>
  )
}

export default ChangedLabel
