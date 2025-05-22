import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { isArray } from 'lodash'
import { SetStateAction, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import bshImg from '@/assets/bgsubheader.png'
import MIButton from '@/components/common/button/MIButton'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
// import ChartComponent from '@/pages/mi/dataDetail/components/ChartComponent'
import queryClient from '@/lib/queryClient'
import DescriptionComponent from '@/pages/mi/dataDetail/components/DescriptionComponent'
import DocumentComponent from '@/pages/mi/dataDetail/components/DocumentComponent'
import DocumentInfoComponent from '@/pages/mi/dataDetail/components/DocumentInfoComponent'
import dataDetailService from '@/service/mi/dataDetail'

const DataDetailPage = () => {
  const [startDate, setStartDate] = useState<string>(dayjs().subtract(1, 'month').format('YYYYMMDD'))
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYYMMDD'))
  const { goodsNo, goodsDataNo } = useParams()
  const [rawSize, setRawSize] = useState<number>(10)
  const [rawPage, setRawPage] = useState<number>(1)
  const [goodsDataSourceNo, setGoodsDataSourceNo] = useState<number>()

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
  const { data: productDataStructuredData } = useQuery({
    queryKey: ['productDataStructuredData', goodsNo, goodsDataNo],
    queryFn: () => dataDetailService.getProductDataStructuredDataList(Number(goodsNo), Number(goodsDataNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
  })

  // 정형데이터 raw 목록
  const { data: productDataStructuredRawData } = useQuery({
    queryKey: ['productDataStructuredRawData', goodsNo, goodsDataNo, goodsDataSourceNo, rawPage, rawSize, startDate, endDate],
    queryFn: () =>
      dataDetailService.getProductDataStructuredRawData(Number(goodsNo), Number(goodsDataNo), Number(goodsDataSourceNo), {
        page: rawPage,
        size: rawSize,
        startDate,
        endDate,
      }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    enabled: !!goodsDataSourceNo,
  })

  const handleDateChange = ({ startDate, endDate }: { startDate?: Dayjs; endDate?: Dayjs }) => {
    setStartDate(startDate?.format('YYYYMMDD') ?? '')
    setEndDate(endDate?.format('YYYYMMDD') ?? '')
  }

  const [searchParams] = useSearchParams('')
  const hideComponent = searchParams.getAll('hide')

  const [field, setField] = useState([])

  const formatDate = useMemo(() => {
    const date = new Date(productData?.auditInfo?.modifyDt.replace(' ', 'T') ?? '')

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
  }, [productData])

  const convertUnstructuredDataToStructuredData = useMemo(
    () =>
      isArray(productDataUnstructuredData)
        ? productDataUnstructuredData.map((item) => ({
          title: item.fileName,
          date: dayjs(item.auditInfo.modifyDt).format('YYYY-MM-DD'),
          format: item.extension,
          isPdfViewable: item.isPdfViewable,
          isDownloadable: productData?.isDownloadable ?? false,
          fileNo: item.fileNo,
        }))
        : [],
    [productDataUnstructuredData, productData],
  )

  const columns = useMemo(
    () =>
      productDataStructuredRawData?.headers?.map((item) => ({
        field: item?.field,
        headerName: item?.name,
        flex: 1,
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <MITableCell value={params.value} typography={{ variant: 'tableBody1' }} />,
      })),
    [productDataStructuredRawData],
  )

  const rows = useMemo(() => {
    if (!columns || !productDataStructuredRawData) return []
    return productDataStructuredRawData.detail.map((item, index) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: Record<string, any> = { id: index }
      field.forEach((key, index) => {
        row[key] = item.cells[index]
      })
      return row
    })
  }, [field, productDataStructuredRawData])

  useEffect(() => {
    if (!columns) return
    setField(columns.map((item) => item.field) as SetStateAction<never[]>)
  }, [columns])

  useEffect(() => {
    if (!productDataStructuredData || (isArray(productDataStructuredData) && productDataStructuredData.length === 0)) return
    setGoodsDataSourceNo(isArray(productDataStructuredData) ? productDataStructuredData[0].goodsDataSourceNo : 0)
  }, [productDataStructuredData])

  useEffect(() => {
    if (!goodsDataSourceNo) return
    queryClient.invalidateQueries({
      queryKey: ['productDataStructuredRawData', goodsNo, goodsDataNo, goodsDataSourceNo, rawPage, rawSize, startDate, endDate],
    })
  }, [goodsDataSourceNo])

  return (
    <>
      {productData && (
        <Box paddingY={21} sx={{ background: ` url(${bshImg}) lightgray 50% / cover no-repeat` }}>
          <Box paddingX={7.5} boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
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
                {/* {productDataStructuredData && <ChartComponent />} */}
                {productDataStructuredRawData && (
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
                            // onClick={}
                          />
                        </Grid>
                      }
                      tableProps={{
                        disableHover: true,
                        noRowMessage: '등록된 내용이 없습니다.',
                        columns: columns as GridColDef[],
                        rowId: 'id',
                        rows,
                      }}
                      paginationProps={{
                        data: productDataStructuredRawData,
                        size: rawSize,
                        onPageChange: (page) => setRawPage(page),
                        onSizeChange: (size) => setRawSize(size),
                      }}
                    />
                  </Box>
                )}
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
            {convertUnstructuredDataToStructuredData.length > 0 && <DocumentComponent data={convertUnstructuredDataToStructuredData} />}
            {productData && <DocumentInfoComponent data={productData} />}
            <Typography color="gray.60" component="div" variant="body2R14" fontSize={12}>
              This document is the property of LSEG, and unauthorized reproduction or distribution is prohibited; prior approval is required
              via mi.admin@sk.com. The content is provided for informational purposes only, and Market Intelligence bears no responsibility
              for errors or damages.
            </Typography>
            <Typography color="gray.60" component="div" variant="body2R14" fontSize={12}>
              본 문서는 해당 데이터 제공업체의 자산으로, 사전 승인 없이 복제하거나 배포하는 것은 삼가 주시기 바랍니다. 활용을 원하실 경우,
              관련 관리자에게 사전 문의해 주시기 바랍니다. 본 문서는 참고용 정보를 제공하기 위한 것으로, 내용의 정확성이나 활용 결과에
              대해서는 사용자의 판단과 책임이 요구됩니다.
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default DataDetailPage
