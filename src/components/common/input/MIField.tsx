import { Box, Typography } from '@mui/material'
import { PropsWithChildren, ReactElement } from 'react'

export interface MIFieldProps {
  label?: string
  required?: boolean
  labelIcon?: ReactElement
  subText?: string
  helper?: string
}

const MIField = (props: PropsWithChildren<MIFieldProps>) => {
  const { children, label, labelIcon, helper, subText, required } = props

  return (
    <Box>
      {(label || subText) && (
        <Box mb={'12px'}>
          {label && (
            <Box display={'flex'} alignItems={'center'}>
              <Typography variant="fieldLabel" component={'div'} color="gray.70">
                {label}
                {required && (
                  <Typography component={'div'} display={'inline-block'} variant="asterisk" color="point.red1" ml={'2px'}>
                    *
                  </Typography>
                )}
              </Typography>
              {labelIcon && (
                <Typography
                  width={'12px'}
                  height={'12px'}
                  component={'div'}
                  display={'inline-block'}
                  color="gray.60"
                  ml={'2px'}
                  sx={{
                    svg: {
                      display: 'block',
                    },
                  }}
                >
                  {labelIcon}
                </Typography>
              )}
            </Box>
          )}
          {subText && (
            <Typography variant="subtext2" color="gray.60" mt="4px">
              {subText}
            </Typography>
          )}
        </Box>
      )}

      <Box>{children}</Box>
      {helper && (
        <Typography component={'div'} display={'inline-block'} mt={'4px'} variant="subtext2" color="gray.60">
          {helper}
        </Typography>
      )}
    </Box>
  )
}

export default MIField
