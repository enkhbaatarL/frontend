import { Box, BoxProps } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { forwardRef, useImperativeHandle, useState } from 'react'

import LockOutlinedIcon from './LockOutlinedIcon'

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  25%, 75% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
`

export interface ShakeableLockIconHandle {
  shake: () => void
}

interface ShakeableLockIconProps extends BoxProps {
  width?: number
  height?: number
}

const ShakeableLockIcon = forwardRef<ShakeableLockIconHandle, ShakeableLockIconProps>(({ width = 16, height = 16, sx, ...props }, ref) => {
  const [isShaking, setIsShaking] = useState(false)

  useImperativeHandle(ref, () => ({
    shake: () => {
      setIsShaking(true)
      setTimeout(() => {
        setIsShaking(false)
      }, 400)
    },
  }))

  return (
    <Box
      component="span"
      sx={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        color: 'gray.60',
        animation: isShaking ? `${shakeAnimation} 0.4s ease-in-out` : 'none',
        ...sx,
      }}
      {...props}
    >
      <LockOutlinedIcon width={width} height={height} style={{ marginBottom: '2px' }} />
    </Box>
  )
})

ShakeableLockIcon.displayName = 'ShakeableLockIcon'

export default ShakeableLockIcon
