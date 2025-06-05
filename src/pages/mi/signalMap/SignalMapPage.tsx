import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import chunk from 'lodash-es/chunk'
import { useEffect, useMemo, useState } from 'react'

import smImg from '@/assets/product_symbol_hover.png'
import MIColorRange from '@/components/common/colorrange/MIColorRange'
import MISelect from '@/components/common/select/MISelect'
import MISignalMap from '@/components/common/signal-map/MISignalMap'
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

const SignalMapPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0
  const [fakeLoading, setFakeLoading] = useState<boolean>(true)

  const [period, setPeriod] = useState<string>('')
  const [companyFilter, setCompanyFilter] = useState<string>('')

  const { data: periodOptions = [] } = useQuery({
    queryKey: ['getPeriodsFilters'],
    queryFn: async () => await signalMapService.getPeriodsFilters(customerCompanyNo),
    select: (res) => res.data.map((m) => ({ label: m.codeNm, value: m.codeId })),
  })

  const { data: companyOptions = [] } = useQuery({
    queryKey: ['getCompanyFilters'],
    queryFn: async () => await signalMapService.getCompanyFilters(customerCompanyNo),
    select: (res) => res.data.map((options) => ({ label: options, value: options })),
  })

  const { data: signalData } = useQuery({
    queryKey: ['getSignalMapData', period, companyFilter],
    queryFn: async () => await signalMapService.getSignalMapData(customerCompanyNo, { period }),
    enabled: !!period,
    select: (res) => res.data,
  })

  useEffect(() => {
    if (signalData) setFakeLoading(false)
  }, [signalData])

  const getSortedList = (list?: MapCategory[]) => {
    if (!list) return []
    return list.sort((a, b) => a.categoryName.localeCompare(b.categoryName))
  }

  const formattedDate = useMemo(() => {
    if (!signalData?.updatedDt) return ''
    return `Updated ${dayjs(signalData?.updatedDt).format('MMMM D, YYYY')}`
  }, [signalData?.updatedDt])

  useEffect(() => {
    setPeriod(periodOptions?.[0]?.value ?? '')
  }, [periodOptions])

  useEffect(() => {
    setCompanyFilter(companyOptions?.[0]?.value ?? '')
  }, [companyOptions])

  return (
    <MISkeleton variant={'signalMap'} loading={fakeLoading}>
      <Box paddingX={7.5} paddingTop="50px" paddingBottom="40px" textAlign="center">
        <Typography color="gray.90" variant="heading0">
          {signalData?.title}
        </Typography>
        <br />
        <Typography color="#495057" variant="subtext0">
          {formattedDate}
        </Typography>
      </Box>
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
              width={160}
              useAllOption
              onChange={(e) => setPeriod(e.target.value as string)}
              options={periodOptions}
            />
            {companyOptions.length !== 0 && (
              <MISelect
                value={companyFilter}
                sizeSelect="h40"
                width={160}
                useAllOption
                onChange={(e) => setCompanyFilter(e.target.value as string)}
                options={companyOptions}
              />
            )}
          </Box>
          <MIColorRange />
        </Box>
        {chunk(getSortedList(signalData?.list), 2).map((row, rowIdx) => (
          <Box
            key={rowIdx}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '24px',
              mb: 5,
            }}
          >
            {row.map((root, colIdx) => {
              const subItems = root?.items.sort((a, b) => a.categoryName.localeCompare(b.categoryName))
              return (
                <Box key={colIdx}>
                  <Box mb={5}>
                    <SectionHeader title={root.categoryName} itemCount={root.items.length} boldTitle />
                  </Box>
                  {subItems.map((subCatogory, cateIdx) => (
                    <Box mb={6} key={cateIdx}>
                      <SectionHeader title={subCatogory.categoryName} itemCount={subCatogory.items.length} />
                      <Box height="460px" marginTop="6px">
                        <MISignalMap mapData={subCatogory.items} useAnimation />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
    </MISkeleton>
  )
}

export default SignalMapPage
