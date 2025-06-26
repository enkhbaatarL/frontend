import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'

import aiIcon from '@/assets/ai.svg'
import MIButton from '@/components/common/button/MIButton.tsx'
import MIButtonViewMore from '@/components/common/button/MIButtonViewMore.tsx'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon.tsx'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import dashboardDataService, { IDashboardSummary } from '@/service/mi/dashboardData.ts'
import { downloadFile } from '@/utils/file.ts'

interface MISummaryDownloadReportProps {
  companyNo: number | undefined
  monthSelect: string
}

const MISummaryDownloadReport = ({ companyNo, monthSelect }: MISummaryDownloadReportProps) => {
  const [showMore, setShowMore] = useState(false)
  const [shouldShowButton, setShouldShowButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboardSummary', monthSelect],
    queryFn: () => dashboardDataService.getDashboardSummary(companyNo ?? 0, monthSelect.split('-').join('')),
    enabled: !!companyNo && !!monthSelect,
  })

  const shouldShowLoading = !companyNo || !monthSelect || isLoading || isFetching

  // 간단한 연산이므로 useMemo 불필요
  const summaryContent =
    !data?.summaries || data.summaries.length === 0
      ? ''
      : data.summaries.map((summary: IDashboardSummary, index: number) => (
        <Box key={index} mt={index !== 0 ? '20px' : 0}>
          <Typography mb={1.5} variant={'subtext5'} fontWeight={600} color={'gray.90'} component={'div'}>
            {summary.explanatoryTitleContent}
          </Typography>
          {(summary.explanatorySummaryContent ?? '').replace('\\n', '\n')}
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
      element.style.webkitLineClamp = '4'
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
      const response = await dashboardDataService.getDashboardSummaryFileDownload(companyNo ?? 0, monthSelect.split('-').join(''))

      const fileName = `Report_${monthSelect.split('-').join('')}.zip`
      downloadFile(response.data, fileName)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <MISkeleton variant={'dashboardSummary'} loading={shouldShowLoading}>
      <Box borderRadius={'4px'} border={'1px solid #E5EDFA'} bgcolor={'#F6F9FD'} padding={5} mt={10} mb={6}>
        <Box display={'flex'} mb={5} alignItems={'center'} justifyContent={'space-between'}>
          <Typography component={'div'} variant={'textAI'}>
            <img style={{ verticalAlign: 'sub', marginRight: '4px' }} src={aiIcon} alt="" />
            Summary
          </Typography>
          <MIButton
            size={'h34'}
            type={'outlined'}
            color={'gray'}
            startIcon={<FileDownloadIcon />}
            disabled={!data?.isFileDownload}
            onClick={handleDownload}
          >
            Download Full Report
          </MIButton>
        </Box>

        <Typography
          ref={contentRef}
          variant={'subtext5'}
          mb={shouldShowButton ? 5 : 0}
          sx={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: showMore ? 'unset' : '4',
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
    </MISkeleton>
  )
}

export default MISummaryDownloadReport
