import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash-es'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'

import ChartPage from '@/pages/mi/forecast/new-components/ChartPage'
import TablePage from '@/pages/mi/forecast/new-components/TablePage'
import forecastDataService from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

const NewForecastPage = () => {
  const [selectedTab, setSelectedTab] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [monthSelect, setMonthSelect] = useState('')
  const tabRefs = useRef<Array<HTMLDivElement | null>>([])
  const tabsContainerRef = useRef<HTMLDivElement | null>(null)
  const contentRefs = useRef<Array<HTMLDivElement | null>>([])
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const targetTabRef = useRef<number | null>(null)

  const { accessCompanyInfo, user } = useAuthStore()

  // 대시보드 차트 조회 가능한 날짜 리스트 (임시)
  const { data: chartDates } = useQuery({
    queryKey: ['dashboardChartDates'],
    queryFn: () => forecastDataService.getForecastChartDates(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // monthSelect 초기값 설정 (임시)
  useEffect(() => {
    if (chartDates?.dates[0] && !monthSelect) {
      setMonthSelect(chartDates.dates[0])
    }
  }, [chartDates, monthSelect])

  const { data: chartData, isLoading: chartDataIsLoading } = useQuery({
    queryKey: ['dashboardChartData', monthSelect],
    queryFn: () =>
      forecastDataService.getForecastChartData(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0, monthSelect.replaceAll('-', '')),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!monthSelect,
  })

  const tabItems = useMemo(
    () => [
      {
        label: 'Chart',
        content: <ChartPage chartData={chartData} chartDataIsLoading={chartDataIsLoading} />,
      },
      {
        label: 'Table',
        content: <TablePage chartData={chartData} chartDataIsLoading={chartDataIsLoading} onMonthSelectChange={setMonthSelect} />,
      },
      {
        label: 'History',
        content: <TablePage chartData={chartData} chartDataIsLoading={chartDataIsLoading} onMonthSelectChange={setMonthSelect} />,
      },
    ],
    [chartData, chartDataIsLoading],
  )

  const updateIndicator = useCallback((index: number) => {
    const currentTab = tabRefs.current[index]
    const container = tabsContainerRef.current
    if (!currentTab || !container) return

    const tabRect = currentTab.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    setIndicatorStyle({
      left: tabRect.left - containerRect.left,
      width: tabRect.width,
    })
  }, [])

  const scrollToContent = useCallback(
    (index: number) => {
      const scrollEl = document.getElementById('main-scroll-wrapper')
      const target = contentRefs.current[index]
      if (!scrollEl || !target) return

      if (index === 0 && !isScrolled) {
        return
      }

      const containerRect = scrollEl.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const offset = isScrolled ? 140 : 176 // sticky header + tab height buffer
      const nextTop = scrollEl.scrollTop + targetRect.top - containerRect.top - offset

      scrollEl.scrollTo({ top: nextTop, behavior: 'smooth' })
    },
    [isScrolled],
  )

  const handleChange = useCallback(
    (index: number) => {
      targetTabRef.current = index
      setSelectedTab(index)
      updateIndicator(index)
      scrollToContent(index)
    },
    [scrollToContent, updateIndicator],
  )

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return undefined

    let scrollStartTop = scrollEl.scrollTop

    const updateActiveTabFromScroll = () => {
      // 탭 클릭으로 인한 스크롤 중이면 스크롤 완료까지 기다림
      if (targetTabRef.current !== null) {
        const scrollTop = scrollEl.scrollTop
        const containerRect = scrollEl.getBoundingClientRect()
        const target = contentRefs.current[targetTabRef.current]
        if (target) {
          const targetRect = target.getBoundingClientRect()
          const currentIsScrolled = scrollTop > 0
          const offset = currentIsScrolled ? 140 : 176
          const targetTop = scrollTop + targetRect.top - containerRect.top - offset

          // 목표 위치에 도달했으면 플래그 해제
          if (Math.abs(scrollTop - targetTop) < 10) {
            targetTabRef.current = null
          } else {
            // 스크롤 중에는 목표 탭 인디케이터 유지
            return
          }
        }
      }

      const scrollTop = scrollEl.scrollTop
      const containerRect = scrollEl.getBoundingClientRect()
      const currentIsScrolled = scrollTop > 0
      const offset = currentIsScrolled ? 140 : 176

      // 각 섹션의 위치를 확인하여 현재 보이는 섹션 찾기
      for (let i = contentRefs.current.length - 1; i >= 0; i--) {
        const content = contentRefs.current[i]
        if (!content) continue

        const contentRect = content.getBoundingClientRect()
        const contentTop = scrollTop + contentRect.top - containerRect.top - offset

        // 섹션이 뷰포트 상단 근처에 있으면 해당 탭을 활성화
        if (scrollTop >= contentTop - 40) {
          setSelectedTab((prevTab) => {
            if (prevTab !== i) {
              updateIndicator(i)
              return i
            }
            return prevTab
          })
          break
        }
      }
    }

    const handleScrollImmediate = () => {
      const currentScrollTop = scrollEl.scrollTop
      setIsScrolled(currentScrollTop > 0)
      updateActiveTabFromScroll()
    }

    const handleScrollDebounced = debounce(() => {
      const currentScrollTop = scrollEl.scrollTop
      const isScrollingUp = currentScrollTop < scrollStartTop
      const isScrollingDown = currentScrollTop > scrollStartTop

      if (contentRefs.current[0]) {
        const firstContent = contentRefs.current[0]
        const containerRect = scrollEl.getBoundingClientRect()
        const targetRect = firstContent.getBoundingClientRect()
        const firstContentTop = scrollEl.scrollTop + targetRect.top - containerRect.top - 150

        if (isScrollingDown && currentScrollTop < firstContentTop) {
          scrollEl.scrollTo({ top: firstContentTop, behavior: 'smooth' })
        } else if (isScrollingUp && currentScrollTop + 1 < firstContentTop && currentScrollTop > 0) {
          scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }

      scrollStartTop = currentScrollTop
    }, 150)

    const handleScroll = () => {
      handleScrollImmediate()
      handleScrollDebounced()
    }

    handleScroll()

    scrollEl.addEventListener('scroll', handleScroll)
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll)
      handleScrollDebounced.cancel()
    }
  }, [updateIndicator])

  useEffect(() => {
    updateIndicator(selectedTab)
    const handleResize = () => updateIndicator(selectedTab)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedTab, updateIndicator])

  const TAB_VERTICAL_GAP = 76

  return (
    <Stack maxWidth="1380px" margin="auto" pt="20px" position="relative" sx={{ userSelect: 'none' }}>
      <Box position="sticky" top={isScrolled ? '-14px' : 0} left="0" bgcolor="commonColor.White" zIndex={200}>
        <Typography
          variant="titleLarge"
          position="absolute"
          top="12px"
          left="24px"
          fontSize="38px"
          sx={{
            transform: `translateY(${isScrolled ? -6 : 0}px)`,
            opacity: isScrolled ? 0 : 1,
            transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, font-size 0.3s ease-in-out, top 0.3s ease-in-out',
            transitionDelay: isScrolled ? '0s' : '0.2s',
          }}
        >
          Crude Oil Forecast
        </Typography>
        <Box
          mt={`${TAB_VERTICAL_GAP + 20}px`}
          position="relative"
          sx={{
            transition: 'transform 0.3s ease-in-out, padding-left 0.3s ease-in-out, margin-bottom 0.3s ease-in-out',
            willChange: 'transform',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'gray.30',
              zIndex: 0,
            },
          }}
        >
          <Stack direction="row" position="relative" justifyContent="space-between">
            <Stack
              direction="row"
              position="relative"
              ref={tabsContainerRef}
              sx={{
                zIndex: 1,
              }}
            >
              {tabItems.map((tab, index) => (
                <Box
                  key={tab.label}
                  onClick={() => handleChange(index)}
                  ref={(el: HTMLDivElement | null) => {
                    tabRefs.current[index] = el
                  }}
                  sx={{
                    fontWeight: 600,
                    fontSize: '18px',
                    color: selectedTab === index ? 'commonColor.Black' : 'content.textNormal',
                    padding: '12px 20px 22px 20px',
                    textTransform: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {tab.label}
                </Box>
              ))}
              <Box
                position="absolute"
                bottom={0}
                left={0}
                height="2px"
                bgcolor="commonColor.Black"
                sx={{
                  width: `${indicatorStyle.width}px`,
                  transform: `translateX(${indicatorStyle.left}px)`,
                  transition: 'transform 0.25s ease, width 0.25s ease',
                  pointerEvents: 'none',
                }}
              />
            </Stack>
            <Box display="flex" alignItems="center">
              <Typography
                variant="infoDocument"
                color="contentText.Normal"
                mr="70px"
                mb="8px"
                sx={{
                  transform: `translateY(${isScrolled ? 0 : 6}px)`,
                  opacity: isScrolled ? 1 : 0,
                  transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  transitionDelay: isScrolled ? '0.2s' : '0s',
                }}
              >
                Crude Oil Forecast
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
      <Stack gap="20px">
        {tabItems.map((tab, index) => (
          <Box
            key={tab.label}
            ref={(el: HTMLDivElement | null) => {
              contentRefs.current[index] = el
            }}
          >
            {tab.content}
          </Box>
        ))}
      </Stack>
    </Stack>
  )
}

export default NewForecastPage
