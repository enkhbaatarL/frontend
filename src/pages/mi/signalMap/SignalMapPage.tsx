import { Box, Tooltip, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import smImg from '@/assets/product_symbol_hover.png'
import MIColorRange from '@/components/common/colorrange/MIColorRange'
import InfoIcon from '@/components/common/icons/table/InfoIconMedium'
import MISelect from '@/components/common/select/MISelect'
import MISignalMap from '@/components/common/signal-map/MISignalMap'
import { MIBaseSkeleton, SkeletonWrapper } from '@/components/mi/MIBaseSkeleton.tsx'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import signalMapService, { MapCategory } from '@/service/mi/signalMap'
import useAuthStore from '@/store/useAuthStore'

interface SectionHeaderProps {
  title: string
  itemCount: number
  subCategories?: string
  boldTitle?: boolean
}

const SectionHeader = ({ title, itemCount, subCategories, boldTitle = false }: SectionHeaderProps) => (
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="end"
    paddingBottom="6px"
    borderBottom="1px solid"
    borderColor={boldTitle ? 'coolGray.70' : 'gray.30'}
  >
    <Typography color="gray.90" variant={boldTitle ? 'heading3' : 'heading4'}>
      {title}
    </Typography>
    <Box display="flex" alignItems="center">
      <Typography color="gray.70" variant={boldTitle ? 'subtext3' : 'subtext4'}>
        {itemCount} Items
      </Typography>
      {subCategories && (
        <>
          <img width={2} height={2} style={{ marginLeft: '6px', marginRight: '6px' }} src={smImg} alt="" />
          <Typography color="gray.70" variant={boldTitle ? 'subtext3' : 'subtext4'}>
            {subCategories} Sub-categories
          </Typography>
        </>
      )}
    </Box>
  </Box>
)

/**
 * 루트 목록을 줄(row) 단위로 그룹핑합니다.
 * - 기본: 루트마다 단독 줄
 * - 예외: 현재 루트와 다음 루트의 하위 항목이 각각 1개이면 같은 줄에 배치
 */
const groupRootsIntoRows = (roots: MapCategory[]): MapCategory[][] => {
  const rows: MapCategory[][] = []
  let i = 0
  while (i < roots.length) {
    const current = roots[i]
    const next = roots[i + 1]
    if (current.items.length === 1 && next && next.items.length === 1) {
      rows.push([current, next])
      i += 2
    } else {
      rows.push([current])
      i += 1
    }
  }
  return rows
}

const SignalMapPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const { i18n, t } = useTranslation()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const [period, setPeriod] = useState<string>('')
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [isRenderingComplete, setIsRenderingComplete] = useState(false)
  const [hasInitialData, setHasInitialData] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

  const { data: periodOptions = [], isLoading: periodOptionsIsLoading } = useQuery({
    queryKey: ['getPeriodsFilters', i18n.language],
    queryFn: async () => await signalMapService.getPeriodsFilters(customerCompanyNo),
    select: (res) => res.data.map((m) => ({ label: m.codeNm, value: m.codeId })),
  })

  const { data: companyOptions = [], isLoading: companyOptionsIsLoading } = useQuery({
    queryKey: ['getCompanyFilters', i18n.language],
    queryFn: async () => await signalMapService.getCompanyFilters(customerCompanyNo),
    select: (res) => res.data.map((m) => ({ label: m.codeNm, value: m.codeId })),
  })

  const normalizeTopImpact = (signalData: any) => {
    if (!signalData?.topImpactVariables) return null
    return [
      {
        categoryName: 'Top Impact Variables',
        items: [
          {
            categoryName: 'All Factors',
            items: signalData?.topImpactVariables,
          },
        ],
      },
    ]
  }

  // 메인 데이터 쿼리 - 초기화가 완료된 후에만 실행
  const { data: signalData, isLoading: signalDataIsLoading } = useQuery({
    queryKey: ['getSignalMapData', period, companyFilter, i18n.language],
    queryFn: async () => await signalMapService.getSignalMapData(customerCompanyNo, { period, filter: companyFilter }),
    enabled: isInitialized && (!!period || !!companyFilter),
    select: (res) => {
      const topImpactVariables = normalizeTopImpact(res.data)
      return {
        ...res.data,
        topImpactVariables,
      }
    },
  })

  useEffect(() => {
    // 언어 변경 시 상태 초기화
    if (i18n.language !== currentLanguage) {
      setPeriod('')
      setCompanyFilter('')
      setIsRenderingComplete(false)
      setHasInitialData(false)
      setIsInitialized(false)
      setCurrentLanguage(i18n.language)
    }
  }, [i18n.language, currentLanguage])

  useEffect(() => {
    if (periodOptions.length > 0 && companyOptions.length > 0 && !isInitialized) {
      setPeriod(periodOptions[0]?.value ?? '')
      setCompanyFilter(companyOptions[0]?.value ?? '')
      setIsInitialized(true)
    }
  }, [periodOptions, companyOptions, isInitialized])

  useEffect(() => {
    setIsRenderingComplete(false)
  }, [period, companyFilter])

  useLayoutEffect(() => {
    if (signalData && !signalDataIsLoading) {
      setIsRenderingComplete(true)
      setHasInitialData(true)
    }
  }, [signalData, signalDataIsLoading])

  const isActuallyLoading = useMemo(
    () => periodOptionsIsLoading || companyOptionsIsLoading || (signalDataIsLoading && !hasInitialData),
    [periodOptionsIsLoading, companyOptionsIsLoading, signalDataIsLoading, hasInitialData],
  )

  return (
    <MISkeleton variant={'signalMap'} loading={isActuallyLoading}>
      {!isRenderingComplete ? (
        <Box
          minWidth={'1380px'}
          width={'1380px'}
          margin={'auto'}
          display={'flex'}
          flexDirection={'column'}
          gap={'10px'}
          height={'96px'}
          alignItems={'center'}
          marginBottom={'40px'}
          marginTop={'50px'}
        >
          <MIBaseSkeleton.InputField width={'806px'} height={'56px'} />
          <MIBaseSkeleton.BaseElement2 width={'482px'} height={'30px'} />
        </Box>
      ) : (
        <Box paddingX={7.5} paddingTop="50px" paddingBottom="40px" textAlign="center">
          <Typography color="gray.90" variant="heading0">
            {signalData?.title}
          </Typography>
          <br />
          <Typography color="#495057" variant="subtext0">
            {t('signalMap.title')}
            <Tooltip title={t('signalMap.tooltipTitle')} arrow>
              <InfoIcon style={{ display: 'inline-block', transform: 'translateX(2px) translateY(3px)' }} />
            </Tooltip>
          </Typography>
        </Box>
      )}
      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin="auto">
        <Box
          paddingTop="24px"
          paddingBottom="20px"
          borderTop="1px solid"
          borderColor="gray.30"
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'start',
            gap: '14px',
          }}
        >
          <Box display={'flex'} gap="14px">
            <MISelect
              value={period}
              sizeSelect="h40"
              useAllOption
              width={160}
              type={'button'}
              onChange={(e) => setPeriod(e.target.value as string)}
              options={periodOptions}
            />
            {companyOptions.length !== 0 && (
              <MISelect
                value={companyFilter}
                sizeSelect="h40"
                width={160}
                useAllOption
                type={'button'}
                onChange={(e) => setCompanyFilter(e.target.value as string)}
                options={companyOptions}
              />
            )}
          </Box>
          <MIColorRange />
        </Box>
        {customerCompanyNo !== 2015 &&
          groupRootsIntoRows(signalData?.topImpactVariables ?? []).map((row, rowIdx) => (
            <Box
              key={rowIdx}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '24px',
                mb: 5,
              }}
            >
              {row.map((root, colIdx) => (
                <Box key={colIdx} mb={6}>
                  <Box mb={5}>
                    <SectionHeader title={root.categoryName} itemCount={root.items.length} boldTitle />
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.min(root.items.length, 2)}, 1fr)`,
                      gap: '24px',
                    }}
                  >
                    {root.items.map((subCategory, cateIdx) => (
                      <Box key={cateIdx}>
                        <SectionHeader title={subCategory.categoryName} itemCount={subCategory.items.length} />
                        <Box height="460px" marginTop="6px">
                          <MISignalMap mapData={subCategory.items} useAnimation />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        {groupRootsIntoRows(signalData?.list ?? []).map((row, rowIdx) => {
          const isSingleSubItem = row.every((root) => root.items.length === 1)
          return (
            <Box
              key={rowIdx}
              sx={{
                display: 'grid',
                gridTemplateColumns: isSingleSubItem ? 'repeat(2, 1fr)' : '1fr',
                gap: '24px',
                mb: 5,
              }}
            >
              {row.map((root, colIdx) => (
                <Box key={colIdx} mb={6}>
                  <Box mb={5}>
                    <SectionHeader title={root.categoryName} itemCount={root.items.length} boldTitle />
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.min(root.items.length, 2)}, 1fr)`,
                      gap: '24px',
                    }}
                  >
                    {root.items.map((subCategory, cateIdx) => (
                      <Box key={cateIdx}>
                        <SectionHeader title={subCategory.categoryName} itemCount={subCategory.items.length} />
                        <Box height="460px" marginTop="6px">
                          <MISignalMap mapData={subCategory.items} useAnimation />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )
        })}
        {!isRenderingComplete && (
          <Box
            minWidth={'1380px'}
            width={'1380px'}
            margin={'auto'}
            display={'flex'}
            flexDirection={'column'}
            gap={'20px'}
            height={'1159px'}
          >
            <Box width={'1380px'} height={'916px'} gap={'20px'} paddingBottom={'17px'}>
              <SkeletonWrapper.Row gap={'24px'} sx={{ paddingBottom: '20px' }}>
                <MIBaseSkeleton.BaseElement2 width={'678px'} height={'37px'} />
                <MIBaseSkeleton.BaseElement2 width={'678px'} height={'37px'} />
              </SkeletonWrapper.Row>
              <SkeletonWrapper.Grid columns={2} gap={'24px'} sx={{ paddingBottom: '20px' }}>
                <MIBaseSkeleton.BaseElement2 width={'678px'} height={'497px'} />
                <MIBaseSkeleton.BaseElement2 width={'678px'} height={'497px'} />
                <MIBaseSkeleton.BaseElement2 width={'678px'} height={'497px'} />
                <MIBaseSkeleton.BaseElement2 width={'678px'} height={'497px'} />
              </SkeletonWrapper.Grid>
            </Box>
          </Box>
        )}
      </Box>
    </MISkeleton>
  )
}

export default SignalMapPage
