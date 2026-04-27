import { Box, Collapse, Fade, Stack } from '@mui/material'
import { ReactNode, useState } from 'react'

import CloseIcon from '@/components/common/icons/CloseIcon'
import { getCookie, setCookie } from '@/utils/cookie'

interface ScenarioWorkbenchNoticeProps {
  noticeKey: string
  children: ReactNode
}

const COOKIE_PREFIX = 'dismissed-scenario-workbench-notice-'

const ScenarioWorkbenchNotice = ({ noticeKey, children }: ScenarioWorkbenchNoticeProps) => {
  const [dismissed, setDismissed] = useState(() => getCookie(`${COOKIE_PREFIX}${noticeKey}`) === '1')
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setCookie(`${COOKIE_PREFIX}${noticeKey}`, '1', 1)
      setDismissed(true)
    }, 300)
  }

  if (dismissed) return null

  return (
    <Collapse in={!isClosing} timeout={300} unmountOnExit>
      <Fade in={!isClosing} timeout={200}>
        <Box py="12px">
          <Stack direction="row" alignItems="center" bgcolor="gray.10" borderRadius="10px" px="12px" py="12px" gap="12px">
            <Box flex={1}>{children}</Box>
            <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={handleClose}>
              <CloseIcon />
            </Box>
          </Stack>
        </Box>
      </Fade>
    </Collapse>
  )
}

export default ScenarioWorkbenchNotice
