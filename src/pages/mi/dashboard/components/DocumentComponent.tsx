import { Box, Grid2 as Grid, Typography } from '@mui/material'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'

interface DocumentItemProps {
  title: string
  date: string
  format: string
}

const DocumentItem = ({ title, date, format }: DocumentItemProps) => (
  <Box paddingY={3}>
    <Typography mb={1} color="gray.70" component="div" variant="fileName">
      {title}
    </Typography>
    <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
      <Typography whiteSpace="nowrap" lineHeight={1.6} color="gray.60" variant="body2">
        {date}
      </Typography>
      <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
      <Typography lineHeight={1.6} color="gray.60" variant="body2">
        {format}
      </Typography>
      <MIButton contentType={'link'} color={'gray'} type={'ghost'} size={'h32'}>
        View
      </MIButton>
      <MIButton contentType={'link'} color={'gray'} type={'ghost'} size={'h32'}>
        Download
      </MIButton>
    </Grid>
  </Box>
)

const DocumentComponent = () => {
  const documentData = [
    {
      title: '2025 guidance: upstream companies capital budgets and production targets targets',
      date: '2025-03-26',
      format: 'PDF',
    },
    {
      title: 'LNG Short Term Outlook.pdf',
      date: '2025-03-26',
      format: 'PDF',
    },
  ]

  return (
    <Grid gap={2.5} container direction="column" p={6} borderRadius={1} border={'1px solid'} borderColor={'gray.30'}>
      <Typography component="div" color="gray.90" variant="titleBox">
        Document
      </Typography>
      <Box>{documentData?.map((item, index) => <DocumentItem key={index} title={item.title} date={item.date} format={item.format} />)}</Box>
      <MIButton width={'100%'} contentType={'text'} color={'gray2'} type={'outlined'} size={'h42'}>
        Download All
      </MIButton>
    </Grid>
  )
}

export default DocumentComponent
