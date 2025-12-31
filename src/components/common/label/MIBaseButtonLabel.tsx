import { Stack, Typography, TypographyProps } from '@mui/material'
import { ReactNode } from 'react'

export interface MIBaseButtonLabelProps {
  prefix?: ReactNode
  children: ReactNode
  suffix?: ReactNode
  gap?: string | number
  color?: string
  variant?: TypographyProps['variant']
}

const MIBaseButtonLabel = ({ prefix, children, suffix, gap = '8px', color, variant = 'body2SB14' }: MIBaseButtonLabelProps) => (
  <Stack direction="row" flex={1} alignItems="center" justifyContent="space-between" gap="6px">
    {!prefix && children === '' ? null : (
      <Stack direction="row" alignItems="center" gap={gap}>
        {prefix}
        <Typography
          variant={variant}
          color={color}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </Typography>
      </Stack>
    )}
    {suffix}
  </Stack>
)

export default MIBaseButtonLabel
