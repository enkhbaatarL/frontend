import { Box, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import LoadingBox from './LoadingBox'
import MIButton from '../button/MIButton'
import MIForecastChart from '../forecast-chart/MIForecastChart'
import { generateChartMonths, generateForecastDataset } from '../forecast-chart/mockBrentForecastData'
import CloseIcon from '../icons/CloseIcon'

import { IFactor } from '@/service/mi/dashboardData.ts'

const CheveronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M8.99953 6.71075C8.60953 7.10075 8.60953 7.73075 8.99953 8.12075L12.8795 12.0008L8.99953 15.8808C8.60953 16.2708 8.60953 16.9008 8.99953 17.2908C9.38953 17.6808 10.0195 17.6808 10.4095 17.2908L14.9995 12.7008C15.3895 12.3108 15.3895 11.6808 14.9995 11.2908L10.4095 6.70075C10.0295 6.32075 9.38953 6.32075 8.99953 6.71075Z"
      fill="#343A40"
    />
  </svg>
)
const LineChartGraphIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M13.7129 17.8891L8.32382 12.804L3.4511 17.3328C3.38154 17.3999 3.29929 17.4525 3.20916 17.4875C3.11904 17.5224 3.02284 17.5391 2.92621 17.5365C2.82957 17.5338 2.73443 17.512 2.64634 17.4721C2.55826 17.4323 2.479 17.3753 2.4132 17.3045C2.3474 17.2336 2.29638 17.1504 2.26313 17.0596C2.22988 16.9689 2.21505 16.8724 2.21953 16.7758C2.22401 16.6792 2.24769 16.5845 2.2892 16.4972C2.33071 16.4099 2.38921 16.3318 2.46127 16.2673L8.33109 10.8128L13.5246 15.7139L20.4918 6.38076C20.6076 6.22645 20.7798 6.12443 20.9708 6.09715C21.1617 6.06988 21.3557 6.11959 21.51 6.23532C21.6643 6.35105 21.7663 6.52333 21.7936 6.71428C21.8209 6.90522 21.7712 7.09919 21.6555 7.25349L13.7129 17.8891Z"
      fill="#343A40"
    />
  </svg>
)

export interface InfluenceFactor {
  label: string
  explanatoryScore: number
  color: string
}
interface MIInfluenceFactorChartProps {
  decreasingFactors?: IFactor[]
  increasingFactors?: IFactor[]
  onHandleChangeRigCountInfluence?: (isShowing: boolean) => void
}

const FactorItem = (props: {
  factor: IFactor
  align?: 'left' | 'right'
  onClick?: () => void
  deactive?: boolean
  isFocus?: boolean
  barColor: string
  maxFactorValue: number
}) => {
  const { factor, align = 'left', maxFactorValue } = props
  const barRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLElement>(null)
  const [offsetRight, setOffsetRight] = useState(0)
  const [offsetLeft, setOffsetLeft] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (barRef.current?.clientWidth && textRef.current?.clientWidth && align === 'right') {
      setOffsetRight(Math.min(barRef.current?.clientWidth - textRef.current?.clientWidth, 0))
    }
    if (barRef.current?.clientWidth && textRef.current?.clientWidth && align === 'left') {
      setOffsetLeft(Math.min(barRef.current?.clientWidth - textRef.current?.clientWidth, 0))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barRef.current, textRef.current, align])

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <Box
      onClick={() => props?.onClick?.()}
      sx={{ width: `${(factor.explanatoryScore / maxFactorValue) * 100}%`, position: 'relative', opacity: props.deactive ? 0.3 : 1 }}
      display={'flex'}
      flexDirection={'column'}
      pb="21px"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Tooltip
        title={factor.explanatoryLevelDetailNm}
        placement="top-end"
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, -6],
                },
              },
            ],
          },
        }}
      >
        <Box
          sx={{
            '&:hover': {
              cursor: 'pointer',
            },
          }}
        >
          <Box
            ref={barRef}
            sx={{
              background: props.barColor,
              width: '100%',
              height: '8px',
              borderRadius: '2px',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '8px',
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.50) 100%)',
                opacity: isHovered ? 1 : 0,
                borderRadius: '2px',
              },
            }}
          />
          <Box
            ref={textRef}
            display={'flex'}
            alignItems={'baseline'}
            gap="2px"
            sx={{
              position: 'absolute',
              right: align === 'right' ? `${offsetRight}px` : 'unset',
              left: align === 'left' ? `${offsetLeft}px` : 'unset',
              bottom: 0,
              width: 'max-content',
              maxWidth: '200px',
              height: '17px',
            }}
          >
            <Typography variant="body2R14" color="gray.70" fontWeight={props.isFocus || isHovered ? 600 : 400} noWrap>
              {factor.explanatoryLevelDetailNm}
            </Typography>
            <Typography variant="subtext2" color="#3C8A36" fontWeight={props.isFocus || isHovered ? 600 : 400}>
              {factor.explanatoryScore}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    </Box>
  )
}

