import { Box, Tooltip, Typography } from '@mui/material'

interface IDetailItemProps {
  title: string | React.ReactNode
  subTitle?: string | React.ReactNode
  fields: {
    label: string
    value: string | number
  }[]
  icon?: React.ReactNode
  onAction?: () => void
  tooltipMessage?: string
}

const DetailItem = (props: IDetailItemProps) => {
  const handleClick = () => {
    props.onAction?.()
  }

  return (
    <Box px={6} py={5} bgcolor={'gray.5'} borderBottom="1px solid" borderColor={'gray.30'} maxWidth={'100%'}>
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
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
            <>
              <Box key={field.label} px={3} display="flex" columnGap={1} alignItems={'center'}>
                <Typography variant="body3" color="gray.70">
                  {field.label}
                </Typography>
                <Typography variant="body3R12" color="gray.60">
                  {field.value}
                </Typography>
              </Box>
              {index < props.fields.length - 1 && <Box width="1px" height="12px" bgcolor="gray.7" />}
            </>
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
