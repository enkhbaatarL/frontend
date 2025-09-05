import { Box, Stack, Typography } from '@mui/material'

import SourceDropdownChip from './SourceDropdownChip'

import { MarketItem } from '@/service/mi/mainDashboard'

export interface IAIMarketSummaryItem extends MarketItem {
  iconSrc?: string
}

interface AIMarketSummaryItemProps {
  item: IAIMarketSummaryItem
}

const AIMarketSummaryItem = ({ item }: AIMarketSummaryItemProps) => (
  <Box borderBottom="0.5px solid #DEE2E6" height={'80px'}>
    <Stack direction="row" alignItems="center" gap={'8px'} marginBottom={'6px'}>
      <Box width={26} height={26} display="flex" alignItems="center" justifyContent="center">
        <img src={item.iconSrc} alt="impact" width={26} height={26} />
      </Box>
      <Typography variant="body1" color="gray.90" sx={{ fontWeight: 600 }}>
        {item.title}
      </Typography>
      <SourceDropdownChip
        sources={item.sources}
        onSourceSelected={(source) => {
          console.log(source)
        }}
      />
    </Stack>
    <Box pl="42px">
      {item.summary.map((content, index) => (
        <Typography
          key={`${item.id}-content-${index}`}
          variant="body2"
          color="gray.70"
          sx={{
            lineHeight: 1.4,
            paddingLeft: '16px',
            textIndent: '-16px',
            '&::before': {
              content: '"•"',
              marginRight: '8px',
              color: 'gray.70',
            },
          }}
        >
          {content}
        </Typography>
      ))}
    </Box>
  </Box>
)

export default AIMarketSummaryItem
