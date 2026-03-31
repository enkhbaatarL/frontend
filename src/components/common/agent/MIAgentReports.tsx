import { CircularProgress, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Source } from '@/utils/agentMarkdownExtractor'

import style from '@/components/common/agent/MIAgentAnswer.module.scss'

interface Props {
  reports: Source[]
  isNew?: boolean
}

const MAX_REPORTS_COUNT = 3

const MIAgentReports = ({ reports, isNew }: Props) => {
  const { t } = useTranslation()
  const [isShowMore, setIsShowMore] = useState<boolean>(reports.length <= MAX_REPORTS_COUNT)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const reportsList = useMemo(() => (isShowMore ? reports : reports.slice(0, MAX_REPORTS_COUNT)), [isShowMore, reports])

  const handleLoadMore = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsShowMore(true)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Stack py="12px" className={isNew ? style.parsedDataContainer : undefined}>
      <Typography variant="contentTitle" color="content.textBlack" py="8px">
        {t('mari.agent.reports')}
      </Typography>
      <Stack mt="12px" gap="10px">
        <Stack gap="6px">
          {reportsList.map((report, index) => {
            const isNewlyShown = isShowMore && index >= MAX_REPORTS_COUNT
            const shouldAnimate = isNew || isNewlyShown

            let animationDelay = '0ms'
            if (shouldAnimate) {
              if (isNewlyShown) {
                animationDelay = `${(index - MAX_REPORTS_COUNT) * 100}ms`
              } else {
                animationDelay = `${index * 100}ms`
              }
            }

            return (
              <Stack
                key={report.index}
                direction="row"
                width="fit-content"
                padding="6px 8px"
                borderRadius="4px"
                border="1px solid"
                borderColor="contentBorder.Normal"
                gap="6px"
                boxSizing="border-box"
                className={shouldAnimate ? style.parsedDataItem : undefined}
                sx={{
                  animationDelay,
                  backgroundColor: 'mari.MariBG',
                  '&:hover': {
                    cursor: 'pointer',
                    borderColor: 'contentBorder.Active',
                    backgroundColor: 'contentBG.Hover',
                  },
                  userSelect: 'none',
                }}
                onClick={() => {
                  window.open(report.url, '_blank')
                }}
              >
                <Typography variant="subtext" color="content.textBlack">
                  {report.sourceNm}
                </Typography>
              </Stack>
            )
          })}
        </Stack>
      </Stack>
      {!isShowMore && (
        <Stack mt="12px" direction="row" alignItems="center" gap="8px" sx={{ userSelect: 'none' }}>
          {isLoading ? (
            <CircularProgress size={16} sx={{ color: 'gray.70' }} />
          ) : (
            <Typography
              variant="body2M14"
              color="gray.70"
              onClick={handleLoadMore}
              sx={{
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                '&:hover': {
                  color: isLoading ? 'gray.70' : 'gray.90',
                  textDecoration: isLoading ? 'none' : 'underline',
                },
              }}
            >
              Show more
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default MIAgentReports
