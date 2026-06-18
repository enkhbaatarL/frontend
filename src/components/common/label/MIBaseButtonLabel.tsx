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
}: MIBaseButtonLabelProps) => {
  const isTextChild = typeof children === 'string' || typeof children === 'number'

  return (
    <Stack direction="row" flex={1} minWidth={0} alignItems="center" justifyContent="space-between" gap="6px" overflow="hidden">
      {!prefix && children === '' ? null : (
        <Stack direction="row" alignItems="center" gap={gap} flex={1} minWidth={0} overflow="hidden">
          {prefix}
          {isTextChild ? (
            <Typography
              component="span"
              variant={variant}
              color={color}
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                maxWidth: '100%',
                display: 'block',
                textAlign,
              }}
            >
              {children}
            </Typography>
          ) : (
            <Stack
              component="span"
              direction="row"
              flex={1}
              minWidth={0}
              alignItems="center"
              justifyContent={textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'}
              overflow="hidden"
              sx={{
                '& svg': {
                  display: 'block',
                },
              }}
            >
              {children}
            </Stack>
          )}
        </Stack>
      )}
      {suffix}
    </Stack>
  )
}

export default MIBaseButtonLabel
