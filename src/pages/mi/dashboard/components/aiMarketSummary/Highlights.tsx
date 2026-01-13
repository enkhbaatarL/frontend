import { Box, Stack, Typography, Collapse, Fade } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import TagChip, { ITagChipItem } from '@/components/common/chip/TagChip'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import InlineNotice from '@/components/common/notice/InlineNotice'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import { DirectionType, IMarketRecapItem, IMarketRecapHighlightItem } from '@/service/mi/dashboard'

interface Props {
  highlights?: IMarketRecapItem['highlights']
}

const options = [
  { label: 'Detailed', value: 'detailed' },
  { label: 'Focused', value: 'focused' },
  { label: 'Narrative', value: 'narrative' },
]

const Icon = ({ direction }: { direction?: DirectionType }) => {
  const getColor = () => {
    if (direction === DirectionType.Upward) return 'linear-gradient(180deg, #3386C2 0%, #1366A2 100%)'
    if (direction === DirectionType.Downward) return 'linear-gradient(180deg, #A02A74 0%, #881C60 100%)'

    return 'linear-gradient(180deg, #A8A8A8 0%, #777777 100%)' // Neutral
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

interface HighlightsItemProps {
  item: IMarketRecapHighlightItem
  selectedOption: string
  borderBottom?: boolean
  onRelatedNewsItemSelected: (item: ITagChipItem) => void
}

const HighlightsItem = ({ item, selectedOption, borderBottom = true, onRelatedNewsItemSelected }: HighlightsItemProps) => (
  <Box px="6px">
    <Stack py="12px" gap="6px" borderBottom={borderBottom ? '1px solid #DEE2E6' : 'none'}>
      <Stack direction="row" gap="8px">
        <Icon direction={item.momentum} />
        <Typography variant="infoDocument">{item.nameEnglish || item.nameKorean}</Typography>
      </Stack>
      <Collapse in={selectedOption === 'detailed'} timeout={300}>
        <Stack gap="6px">
          <Stack pl="22px" gap="1px">
            {item.relatedEventRepresentativeNewsResNews?.slice(0, 3).map((news, index) => (
              <Box
                key={`${item.highlightEventId}-news-${index}`}
                onClick={() => {
                  onRelatedNewsItemSelected({ name: news.provider, value: news.newsSummaryId.toString() })
                }}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  ml: '-14px',
                }}
              >
                <Typography
                  component="span"
                  variant="subtext5"
                  color="gray.70"
                  fontWeight={500}
                  sx={{
                    mr: '6px',
                    flexShrink: 0,
                  }}
                >
                  •
                </Typography>
                <Typography
                  component="span"
                  variant="subtext5"
                  color="gray.70"
                  fontWeight={500}
                  sx={{
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {news.title}
                </Typography>
              </Box>
            ))}
          </Stack>
          <TagChip
            items={
              item.relatedEventRepresentativeNewsResNews?.map((news) => ({ name: news.provider, value: news.newsSummaryId.toString() })) ??
              []
            }
            ellipsisRange={2}
            padding="6px 20px"
            onItemSelected={onRelatedNewsItemSelected}
          />
        </Stack>
      </Collapse>
    </Stack>
  </Box>
)

const Highlights = ({ highlights }: Props) => {
  const [selectedOption, setSelectedOption] = useState('detailed')
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleRelatedNewsItemSelected = ({ value }: ITagChipItem) => {
    navigate(`/mi/market-news/${value}`)
  }

  return (
    <Stack padding="6px 12px" borderRadius="10px" gap="6px" sx={{ backgroundColor: '#F8F9FA' }}>
      <SectionHeader title="Highlights" tooltipTitle={t('dashboard.highlights.tooltipTitle')} padding="7.5px 0 7.5px 6px">
        <MISelectMenu
          items={options.map((option) => ({ ...option, label: t(`common.${option.value}`) }))}
          selected={selectedOption}
          onSelected={setSelectedOption}
          paperProps={{
            sx: {
              width: '150px',
            },
          }}
          closeOnScroll
        />
      </SectionHeader>
      {((highlights?.items && highlights.items.length > 0) || (selectedOption === 'narrative' && highlights?.narrative)) && (
        <InlineNotice noticeKey="dashboard-highlights">{t('dashboard.highlights.inlineNotice')}</InlineNotice>
      )}
      {(!highlights?.items || highlights.items.length === 0) && selectedOption !== 'narrative' ? (
        <Stack height={352} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
          <Typography variant="body2SB14" color="content.textNormal">
            No data available to display.
          </Typography>
        </Stack>
      ) : (
        <>
          <Fade in={selectedOption === 'detailed' || selectedOption === 'focused'} timeout={500}>
            <Box>
              {(selectedOption === 'detailed' || selectedOption === 'focused') &&
                highlights?.items.map((item, index) => (
                  <HighlightsItem
                    key={item.highlightEventId}
                    item={item}
                    selectedOption={selectedOption}
                    borderBottom={index !== highlights?.items.length - 1}
                    onRelatedNewsItemSelected={handleRelatedNewsItemSelected}
                  />
                ))}
            </Box>
          </Fade>
          <Fade in={selectedOption === 'narrative'} timeout={500}>
            <Box>
              {selectedOption === 'narrative' && (
                <>
                  {highlights?.narrative ? (
                    <Stack padding="12px 20px 6px" gap="6px">
                      <Typography variant="infoDocument">{highlights?.narrative.title}</Typography>
                      <Stack gap="8px">
                        {highlights?.narrative.content.map((content, index) => (
                          <Typography key={`narrative-content-${index}`} variant="subtext5" color="gray.70" fontWeight={500}>
                            {content}
                          </Typography>
                        ))}
                        <TagChip
                          items={
                            highlights?.relatedEventRepresentativeNewsResNews?.map((news) => ({
                              name: news.provider,
                              value: news.newsSummaryId.toString(),
                            })) ?? []
                          }
                          ellipsisRange={2}
                          py="4px"
                          onItemSelected={handleRelatedNewsItemSelected}
                        />
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack height={352} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
                      <Typography variant="body2SB14" color="content.textNormal">
                        No data available to display.
                      </Typography>
                    </Stack>
                  )}
                </>
              )}
            </Box>
          </Fade>
        </>
      )}
    </Stack>
  )
}

export default Highlights
