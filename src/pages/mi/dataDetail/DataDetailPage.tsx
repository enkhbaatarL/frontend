import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import MISkeleton from '@/components/mi/MISkeleton'
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
  const { t } = useTranslation()
  const pathParams = useParams()
  const { state } = useLocation()
  const [goodsDataSourceNo, setGoodsDataSourceNo] = useState<number>()

  const [startDate, setStartDate] = useState<string>(dayjs().subtract(6, 'month').format('YYYYMMDD'))
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYYMMDD'))

  const [rawSize, setRawSize] = useState<number>(50)
  const [rawPage, setRawPage] = useState<number>(1)

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasInitialData, setHasInitialData] = useState(false)

  const { goodsNo, goodsDataNo } = useMemo(
    () => ({
      goodsNo: Number(pathParams.goodsNo),
      goodsDataNo: Number(pathParams.goodsDataNo),
    }),
    [pathParams],
  )

  // 데이터 정보
  const { data: productData, isLoading: productDataIsLoading } = useQuery({
    queryKey: ['productData', goodsNo, goodsDataNo],
    queryFn: () => dataDetailService.getProductData(goodsNo, goodsDataNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 정형데이터 목록
  const { data: structuredDataList, isLoading: structuredDataListIsLoading } = useQuery({
    queryKey: ['productDataUnstructuredData', goodsNo, goodsDataNo],
    queryFn: () => dataDetailService.getProductDataStructuredDataList(goodsNo, goodsDataNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 비정형데이터 목록
  const { data: unstructuredDataList, isLoading: unstructuredDateListIsLoading } = useQuery({
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
  const { data: rawGoodsData, isLoading: rawGoodsDataIsLoading } = useQuery({
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

  const isActuallyLoading = useMemo(
    () =>
      isInitialLoading ||
      productDataIsLoading ||
      structuredDataListIsLoading ||
      unstructuredDateListIsLoading ||
      (rawGoodsDataIsLoading && !hasInitialData),
    [
      isInitialLoading,
      productDataIsLoading,
      structuredDataListIsLoading,
      unstructuredDateListIsLoading,
      rawGoodsDataIsLoading,
      hasInitialData,
    ],
  )

  const handleDateChange = ({ startDate: newStartDate, endDate: newEndDate }: { startDate?: Dayjs; endDate?: Dayjs }) => {
    setStartDate(newStartDate?.format('YYYYMMDD') ?? '')
    setEndDate(newEndDate?.format('YYYYMMDD') ?? '')
  }

  useEffect(() => {
    const initializeData = async () => {
      if (productData && structuredDataList && unstructuredDataList && !hasInitialData) {
        try {
          // 기본 상태 설정이 완료되었음을 표시
          setHasInitialData(true)
        } catch (error) {
          console.error('초기 데이터 로딩 실패:', error)
        } finally {
          setIsInitialLoading(false)
        }
      } else if (productData && structuredDataList !== undefined && unstructuredDataList !== undefined) {
        setIsInitialLoading(false)
        setHasInitialData(true)
      }
    }

    initializeData()
  }, [productData, structuredDataList, unstructuredDataList, hasInitialData])

  useEffect(() => {
    if (rawGoodsData?.detail && rawGoodsData.detail.length > 0) {
      setHasInitialData(true)
    }
  }, [rawGoodsData])

  return (
    <MISkeleton variant={'dataDetail'} loading={isActuallyLoading}>
      {productData && (
        <Box paddingTop={'56px'} paddingBottom={'30px'}>
          <Box paddingX={7.5} boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
            <Typography color="contentText.Normal" variant="subtext1">
              {hasStructuredDataList ? 'Market Metrics' : 'Market Reports'}
            </Typography>
            <Typography paddingTop= {3.5} paddingBottom={6.5} color="contentText.Black" component="h1" lineHeight={1.2} variant="titleSubPage">
              {productData.goodsDataNm}
            </Typography>
            <Grid container alignItems="center">
              <Typography color="contentText.Subtext" variant="subtext1">
                {formatDate}
              </Typography>
              <MILine length={14} margin="0 14px" direction="vertical" backgroundColor="gray.50" />
              <Typography color="contentText.Subtext" variant="subtext1">
                {productData.providerNm}
              </Typography>
            </Grid>
          </Box>
        </Box>
      )}
      <Box boxSizing={'border-box'} minWidth={'1380px'} width={'1380px'} borderTop="1px solid" borderColor="gray.30" margin={'auto'}></Box>
      <Box boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'} paddingTop={10} paddingX={7.5}>
        <Grid
          sx={{
            flexWrap: 'nowrap',
          }}
          direction="row"
          container
          gap={6}
        >
          <Grid container direction="column" flexGrow={1} gap={5}>
            {hasStructuredDataList && (
              <>
                <ChartComponent
                  goodsNo={goodsNo}
                  goodsDataNo={goodsDataNo}
                  goodsDataSourceNo={goodsDataSourceNo}
                  setGoodsDataSourceNo={setGoodsDataSourceNo}
                  structuredDataList={structuredDataList}
                  isDownloadable={productData?.isDownloadable}
                />
                <Grid container justifyContent="space-between" marginTop={5}>
                  <Box maxWidth={465}>
                    <MIDateRangePicker onChange={handleDateChange} startDate={startDate} endDate={endDate} />
                  </Box>
                  <MIButton
                    toolTip={t('dataDetail.excelDownload')}
                    type="outlined"
                    color="gray"
                    contentType="icon"
                    startIcon={<FileDownloadIcon />}
                    onClick={downloadRawData}
                    disabled={!productData?.isDownloadable}
                  />
                </Grid>
                {rawGoodsData && (
                  <Box width={'100%'}>
                    <MITableUser<ITableRow>
                      tableProps={{
                        disableHover: true,
                        noRowMessage: t('dataDetail.noResultsFound'),
                        columns: columns as GridColDef[],
                        rowId: 'id',
                        rows,
                      }}
                      paginationProps={{
                        data: rawGoodsData as unknown as IPaginationResponse<ITableRow>,
                        size: rawSize,
                        onPageChange: (page) => setRawPage(page),
                        onSizeChange: (size) => {
                          setRawSize(size)
                          setRawPage(1)
                        },
                      }}
                    />
                  </Box>
                )}
                {!rawGoodsData && hasInitialData && (
                  <Box>
                    <MIBaseSkeleton.BaseElement2 width={'100%'} height={'497px'} />
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
                    {t('dataDetail.noContentMessage')}
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
          <Grid
            sx={{
              width: '286px',
              maxWidth: '286px',
              minWidth: '286px',
              flexShrink: 0,
            }}
            container
            gap={6}
            direction="column"
          >
            {hasUnstructuredData && (
              <DocumentComponent
                data={
                  unstructuredDataList?.map(({ fileNo, fileName, auditInfo, extension, isPdfViewable, fileSize }) => ({
                    fileNo,
                    fileName,
                    date: dayjs(auditInfo.modifyDt).format('YYYY-MM-DD HH:mm'),
                    extension,
                    isPdfViewable,
                    isDownloadable: productData?.isDownloadable,
                    fileSize,
                  })) ?? []
                }
              />
            )}
            {productData && <DocumentInfoComponent data={productData} />}
            <Typography paddingX={3} color="gray.60" component="div" variant="body3R12">
              This document is the property of the respective data provider. Please refrain from reproducing or distributing it without
              prior approval. If you wish to use this content, please contact the appropriate administrator in advance. The information
              contained herein is provided for reference purposes only, and users are encouraged to exercise their own judgment and
              responsibility when utilizing it.
            </Typography>
            <Typography paddingX={3} color="gray.60" component="div" variant="body3R12">
              {t('dataDetail.disclaimer')}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </MISkeleton>
  )
}

export default DataDetailPage
