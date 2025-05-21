import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { isArray } from 'lodash'
import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import bshImg from '@/assets/bgsubheader.png'
import MIButton from '@/components/common/button/MIButton'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import ChartComponent from '@/pages/mi/dataDetail/components/ChartComponent'
import DescriptionComponent from '@/pages/mi/dataDetail/components/DescriptionComponent'
import DocumentComponent from '@/pages/mi/dataDetail/components/DocumentComponent'
import DocumentInfoComponent from '@/pages/mi/dataDetail/components/DocumentInfoComponent'
import dataDetailService from '@/service/mi/dataDetail'

const DataDetailPage = () => {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const { goodsNo, goodsDataNo } = useParams()

  // 데이터 정보
  const { data: productData } = useQuery({
    queryKey: ['productData', goodsNo, goodsDataNo],
    queryFn: () => dataDetailService.getProductData(Number(goodsNo), Number(goodsDataNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
  })

  // 비정형데이터 목록
  const { data: productDataUnstructuredData } = useQuery({
    queryKey: ['productDataUnstructuredData', goodsNo, goodsDataNo],
    queryFn: () => dataDetailService.getProductDataUnstructuredDataList(Number(goodsNo), Number(goodsDataNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
  })

  // 정형데이터 목록
  // const { data: productDataStructuredData } = useQuery({
  //   queryKey: ['productDataStructuredData', goodsNo, goodsDataNo],
  //   queryFn: () => dataDetailService.getProductDataStructuredDataList(Number(goodsNo), Number(goodsDataNo)),
  //   refetchOnWindowFocus: 'always',
  //   refetchOnMount: 'always',
  //   gcTime: 0,
  //   staleTime: 0,
  // })

  const handleDateChange = ({ startDate, endDate }: { startDate?: Dayjs; endDate?: Dayjs }) => {
    setStartDate(startDate?.format('YYYYMMDD') ?? '')
    setEndDate(endDate?.format('YYYYMMDD') ?? '')
  }
  const mockTableData = Array.from({ length: 5 }).map((_, index) => ({
    id: index + 1,
    col1: 'value',
    col2: 'value',
    col3: '00,000',
    col4: '00,000',
    col5: '00,000',
    col6: '00,000',
    col7: '00,000',
  }))

  const [searchParams] = useSearchParams('')
  const hideComponent = searchParams.getAll('hide')

  const formatDate = useMemo(() => {
    const date = new Date(productData?.auditInfo?.modifyDt.replace(' ', 'T') ?? '')

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
  }, [productData])

  const convertUnstructuredDataToStructuredData = useMemo(() => isArray(productDataUnstructuredData)
    ? productDataUnstructuredData.map((item) => ({
      title: item.fileName,
      date: dayjs(item.auditInfo.modifyDt).format('YYYY-MM-DD'),
      format: item.extension,
      isPdfViewable: item.isPdfViewable,
      isDownloadable: productData?.isDownloadable ?? false,
      fileNo: item.fileNo,
    }))
    : [], [productDataUnstructuredData, productData])

  return (
    <>
      {productData && (
        <Box paddingY={21} sx={{ background: ` url(${bshImg}) lightgray 50% / cover no-repeat` }}>
          <Box paddingX={7.5} boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
            {/* <Typography color="white" variant="body1M16">
              Insight
            </Typography> */}
            <Typography color="white" component="h1" lineHeight={1.2} mb={7.5} mt={1} variant="titleSubheader">
              {productData.goodsDataNm}
            </Typography>
            <Grid container alignItems="center">
              <Typography color="white" variant="subtext1">
                {formatDate}
              </Typography>
              <MILine length={14} margin="0 14px" direction="vertical" backgroundColor="gray.50" />
              <Typography color="white" variant="subtext1">
                {productData.providerNm}
              </Typography>
            </Grid>
          </Box>
        </Box>
      )}
      <Box boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'} paddingTop={10} paddingX={7.5}>
        <Grid
          sx={{
            flexWrap: 'nowrap',
          }}
          direction="row"
          container
          gap={6}
        >
          <Grid container direction="column" flexGrow={1} gap={9.5}>
            {!hideComponent.includes('charttable') && (
              <>
                <ChartComponent />
                <Box width={'100%'}>
                  <MITableUser
                    tableHeader={
                      <Grid container justifyContent="space-between">
                        <Box maxWidth={465}>
                          <MIDateRangePicker onChange={handleDateChange} startDate={startDate} endDate={endDate} />
                        </Box>
                        <MIButton
                          toolTip={'엑셀 다운로드'}
                          type="outlined"
                          color="gray"
                          contentType="icon"
                          startIcon={<FileDownloadIcon />}
                          onClick={() => console.log(startDate, endDate)}
                        />
                      </Grid>
                    }
                    tableProps={{
                      disableHover: true,
                      noRowMessage: '등록된 내용이 없습니다.',
                      columns: [
                        {
                          field: 'col1',
                          headerName: 'value',
                          flex: 1,
                          renderCell: (param) => <MITableCell value={param.value} typography={{ variant: 'tableBody1' }} />,
                        },
                        { field: 'col2', headerName: 'value', flex: 1 },
                        { field: 'col3', headerName: 'value', flex: 1, align: 'right' },
                        { field: 'col4', headerName: 'value', flex: 1, align: 'right' },
                        { field: 'col5', headerName: 'value', flex: 1, align: 'right' },
                        { field: 'col6', headerName: 'value', flex: 1, align: 'right' },
                        { field: 'col7', headerName: 'value', flex: 1, align: 'right' },
                      ],
                      rowId: 'id',
                      rows: mockTableData,
                    }}
                  />
                </Box>
              </>
            )}
            {!hideComponent.includes('description') && !hideComponent.includes('charttable') && <MILine />}
            {!hideComponent.includes('description') && <DescriptionComponent />}

            {hideComponent.includes('description') && hideComponent.includes('charttable') && (
              <Box
                display={'flex'}
                borderBottom={'1px solid'}
                borderColor={'gray.30'}
                alignItems={'center'}
                justifyContent={'center'}
                bgcolor={'gray.5'}
                textAlign={'center'}
                height={800}
              >
                <Box display="flex" flexDirection="column" rowGap="10px" alignItems="center">
                  <ErrorOutlineIcon />
                  <Typography variant="body3SB12" color="gray.60">
                    이 콘텐츠는 본문을 제공하지 않습니다.
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
          <Grid
            sx={{
              width: '286px',
            }}
            container
            gap={6}
            direction="column"
            flexShrink={0}
          >
            {convertUnstructuredDataToStructuredData && <DocumentComponent data={convertUnstructuredDataToStructuredData} />}
            {productData && <DocumentInfoComponent data={productData} />}
            <Typography color="gray.60" component="div" variant="body2R14">
              This document is the property of LSEG, and unauthorized reproduction or distribution is prohibited; prior approval is required
              via mi.admin@sk.com. The content is provided for informational purposes only, and Market Intelligence bears no responsibility
              for errors or damages.
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default DataDetailPage
