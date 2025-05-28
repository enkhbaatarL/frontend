import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useMemo } from 'react'

import { IProductDataInfo } from '@/service/mi/dataDetail'

interface DocumentInfoItemProps {
  label: string
  value: string
}
interface DocumentInfoComponentProps {
  data: IProductDataInfo
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

const DocumentInfoComponent = ({ data }: DocumentInfoComponentProps) => {
  const dataInfo = useMemo(
    () => [
      {
        label: 'Language',
        value: data.categories.find((cat) => cat.categoryHighCd === 'LANGUAGES')?.value.join(', ') ?? '',
      },
    ],
    [data],
  )

  return (
    <Grid gap={3.5} container direction="column" p={6} borderRadius={1} border={'1px solid'} borderColor={'gray.30'}>
      <Typography component="div" color="gray.90" variant="titleBox">
        Data Info
      </Typography>
      <Grid container direction="column" gap={3}>
        {dataInfo.map((item, index) => (
          <DocumentInfoItem key={index} label={item.label} value={item.value} />
        ))}
      </Grid>
    </Grid>
  )
}

export default DocumentInfoComponent
