import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Collapse, Fade, Stack, Typography } from '@mui/material'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import Summarizing from '@/pages/mi/dashboard/components/common/Summarizing'

export interface AiSummaryData {
  title: string
  summary: string[] | AiNewsSummaryItem[]
}

export interface AiNewsSummaryItem {
  newsSummaryId: number
  title: string
  firstCreated: string
  dataRegistrationSerialNo: number
}

export interface AiNewsSummaryData {
  title: string
  summary: AiNewsSummaryItem[]
}

interface Props {
  fetchSummary: () => Promise<AiSummaryData | AiNewsSummaryData>
  viewOriginal?: () => void
  hasSimilarNews?: boolean
}

export interface AiSummaryHandle {
  toggle: () => void
  open: () => void
  close: () => void
  reset: () => void
}

const AiSummary = forwardRef<AiSummaryHandle, Props>(({ fetchSummary, viewOriginal, hasSimilarNews = false }, ref) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [aiData, setAiData] = useState<AiSummaryData | AiNewsSummaryData | null>(null)

  useEffect(() => {
    setAiData(null)
    setIsExpanded(false)
  }, [i18n.language])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchSummary()
      setAiData(data)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSummary = async () => {
    if (aiData) {
      setIsExpanded(!isExpanded)
    } else {
      setIsExpanded(true)
      await fetchData()
    }
  }

  const openSummary = async () => {
    setIsExpanded(true)
    if (aiData) {
      return
    }
    await fetchData()
  }

  const closeSummary = () => {
    setIsExpanded(false)
    setIsLoading(false)
  }

  const reset = () => {
    setIsExpanded(false)
    setIsLoading(false)
    setAiData(null)
  }

  useImperativeHandle(ref, () => ({
    toggle: toggleSummary,
    open: openSummary,
    close: closeSummary,
    reset,
  }))

  const handleNewsClick = (newsSummaryId: number) => {
    navigate(`/mi/market-news/${newsSummaryId}`)
  }

  const isNewsData = (_data: AiSummaryData | AiNewsSummaryData): _data is AiNewsSummaryData => hasSimilarNews

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
            <Fade in={!!aiData} timeout={800}>
              <Stack pt="10px" gap="6px">
                <Typography variant="body1B16" color="content.textNormal">
                  {aiData?.title}
                </Typography>
                <Stack pl="22px">
                  {/* 데이터 렌더링 분기 처리 */}
                  {aiData && isNewsData(aiData)
                    ? // hasSimilarNews === true: 뉴스 리스트 렌더링
                    aiData.summary.map((news, index) => (
                      <Box
                        key={index}
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
                        <Typography
                          variant="body1M16"
                          color="content.textNormal"
                          onClick={() => handleNewsClick(news.newsSummaryId)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {news.title}
                        </Typography>
                      </Box>
                    ))
                    : // hasSimilarNews === false: 일반 텍스트 리스트 렌더링
                    (aiData as AiSummaryData)?.summary.map((summary, index) => (
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
                        {summary as string}
                      </Typography>
                    ))}
                </Stack>

                <Stack direction="row" justifyContent="space-between" mt="14px" gap="12px">
                  <Stack justifyContent="center">
                    <Stack direction="row" alignItems="start" boxSizing="border-box" gap="4px">
                      <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Subtext' }} />
                      <Typography variant="subtext2" color="contentText.Subtext" letterSpacing={-0.1}>
                        {t('dashboard.feed.summary.aiDescription')}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* View Original 버튼은 hasSimilarNews가 false일 때만 노출 */}
                  {!hasSimilarNews && (
                    <MIButton
                      width="100%"
                      color="gray"
                      type="outlined"
                      contentType="text"
                      size="h28"
                      padding="5px 12px"
                      onClick={(e) => {
                        e.stopPropagation()
                        viewOriginal?.()
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        <Typography variant="subtext3" color="content.textNormal" letterSpacing={-0.1}>
                          View Original
                        </Typography>
                      </Box>
                    </MIButton>
                  )}
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
