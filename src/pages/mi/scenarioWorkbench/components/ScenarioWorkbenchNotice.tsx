import { Box, Collapse, Fade, Stack } from '@mui/material'
import { ReactNode, useState } from 'react'

import CloseIcon from '@/components/common/icons/CloseIcon'

interface ScenarioWorkbenchNoticeProps {
  noticeKey: string
  children: ReactNode
}

const STORAGE_KEY = 'disabled-scenario-workbench-notice'

const ScenarioWorkbenchNotice = ({ noticeKey, children }: ScenarioWorkbenchNoticeProps) => {
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')?.[noticeKey])
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'), [noticeKey]: true }))
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
