import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'

import aiIcon from '@/assets/ai.svg'
import MIButton from '@/components/common/button/MIButton.tsx'
import MIButtonViewMore from '@/components/common/button/MIButtonViewMore.tsx'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon.tsx'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import dashboardDataService, { IDashboardSummary } from '@/service/mi/dashboardData.ts'

interface MISummaryDownloadReportProps {
  companyNo: number | undefined
  monthSelect: string
}

const MISummaryDownloadReport = ({ companyNo, monthSelect }: MISummaryDownloadReportProps) => {
  const [showMore, setShowMore] = useState(false)
  const [shouldShowButton, setShouldShowButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardSummary', monthSelect],
    queryFn: () => dashboardDataService.getDashboardSummary(companyNo ?? 0, monthSelect.split('-').join('')),
    enabled: !!companyNo && !!monthSelect,
  })

  // summaries 데이터를 렌더링하는 함수
  const renderSummaryContent = () => {
    if (!data?.summaries || data.summaries.length === 0) {
      return '데이터가 없습니다.'
    }

    return data.summaries.map((summary: IDashboardSummary, index: number) => (
      <Typography key={index} variant="subtext5" color="#242424" component="div">
        {index !== 0 && summary.explanatoryTitleContent}
        <br />
        {summary.explanatorySummaryContent}
      </Typography>
    ))
  }

  // 텍스트 높이를 체크하여 버튼 표시 여부 결정
  useEffect(() => {
    if (contentRef.current && data?.summaries) {
      const element = contentRef.current

      // 임시로 line-clamp 제거하여 전체 높이 측정
      const originalWebkitLineClamp = element.style.webkitLineClamp
      const originalDisplay = element.style.display
      const originalWebkitBoxOrient = element.style.webkitBoxOrient

      element.style.webkitLineClamp = 'unset'
      element.style.display = 'block'
      element.style.webkitBoxOrient = 'unset'

      const fullHeight = element.scrollHeight

      // 다시 3줄로 제한하여 높이 측정
      element.style.webkitLineClamp = '3'
      element.style.display = '-webkit-box'
      element.style.webkitBoxOrient = 'vertical'

      const clampedHeight = element.scrollHeight

      // 원래 스타일로 복원
      element.style.webkitLineClamp = originalWebkitLineClamp
      element.style.display = originalDisplay
      element.style.webkitBoxOrient = originalWebkitBoxOrient

      // 전체 높이가 3줄 높이보다 크면 버튼 표시
      setShouldShowButton(fullHeight > clampedHeight)
    }
  }, [data?.summaries])

  return (
    <MISkeleton variant={'dashboardSummary'} loading={isLoading}>
      <Box borderRadius={'4px'} border={'1px solid #E5EDFA'} bgcolor={'#F6F9FD'} padding={5} mt={10} mb={6}>
        <Box display={'flex'} mb={5} alignItems={'center'} justifyContent={'space-between'}>
          <Typography component={'div'} variant={'textAI'}>
            <img style={{ verticalAlign: 'sub', marginRight: '4px' }} src={aiIcon} alt="" />
            Summary
          </Typography>
          <MIButton size={'h34'} type={'outlined'} color={'gray'} startIcon={<FileDownloadIcon />} disabled={!data?.isFileDownload}>
            Download Full Report
          </MIButton>
        </Box>

        {data?.summaries && data.summaries.length > 0 && (
          <Typography mb={1.5} variant={'subtext5'} fontWeight={600} color={'gray.90'} component={'div'}>
            {data.summaries[0].explanatoryTitleContent}
          </Typography>
        )}

        <Box
          ref={contentRef}
          mb={shouldShowButton ? 5 : 0}
          sx={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: showMore ? 'unset' : '4',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {renderSummaryContent()}
        </Box>

        {shouldShowButton && <MIButtonViewMore onClick={() => setShowMore(!showMore)} state={showMore ? 'less' : 'more'} />}
      </Box>
    </MISkeleton>
  )
}

export default MISummaryDownloadReport
