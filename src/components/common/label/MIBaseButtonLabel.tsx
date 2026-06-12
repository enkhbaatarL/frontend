import { Stack, Typography, TypographyProps } from '@mui/material'
import { ReactNode } from 'react'

export interface MIBaseButtonLabelProps {
  prefix?: ReactNode
  children: ReactNode
  suffix?: ReactNode
  gap?: string | number
  color?: string
  variant?: TypographyProps['variant']
  textAlign?: TypographyProps['textAlign']
}

const MIBaseButtonLabel = ({
  prefix,
  children,
  suffix,
  gap = '8px',
  color,
  variant = 'body2SB14',
  textAlign = 'center',
}: MIBaseButtonLabelProps) => (
  <Stack direction="row" flex={1} minWidth={0} alignItems="center" justifyContent="space-between" gap="6px">
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
            justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
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
