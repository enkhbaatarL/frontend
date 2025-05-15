import SearchIcon from '@mui/icons-material/Search'
import { Box, FormControlLabel, FormGroup, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import psImg from '@/assets/productsymbol.png'
import shiImg from '@/assets/subheaderinsight.jpg'
import AdminCheckbox from '@/components/admin/AdminCheckbox'
import MIInput from '@/components/common/input/MIInput'
import MIPagination from '@/components/common/pagination/MIPagination'
import MISelect from '@/components/common/select/MISelect'
import InsightsCardBtn from '@/pages/mi/insights/components/InsightsCardBtn'
// import InsightsDocumentItem from '@/pages/mi/insights/components/InsightsDocumentItem'
import insightsService, { IAdvancedFilter, IAdvancedFilterItem } from '@/service/mi/insights'
import useAuthStore from '@/store/useAuthStore'

export type ReportType = 'A_INSIGHT' | 'A_CMMDT_MRKT_RPT' | 'A_CMPY_RPT' | 'A_ASST_RPT' | 'A_DEAL_INSIGHT'
export interface Report {
  type: ReportType
  title: string
  date: string
  source: string
  typeId: string
}

const InsightsPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  // 포커스 목록
  const { data: focusedList } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => await insightsService.getFocusedList({ customerCompanyNo }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
  })

  // 필터
  const { data: filterList } = useQuery({
    queryKey: ['filterList'],
    queryFn: async () => await insightsService.getAdvancedFilterData(),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
  })

  const reports = useMemo(() => {
    if (focusedList && Array.isArray(focusedList.data)) {
      return focusedList.data.map((item) => ({
        type: item.goodsDataCategoryCd,
        title: item.goodsDataNm,
        date: item.modifyDt,
        source: item.providerNm,
        typeId: item.goodsDataNo,
      }))
    }
    return []
  }, [focusedList])

  const convertToFilters = (filterList: IAdvancedFilter) => {
    const { documentTypes, providers, languages } = filterList

    const toSnakeCase = (str: string) => str.replace(/\s+/g, '_').replace(/[()]/g, '').toLowerCase()

    const buildOptions = (arr: IAdvancedFilterItem[]) =>
      arr.map((item: IAdvancedFilterItem) => ({
        label: item.codeNm,
        value: toSnakeCase(item.codeNm),
      }))

    return [
      {
        title: 'Document Types',
        options: buildOptions(documentTypes as IAdvancedFilterItem[]),
      },
      {
        title: 'Providers',
        options: buildOptions(providers as IAdvancedFilterItem[]),
      },
      {
        title: 'Languages',
        options: buildOptions(languages),
      },
    ]
  }

  const filters = useMemo(() => {
    if (filterList) {
      return convertToFilters(filterList.data)
    }
    return []
  }, [filterList])

  return (
    <>
      <Box
        paddingY={14}
        sx={{
          background: `url(${psImg}) right / 33% no-repeat, url(${shiImg}) lightgray 50% / cover no-repeat`,
          zIndex: 0,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            boxShadow: '0px 20px 20px 0px rgba(0, 0, 0, 0.25) inset',
          }}
        ></Box>
        <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
          <Typography color="white" component="h1" fontSize={40} variant="body1M16">
            Insights
          </Typography>
          <Typography color="#DCDCDC" fontSize={20} lineHeight={1.6} variant="subtext1">
            Stay informed, stay ahead
          </Typography>
        </Box>
      </Box>
      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'} py={12.5} px={7.5}>
        <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
          Focused
        </Typography>
        <Grid mb={17.5} container spacing={6}>
          {reports?.map((report, index) => (
            <Grid size={3} key={index}>
              <InsightsCardBtn index={index} report={report} />
            </Grid>
          ))}
        </Grid>

        <Box pb={6} mb={9} borderBottom={'1px solid'} borderColor={'gray.30'}>
          <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
            Insights
          </Typography>
          <MIInput
            width={458}
            maxWidth={'100%'}
            placeholder="Search for insights"
            size="h46"
            startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
          />
        </Box>
        <Grid
          container
          sx={{
            flexDirection: 'row',
          }}
          wrap={'nowrap'}
          gap={6}
        >
          <Box flexGrow={1}>
            <Grid mb={6} width={334} container direction={'row'} wrap={'nowrap'} gap={3.5}>
              <MISelect
                minWidth={160}
                fullWidth
                options={[
                  {
                    label: 'Newest',
                    value: 'Newest',
                  },
                  {
                    label: 'Newest1',
                    value: 'Newest1',
                  },
                ]}
              />
              <MISelect
                minWidth={160}
                fullWidth
                options={[
                  {
                    label: 'All dates',
                    value: 'All',
                  },
                  {
                    label: 'Dates 1',
                    value: 'Dates',
                  },
                  {
                    label: 'Dates 2',
                    value: 'Dates2',
                  },
                ]}
              />
            </Grid>
            {/* <Grid container direction={'column'} gap={8}>
              {dump.map((report, index) => (
                <InsightsDocumentItem key={index} report={report} />
              ))}
            </Grid> */}
            <MIPagination />
          </Box>
          <Box
            flexShrink={0}
            sx={{
              width: 346,
            }}
          >
            <Grid container border={'1px solid'} borderColor={'gray.30'} borderRadius={1} gap={6} padding={6} flexShrink={0}>
              {filters?.map((section) => (
                <Box key={section.title}>
                  <Typography mb={3.5} color="gray.90" component="h2" variant="titleBox">
                    {section.title}
                  </Typography>
                  <FormGroup>
                    {section.options.map((option: { label: string; value: string }) => (
                      <FormControlLabel
                        key={option.value}
                        sx={{
                          p: '6.82px 8px',
                          mr: 0,
                          '.MuiTypography-root': { fontSize: '16px', lineHeight: 1.4 },
                        }}
                        control={<AdminCheckbox value={option.value} />}
                        label={option.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Box>
    </>
  )
}

export default InsightsPage
