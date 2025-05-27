import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import bshImg from '@/assets/bgsubheader.png'
import MIButton from '@/components/common/button/MIButton'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import queryClient from '@/lib/queryClient'
import ChartComponent from '@/pages/mi/dataDetail/components/ChartComponent'
import DescriptionComponent from '@/pages/mi/dataDetail/components/DescriptionComponent'
import DocumentComponent from '@/pages/mi/dataDetail/components/DocumentComponent'
import DocumentInfoComponent from '@/pages/mi/dataDetail/components/DocumentInfoComponent'
import dataDetailService, { IProductDataStructuredRawData } from '@/service/mi/dataDetail'
import { IPaginationResponse } from '@/types/api'
import { downloadFile } from '@/utils/file'

interface ITableRow {
  id: string
  [key: string]: unknown
}

const DataDetailPage = () => {
  const pathParams = useParams()
  const { state } = useLocation()
  const [goodsDataSourceNo, setGoodsDataSourceNo] = useState<number>()

  const [startDate, setStartDate] = useState<string>(dayjs().subtract(1, 'month').format('YYYYMMDD'))
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYYMMDD'))

  const [rawSize, setRawSize] = useState<number>(10)
  const [rawPage, setRawPage] = useState<number>(1)

  const { goodsNo, goodsDataNo } = useMemo(
    () => ({
      goodsNo: Number(pathParams.goodsNo),
      goodsDataNo: Number(pathParams.goodsDataNo),
    }),
    [pathParams],
  )

  // 데이터 정보
  const { data: productData } = useQuery({
    queryKey: ['productData', goodsNo, goodsDataNo],
    queryFn: () => dataDetailService.getProductData(goodsNo, goodsDataNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 정형데이터 목록
  const { data: structuredDataList } = useQuery({
    queryKey: ['productDataUnstructuredData', goodsNo, goodsDataNo],
    queryFn: () => dataDetailService.getProductDataStructuredDataList(goodsNo, goodsDataNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 비정형데이터 목록
  const { data: unstructuredDataList } = useQuery({
    queryKey: ['productDataStructuredData', goodsNo, goodsDataNo],
    queryFn: () => dataDetailService.getProductDataUnstructuredDataList(goodsNo, goodsDataNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const hasStructuredDataList = useMemo(() => (structuredDataList ?? []).length > 0, [structuredDataList])
  const hasUnstructuredData = useMemo(() => (unstructuredDataList ?? []).length > 0, [unstructuredDataList])
  const hasDescription = useMemo(
    () => !!productData?.goodsDataExpn || !!productData?.goodsDataSummaryCntt,
    [productData?.goodsDataExpn, productData?.goodsDataSummaryCntt],
  )

  // 정형데이터 raw 목록
  const { data: rawGoodsData } = useQuery({
    queryKey: ['productDataStructuredRawData', goodsNo, goodsDataNo, goodsDataSourceNo, rawPage, rawSize, startDate, endDate],
    queryFn: () =>
      dataDetailService.getProductDataStructuredRawData(goodsNo, goodsDataNo, goodsDataSourceNo!, {
        page: rawPage,
        size: rawSize,
        startDate,
        endDate,
      }),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!goodsDataSourceNo,
  })

  const handleDateChange = ({ startDate, endDate }: { startDate?: Dayjs; endDate?: Dayjs }) => {
    setStartDate(startDate?.format('YYYYMMDD') ?? '')
    setEndDate(endDate?.format('YYYYMMDD') ?? '')
  }

  const downloadRawData = async () => {
    if (!goodsDataSourceNo) return

    try {
      const response = await dataDetailService.downloadProductDataStructuredRawData(goodsNo, goodsDataNo, goodsDataSourceNo, {
        startDate,
        endDate,
      })

      const fileName = `${productData?.goodsDataNm}_${productData?.goodsDataExpn}_${startDate}_${endDate}.xlsx`
      downloadFile(response.data, fileName)
    } catch (error) {
      console.error(error)
    }
  }

  const formatDate = useMemo(() => {
    const date = new Date(productData?.auditInfo?.modifyDt.replace(' ', 'T') ?? '')

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
  }, [productData])

  const columns = useMemo(
    () =>
      rawGoodsData?.headers?.map(({ field, name }, index) => ({
        field,
        headerName: name,
        flex: 1,
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const cellValue = index === 0 ? dayjs(params.value).format('YYYY-MM-DD') : params.value

          return <MITableCell value={cellValue} typography={{ variant: 'tableBody1' }} />
        },
      })),
    [rawGoodsData],
  )

  const rows = useMemo(() => {
    if (!rawGoodsData?.detail) return []

    return rawGoodsData.detail.map((row: IProductDataStructuredRawData, index: number) => {
      const cells = row.cells.reduce(
        (acc, cell, i) => {
          const header = rawGoodsData.headers?.[i]
          if (header) {
            acc[header.field] = cell
          }
          return acc
        },
        {} as Record<string, unknown>,
      )

      return {
        id: String(index),
        ...cells,
      }
    })
  }, [rawGoodsData])

  useEffect(() => {
    if (!goodsDataSourceNo) return

    queryClient
      .invalidateQueries({
        queryKey: ['productDataStructuredRawData', goodsNo, goodsDataNo, goodsDataSourceNo, rawPage, rawSize, startDate, endDate],
      })
      .then()
  }, [endDate, goodsDataNo, goodsDataSourceNo, goodsNo, rawPage, rawSize, startDate])

  useEffect(() => {
    const routeGoodsDataSourceNo = state?.goodsDataSrcNo
    const firstItemDataSourceNo = structuredDataList?.[0]?.goodsDataSourceNo

    if (routeGoodsDataSourceNo) setGoodsDataSourceNo(routeGoodsDataSourceNo)
    else if (firstItemDataSourceNo) setGoodsDataSourceNo(firstItemDataSourceNo)
  }, [state?.goodsDataSrcNo, structuredDataList])

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
            {hasStructuredDataList && (
              <>
                <ChartComponent
                  goodsNo={goodsNo}
                  goodsDataNo={goodsDataNo}
                  goodsDataSourceNo={goodsDataSourceNo}
                  setGoodsDataSourceNo={setGoodsDataSourceNo}
                  structuredDataList={structuredDataList}
                  modifyDt={productData?.auditInfo?.modifyDt}
                  goodsDataNm={productData?.goodsDataNm}
                  isDownloadable={productData?.isDownloadable}
                />
                {rawGoodsData && (
                  <Box width={'100%'}>
                    <MITableUser<ITableRow>
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
                            onClick={downloadRawData}
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
                        data: rawGoodsData as unknown as IPaginationResponse<ITableRow>,
                        size: rawSize,
                        onPageChange: (page) => setRawPage(page),
                        onSizeChange: (size) => setRawSize(size),
                      }}
                    />
                  </Box>
                )}
                <MILine />
              </>
            )}
            {hasDescription && (
              <DescriptionComponent description={productData?.goodsDataExpn} summary={productData?.goodsDataSummaryCntt} />
            )}
            {!hasStructuredDataList && !hasDescription && (
              <Box
                display={'flex'}
                border={'1px solid'}
                borderColor={'gray.30'}
                borderRadius={'4px'}
                alignItems={'center'}
                justifyContent={'center'}
                bgcolor={'gray.5'}
                textAlign={'center'}
                height={800}
              >
                <Box display="flex" flexDirection="column" rowGap="10px" alignItems="center">
                  <ErrorOutlineIcon />
                  <Typography variant="body3SB12" color="gray.60">
                    {t('이 콘텐츠는 본문을 제공하지 않습니다.')}
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
            {hasUnstructuredData && (
              <DocumentComponent
                data={
                  unstructuredDataList?.map(({ fileNo, fileName, auditInfo, extension, isPdfViewable, isDownloadable, fileSize }) => ({
                    fileNo,
                    fileName,
                    date: dayjs(auditInfo.modifyDt).format('YYYY-MM-DD'),
                    extension,
                    isPdfViewable,
                    isDownloadable,
                    fileSize,
                  })) ?? []
                }
              />
            )}
            {productData && <DocumentInfoComponent data={productData} />}
            <Typography color="gray.60" component="div" variant="body3R12">
              This document is the property of the respective data provider. Please refrain from reproducing or distributing it without
              prior approval. If you wish to use this content, please contact the appropriate administrator in advance. The information
              contained herein is provided for reference purposes only, and users are encouraged to exercise their own judgment and
              responsibility when utilizing it.
            </Typography>
            <Typography color="gray.60" component="div" variant="body3R12">
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
