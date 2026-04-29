import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import TokenIcon from '@mui/icons-material/Token'
import TungstenRoundedIcon from '@mui/icons-material/TungstenRounded'
import { Box, Collapse, IconButton, Stack, Tab, Tabs, Typography } from '@mui/material'
import { type SyntheticEvent, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { type NavigateFunction, useNavigate } from 'react-router-dom'

import RelatedEventsAndScenariosSection from './components/scenario/RelatedEventsAndScenariosSection'
import ScenarioKeyPredictionsSection from './components/scenario/ScenarioKeyPredictionsSection'
import ScenarioSummarySection from './components/scenario/ScenarioSummarySection'
import SignpostMonitoringSection from './components/scenario/SignpostMonitoringSection'
import { ScenarioDetail } from './components/scenario/types'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'

/** Collapse로 접히는 상단 네비 행 높이(px) — 초기 sticky 높이·DOM 측정 보정에 공통 */
const SCENARIO_STICKY_NAV_ROW_PX = 52

/** MILayout 스티키 `top` 전환과 동일 계열 */
const SCENARIO_LAYOUT_TRANSITION_MS = 220
const SCENARIO_LAYOUT_TRANSITION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

const STICKY_HEIGHT_MEASURE_EPS_PX = 2
const SCENARIO_STICKY_HEIGHT_INITIAL_EXPANDED_PX = 264

const SCENARIO_DETAIL_MOCK: ScenarioDetail = {
  name: '호르무즈 봉쇄 3개월+ 유지',
  tags: ['장기봉쇄', '수요파괴'],
  summary: {
    priceFlowTitle: 'JKM 가격 흐름',
    priceSteps: [{ label: '$21~23' }, { label: '$19~20' }, { label: '$19' }],
    flowDescription: '4~6월 $21~23 (공급 충격) → 7~9월 $19~20 (수요 파괴+증산) → 4Q $18.5~19.5 (겨울 반등)',
    forecastTitle: 'JKM 영향 전망',
    forecastBody:
      '3월 11일 호르무즈 해협이 완전히 봉쇄된 이후 이 상황이 3개월 이상 지속될 경우, 4~6월에는 공급 충격으로 인해 JKM 가격이 $21~23 수준까지 상승할 것으로 예상됩니다. 이후 7~9월에는 인도와 동남아를 중심으로 $20 이상 가격에 대한 수요 저항이 발생하면서 수요 파괴가 나타나고, 동시에 미국의 증산 영향이 더해져 가격은 $19~20 수준으로 하향 안정화될 가능성이 있습니다. 4분기에는 겨울철 계절적 수요가 반영되며 $18.5~19.5 수준에서 반등이 예상되며, 전체 시나리오에서 가장 중요한 변수는 호르무즈 봉쇄 해소 시점입니다.',
    chartUnit: 'Unit: USD/MMBtu',
    chart: {
      months: ['26.05', '06', '07', '08', '09', '10', '11', '12', '27.01', '02', '03', '04'],
      weeklyValues: [
        26.0, 26.4, 27.0, 27.6, 28.0, 28.4, 28.2, 29.0, 30.0, 30.6, 31.0, 30.7, 31.4, 32.8, 33.5, 32.8, 34.8, 36.4, 35.2, 34.0, 33.0, 31.6,
        30.4, 30.0, 30.6, 31.4, 30.8, 30.2, 31.2, 38.4, 40.4, 41.6, 40.6, 40.0, 40.4, 40.1, 40.8, 41.2, 40.0, 39.4, 40.4, 41.0, 40.4, 39.4,
        41.6, 42.0, 40.4, 39.2,
      ],
    },
  },
  keyPredictions: [
    { title: '갈등 기간', value: '6개월 이상' },
    { title: '피해 수준', value: '대규모 인프라 파괴' },
    { title: '복구 전망', value: '3~5년 예상', description: '완전 복구 기준 text' },
    { title: 'LNG 수출 영향', value: '20 MTPA+ (25%+)', direction: 'down' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text' },
    { title: 'Text Label', value: 'Value', direction: 'up', description: 'Supporting text', hidden: true },
  ],
  signposts: [
    {
      id: 1,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승 압력 지속',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 2,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승 압력 지속',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 3,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 4,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 5,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
    {
      id: 6,
      coreEvent: '3/11 호르무즈 완전 봉쇄 및 150+ 선박 대기',
      currentStatus: '물리적 통행 차단 지속',
      marketImpact: 'LNG 및 원유 공급 블록 현실화 → 가격 상승',
      observationPoint: '대기 선박 증가 여부 / 실제 운송 재개 여부',
      source: 'MarineTraffic, Reuters',
    },
  ],
  relatedEvents: [
    {
      id: 1,
      name: '미국/이스라엘 이란 공습 개시 (Operation Epic Fury)',
      date: '02-28 09:00',
      category: '지정학적 리스크',
      marketImpact: '높음',
      marketImpactColor: '#364FC7',
      direction: 'up',
      directionLabel: '상승',
    },
    {
      id: 2,
      name: 'EU 가스 재고 39.2% — 5년 평균 63% 대비 하회',
      date: '02-27 09:00',
      category: '수급 밸런스',
      marketImpact: '중간',
      marketImpactColor: '#7384D9',
      direction: 'neutral',
      directionLabel: '보합',
    },
  ],
  relatedScenarios: [
    {
      id: 1,
      name: '1~2주 내 협상 완료 상황 해소',
      isCurrent: false,
      marketImpact: '낮음',
      marketImpactColor: '#A7B2E5',
      priceImpact: '낮음',
      priceImpactColor: '#A7B2E5',
      initialProbability: '100%',
    },
    {
      id: 2,
      name: '수주 내 호르무즈 정상화',
      isCurrent: false,
      marketImpact: '낮음',
      marketImpactColor: '#A7B2E5',
      priceImpact: '높음',
      priceImpactColor: '#364FC7',
      initialProbability: '100%',
    },
    {
      id: 3,
      name: '호르무즈 봉쇄 3개월+ 유지',
      isCurrent: true,
      marketImpact: '중간',
      marketImpactColor: '#7384D9',
      priceImpact: '중간',
      priceImpactColor: '#7384D9',
      initialProbability: '100%',
    },
    {
      id: 4,
      name: '걸프 LNG 인프라 타격, 복구',
      isCurrent: false,
      marketImpact: '높음',
      marketImpactColor: '#364FC7',
      priceImpact: '높음',
      priceImpactColor: '#364FC7',
      initialProbability: '100%',
    },
    {
      id: 5,
      name: '걸프 LNG 인프라 타격, 미복구',
      isCurrent: false,
      marketImpact: '높음',
      marketImpactColor: '#364FC7',
      priceImpact: '높음',
      priceImpactColor: '#364FC7',
      initialProbability: '100%',
    },
  ],
}

interface SectionHeadingProps {
  title: string
}

const SectionHeading = ({ title }: SectionHeadingProps) => (
  <Stack direction="row" alignItems="center" gap="8px">
    <TungstenRoundedIcon sx={{ fontSize: 30, color: 'contentText.Black' }} />
    <Typography sx={{ fontSize: 20, fontWeight: 600, color: 'contentText.Black' }}>{title}</Typography>
    <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Normal' }} />
  </Stack>
)

type ScenarioStickyHeaderVm = {
  activeSection: number
  isMainScrolled: boolean
  data: ScenarioDetail
  navigate: NavigateFunction
  handleTabChange: (event: SyntheticEvent, index: number) => void
  handleTabClick: (index: number) => void
}

let scenarioStickyHeaderVm: ScenarioStickyHeaderVm | null = null
let scenarioStickyHeaderVmVersion = 0
const scenarioStickyHeaderListeners = new Set<() => void>()

const subscribeScenarioStickyHeader = (listener: () => void) => {
  scenarioStickyHeaderListeners.add(listener)
  return () => scenarioStickyHeaderListeners.delete(listener)
}

const getScenarioStickyHeaderVersion = () => scenarioStickyHeaderVmVersion

const publishScenarioStickyHeaderVm = (vm: ScenarioStickyHeaderVm) => {
  scenarioStickyHeaderVm = vm
  scenarioStickyHeaderVmVersion += 1
  scenarioStickyHeaderListeners.forEach((l) => l())
}

/** `setStickyHeader` 한 번만 호출하고 탭·Collapse는 이 컴포넌트만 리렌더 — 스크롤·스파이 시 본문 패딩 흔들림 방지 */
const ScenarioDetailStickyHeaderView = () => {
  useSyncExternalStore(subscribeScenarioStickyHeader, getScenarioStickyHeaderVersion, getScenarioStickyHeaderVersion)
  const vm = scenarioStickyHeaderVm
  if (!vm) return null

  const { activeSection, isMainScrolled, data, navigate, handleTabChange, handleTabClick } = vm

  return (
    <Box maxWidth="1380px" margin="auto" px="12px" width="100%" sx={{ userSelect: 'none' }}>
      <Stack bgcolor="commonColor.White">
        <Collapse
          in={!isMainScrolled}
          /** 마운트 직후 `in === true`여도 enter 애니메이션이 돌면 상단 블록이 아래로 펼쳐지는 것처럼 보임 */
          appear={false}
          timeout={{
            appear: SCENARIO_LAYOUT_TRANSITION_MS,
            enter: SCENARIO_LAYOUT_TRANSITION_MS,
            exit: SCENARIO_LAYOUT_TRANSITION_MS,
          }}
          easing={{ enter: SCENARIO_LAYOUT_TRANSITION_EASING, exit: SCENARIO_LAYOUT_TRANSITION_EASING }}
          sx={{
            transition: `height ${SCENARIO_LAYOUT_TRANSITION_MS}ms ${SCENARIO_LAYOUT_TRANSITION_EASING}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" py="8px">
            <Box flex={1} minWidth={0} display="flex" alignItems="flex-end" minHeight="36px">
              <MIBaseButton
                variant="outlined"
                prefix={<KeyboardBackspaceIcon sx={{ fontSize: 20 }} />}
                onClick={() => navigate('/mi/scenario-workbench')}
                enableHoverBackground
                sx={{
                  height: '36px',
                }}
              >
                Scenarios
              </MIBaseButton>
            </Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="flex-end"
              gap="8px"
              flex={1}
              minWidth={0}
              sx={{ opacity: 0, pointerEvents: 'none' }}
              aria-hidden
            >
              <IconButton
                disabled
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  p: '8px',
                  borderRadius: '10px',
                  border: '1px solid #E9ECEF',
                  bgcolor: 'contentBG.Disabled',
                  color: 'contentText.Disabled',
                  '&.Mui-disabled': { border: '1px solid #E9ECEF' },
                }}
              >
                <ModeCommentOutlinedIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                size="small"
                aria-label="더보기"
                sx={{
                  width: 36,
                  height: 36,
                  p: '8px',
                  borderRadius: '10px',
                  border: '1px solid #DEE2E6',
                  bgcolor: 'commonColor.White',
                  color: 'contentText.Normal',
                  '&:hover': { bgcolor: 'commonColor.White' },
                }}
              >
                <MoreVertIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Stack>
          </Stack>
        </Collapse>

        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" width="100%">
          <Stack flex={1} minWidth={0} gap="10px" alignItems="flex-start" pt="20px">
            <Typography variant="body1B16" color="contentText.Black">
              Scenario
            </Typography>
            <Typography variant="titleLarge" fontSize="26px" fontWeight={600} display="block" sx={{ lineHeight: 1.4 }}>
              {data.name}
            </Typography>
            <Stack direction="row" gap="8px" flexWrap="wrap">
              {data.tags.map((tag) => (
                <MIChip
                  key={tag}
                  label={tag}
                  fontType="body2M14"
                  sx={{ height: '28px', padding: '4px 8px', backgroundColor: '#E9ECEF', color: '#212529', borderRadius: '100px' }}
                  disableHover
                />
              ))}
            </Stack>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          sx={{
            position: 'relative',
            mt: '4px',
            bgcolor: 'commonColor.White',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '1px',
              bgcolor: '#DEE2E6',
              pointerEvents: 'none',
              zIndex: 1,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              top: '100%',
              height: '12px',
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0))',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)',
              WebkitMaskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskImage: 'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)',
              maskSize: '100% 100%',
              maskRepeat: 'no-repeat',
              opacity: 'var(--mi-scenario-tab-shadow-opacity, 0)',
              /** 0↔1이 220ms 보간되면 스크롤 동기화 시 한 박자 번쩍임처럼 보임 */
              transition: 'none',
              pointerEvents: 'none',
              zIndex: 2,
            },
          }}
        >
          <Tabs
            value={activeSection}
            onChange={handleTabChange}
            slotProps={{
              scroller: {
                style: { overflow: 'visible' },
              },
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              borderBottom: 'none',
              position: 'relative',
              zIndex: 3,
              overflow: 'visible',
              '& .MuiTabs-flexContainer': { alignItems: 'flex-end' },
              '.MuiTabs-indicator': {
                backgroundColor: 'commonColor.Black',
                height: '2px',
                minHeight: '2px',
                bottom: 0,
                zIndex: 2,
              },
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: 1.4,
                color: 'contentText.Black',
                minHeight: 62,
                padding: '20px',
                textTransform: 'none',
                /** 스크롤 스파이가 빠르게 바뀔 때 600↔700 전환이 레이아웃·시각적으로 떨림 — 인디케이터로만 선택 표시 */
                '&.Mui-selected': { color: 'commonColor.Black', fontWeight: 600 },
              },
            }}
          >
            {['시나리오 요약', '시나리오 주요 가정', 'Signpost 모니터링', '관련 이벤트 및 시나리오'].map((label, index) => (
              <Tab key={label} label={label} disableRipple onClick={() => handleTabClick(index)} />
            ))}
          </Tabs>

          <MIBaseButton
            variant="contained"
            prefix={<TokenIcon sx={{ fontSize: 20 }} />}
            disableRipple
            sx={{
              height: '36px',
              position: 'relative',
              zIndex: 3,
            }}
          >
            모델 시뮬레이션
          </MIBaseButton>
        </Stack>
      </Stack>
    </Box>
  )
}

const ScenarioDetailPage = () => {
  const navigate = useNavigate()
  const { setStickyHeader, patchStickyHeaderOptions } = useStickyHeader()
  const data = SCENARIO_DETAIL_MOCK
  const [activeSection, setActiveSection] = useState(0)
  const [isMainScrolled, setIsMainScrolled] = useState(false)
  const [stickyHeightsPx, setStickyHeightsPx] = useState(() => ({
    expanded: SCENARIO_STICKY_HEIGHT_INITIAL_EXPANDED_PX,
    collapsed: SCENARIO_STICKY_HEIGHT_INITIAL_EXPANDED_PX - SCENARIO_STICKY_NAV_ROW_PX,
  }))
  const stickyHeightsRef = useRef(stickyHeightsPx)
  stickyHeightsRef.current = stickyHeightsPx
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const mainScrollCollapsedRef = useRef(false)
  const suppressScrollSpyForTabScrollRef = useRef(false)
  const programmaticScrollGenerationRef = useRef(0)
  const stickyRoIgnoreUntilRef = useRef(0)
  const prevIsMainScrolledForStickyRef = useRef<boolean | null>(null)
  const isMainScrolledRef = useRef(isMainScrolled)
  isMainScrolledRef.current = isMainScrolled

  const syncMainHeaderCollapseState = useCallback((scrollEl: HTMLElement) => {
    const y = scrollEl.scrollTop
    const next = y > 0
    if (next !== mainScrollCollapsedRef.current) {
      mainScrollCollapsedRef.current = next
      setIsMainScrolled(next)
    }
  }, [])

  const syncStickyHeightsFromMeasuredEl = useCallback(() => {
    const root = document.getElementById('main-scroll-wrapper')
    const el = root?.querySelector<HTMLElement>('[data-sticky-header]')
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h < 1) return
    const nav = SCENARIO_STICKY_NAV_ROW_PX
    const next = isMainScrolledRef.current
      ? { expanded: Math.round(h + nav), collapsed: Math.round(h) }
      : { expanded: Math.round(h), collapsed: Math.round(h - nav) }
    setStickyHeightsPx((prev) => {
      if (
        Math.abs(prev.expanded - next.expanded) < STICKY_HEIGHT_MEASURE_EPS_PX &&
        Math.abs(prev.collapsed - next.collapsed) < STICKY_HEIGHT_MEASURE_EPS_PX
      ) {
        return prev
      }
      return next
    })
  }, [])

  useLayoutEffect(() => {
    if (prevIsMainScrolledForStickyRef.current === null) {
      prevIsMainScrolledForStickyRef.current = isMainScrolled
      return
    }
    if (prevIsMainScrolledForStickyRef.current === isMainScrolled) return
    prevIsMainScrolledForStickyRef.current = isMainScrolled
    stickyRoIgnoreUntilRef.current = performance.now() + SCENARIO_LAYOUT_TRANSITION_MS
  }, [isMainScrolled])

  const getStickySectionAlignY = useCallback(
    (scrollEl: HTMLElement) => {
      const sticky = scrollEl.querySelector('[data-sticky-header]')
      if (sticky) return sticky.getBoundingClientRect().bottom

      const collapsed = scrollEl.scrollTop > 0
      const containerRect = scrollEl.getBoundingClientRect()
      const stickyHeight = collapsed ? stickyHeightsPx.collapsed : stickyHeightsPx.expanded
      /** MILayout `paddingTop`과 동기: 접힘 70px / 펼침 106px */
      const headerTop = collapsed ? 70 : 106
      return containerRect.top + headerTop + stickyHeight
    },
    [stickyHeightsPx.collapsed, stickyHeightsPx.expanded],
  )

  const applyScrollSpyActiveSection = useCallback(() => {
    if (suppressScrollSpyForTabScrollRef.current) return
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return

    const stickyLine = getStickySectionAlignY(scrollEl)
    const lastIdx = sectionRefs.current.length - 1
    const lastEl = lastIdx >= 0 ? sectionRefs.current[lastIdx] : null
    const nearDocEnd = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight <= 32

    let next = 0
    sectionRefs.current.forEach((el, i) => {
      if (!el) return
      if (el.getBoundingClientRect().top <= stickyLine + 0.75) next = i
    })
    if (lastEl && nearDocEnd && lastEl.getBoundingClientRect().top > stickyLine + 0.75) {
      next = lastIdx
    }
    setActiveSection((prev) => (prev === next ? prev : next))
  }, [getStickySectionAlignY])

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) {
      scrollEl.scrollTop = 0
      scrollEl.style.setProperty('--mi-scenario-tab-shadow-opacity', '0')
    }
  }, [])

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return undefined
    const onScroll = () => {
      const y = scrollEl.scrollTop
      const next = y > 0
      if (next !== mainScrollCollapsedRef.current) {
        mainScrollCollapsedRef.current = next
        setIsMainScrolled(next)
      }
      scrollEl.style.setProperty('--mi-scenario-tab-shadow-opacity', y > 0 ? '1' : '0')
      applyScrollSpyActiveSection()
    }
    onScroll()
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [applyScrollSpyActiveSection])

  useEffect(() => {
    applyScrollSpyActiveSection()
  }, [applyScrollSpyActiveSection, isMainScrolled])

  const scrollSectionIntoView = useCallback(
    (index: number) => {
      const el = sectionRefs.current[index]
      const scrollEl = document.getElementById('main-scroll-wrapper')
      if (!el || !scrollEl) return

      const computeScrollTopToAlignSection = () => {
        if (index === 0) {
          return 0
        }
        const stickyBottom = getStickySectionAlignY(scrollEl)
        const elRect = el.getBoundingClientRect()
        return Math.max(0, scrollEl.scrollTop + elRect.top - stickyBottom)
      }

      const scrollTarget = computeScrollTopToAlignSection()
      const beforeTop = scrollEl.scrollTop

      if (Math.abs(scrollTarget - beforeTop) < 8) {
        syncMainHeaderCollapseState(scrollEl)
        requestAnimationFrame(() => {
          scrollEl.dispatchEvent(new Event('scroll', { bubbles: true }))
          applyScrollSpyActiveSection()
        })
        return
      }

      programmaticScrollGenerationRef.current += 1
      const generation = programmaticScrollGenerationRef.current
      suppressScrollSpyForTabScrollRef.current = true

      const finishProgrammaticScroll = () => {
        if (generation === programmaticScrollGenerationRef.current) {
          scrollEl.scrollTop = computeScrollTopToAlignSection()
          syncMainHeaderCollapseState(scrollEl)
          suppressScrollSpyForTabScrollRef.current = false
          setActiveSection(index)
          requestAnimationFrame(() => applyScrollSpyActiveSection())
        }
      }

      let finished = false
      const fallbackTimer = {
        id: undefined as ReturnType<typeof globalThis.setTimeout> | undefined,
      }
      const settleOnce = () => {
        if (finished) return
        finished = true
        scrollEl.removeEventListener('scrollend', settleOnce)
        if (fallbackTimer.id !== undefined) globalThis.clearTimeout(fallbackTimer.id)
        finishProgrammaticScroll()
      }

      scrollEl.addEventListener('scrollend', settleOnce, { passive: true })
      fallbackTimer.id = globalThis.setTimeout(settleOnce, 4000)
      scrollEl.scrollTo({ top: scrollTarget, behavior: 'smooth' })
    },
    [applyScrollSpyActiveSection, getStickySectionAlignY, syncMainHeaderCollapseState],
  )

  const handleTabChange = useCallback(
    (_: SyntheticEvent, index: number) => {
      setActiveSection(index)
      scrollSectionIntoView(index)
    },
    [scrollSectionIntoView],
  )

  const handleTabClick = useCallback(
    (index: number) => {
      if (activeSection === index) {
        scrollSectionIntoView(index)
      }
    },
    [activeSection, scrollSectionIntoView],
  )

  useLayoutEffect(() => {
    publishScenarioStickyHeaderVm({
      activeSection,
      isMainScrolled,
      data,
      navigate,
      handleTabChange,
      handleTabClick,
    })
  }, [activeSection, data, handleTabChange, handleTabClick, isMainScrolled, navigate])

  useLayoutEffect(() => {
    setStickyHeader(<ScenarioDetailStickyHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: stickyHeightsRef.current,
    })
    return () => {
      setStickyHeader(null)
      scenarioStickyHeaderVm = null
    }
  }, [setStickyHeader])

  useLayoutEffect(() => {
    syncStickyHeightsFromMeasuredEl()

    let ro: ResizeObserver | null = null
    let cancelled = false
    let raf = 0

    const startObserver = () => {
      if (cancelled) return
      const root = document.getElementById('main-scroll-wrapper')
      const el = root?.querySelector<HTMLElement>('[data-sticky-header]')
      if (!el) return
      syncStickyHeightsFromMeasuredEl()
      ro = new ResizeObserver(() => {
        if (performance.now() < stickyRoIgnoreUntilRef.current) return
        syncStickyHeightsFromMeasuredEl()
      })
      ro.observe(el)
    }

    raf = requestAnimationFrame(startObserver)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [data.name, data.tags, syncStickyHeightsFromMeasuredEl])

  useLayoutEffect(() => {
    const t = globalThis.setTimeout(syncStickyHeightsFromMeasuredEl, SCENARIO_LAYOUT_TRANSITION_MS)
    return () => globalThis.clearTimeout(t)
  }, [isMainScrolled, syncStickyHeightsFromMeasuredEl])

  useLayoutEffect(() => {
    patchStickyHeaderOptions({ stickyHeightsPx })
  }, [patchStickyHeaderOptions, stickyHeightsPx])

  return (
    <Stack maxWidth="1380px" margin="auto" px="12px" position="relative" sx={{ userSelect: 'none', overflowX: 'hidden' }}>
      <Box position="relative">
        <Stack gap="12px">
          <Stack
            ref={(el) => {
              sectionRefs.current[0] = el as HTMLDivElement
            }}
            gap="12px"
            py="30px"
          >
            <SectionHeading title="시나리오 요약" />
            <ScenarioSummarySection data={data.summary} />
          </Stack>
          <Stack
            ref={(el) => {
              sectionRefs.current[1] = el as HTMLDivElement
            }}
            gap="12px"
            pt="30px"
            pb="30px"
          >
            <SectionHeading title="시나리오 주요 가정" />
            <ScenarioKeyPredictionsSection predictions={data.keyPredictions} />
          </Stack>
          <Stack
            ref={(el) => {
              sectionRefs.current[2] = el as HTMLDivElement
            }}
            gap="12px"
            pt="30px"
            pb="30px"
          >
            <SectionHeading title="Signpost 모니터링" />
            <SignpostMonitoringSection rows={data.signposts} />
          </Stack>
          <Stack
            ref={(el) => {
              sectionRefs.current[3] = el as HTMLDivElement
            }}
            gap="12px"
          >
            <SectionHeading title="관련 이벤트 및 시나리오" />
            <RelatedEventsAndScenariosSection events={data.relatedEvents} scenarios={data.relatedScenarios} />
          </Stack>
        </Stack>
      </Box>
    </Stack>
  )
}

export default ScenarioDetailPage
