import { Box, Stack, Typography } from '@mui/material'

export type EventDetailTabKey = 'impact' | 'ai' | 'records' | 'outlook' | 'fundamental'

const TABS: { key: EventDetailTabKey; label: string }[] = [
  { key: 'impact', label: '영향도 분석' },
  { key: 'ai', label: 'AI Insights' },
  { key: 'records', label: 'MI Records' },
  { key: 'outlook', label: '기관 전망' },
  { key: 'fundamental', label: 'Fundamental Deep-dive' },
]

interface EventDetailStickyHeaderProps {
  title: string
  generatedAtLabel: string
  updatedAtLabel: string
  activeTab: EventDetailTabKey
  onTabChange: (tab: EventDetailTabKey) => void
}

/** Figma 2128:31397 — Event 라벨, 26px 제목, 일시 칩, 탭 메뉴 */
const EventDetailStickyHeader = ({ title, generatedAtLabel, updatedAtLabel, activeTab, onTabChange }: EventDetailStickyHeaderProps) => (
  <Box
    position="sticky"
    top={0}
    zIndex={10}
    bgcolor="common.white"
    borderBottom="1px solid"
    borderColor="contentBorder.Normal"
    boxShadow="0px 10px 20px 0px #ffffff"
    pt={2.5}
    pb={0}
    width="100%"
  >
    <Stack gap={0.5} alignItems="flex-start" width="100%">
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" width="100%">
        <Stack gap={1.25} alignItems="flex-start" flex={1} minWidth={0}>
          <Box borderRadius="10px">
            <Typography fontSize={16} fontWeight={700} color="contentText.Black" lineHeight={1.4}>
              Event
            </Typography>
          </Box>
          <Typography
            fontSize={26}
            fontWeight={600}
            color="contentText.Black"
            lineHeight={1.4}
            sx={{ wordBreak: 'break-word' }}
          >
            {title}
          </Typography>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Stack direction="row" alignItems="center" gap={0.75} px={1} py={0.5} borderRadius="999px">
              <Typography fontSize={12} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
                생성일시
              </Typography>
              <Typography fontSize={14} fontWeight={500} color="contentText.Black" lineHeight={1.4}>
                {generatedAtLabel}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.75} px={1} py={0.5} borderRadius="999px">
              <Typography fontSize={12} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
                업데이트
              </Typography>
              <Typography fontSize={14} fontWeight={500} color="contentText.Black" lineHeight={1.4}>
                {updatedAtLabel}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Box width={129} height={36} flexShrink={0} />
      </Stack>
      <Stack width="100%" borderBottom="1px solid" borderColor="contentBorder.Normal" alignItems="stretch">
        <Stack direction="row" alignItems="flex-end" flex={1} minWidth={0}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <Box
                key={tab.key}
                component="button"
                type="button"
                onClick={() => onTabChange(tab.key)}
                sx={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  minHeight: 62,
                  px: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderBottom: isActive ? '2px solid' : '2px solid transparent',
                  borderBottomColor: isActive ? 'common.black' : 'transparent',
                  mb: '-1px',
                }}
              >
                <Typography
                  fontSize={16}
                  fontWeight={isActive ? 700 : 600}
                  color="contentText.Black"
                  lineHeight={1.4}
                  whiteSpace="nowrap"
                >
                  {tab.label}
                </Typography>
              </Box>
            )
          })}
        </Stack>
      </Stack>
    </Stack>
  </Box>
)

export default EventDetailStickyHeader
