import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Collapse, Fade, Stack, Typography } from '@mui/material'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MIButton from '@/components/common/button/MIButton'
import Summarizing from '@/pages/mi/dashboard/components/common/Summarizing'

export interface AiSummaryData {
  title: string
  summary: string[]
}

interface Props {
  fetchSummary: () => Promise<AiSummaryData>
  viewOriginal?: () => void
}

export interface AiSummaryHandle {
  toggle: () => void
  open: () => void
  close: () => void
  reset: () => void
}

const AiSummary = forwardRef<AiSummaryHandle, Props>(({ fetchSummary, viewOriginal }, ref) => {
  const { t, i18n } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState<AiSummaryData | null>(null)

  useEffect(() => {
    setAiSummary(null)
    setIsExpanded(false)
  }, [i18n.language])

  const toggleSummary = async () => {
    if (aiSummary) {
      setIsExpanded(!isExpanded)
    } else {
      setIsExpanded(true)
      setIsLoading(true)
      try {
        const data = await fetchSummary()
        setAiSummary(data)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const openSummary = async () => {
    setIsExpanded(true)

    if (aiSummary) {
      return
    }

    setIsLoading(true)
    try {
      const data = await fetchSummary()
      setAiSummary(data)
    } finally {
      setIsLoading(false)
    }
  }

  const closeSummary = () => {
    setIsExpanded(false)
    setIsLoading(false)
  }

  const reset = () => {
    setIsExpanded(false)
    setIsLoading(false)
    setAiSummary(null)
  }

  useImperativeHandle(ref, () => ({
    toggle: toggleSummary,
    open: openSummary,
    close: closeSummary,
    reset,
  }))

  return (
    <Collapse
      in={isExpanded}
      timeout={300}
      sx={{
        '& .MuiCollapse-wrapper': {
          transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        },
      }}
    >
      <Box>
        {isLoading ? (
          <Box pr="24px">
            <Summarizing />
          </Box>
        ) : (
          <Box>
            <Fade in={!!aiSummary} timeout={800}>
              <Stack pt="10px" gap="6px">
                <Typography variant="body1B16" color="content.textNormal">
                  {aiSummary?.title}
                </Typography>
                <Stack pl="22px">
                  {aiSummary?.summary.map((summary, index) => (
                    <Typography
                      key={index}
                      variant="body1M16"
                      color="content.textNormal"
                      lineHeight={1.4}
                      sx={{
                        textIndent: '-14px',
                        '&::before': {
                          content: '"•"',
                          marginRight: '6px',
                          color: 'gray.70',
                        },
                      }}
                    >
                      {summary}
                    </Typography>
                  ))}
                </Stack>
                <Stack direction="row" justifyContent="space-between" mt="14px" gap="18px">
                  <Stack justifyContent="center">
                    <Stack direction="row" alignItems="start" boxSizing="border-box" gap="4px">
                      <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Subtext' }} />
                      <Typography variant="subtext2" color="contentText.Subtext">
                        {t('dashboard.feed.summary.aiDescription')}
                      </Typography>
                    </Stack>
                  </Stack>
                  <MIButton
                    width="100%"
                    color="gray"
                    type="outlined"
                    contentType="text"
                    size="h28"
                    onClick={(e) => {
                      e.stopPropagation()
                      viewOriginal?.()
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtext3" color="content.textNormal">
                        View Original
                      </Typography>
                    </Box>
                  </MIButton>
                </Stack>
              </Stack>
            </Fade>
          </Box>
        )}
      </Box>
    </Collapse>
  )
})

AiSummary.displayName = 'AiSummary'

export default AiSummary
