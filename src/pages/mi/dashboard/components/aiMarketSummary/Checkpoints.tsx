import CheckIcon from '@mui/icons-material/Check'
import { Box, Stack, Typography, Collapse, Fade } from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MISelectMenu from '@/components/common/menu/MISelectMenu'
import InlineNotice from '@/components/common/notice/InlineNotice'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import { MarketItem } from '@/service/mi/dashboard'

const options = [
  { label: 'Detailed', value: 'detailed' },
  { label: 'Focused', value: 'focused' },
  { label: 'Narrative', value: 'narrative' },
]

const CheckpointsItem = ({
  item,
  selectedOption,
  borderBottom = true,
}: {
  item: MarketItem
  selectedOption: string
  borderBottom?: boolean
}) => (
  <Box px="6px">
    <Stack py="12px" gap="6px" borderBottom={borderBottom ? '1px solid #DEE2E6' : 'none'}>
      <Stack direction="row" gap="8px">
        <Stack width={32} height={32} alignItems="center" justifyContent="start">
          <CheckIcon sx={{ color: '#364FC7' }} />
        </Stack>
        <Typography variant="infoDocument">{item.title}</Typography>
      </Stack>
      <Collapse in={selectedOption === 'detailed'} timeout={300}>
        <Stack gap="6px">
          <Stack pl="22px" gap="1px">
            {item.summary.map((content, index) => (
              <Typography
                key={`${item.id}-content-${index}`}
                variant="subtext5"
                color="gray.70"
                fontWeight={500}
                sx={{
                  textIndent: '-14px',
                  '&::before': {
                    content: '"•"',
                    marginRight: '6px',
                    color: 'gray.70',
                  },
                }}
              >
                {content}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Collapse>
    </Stack>
  </Box>
)

const Checkpoints = () => {
  const [selectedOption, setSelectedOption] = useState('detailed')
  const { t } = useTranslation()

  const sampleData: { detailed: MarketItem[]; narrative: MarketItem } = useMemo(
    () => ({
      detailed: [
        {
          id: 'c1',
          title: t('dashboard.sampleData.checkpoints.detailed.0.title'),
          summary: [t('dashboard.sampleData.checkpoints.detailed.0.summary.0'), t('dashboard.sampleData.checkpoints.detailed.0.summary.1')],
          sources: [],
        },
        {
          id: 'c2',
          title: t('dashboard.sampleData.checkpoints.detailed.1.title'),
          summary: [t('dashboard.sampleData.checkpoints.detailed.1.summary.0'), t('dashboard.sampleData.checkpoints.detailed.1.summary.1')],
          sources: [],
        },
        {
          id: 'c3',
          title: t('dashboard.sampleData.checkpoints.detailed.2.title'),
          summary: [t('dashboard.sampleData.checkpoints.detailed.2.summary.0'), t('dashboard.sampleData.checkpoints.detailed.2.summary.1')],
          sources: [],
        },
      ],
      narrative: {
        id: 'c4',
        title: t('dashboard.sampleData.checkpoints.narrative.title'),
        summary: [
          t('dashboard.sampleData.checkpoints.narrative.summary.0'),
          t('dashboard.sampleData.checkpoints.narrative.summary.1'),
          t('dashboard.sampleData.checkpoints.narrative.summary.2'),
        ],
        sources: [],
      },
    }),
    [t],
  )

  return (
    <Stack padding="6px 12px" borderRadius="10px" gap="6px" sx={{ backgroundColor: '#F8F9FA' }}>
      <SectionHeader title="Checkpoints" tooltipTitle={t('dashboard.checkpoints.tooltipTitle')} padding="7.5px 0 7.5px 6px">
        <MISelectMenu
          items={options.map((option) => ({ ...option, label: t(`common.${option.value}`) }))}
          selected={selectedOption}
          onSelected={setSelectedOption}
          menuPositionOffset={{ top: 4, right: -32 }}
          placement="bottom-end"
          paperProps={{
            sx: {
              width: '150px',
            },
          }}
        />
      </SectionHeader>
      <InlineNotice noticeKey="dashboard-checkpoints">{t('dashboard.checkpoints.inlineNotice')}</InlineNotice>
      <Fade in={selectedOption === 'detailed' || selectedOption === 'focused'} timeout={500}>
        <Box>
          {(selectedOption === 'detailed' || selectedOption === 'focused') &&
            sampleData.detailed.map((item, index) => (
              <CheckpointsItem
                key={item.id}
                item={item}
                selectedOption={selectedOption}
                borderBottom={index !== sampleData.detailed.length - 1}
              />
            ))}
        </Box>
      </Fade>
      <Fade in={selectedOption === 'narrative'} timeout={500}>
        <Box>
          {selectedOption === 'narrative' && (
            <Stack padding="12px 20px 16px" gap="6px">
              <Typography variant="infoDocument">{sampleData.narrative.title}</Typography>
              <Stack gap="8px">
                {sampleData.narrative.summary.map((content, index) => (
                  <Typography key={`${sampleData.narrative.id}-content-${index}`} variant="subtext5" color="gray.70" fontWeight={500}>
                    {content}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          )}
        </Box>
      </Fade>
    </Stack>
  )
}

export default Checkpoints
