import { Box, Tooltip, Typography, TypographyProps } from '@mui/material'
import { PropsWithChildren, ReactElement } from 'react'

import InfoOutlineIcon from '../icons/InfoOutlineIcon'

export interface MIFieldProps {
  label?: string
  labelStyle?: TypographyProps
  spacingAfterLabel?: number
  required?: boolean
  subText?: string | ReactElement
  helper?: string
  helperStyle?: TypographyProps
  title?: string
  labelSize?: 'sm' | 'lg'
}

const MILabel = (props: {
  labelSize?: 'sm' | 'lg'
  required?: boolean
  title?: string
  subText?: string | ReactElement
  label?: string
}) => {
  const { labelSize, required, title, subText, label } = props

  const size = labelSize || 'sm'
  const spacingBottom = size === 'sm' ? 6 : 12
  const fontWeight = size === 'sm' ? 500 : 900
  const labelVariant: TypographyProps['variant'] = size === 'sm' ? 'labelText' : 'sectionTitle'
  const labelColor = size === 'sm' ? 'gray.70' : 'gray.90'
  const wordGap = size === 'sm' ? 2 : 4

  return (
    <Box mb={`${spacingBottom}px`}>
      <Box display={'flex'} alignItems={'center'} columnGap={`${wordGap}px`}>
        {label && (
          <Typography variant={labelVariant} component={'div'} color={labelColor}>
            {label}
          </Typography>
        )}

        {required && (
          <Typography
            component={'div'}
            variant={labelVariant}
            fontWeight={fontWeight}
            fontSize={'12px'}
            lineHeight={'12px'}
            alignSelf={'flex-start'}
            color="point.red1"
          >
            *
          </Typography>
        )}
        {title && (
          <Typography component={'div'} color="gray.60" sx={{ cursor: 'pointer' }}>
            <Tooltip title={title} placement="bottom-start">
              <InfoOutlineIcon display={'block'} width={'12px'} height={'12px'} />
            </Tooltip>
          </Typography>
        )}
      </Box>
      {subText && (
        <Typography component={'p'} variant="subtext2" color="gray.60" mt="4px">
          {subText}
        </Typography>
      )}
    </Box>
  )
}

export default function MIField(props: PropsWithChildren<MIFieldProps>) {
  const { children, label, title, helper, subText, required, helperStyle, labelSize } = props

  return (
    <Box>
      {(label || subText) && <MILabel label={label} subText={subText} title={title} required={required} labelSize={labelSize} />}

      <Box>{children}</Box>
      {helper && (
        <Typography component={'div'} display={'inline-block'} mt={'4px'} variant="subtext2" color="gray.60" {...helperStyle}>
          {helper}
        </Typography>
      )}
    </Box>
  )
}
