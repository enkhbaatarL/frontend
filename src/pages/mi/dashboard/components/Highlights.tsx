import { Box, Stack, Typography, Collapse, Fade } from '@mui/material'
import { isEmpty } from 'lodash-es'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import InlineNotice from '@/components/common/notice/InlineNotice'
import DashboardSelect from '@/pages/mi/dashboard/components/DashboardSelect'
import SectionHeader from '@/pages/mi/dashboard/components/SectionHeader'
import SourceDropdownChip from '@/pages/mi/dashboard/components/SourceDropdownChip'
import { MarketItem, MarketItemType, SourceOption } from '@/service/mi/dashboard'

const options = [
  { label: 'Detailed', value: 'detailed' },
  { label: 'Focused', value: 'focused' },
  { label: 'Narrative', value: 'narrative' },
]

const Icon = ({ type }: { type: MarketItemType }) => {
  const getColor = () => {
    if (type === 'positive') return 'linear-gradient(180deg, #3386C2 0%, #1366A2 100%)'
    if (type === 'negative') return 'linear-gradient(180deg, #A02A74 0%, #881C60 100%)'
    return 'linear-gradient(180deg, #A8A8A8 0%, #777777 100%)'
  }

  return (
    <Box
      borderRadius="4px"
      border="1px solid #DEE2E6"
      width={26}
      height={26}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="#FFFFFF"
    >
      <Box borderRadius="4px" width={16} height={16} display="flex" sx={{ background: getColor() }} />
    </Box>
  )
}

const convertSources = (sources: SourceOption[]): SourceOption[][] => {
  const [source1, source2, ...rest] = sources

  return [source1 ? [source1] : [], source2 ? [source2] : [], rest.filter((source) => !isEmpty(source))].filter(
    (sourceGroup) => sourceGroup.length > 0,
  )
}

const SourceItems = ({ sources, padding = '6px 20px' }: { sources: SourceOption[]; padding?: string }) => {
  const convertedSources = convertSources(sources)

  return (
    <Stack direction="row" padding={padding} gap="8px">
      {convertedSources.map((item, index) => (
        <SourceDropdownChip key={index} sources={item} onSourceSelected={(_source) => {}} />
      ))}
    </Stack>
  )
}

const HighlightsItem = ({
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
        <Icon type={item.type ?? 'neutral'} />
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
          <SourceItems sources={item.sources} />
        </Stack>
      </Collapse>
    </Stack>
  </Box>
)

const Highlights = () => {
  const [selectedOption, setSelectedOption] = useState('detailed')
  const { t } = useTranslation()

  const sampleData: { detailed: MarketItem[]; narrative: MarketItem } = useMemo(
    () => ({
      detailed: [
        {
          id: 's1',
          type: 'positive',
          title: t('dashboard.sampleData.highlights.detailed.0.title'),
          summary: [
            t('dashboard.sampleData.highlights.detailed.0.summary.0'),
            t('dashboard.sampleData.highlights.detailed.0.summary.1'),
            t('dashboard.sampleData.highlights.detailed.0.summary.2'),
          ],
          sources: [{ name: 'Reuters', link: 'https://reuters.com' }],
        },
        {
          id: 's2',
          type: 'negative',
          title: t('dashboard.sampleData.highlights.detailed.1.title'),
          summary: [
            t('dashboard.sampleData.highlights.detailed.1.summary.0'),
            t('dashboard.sampleData.highlights.detailed.1.summary.1'),
            t('dashboard.sampleData.highlights.detailed.1.summary.2'),
          ],
          sources: [
            { name: 'Reuters', link: 'https://reuters.com' },
            { name: 'Bloomberg', link: 'https://bloomberg.com' },
            { name: 'Bloomberg1', link: 'https://bloomberg.com' },
            { name: 'Bloomberg2', link: 'https://bloomberg.com' },
            { name: 'Bloomberg3', link: 'https://bloomberg.com' },
          ],
        },
        {
          id: 's3',
          type: 'neutral',
          title: t('dashboard.sampleData.highlights.detailed.2.title'),
          summary: [
            t('dashboard.sampleData.highlights.detailed.2.summary.0'),
            t('dashboard.sampleData.highlights.detailed.2.summary.1'),
            t('dashboard.sampleData.highlights.detailed.2.summary.2'),
          ],
          sources: [
            { name: 'Reuters', link: 'https://reuters.com' },
            { name: 'Bloomberg', link: 'https://bloomberg.com' },
          ],
        },
      ],
      narrative: {
        id: 's4',
        title: t('dashboard.sampleData.highlights.narrative.title'),
        summary: [
          t('dashboard.sampleData.highlights.narrative.summary.0'),
          t('dashboard.sampleData.highlights.narrative.summary.1'),
          t('dashboard.sampleData.highlights.narrative.summary.2'),
        ],
        sources: [
          { name: 'Reuters', link: 'https://reuters.com' },
          { name: 'Bloomberg', link: 'https://bloomberg.com' },
          { name: 'Bloomberg1', link: 'https://bloomberg.com' },
          { name: 'Bloomberg2', link: 'https://bloomberg.com' },
          { name: 'Bloomberg3', link: 'https://bloomberg.com' },
        ],
      },
    }),
    [t],
  )

  return (
    <Stack padding="6px 12px" borderRadius="10px" gap="6px" sx={{ backgroundColor: '#F8F9FA' }}>
      <SectionHeader title="Highlights" tooltipTitle={t('dashboard.highlights.tooltipTitle')} padding="7.5px 0 7.5px 6px">
        <DashboardSelect
          items={options.map((option) => ({ ...option, label: t(`common.${option.value}`) }))}
          selected={selectedOption}
          onSelected={setSelectedOption}
          menuPositionOffset={-32}
          fitMenuWidth={false}
          paperProps={{
            sx: {
              width: '150px',
            },
          }}
        />
      </SectionHeader>
      <InlineNotice noticeKey="dashboard-highlights">{t('dashboard.highlights.inlineNotice')}</InlineNotice>
      <Fade in={selectedOption === 'detailed' || selectedOption === 'focused'} timeout={500}>
        <Box>
          {(selectedOption === 'detailed' || selectedOption === 'focused') &&
            sampleData.detailed.map((item, index) => (
              <HighlightsItem
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
            <Stack padding="12px 20px 6px" gap="6px">
              <Typography variant="infoDocument">{sampleData.narrative.title}</Typography>
              <Stack gap="8px">
                {sampleData.narrative.summary.map((content, index) => (
                  <Typography key={`${sampleData.narrative.id}-content-${index}`} variant="subtext5" color="gray.70" fontWeight={500}>
                    {content}
                  </Typography>
                ))}
              </Stack>
              <SourceItems sources={sampleData.narrative.sources} padding="6px 0 12px" />
            </Stack>
          )}
        </Box>
      </Fade>
    </Stack>
  )
}

export default Highlights
