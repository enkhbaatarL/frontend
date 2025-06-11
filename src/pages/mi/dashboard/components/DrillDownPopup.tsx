import { Box, CircularProgress, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import CloseIcon from '@/components/common/icons/CloseIcon'
import MIInfluenceFactorChart from '@/components/common/influence-factor-chart/MIInfluenceFactorChart.tsx'
import MISegmented from '@/components/common/segmentedbtn/MISegmented'
import { SelectedReportChartContent } from '@/pages/mi/dashboard/components/ReportComponent'
import dashboardDataService from '@/service/mi/dashboardData.ts'
import theme from '@/theming'

interface DrillDownPopupProps {
  monthSelect: string
  selectedContent: SelectedReportChartContent
  onClose: () => void
  companyNo: number | undefined
}

const HorizontalChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 18L14 18M4 12L20 12M4 6L10 6" stroke="#343A40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PopupIndicatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 28 16" fill="none">
    <path d="M14 0L27.5 16H0.5L14 0Z" fill="#E9ECEF" />
  </svg>
)

const DrillDownPopup = ({ monthSelect, selectedContent, onClose, companyNo }: DrillDownPopupProps) => {
  const [categorySelect, setCategorySelect] = useState('')

  const { data: categoryList, isLoading: isLoadingCategoryList } = useQuery({
    queryKey: ['dashboardFactorCategory', monthSelect, selectedContent.goodsDataSourceNo],
    queryFn: () =>
      dashboardDataService.getDashboardFactorCategory(companyNo ?? 0, {
        predictDate: monthSelect.split('-').join(''),
        goodsDataSourceNo: selectedContent.goodsDataSourceNo ?? 0,
      }),
    enabled: !!companyNo && !!monthSelect && !!selectedContent.goodsDataSourceNo,
  })

  // factor
  const { data: factors, isLoading: isLoadingFactors } = useQuery({
    queryKey: ['dashboardFactors', categorySelect, monthSelect, selectedContent.goodsDataSourceNo],
    queryFn: () =>
      dashboardDataService.getDashboardFactors(companyNo ?? 0, {
        predictDate: monthSelect.split('-').join(''),
        goodsDataSourceNo: selectedContent.goodsDataSourceNo ?? 0,
        explanatoryLevelNm: categorySelect,
      }),
    enabled: !!companyNo && !!categorySelect && !!monthSelect && !!selectedContent.goodsDataSourceNo,
  })

  useEffect(() => {
    if (categoryList?.explanatoryLevelNms[0]) {
      setCategorySelect(categoryList.explanatoryLevelNms[0])
    }
  }, [categoryList])

  return (
    <Box width={'1028px'} mb="24px" mt="35px" sx={{ borderRadius: '4px', backgroundColor: '#E9ECEF', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: '3px', left: '50%', transform: 'translate(-50%, -100%)', '& svg': { display: 'block' } }}>
        <PopupIndicatorIcon />
      </Box>
      <Box p={'12px'}>
        <Box px={'12px'} pt={'12px'} pb={'10px'} display={'flex'} justifyContent={'space-between'}>
          <Box>
            <Box
              mb="8px"
              sx={{
                display: 'inline-flex',
                backgroundColor: theme.palette.common.white,
                padding: '0 8px',
                borderRadius: '100px',
                alignItems: 'center',
              }}
              height={'20px'}
            >
              <Typography variant="chip2" color="#495057">
                Drill-down
              </Typography>
            </Box>
            <Box mb="8px">
              <Typography variant="body2" color="#495057">
                {selectedContent?.label} / {selectedContent?.date}
              </Typography>
            </Box>
            <Box>
              <Typography variant="messageText1" color="#212529" sx={{ marginRight: '2px' }}>
                {selectedContent?.value}
              </Typography>
              <Typography variant="body2SB14" color="#212529">
                USD/bb
              </Typography>
            </Box>
          </Box>
          <MIButton type="ghost" contentType="icon" size="h32" onClick={onClose}>
            <CloseIcon />
          </MIButton>
        </Box>

        <Box p={'6px'} mt={'10px'}>
          <Box maxWidth={'994px'} p={'24px'} sx={{ backgroundColor: theme.palette.common.white, borderRadius: '4px' }}>
            <Box display={'flex'} gap="6px" mb={'12px'}>
              <HorizontalChartIcon />
              <Typography component={'div'} variant="infoDocument" color="gray.90">
                주요 요인 분석
              </Typography>
            </Box>
            <Box
              display={'flex'}
              gap={'10px'}
              maxWidth={'946px'}
              maxHeight={'100%'}
              flexWrap={'wrap'}
              paddingTop={'10px'}
              paddingBottom={'10px'}
            >
              {isLoadingCategoryList ? (
                <Box display={'flex'} alignItems={'center'} justifyContent={'center'} width={'100%'}>
                  <CircularProgress />
                </Box>
              ) : (
                categoryList?.explanatoryLevelNms.map((data: string, index: number) => (
                  <MISegmented size="h30" active={data === categorySelect} onClick={() => setCategorySelect(data)} key={index}>
                    {data}
                  </MISegmented>
                ))
              )}
            </Box>
            {!isLoadingCategoryList &&
              (isLoadingFactors ? (
                <Box display={'flex'} alignItems={'center'} justifyContent={'center'} width={'100%'} height={'320px'}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box padding={'18px 12px 18px 12px'}>
                    <Typography variant="body2R14" color="#495057">
                      {factors?.categorySummary}
                    </Typography>
                  </Box>
                  <Box mt={'12px'}>
                    <MIInfluenceFactorChart increasingFactors={factors?.plusFactors} decreasingFactors={factors?.minusFactors} />
                  </Box>
                </>
              ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default DrillDownPopup
