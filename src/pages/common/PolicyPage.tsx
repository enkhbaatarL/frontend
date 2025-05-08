import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useState } from 'react'

import MISelect from '@/components/common/select/MISelect.tsx'
import usePolicyHtml from '@/hooks/usePolicyHtml.tsx'

import './Policy.scss'

const PolicyPage = () => {
  const policyHtml = usePolicyHtml()
  const [selectDate, setSelectDate] = useState<string>('20250000')

  return (
    <>
      <Grid justifyContent="space-between" container pt={10} px={7.5}>
        <Typography color="gray.90" component="div" variant="heading2">
          개인정보 처리방침
        </Typography>
        <MISelect value={selectDate} onChange={(e) => setSelectDate(String(e.target.value))}></MISelect>
      </Grid>
      <Box className="contentHtml" padding={7.5} component="div" dangerouslySetInnerHTML={{ __html: policyHtml }} />
    </>
  )
}

export default PolicyPage
