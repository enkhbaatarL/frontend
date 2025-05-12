import SearchIcon from '@mui/icons-material/Search'
import { Box, FormControlLabel, FormGroup, Grid2 as Grid, Typography } from '@mui/material'

import AdminCheckbox from '@/components/admin/AdminCheckbox'
import MIInput from '@/components/common/input/MIInput'
import MISelect from '@/components/common/select/MISelect'
import MITablePagination from '@/components/common/table-user/MITablePagination'
import { mockFilters } from '@/hooks/mockFilters'
import { useMockReports } from '@/hooks/useMockReports'
import InsightsCardBtn from '@/pages/user/Insights/components/InsightsCardBtn'
import InsightsDocumentItem from '@/pages/user/Insights/components/InsightsDocumentItem'

const InsightsPage = () => {
  const reports = useMockReports()

  return (
    <>
      <Box
        paddingX={7.5}
        paddingY={14}
        sx={{
          background:
            'url(\'/src/assets/productsymbol.png\') right / 33% no-repeat, url(\'/src/assets/subheaderinsight.jpg\') lightgray 50% / cover no-repeat',
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
            Insights
          </Typography>
          <Typography color="#DCDCDC" fontSize={20} lineHeight={1.6} variant="subtext1">
            Stay informed, stay ahead
          </Typography>
        </Box>
      </Box>
      <Box maxWidth={'1380px'} margin={'auto'} py={12.5} px={7.5}>
        <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
          Focused
        </Typography>
        <Grid mb={17.5} container spacing={6}>
          {reports.map((report, index) => (
            <Grid size={{ xs: 6, md: 3 }} key={index}>
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
            flexDirection: {
              xs: 'column',
              md: 'row',
            },
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
            <Grid container direction={'column'} gap={8}>
              {reports.map((report, index) => (
                <InsightsDocumentItem key={index} report={report} />
              ))}
            </Grid>
            <MITablePagination />
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
            <Grid container border={'1px solid'} borderColor={'gray.30'} borderRadius={1} gap={6} padding={6} flexShrink={0}>
              {mockFilters.map((section) => (
                <Box key={section.title}>
                  <Typography mb={3.5} color="gray.90" component="h2" variant="titleBox">
                    {section.title}
                  </Typography>
                  <FormGroup>
                    {section.options.map((option) => (
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
