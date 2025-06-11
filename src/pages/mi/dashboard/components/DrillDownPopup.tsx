import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import CloseIcon from '@/components/common/icons/CloseIcon'
import MISegmented from '@/components/common/segmentedbtn/MISegmented'
import dashboardDataService from '@/service/mi/dashboardData.ts'
import theme from '@/theming'

interface DrillDownPopupProps {
  monthSelect: string
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

const DrillDownPopup = ({ monthSelect }: DrillDownPopupProps) => {
  const [categorySelect, setCategorySelect] = useState('')

  const { data: categoryList } = useQuery({
    queryKey: ['dashboardFactorCategory'],
    queryFn: () =>
      dashboardDataService.getDashboardFactorCategory(2013, {
        predictDate: '20250511',
        goodsDataSourceNo: 63,
      }),
  })

  // factor
  /*  const { data: factors } = useQuery({
    queryKey: ['dashboardFactors', categorySelect],
    queryFn: () => dashboardDataService.getDashboardFactors(2013, {
      predictDate: '20250511',
      goodsDataSourceNo: 63,
      explanatoryLevelNm: categorySelect,
    }),
    enabled: !!categorySelect,
  })*/

  return (
    <Box width={'1028px'} mb="24px" mt="35px" sx={{ borderRadius: '4px', backgroundColor: '#E9ECEF', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: '0px', left: '50%', transform: 'translate(-50%, -100%)', '& svg': { display: 'block' } }}>
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
                Drill-down {monthSelect}
              </Typography>
            </Box>
            <Box mb="8px">
              <Typography variant="body2" color="#495057">
                {/* {selectedContent?.label} / {selectedContent?.date} */}
              </Typography>
            </Box>
            <Box>
              <Typography variant="messageText1" color="#212529" sx={{ marginRight: '2px' }}>
                {/* {selectedContent?.value} */}
              </Typography>
              <Typography variant="body2SB14" color="#212529">
                USD/bb
              </Typography>
            </Box>
          </Box>
          <MIButton type="ghost" contentType="icon" size="h32" onClick={() => {}}>
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
              {categoryList &&
                categoryList.explanatoryLevelNms.map((data: string, index: number) => (
                  <MISegmented size="h30" active={data === categorySelect} onClick={() => setCategorySelect(data)} key={index}>
                    {data}
                  </MISegmented>
                ))}
            </Box>
            <Box padding={'18px 12px 18px 12px'}>
              <Typography variant="body2R14" color="#495057">
                선택한 요인 분류에 대한 설명이 필요한 경우 여기에 작성합니다. Lorem ipsum dolor sit amet consectetur adipiscing elit.
                Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu
                aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada
                lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra
                inceptos himenaeos.
              </Typography>
            </Box>

            <Box mt={'12px'}>
              {/* <MIInfluenceFactorChart
                  height={150}
                  decreasingFactors={[
                    {
                      label: 'Decreasing Factor 1',
                      value: 85.0,
                      color: '#A9141A',
                    },
                    {
                      label: 'D Factor 2',
                      value: 40.0,
                      color: '#5B6773',
                    },
                    {
                      label: 'D Factor 3',
                      value: 30.0,
                      color: '#7A8790',
                    },
                    {
                      label: 'D Factor 4',
                      value: 20.0,
                      color: '#8C98A0',
                    },
                    {
                      label: 'D Factor 5',
                      value: 5.0,
                      color: '#9DAFB9',
                    },
                  ]}
                  increasingFactors={[
                    {
                      label: 'Increasing Factor 1',
                      value: 100.0,
                      color: '#3C8A36',
                    },
                    {
                      label: 'Rig count',
                      value: 80.0,
                      color: '#5B6773',
                    },
                    {
                      label: 'I Factor 3',
                      value: 65.0,
                      color: '#7A8790',
                    },
                    {
                      label: 'I Factor 4',
                      value: 35.0,
                      color: '#8C98A0',
                    },
                    {
                      label: 'I Factor 5',
                      value: 1.0,
                      color: '#9DAFB9',
                    },
                  ]}
                /> */}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default DrillDownPopup
