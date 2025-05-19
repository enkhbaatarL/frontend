import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import boardService from '@/service/mi/board'
import useAuthStore from '@/store/useAuthStore.ts'

export default function NoticesDetailPage() {
  const navigate = useNavigate()
  const { noticeNo } = useParams()
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const { data } = useQuery({
    queryKey: ['noticeDetail', noticeNo],
    queryFn: async () => await boardService.getNoticeDetail(noticeNo, { customerCompanyNo }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!noticeNo,
  })

  return (
    <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
      <Box paddingY={5} borderBottom="1px solid #DEE2E6">
        <Typography variant="body2M14" mr={7.5} color="gray.60">
          {data?.bulletinCategoryName}
        </Typography>
        <Typography variant="body1B16" color="gray.90">
          {data?.bulletinTitleNm}
        </Typography>
      </Box>
      <Box paddingY={7.5}>
        {data?.fileUrl && <img style={{ display: 'block' }} width="100%" src={data.fileUrl} alt="" />}
        <Grid direction="column" mb={5} paddingY={7.5} gap={4} container borderBottom="1px solid #D9D9D9">
          <Typography variant="body1R16" component="div" color="gray.90">
            {data?.bulletinCntt}
          </Typography>
        </Grid>
        <MIButton
          onClick={() => navigate(-1)}
          color="gray"
          size="h42"
          startIcon={<KeyboardArrowLeftIcon sx={{ color: '#868E96', marginLeft: '-15px' }} fontSize="small" />}
          type="ghost"
        >
          목록 보기
        </MIButton>
      </Box>
    </Box>
  )
}
