import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import TagChip from '@/components/common/chip/TagChip'
import MILine from '@/components/common/divider/MILine'
import MISkeleton from '@/components/mi/MISkeleton'
import marketNewsService from '@/service/mi/marketNews'

const NewsDetailPage = () => {
  const pathParams = useParams()
  const newsSummaryId = pathParams.newsSummaryId

  const navigate = useNavigate()

  const { data: newsSummaryData, isLoading: newsSummaryDataIsLoading } = useQuery({
    queryKey: ['newsSummaryData', newsSummaryId],
    queryFn: () => marketNewsService.getNewsSummaryData(newsSummaryId!),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!newsSummaryId,
  })

  return (
    <MISkeleton variant={'marketNewsDetail'} loading={newsSummaryDataIsLoading}>
      <Box paddingTop={'56px'} paddingBottom={'30px'}>
        <Box paddingX={7.5} boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
          <Typography color="contentText.Normal" variant="subtext1" sx={{ cursor: 'pointer' }} onClick={() => navigate('/mi/market-news')}>
            Market News
          </Typography>
          <Typography paddingY={6.5} color="contentText.Black" component="h1" lineHeight={1.2} variant="titleSubPage">
            {newsSummaryData?.title}
          </Typography>
          <Grid container alignItems="center">
            <Typography color="contentText.Subtext" variant="subtext1">
              {newsSummaryData?.firstCreated && dayjs(newsSummaryData?.firstCreated).format('MMMM D, YYYY')}
            </Typography>
            <MILine length={14} margin="0 14px" direction="vertical" backgroundColor="gray.50" />
            <Typography color="contentText.Subtext" variant="subtext1">
              {newsSummaryData?.provider}
            </Typography>
          </Grid>
        </Box>
      </Box>
      <Box boxSizing={'border-box'} minWidth={'1380px'} width={'1380px'} borderTop="1px solid" borderColor="gray.30" margin={'auto'}></Box>
      <Box boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'} paddingTop={10} paddingX={7.5}>
        <Grid
          sx={{
            flexWrap: 'nowrap',
          }}
          direction="row"
          container
          gap={6}
        >
          <Grid container direction="column" flexGrow={1} gap={10}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {newsSummaryData?.story}
            </ReactMarkdown>
            <TagChip items={newsSummaryData?.tagList?.map((value) => ({ name: value })) ?? []} disabled />
          </Grid>
          <Grid
            sx={{
              width: '286px',
              maxWidth: '286px',
              minWidth: '286px',
              flexShrink: 0,
            }}
            container
            gap={6}
            direction="column"
          >
            <Typography paddingX={3} color="gray.60" component="div" variant="body3R12">
              This document is the property of the respective data provider. Please refrain from reproducing or distributing it without
              prior approval. If you wish to use this content, please contact the appropriate administrator in advance. The information
              contained herein is provided for reference purposes only, and users are encouraged to exercise their own judgment and
              responsibility when utilizing it.
            </Typography>
            <Typography paddingX={3} color="gray.60" component="div" variant="body3R12">
              본 문서는 해당 데이터 제공업체의 자산으로, 사전 승인 없이 복제하거나 배포하는 것은 삼가 주시기 바랍니다. 활용을 원하실 경우,
              관련 관리자에게 사전 문의해 주시기 바랍니다. 본 문서는 참고용 정보를 제공하기 위한 것으로, 내용의 정확성이나 활용 결과에
              대해서는 사용자의 판단과 책임이 요구됩니다.
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </MISkeleton>
  )
}

export default NewsDetailPage
