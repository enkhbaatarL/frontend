import { Box, Grid2 as Grid, Typography } from '@mui/material'

interface DocumentInfoItemProps {
  label: string
  value: string
}

const DocumentInfoItem = ({ label, value }: DocumentInfoItemProps) => (
  <Box>
    <Typography color="gray.70" component="div" variant="infoDocument">
      {label}
    </Typography>
    <Typography lineHeight={1.6} color="gray.70" component="div" variant="body1R16">
      {value}
    </Typography>
  </Box>
)

const DocumentInfoComponent = () => {
  const documentInfoData = [
    {
      label: 'Contributor',
      value: 'Gedik Investment',
    },
    {
      label: 'Author',
      value: 'Research Department',
    },
    {
      label: 'Subject',
      value: 'PORTFOLIO STRATEGY',
    },
    {
      label: 'Category',
      value: 'EQUITY',
    },
    {
      label: 'Region',
      value: 'Western Asia, Europe',
    },
    {
      label: 'Country',
      value: 'Turkey',
    },
    {
      label: 'Language',
      value: 'English',
    },
  ]

  return (
    <Grid gap={3.5} container direction="column" p={6} borderRadius={1} border={'1px solid'} borderColor={'gray.30'}>
      <Typography component="div" color="gray.90" variant="titleBox">
        Document Info
      </Typography>
      <Grid container direction="column" gap={3}>
        {documentInfoData.map((item, index) => (
          <DocumentInfoItem key={index} label={item.label} value={item.value} />
        ))}
      </Grid>
    </Grid>
  )
}

export default DocumentInfoComponent
