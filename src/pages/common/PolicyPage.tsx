import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import parse from 'html-react-parser'
import { useEffect, useMemo, useState } from 'react'
import './Policy.scss'

import MISelect from '@/components/common/select/MISelect'
import policyService from '@/service/mi/policyService'

const PolicyPage = () => {
  const [policyNo, setPolicyNo] = useState<number | 'latest'>('latest')

  // GET 개인정보 처리방침 목록 조회 API
  const { data: privacyPolicyList = [] } = useQuery({
    queryKey: ['privacyPolicyList'],
    queryFn: async () => await policyService.getPrivacyPolicies(),
    select: (list) => list.map((m) => ({ ...m, label: m.poltacVerNm, value: m.poltacNo })),
  })

  // GET 개인정보 처리방침 목록 조회 API
  const { data: privacyPolicyDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['getPrivacyPolicyDetail', policyNo],
    queryFn: async () => await policyService.getPrivacyPolicyDetail(policyNo),
  })

  /** 최초 랜더링시 최신 방침 조회 */
  useEffect(() => {
    refetchDetail()
  }, [refetchDetail])

  /** html 변환 */
  const content = useMemo(() => DOMPurify.sanitize(privacyPolicyDetail?.poltacCntt ?? ''), [privacyPolicyDetail?.poltacCntt])

  return (
    <Box maxWidth="1380px" margin="auto" paddingX={7.5}>
      <Grid flex={1} justifyContent="space-between" container pt={10} px={7.5}>
        <Typography color="gray.90" component="div" variant="heading2">
          개인정보 처리방침
        </Typography>
        <MISelect
          width={164}
          options={privacyPolicyList}
          showClearIcon={false}
          value={policyNo === 'latest' ? privacyPolicyDetail?.poltacNo : String(policyNo)}
          onChange={(e) => setPolicyNo(Number(e.target.value))}
        ></MISelect>
      </Grid>
      <Box className="contentHtml" padding={7.5} component="div">
        {parse(content)}
      </Box>
    </Box>
  )
}

export default PolicyPage
