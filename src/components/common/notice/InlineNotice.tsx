import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Collapse, Fade, Stack, Typography } from '@mui/material'
import { ReactNode, useState } from 'react'

import CloseIcon from '@/components/common/icons/CloseIcon'

interface InlineNoticeProps {
  noticeKey: string
  children: ReactNode
  showCloseButton?: boolean
}

const InlineNotice = ({ noticeKey, children, showCloseButton = true }: InlineNoticeProps) => {
  const [disabled, setDisabled] = useState(JSON.parse(localStorage.getItem('disabled-inline-notice') ?? '{}')?.[noticeKey])
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      localStorage.setItem(
        'disabled-inline-notice',
        JSON.stringify({ ...JSON.parse(localStorage.getItem('disabled-inline-notice') ?? '{}'), [noticeKey]: true }),
      )
      setDisabled(true)
    }, 300)
  }

  if (disabled) return null

  return (
    <Collapse in={!isClosing} timeout={300} unmountOnExit>
      <Fade in={!isClosing} timeout={200}>
        <Box padding="6px 12px" boxSizing="border-box" sx={{ userSelect: 'none' }}>
          <Stack
            direction="row"
            alignItems="start"
            borderRadius="10px"
            minHeight="38px"
            padding="8px 12px"
            boxSizing="border-box"
            bgcolor="#E8F4FF"
            gap="6px"
          >
            <InfoOutlinedIcon sx={{ fontSize: 20, color: '#364FC7' }} />
            <Typography variant="body2" color="#364FC7" flexGrow={1}>
              {children}
            </Typography>
            {showCloseButton && <CloseIcon onClick={handleClose} style={{ cursor: 'pointer' }} />}
          </Stack>
        </Box>
      </Fade>
    </Collapse>
  )
}

export default InlineNotice
