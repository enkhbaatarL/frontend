import CheckIcon from '@mui/icons-material/Check'
import { Box, Stack, Typography, Collapse, Fade } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import MISelectMenu from '@/components/common/menu/MISelectMenu'
import InlineNotice from '@/components/common/notice/InlineNotice'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import { IMarketRecapCheckpointItem, IMarketRecapItem } from '@/service/mi/dashboard'

interface Props {
  checkpoints?: IMarketRecapItem['checkpoints']
}

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
  item: IMarketRecapCheckpointItem
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
            {item.content.map((content, index) => (
              <Typography
                key={`${item.checkpointId}-content-${index}`}
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

const Checkpoints = ({ checkpoints }: Props) => {
  const [selectedOption, setSelectedOption] = useState('detailed')
  const { t } = useTranslation()

  return (
    <Stack padding="6px 12px" borderRadius="10px" gap="6px" sx={{ backgroundColor: '#F8F9FA' }}>
      <SectionHeader title="Checkpoints" tooltipTitle={t('dashboard.checkpoints.tooltipTitle')} padding="7.5px 0 7.5px 6px">
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
      {((checkpoints?.items && checkpoints.items.length > 0) || (selectedOption === 'narrative' && checkpoints?.narrative)) && (
        <InlineNotice noticeKey="dashboard-checkpoints">{t('dashboard.checkpoints.inlineNotice')}</InlineNotice>
      )}
      {(!checkpoints?.items || checkpoints.items.length === 0) && selectedOption !== 'narrative' ? (
        <Stack height={352} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
          <Typography variant="body2SB14" color="gray.50">
            No data available to display.
          </Typography>
        </Stack>
      ) : (
        <>
          <Fade in={selectedOption === 'detailed' || selectedOption === 'focused'} timeout={500}>
            <Box>
              {(selectedOption === 'detailed' || selectedOption === 'focused') &&
                checkpoints?.items.map((item, index) => (
                  <CheckpointsItem
                    key={item.checkpointId}
                    item={item}
                    selectedOption={selectedOption}
                    borderBottom={index !== checkpoints?.items.length - 1}
                  />
                ))}
            </Box>
          </Fade>
          <Fade in={selectedOption === 'narrative'} timeout={500}>
            <Box>
              {selectedOption === 'narrative' && (
                <>
                  {checkpoints?.narrative ? (
                    <Stack padding="12px 20px 16px" gap="6px">
                      <Typography variant="infoDocument">{checkpoints?.narrative.title}</Typography>
                      <Stack gap="8px">
                        {checkpoints?.narrative.content.map((content, index) => (
                          <Typography key={`narrative-content-${index}`} variant="subtext5" color="gray.70" fontWeight={500}>
                            {content}
                          </Typography>
                        ))}
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack height={352} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
                      <Typography variant="body2SB14" color="gray.50">
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

export default Checkpoints
