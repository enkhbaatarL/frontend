import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { Dayjs } from 'dayjs'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import bshImg from '@/assets/bgsubheader.png'
import MIButton from '@/components/common/button/MIButton'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import ChartComponent from '@/pages/mi/dataVisualization/components/ChartComponent'
import DescriptionComponent from '@/pages/mi/dataVisualization/components/DescriptionComponent'
import DocumentComponent from '@/pages/mi/dataVisualization/components/DocumentComponent'
import DocumentInfoComponent from '@/pages/mi/dataVisualization/components/DocumentInfoComponent'

const DataVisualizationPage = () => {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const handleDateChange = ({ startDate, endDate }: { startDate: Dayjs | null; endDate: Dayjs | null }) => {
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

  return (
    <>
      <Box paddingX={7.5} paddingY={21} sx={{ background: ` url(${bshImg}) lightgray 50% / cover no-repeat` }}>
        <Box maxWidth={'1380px'} margin={'auto'}>
          <Typography color="white" variant="body1M16">
            Insight
          </Typography>
          <Typography color="white" component="h1" lineHeight={1.2} mb={7.5} mt={1} variant="titleSubheader">
            Eye on the tiger: how higher Indian economic growth could impact global energy markets
          </Typography>
          <Grid container alignItems="center">
            <Typography color="white" variant="subtext1">
              March 19, 2025
            </Typography>
            <MILine length={14} margin="0 14px" direction="vertical" backgroundColor="gray.50" />
            <Typography color="white" variant="subtext1">
              Wood Mackenzie
            </Typography>
          </Grid>
        </Box>
      </Box>
      <Box maxWidth={'1380px'} margin={'auto'} paddingTop={10} paddingX={7.5}>
        <Grid
          sx={{
            flexWrap: {
              xs: 'wrap',
              md: 'nowrap',
            },
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
                          <MIDateRangePicker onChange={handleDateChange} />
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
              width: {
                xs: '100%',
                md: '286px',
              },
            }}
            container
            gap={6}
            direction="column"
            flexShrink={0}
          >
            {!hideComponent.includes('document') && <DocumentComponent />}
            <DocumentInfoComponent />
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

export default DataVisualizationPage
