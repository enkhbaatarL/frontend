import { Box, Tooltip, Typography } from '@mui/material'
import { Fragment, ReactNode } from 'react'

interface IDetailItemProps {
  title: string | ReactNode
  subTitle?: string | ReactNode
  fields: {
    label: string
    value: string | number
  }[]
  icon?: ReactNode
  onAction?: () => void
  tooltipMessage?: string
}

const DetailItem = (props: IDetailItemProps) => {
  const handleClick = () => {
    props.onAction?.()
  }

  return (
    <Box px={6} py={5} bgcolor={'gray.5'} borderBottom="1px solid" borderColor={'gray.30'} maxWidth={'100%'}>
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={20}>
        <Box>
          {typeof props.title === 'string' ? (
            <Typography variant="body1" color="gray.70">
              {props.title}
            </Typography>
          ) : (
            props.title
          )}
        </Box>
        <Box display={'flex'} alignItems={'center'}>
          {props.fields?.map((field, index) => (
            <Fragment key={`field-${index}`}>
              <Box px={3} display="flex" columnGap={1} alignItems={'center'} flexWrap={'wrap'}>
                <Typography variant="body3" color="gray.70" noWrap>
                  {field.label}
                </Typography>
                <Typography variant="body3R12" color="gray.60" noWrap>
                  {field.value}
                </Typography>
              </Box>
              {index < props.fields.length - 1 && <Box width="1px" height="12px" bgcolor="gray.7" />}
            </Fragment>
          ))}

          {props.icon &&
            (props.tooltipMessage ? (
              <Tooltip title={props.tooltipMessage}>
                <Box
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  bgcolor="common.white"
                  width={'28px'}
                  height={'28px'}
                  p={1}
                  color="gray.60"
                  border="1px solid"
                  borderColor={'gray.8'}
                  borderRadius={'6px'}
                  onClick={handleClick}
                  boxSizing={'border-box'}
                  sx={{ cursor: 'pointer' }}
                >
                  {props.icon}
                </Box>
              </Tooltip>
            ) : (
              <Box
                display={'flex'}
                alignItems={'center'}
                justifyContent={'center'}
                bgcolor="common.white"
                width={'28px'}
                height={'28px'}
                p={1}
                color="gray.60"
                border="1px solid"
                borderColor={'gray.8'}
                borderRadius={'6px'}
                onClick={handleClick}
                boxSizing={'border-box'}
                sx={{ cursor: 'pointer' }}
              >
                {props.icon}
              </Box>
            ))}
        </Box>
      </Box>
      <Box>{props.subTitle && <Box>{props.subTitle}</Box>}</Box>
    </Box>
  )
}

export default DetailItem
