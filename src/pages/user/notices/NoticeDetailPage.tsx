import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton.tsx'

export default function CustomerNoticesDetailPage() {
  const navigate = useNavigate()

  return (
    <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
      <Box paddingY={5} borderBottom="1px solid #DEE2E6">
        <Typography variant="body2M14" mr={7.5} color="gray.60">
          이벤트
        </Typography>
        <Typography variant="body1B16" color="gray.90">
          MI 플랫폼 오픈 기념 1개월 무료 사용
        </Typography>
      </Box>
      <Box paddingY={7.5}>
        <img style={{ display: 'block' }} width="100%" src="/src/assets/subheader.jpg" alt="" />
        <Grid direction="column" mb={5} paddingY={7.5} gap={4} container borderBottom="1px solid #D9D9D9">
          <Typography variant="body1R16" component="div" color="gray.90">
            &#10100;공지사항 내용이 출력됩니다&#10101; <br />
            안녕하세요, MI 플랫폼입니다.
          </Typography>
          <Typography variant="body1R16" component="div" color="gray.90">
            The US horizontal rig count decreased by three this week, bringing the total to 529. Oil rig numbers decreased by five to 458,
            driven by losses in the Permian. The tight gas plays added two rigs, with one each in the Utica and Haynesville.
          </Typography>
          <Typography variant="body1R16" component="div" color="gray.90">
            The latest round of oil market reports, including the US Energy Information Administration (EIA), the International Energy
            Agency (IEA) and OPEC, and our own updated Oil Market Balances Report (OMB) forecasts for March 2025, show that under the
            current OPEC+ policy, markets will face a serious surplus in supply for 4Q25 if OPEC+ implements unwinding of production cuts
            (excluding OPEC’s view). In this analysis, we compare their projections for 2025, providing key insights into the changing
            landscape of oil supply and demand.
          </Typography>
          <Typography variant="body1R16" component="div" color="gray.90">
            The latest round of oil market reports, including the US Energy Information Administration (EIA), the International Energy
            Agency (IEA) and OPEC, and our own updated Oil Market Balances Report (OMB) forecasts for March 2025, show that under the
            current OPEC+ policy, markets will face a serious surplus in supply for 4Q25 if OPEC+ implements unwinding of production cuts
            (excluding OPEC’s view). In this analysis, we compare their projections for 2025, providing key insights into the changing
            landscape of oil supply and demand.
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