export default function MIInfluenceFactorChart(props: Readonly<MIInfluenceFactorChartProps>) {
  const { decreasingFactors, increasingFactors, onHandleChangeRigCountInfluence } = props
  const [selectedBar, setSelectedBar] = useState('')
  const { months } = generateChartMonths()
  const [loadingFactorGraph, setLoadingFactorGraph] = useState(false)
  const navigate = useNavigate()

  const redirectToDataVisualization = () => {
    navigate('/user/data-visualization')
  }

  const changeBar = (value: string) => {
    setLoadingFactorGraph(true)
    setSelectedBar(value)
    onHandleChangeRigCountInfluence?.(true)
    setTimeout(() => {
      setLoadingFactorGraph(false)
    }, 1000)
  }

  const incColorMap = ['#2E7D32', '#388E3C', '#43A047', '#66BB6A', '#81C784']
  const decColorMap = ['#A9141A', '#5B6773', '#7A8790', '#8C98A0', '#9DAFB9']

  const maxFactorValue = useMemo(() => {
    const maxValue = Math.max(
      ...(decreasingFactors?.map((item) => item.explanatoryScore) ?? []),
      ...(increasingFactors?.map((item) => item.explanatoryScore) ?? []),
    )

    return maxValue
  }, [decreasingFactors, increasingFactors])

  return (
    <Box>
      <Box display={'flex'} flexDirection={'column'} gap="12px" mb="12px" px="12px" py="24px">
        <Box display={'flex'} justifyContent={'space-between'}>
          <Typography variant="body2SB14">하락요인</Typography>
          <Typography variant="body2SB14">상승요인</Typography>
        </Box>
        <Box display={'flex'} width={'100%'} sx={{ overflow: 'hidden' }}>
          <Box display={'flex'} flexDirection={'column'} alignItems={'flex-end'} gap={'10px'} flex={1} width={'100%'}>
            {decreasingFactors?.map((item) => (
              <FactorItem
                key={item.explanatoryLevelDetailNm}
                deactive={item.explanatoryLevelDetailNm !== selectedBar && !!selectedBar}
                isFocus={item.explanatoryLevelDetailNm === selectedBar}
                factor={item}
                onClick={() => changeBar(item.explanatoryLevelDetailNm)}
                barColor={item.dirRank < 5 ? decColorMap[item.dirRank - 1] : decColorMap[4]}
                maxFactorValue={maxFactorValue}
              />
            ))}
          </Box>
          <Box height={'fit-contnent'} width={'2px'} sx={{ backgroundColor: '#D6D6D6' }} mx="24px" />
          <Box display={'flex'} flexDirection={'column'} gap={'10px'} flex={1}>
            {increasingFactors?.map((item) => (
              <FactorItem
                key={item.explanatoryLevelDetailNm}
                deactive={item.explanatoryLevelDetailNm !== selectedBar && !!selectedBar}
                factor={item}
                isFocus={item.explanatoryLevelDetailNm === selectedBar}
                align="right"
                onClick={() => changeBar(item.explanatoryLevelDetailNm)}
                barColor={item.dirRank < 5 ? incColorMap[item.dirRank - 1] : decColorMap[4]}
                maxFactorValue={maxFactorValue}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {loadingFactorGraph && <LoadingBox width={946} height={668} />}

      {!!selectedBar && !loadingFactorGraph && (
        <Box
          display={'flex'}
          flexDirection={'column'}
          gap="12px"
          padding={'24px'}
          sx={{
            border: '1px solid #868E96',
            borderRadius: '4px',
          }}
        >
          <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
            <MIButton
              onClick={redirectToDataVisualization}
              type={'ghost'}
              contentType={'text'}
              startIcon={<LineChartGraphIcon />}
              endIcon={<CheveronRightIcon />}
            >
              {selectedBar}
            </MIButton>
            <MIButton
              type="ghost"
              contentType="icon"
              size="h32"
              onClick={() => {
                setSelectedBar('')
                onHandleChangeRigCountInfluence?.(false)
              }}
            >
              <CloseIcon />
            </MIButton>
          </Box>

          <Box display={'flex'} gap={'12px'} px="12px" py="18px">
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                border: '1px solid #D6D6D6',
                padding: '8px 12px',
                minWidth: '79px',
                width: '79px',
                maxWidth: '79px',
                height: '61px',
                letterSpacing: '-0.4px',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <Typography variant="subtext3" color="gray.70">
                영향력 점수
              </Typography>
              <Typography variant="sectionTitleTXL" color="gray.70">
                8.5
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2R14" color="gray.70">
                리그 가동률이 평년 대비 약 12% 회복되었습니다. 이는 새로운 공급을 의미하며, 시장 공급 증가로 이어질 전망입니다. Lorem ipsum
                dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi
                pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus
                bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti
                sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
              </Typography>
            </Box>
          </Box>

          <MIForecastChart
            forecastDatasets={[
              {
                ...generateForecastDataset(months, { forecastByMonth: false }),
                label: 'Actual data 1',
                color: '#40597A',
                hidePoint: true,
                type: 'future',
              },
            ]}
            months={months}
            height={448}
            topLabel="Unit: Rigs"
            lastUpdated="April 29, 2025"
            hideControl
            hideLegend
            showForecastTrend={false}
            showVerticalLine={false}
            onSelectedContent={() => {}}
          />
        </Box>
      )}
    </Box>
  )
}
