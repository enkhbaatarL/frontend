import { Box, Grid2 as Grid, Typography } from '@mui/material'

import ShowChartIcon from '@/components/common/icons/ShowChartIcon'
import MISelect from '@/components/common/select/MISelect'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import { useMockDataHistory } from '@/hooks/useMockDataHistory'

const HistoryComponent = () => {
  const { data } = useMockDataHistory()

  return (
    <Box>
      <Box paddingTop={7.5} paddingBottom={10} textAlign="center">
        <Typography component={'div'} color="gray.90" variant="heading0">
          HHP Forecast
        </Typography>
        <Typography component={'div'} color="#495057" variant="subtext0">
          Forecasted by SK AI Market Intelligence Model
        </Typography>
      </Box>
      <Grid container flexWrap={'nowrap'} gap={2.5} mb={6}>
        <MISelect
          width={180}
          options={[
            { label: 'Value 1', value: 'Value 1' },
            { label: 'Value 2', value: 'Value 2' },
            { label: 'Value 3', value: 'Value 3' },
          ]}
        />
        <MISelect
          width={180}
          options={[
            { label: 'Value 1', value: 'Value 1' },
            { label: 'Value 2', value: 'Value 2' },
            { label: 'Value 3', value: 'Value 3' },
          ]}
        />
        <MISelect
          width={180}
          options={[
            { label: 'Value 1', value: 'Value 1' },
            { label: 'Value 2', value: 'Value 2' },
            { label: 'Value 3', value: 'Value 3' },
          ]}
        />
        <MISelect
          width={180}
          options={[
            { label: 'Value 1', value: 'Value 1' },
            { label: 'Value 2', value: 'Value 2' },
            { label: 'Value 3', value: 'Value 3' },
          ]}
        />
      </Grid>
      <MITableUser
        tableProps={{
          noRowMessage: '등록된 내용이 없습니다.',
          columns: [
            {
              field: 'month',
              headerName: '기원월',
              flex: 1,
              renderCell: (param) => <MITableCell value={param.value} typography={{ variant: 'tableBody1' }} />,
            },
            {
              field: 'forecast',
              headerName: 'Forecast',
              align: 'right',
              flex: 1,
              renderCell: (param) => <MITableCell value={param.value.toLocaleString('ko-KR')} typography={{ variant: 'tableBody2' }} />,
            },
            {
              field: 'actual',
              headerName: 'Actual',
              align: 'right',
              flex: 1,
              renderCell: (param) => <MITableCell value={param.value.toLocaleString('ko-KR')} typography={{ variant: 'tableBody2' }} />,
            },
            {
              field: 'm1',
              headerName: 'HHP M1',
              align: 'right',
              flex: 1,
              renderCell: (param) => <MITableCell value={param.value.toLocaleString('ko-KR')} typography={{ variant: 'tableBody2' }} />,
            },
            {
              field: 'm2',
              headerName: 'HHP M2',
              align: 'right',
              flex: 1,
              renderCell: (param) => <MITableCell value={param.value.toLocaleString('ko-KR')} typography={{ variant: 'tableBody2' }} />,
            },
            {
              field: 'm3',
              headerName: 'HHP M3',
              align: 'right',
              flex: 1,
              renderCell: (param) => <MITableCell value={param.value.toLocaleString('ko-KR')} typography={{ variant: 'tableBody2' }} />,
            },
            {
              field: 'error',
              headerName: '오차율',
              align: 'right',
              flex: 1,
              renderCell: (param) => (
                <MITableCell
                  value={`${param.value > 0 ? '+' : ''}${param.value.toFixed(2)}%`}
                  typography={{
                    variant: 'tableBody2',
                    color: param.value > 0 ? 'chart.green6' : param.value < 0 ? 'chart.red4' : 'gray.90',
                  }}
                />
              ),
            },
            {
              field: 'report',
              headerName: '리포트',
              align: 'center',
              flex: 1,
              renderCell: (param) => (
                <Typography variant={'tableBody2'} color={'gray.90'}>
                  <ShowChartIcon style={{ color: 'content.iconEnabled', verticalAlign: 'sub', marginRight: '8px' }} />
                  {param.value}
                </Typography>
              ),
            },
          ],
          rowId: 'month',
          rows: data,
        }}
      />
    </Box>
  )
}

export default HistoryComponent
