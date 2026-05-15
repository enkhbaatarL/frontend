import { Stack, Typography } from '@mui/material'

/** Price 탭 본문(빈 상태 — 레이아웃은 FundamentalModelPage) */
const PriceTabPanel = () => (
  <Stack gap={2} sx={{ userSelect: 'text' }}>
    <Stack
      minHeight={400}
      alignItems="center"
      justifyContent="center"
      bgcolor="commonColor.White"
      borderRadius="10px"
      border="1px dashed"
      borderColor="gray.30"
    >
      <Typography variant="body2R14" color="gray.60">
          가격 화면 입니다.
      </Typography>
    </Stack>
  </Stack>
)

export default PriceTabPanel
