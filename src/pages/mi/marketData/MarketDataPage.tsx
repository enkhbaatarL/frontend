import SearchIcon from '@mui/icons-material/Search'
import { Box, Grid2 as Grid, Typography } from '@mui/material'

import MILine from '@/components/common/divider/MILine'
import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table-user/MITableUser'
import { useMockEvents } from '@/hooks/useMockEvents'
import { useMockMarket } from '@/hooks/useMockMarket'
import MarketdataChart from '@/pages/user/marketdata/components/MarketdataChart'
import MarketdataChartSmall from '@/pages/user/marketdata/components/MarketdataChartSmall'

const MarketDataPage = () => {
  const { data } = useMockMarket()
  const { dataEvent } = useMockEvents()

  return (
    <>
      <Box
        paddingX={7.5}
        paddingY={14}
        sx={{
          background:
            'url(\'/src/assets/productsymbol.png\') right / 33% no-repeat, url(\'/src/assets/bgmarket.jpg\') lightgray 50% 82%/ cover no-repeat',
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
        <Box maxWidth={'1380px'} margin={'auto'}>
          <Typography color="white" component="h1" fontSize={40} variant="body1M16">
            Market Data
          </Typography>
          <Typography color="#DCDCDC" fontSize={20} lineHeight={1.6} variant="subtext1">
            Elevate your market understanding with comprehensive data
          </Typography>
        </Box>
      </Box>
      <Box maxWidth={'1380px'} margin={'auto'} py={12.5} px={7.5}>
        <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
          Data Dashboard
        </Typography>
        <Grid mb={17.5} container spacing={5}>
          <Grid width={'100%'} container direction={'row'} gap={5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <MarketdataChart />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MarketdataChart />
            </Grid>
          </Grid>
          <Grid width={'100%'} container direction={'row'} gap={5}>
            <Grid size={{ xs: 6, md: 3 }}>
              <MarketdataChartSmall isClock />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MarketdataChartSmall />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MarketdataChartSmall />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MarketdataChartSmall />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MarketdataChartSmall />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MarketdataChartSmall />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MarketdataChartSmall />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MarketdataChartSmall />
            </Grid>
          </Grid>
        </Grid>
        <Box pb={6} mb={9} borderBottom={'1px solid'} borderColor={'gray.30'}>
          <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
            Data Catalog
          </Typography>
          <MIInput
            width={458}
            maxWidth={'100%'}
            placeholder="Search for Data"
            size="h46"
            startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
          />
        </Box>
        <Grid
          container
          sx={{
            flexDirection: {
              xs: 'column',
              md: 'row',
            },
          }}
          wrap={'nowrap'}
          gap={6}
        >
          <Box flexGrow={1}>
            <Box width={'100%'}>
              <MITableUser
                tableProps={{
                  disabledHover: true,
                  noRowMessage: '등록된 내용이 없습니다.',
                  columns: [
                    {
                      field: 'dataProvider',
                      headerName: 'Data Provider',
                      flex: 1,
                      renderCell: (param) => <MITableCell value={param.value} typography={{ variant: 'tableBody1' }} />,
                    },
                    { field: 'dataName', headerName: 'Data Name', flex: 2 },
                    { field: 'description', headerName: 'Description', flex: 2 },
                    {
                      field: 'lastUpdated',
                      headerName: 'Last Updated',
                      flex: 1,
                      align: 'center',
                      renderCell: (param) => <MITableCell value={param.value} typography={{ variant: 'tableBody2', color: '#868E96' }} />,
                    },
                  ],
                  rowId: 'dataName',
                  rows: data,
                }}
              />
            </Box>
          </Box>
          <Box
            flexShrink={0}
            sx={{
              width: {
                xs: '100%',
                md: 346,
              },
            }}
          >
            <Box border={'1px solid'} borderColor={'gray.30'} borderRadius={1} gap={6} padding={6} flexShrink={0}>
              <Typography mb={2.5} color="gray.90" component="h2" variant="titleBox">
                Recent Viewed
              </Typography>
              {dataEvent.map((item, index) => (
                <Box py={3} borderBottom={index === dataEvent.length - 1 ? 'none' : '1px solid'} borderColor={'gray.30'} key={index}>
                  <Typography color="gray.70" component="div" variant="body1">
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    color="gray.70"
                    lineHeight={1.6}
                    component="div"
                    variant="body2"
                  >
                    {item.subtitle}
                  </Typography>
                  <Grid direction={'row'} container alignItems={'center'}>
                    <Typography color="gray.60" lineHeight={1.6} component="div" variant="body2">
                      {item.location}
                    </Typography>
                    <MILine thickness={2} margin={'0 6px'} length={6} borderRadius={10} direction={'vertical'} />
                    <Typography color="gray.60" lineHeight={1.6} component="div" variant="body2">
                      {item.date}
                    </Typography>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      </Box>
    </>
  )
}

export default MarketDataPage
