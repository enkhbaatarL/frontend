import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import aiStarIcon from '@/assets/ai.svg'
import MIButton from '@/components/common/button/MIButton.tsx'
import MIButtonViewMore from '@/components/common/button/MIButtonViewMore.tsx'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon.tsx'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import forecastDataService, { IForecastSummary } from '@/service/mi/forecast.ts'
import { downloadFile } from '@/utils/file.ts'
import { markdownRemarkPlugins } from '@/utils/markdown'

interface MISummaryDownloadReportProps {
  companyNo: number | undefined
  monthSelect: string
}

const MISummaryDownloadReport = ({ companyNo, monthSelect }: MISummaryDownloadReportProps) => {
  const [showMore, setShowMore] = useState(false)
  const [shouldShowButton, setShouldShowButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const { i18n } = useTranslation()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboardSummary', monthSelect],
    queryFn: () => forecastDataService.getForecastSummary(companyNo ?? 0, monthSelect.split('-').join('')),
    enabled: !!companyNo && !!monthSelect,
  })

  const shouldShowLoading = !companyNo || !monthSelect || isLoading || isFetching
  const hasNoData = !shouldShowLoading && (!data?.summaries || data.summaries.length === 0)

  const summaryContent =
    !data?.summaries || data.summaries.length === 0
      ? null
      : data.summaries.map((summary: IForecastSummary, index: number) => (
        <Box key={index} mt={index !== 0 ? '20px' : 0}>
          <Typography mb={1.5} variant={'subtext5'} color={'content.textNormal'} component={'div'}>
            {summary.explanatoryTitleContent}
          </Typography>
          <Typography variant={'body2R14'} color={'content.textNormal'} component={'div'}>
            <ReactMarkdown remarkPlugins={markdownRemarkPlugins} rehypePlugins={[rehypeRaw]}>
              {(summary.explanatorySummaryContent ?? '').replaceAll('\\n', '\n')}
            </ReactMarkdown>
          </Typography>
        </Box>
      ))

  // useEffect에서 summaryContent를 의존성에 추가
  useEffect(() => {
    if (!contentRef.current || !summaryContent || shouldShowLoading) {
      return undefined
    }

    const element = contentRef.current

    // 올바른 overflow 감지 방법 (항상 4줄 제한 상태에서 측정)
    const checkOverflow = () => {
      // 현재 상태 저장
      const currentWebkitLineClamp = element.style.webkitLineClamp
      const currentDisplay = element.style.display
      const currentWebkitBoxOrient = element.style.webkitBoxOrient

      // 강제로 4줄 제한 상태로 설정
      element.style.webkitLineClamp = '8'
      element.style.display = '-webkit-box'
      element.style.webkitBoxOrient = 'vertical'

      const clientHeight = element.clientHeight
      const scrollHeight = element.scrollHeight

      // 원래 상태로 복원
      element.style.webkitLineClamp = currentWebkitLineClamp
      element.style.display = currentDisplay
      element.style.webkitBoxOrient = currentWebkitBoxOrient

      // scrollHeight가 clientHeight보다 크면 내용이 잘린 것
      setShouldShowButton(scrollHeight > clientHeight)
    }

    // 약간의 지연을 주어 DOM이 완전히 렌더링된 후 측정
    const timeoutId = setTimeout(checkOverflow, 50)

    // ResizeObserver로 크기 변화 감지
    const resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(element)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [summaryContent, shouldShowLoading]) // showMore는 의존성에서 제외

  const handleDownload = async () => {
    try {
      // TODO: 시연 후 제거 필요
      // 일본어일 때 특정 PDF 파일 다운로드
      if (i18n.language === 'ja') {
        const response = await fetch('/temp/DubaiCrudeReport.pdf')
        if (response.ok) {
          const blob = await response.blob()
          downloadFile(blob, 'DubaiCrudeReport.pdf')
        }
        return
      }

      const response = await forecastDataService.getForecastSummaryFileDownload(companyNo ?? 0, monthSelect.split('-').join(''))

      const cd = response.headers?.['content-disposition'] ?? ''

      if (cd.includes('.zip')) {
        const fileName = `Report_${monthSelect.split('-').join('')}.zip`
        downloadFile(response.data, fileName)
      } else {
        // prettier-ignore
        const fileName = cd.split('\'\'').pop().trim()
        downloadFile(response.data, fileName)
      }
    } catch {
      return
    }
  }

  if (hasNoData) {
    return <Box height="24px" />
  }

  return (
    <MISkeleton variant={'dashboardSummary'} loading={shouldShowLoading}>
      <Box
        borderRadius={'6px'}
        sx={{
          background: `
            linear-gradient(135deg, #364FC7 0%, #2F80ED 25%, #364FC7 75%, #29487B 100%),
            linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 30%, #FCFEFF 70%, #E9F6FC 100%)
          `,
          backgroundClip: 'padding-box, content-box',
          backgroundOrigin: 'border-box, content-box',
          padding: '1px',
        }}
        mt={10}
        mb={6}
      >
        <Box
          borderRadius={'6px'}
          sx={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 30%, #FCFEFF 70%, #E9F6FC 100%)',
            padding: 5,
          }}
        >
          <Box display={'flex'} mb={5} alignItems={'center'} justifyContent={'space-between'}>
            <Typography component={'div'} variant={'textAI'}>
              <img style={{ verticalAlign: 'sub', marginRight: '4px' }} src={aiStarIcon} alt="" />
              AI Summary
            </Typography>
            <MIButton
              size={'h34'}
              type={'outlined'}
              color={'gray'}
              startIcon={<FileDownloadIcon />}
              disabled={!data?.isFileDownload}
              onClick={handleDownload}
              width={'192px'}
            >
              Download All Report
            </MIButton>
          </Box>

          <Box width="990px" height="1px" bgcolor="#1967D22E" mb={5} />

          <Typography
            ref={contentRef}
            variant={'subtext5'}
            mb={shouldShowButton ? 5 : 0}
            sx={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: showMore ? 'unset' : '8',
              WebkitBoxOrient: 'vertical',
              whiteSpace: 'pre-line', // 줄바꿈 처리
              lineHeight: 1.5, // 명시적으로 line-height 설정
            }}
            color={'#242424'}
            component={'div'}
          >
            {summaryContent}
          </Typography>

          {shouldShowButton && <MIButtonViewMore onClick={() => setShowMore(!showMore)} state={showMore ? 'less' : 'more'} />}
        </Box>
      </Box>
    </MISkeleton>
  )
}

export default MISummaryDownloadReport
