import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Collapse, Fade, Stack, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import ShakeableLockIcon from '@/components/common/icons/ShakeableLockIcon'
import Summarizing from '@/pages/mi/dashboard/components/common/Summarizing'

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  25%, 75% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
`

export interface AiSummaryData {
  title: string
  summary: string[] | AiNewsSummaryItem[]
}

export interface AiNewsSummaryItem {
  newsSummaryId: number
  title: string
  firstCreated: string
  dataRegistrationSerialNo: number
  isViewable?: boolean
}

export interface AiNewsSummaryData {
  title: string
  summary: AiNewsSummaryItem[]
}

interface Props {
  fetchSummary: () => Promise<AiSummaryData | AiNewsSummaryData>
  viewOriginal?: () => void
  showSimilarNews?: boolean
  itemIsViewable?: boolean
}

export interface AiSummaryHandle {
  toggle: () => void
  open: () => void
  close: () => void
  reset: () => void
}

const AiSummary = forwardRef<AiSummaryHandle, Props>(({ fetchSummary, viewOriginal, showSimilarNews = false, itemIsViewable }, ref) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [aiData, setAiData] = useState<AiSummaryData | AiNewsSummaryData | null>(null)
  const [shakingTexts, setShakingTexts] = useState<Set<number>>(new Set())

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

  const handleNewsClick = (e: React.MouseEvent, newsSummaryId: number, isViewable?: boolean) => {
    e.stopPropagation() // FeedItem이 닫히지 않도록 이벤트 버블링 방지
    if (isViewable !== false) {
      navigate(`/mi/market-news/${newsSummaryId}`)
    } else {
      setShakingTexts((prev) => new Set(prev).add(newsSummaryId))
      setTimeout(() => {
        setShakingTexts((prev) => {
          const next = new Set(prev)
          next.delete(newsSummaryId)
          return next
        })
      }, 400)
    }
  }

  const isNewsData = (data: AiSummaryData | AiNewsSummaryData): data is AiNewsSummaryData => {
    if (!showSimilarNews) return false
    if (Array.isArray(data.summary) && data.summary.length > 0) {
      const firstItem = data.summary[0]
      return typeof firstItem === 'object' && firstItem !== null && 'newsSummaryId' in firstItem
    }
    return showSimilarNews && Array.isArray(data.summary)
  }

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
                {/* 데이터 렌더링 분기 처리 */}
                {aiData && isNewsData(aiData)
                  ? // showSimilarNews === true: 뉴스 리스트 렌더링
                  aiData.summary.length > 0 && (
                    <Stack pl="22px">
                      {aiData.summary.map((news, index) => (
                        <Box
                          key={index}
                          onClick={(e) => handleNewsClick(e, news.newsSummaryId, news.isViewable)}
                          sx={{
                            cursor: news.isViewable !== false ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'flex-start',
                            ml: '-14px',
                          }}
                        >
                          <Typography
                            component="span"
                            variant="body1M16"
                            color="gray.70"
                            sx={{
                              mr: '6px',
                              flexShrink: 0,
                            }}
                          >
                              •
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            gap="4px"
                            sx={{
                              width: '100%',
                              minWidth: 0,
                              animation: shakingTexts.has(news.newsSummaryId) ? `${shakeAnimation} 0.4s ease-in-out` : 'none',
                            }}
                          >
                            <Typography
                              component="span"
                              variant="body1M16"
                              color="content.textNormal"
                              sx={{
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {news.title}
                            </Typography>
                            {news.isViewable === false && <ShakeableLockIcon width={16} height={16} sx={{ animation: 'none' }} />}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )
                  : // showSimilarNews === false: 일반 텍스트 리스트 렌더링
                  (aiData as AiSummaryData)?.summary.length > 0 && (
                    <Stack pl="22px">
                      {(aiData as AiSummaryData).summary.map((summary, index) => (
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
                  )}

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
                  {!showSimilarNews && (
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
                      disabled={itemIsViewable === false}
                    >
                      <Box display="flex" alignItems="center">
                        <Typography
                          variant="subtext3"
                          color={itemIsViewable === false ? undefined : 'content.textNormal'}
                          letterSpacing={-0.1}
                        >
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
