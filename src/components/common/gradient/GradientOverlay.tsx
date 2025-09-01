import { Box } from '@mui/material'

type Target = 'top' | 'bottom'

interface GradientOverlayProps {
  targetList?: Target[]
  color?: string
  topOffset?: number
  bottomOffset?: number
}

const hexToRgbObj = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  return { r, g, b }
}

/**
 * position: relative 속성의 부모 필요
 * @param color
 * @constructor
 */
const GradientOverlay = ({ targetList, color, topOffset, bottomOffset }: GradientOverlayProps) => {
  const { r, g, b } = color ? hexToRgbObj(color) : { r: 255, g: 255, b: 255 }

  return (targetList ?? ['top', 'bottom']).map((side) => (
    <Box
      key={side}
      sx={{
        position: 'absolute',
        left: '22px',
        right: '22px',
        top: side === 'top' ? (topOffset ?? 0) : undefined,
        bottom: side === 'bottom' ? (bottomOffset ?? 0) : undefined,
        height: '12px',
        pointerEvents: 'none',
        background: `linear-gradient(
                to ${side},
                rgba(${r}, ${g}, ${b}, 0) 0%,
                rgba(${r}, ${g}, ${b}, 0.7) 40%,
                rgba(${r}, ${g}, ${b}, 1) 100%
              )`,
        zIndex: 1,
      }}
    />
  ))
}

export default GradientOverlay
