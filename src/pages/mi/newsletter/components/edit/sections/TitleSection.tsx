import EastIcon from '@mui/icons-material/East'
import { Box, Stack, Typography } from '@mui/material'

import MIMaskInput from '@/components/common/input/MIMaskInput'
import Block, { type BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'
import { NEWSLETTER_SECTION_CODE, NEWSLETTER_SECTION_EDIT_LABEL } from '@/pages/mi/newsletter/utils/snapshotUtils'
import { formatPriceForDisplay } from '@/utils/titleOilPriceDisplay'

interface TitleSectionProps {
  title: string
  /** 스냅샷 `fields.subtitle`과 동일 */
  subtitle?: string
  /** 스냅샷 `fields.priceChangeFrom` / `priceChangeTo` — 둘 다 유한 숫자일 때만 메일 유가 행 표시 */
  priceChangeFrom?: number
  priceChangeTo?: number
  onTitleChange?: (value?: string) => void
  onSubtitleChange?: (value?: string) => void
  onPriceChangeFromChange?: (value?: string) => void
  onPriceChangeToChange?: (value?: string) => void
  blockOrder?: BlockOrderProps
  showRequiredIndicator?: boolean
  sectionVisibility?: boolean
  onSectionVisibilityChange?: (visible: boolean) => void
}

const TitleSection = ({
  title,
  subtitle = '',
  priceChangeFrom,
  priceChangeTo,
  onTitleChange,
  onSubtitleChange,
  onPriceChangeFromChange,
  onPriceChangeToChange,
  blockOrder,
  showRequiredIndicator = false,
  sectionVisibility,
  onSectionVisibilityChange,
}: TitleSectionProps) => {
  /** `TitleAndOilPrice` / 메일·캡처와 동일 — 이 조건일 때만 유가 행이 실제 출력됨 */
  const showOilRow =
    priceChangeFrom !== undefined && priceChangeTo !== undefined && Number.isFinite(priceChangeFrom) && Number.isFinite(priceChangeTo)

  const oilCollapsedSuffix =
    showOilRow && priceChangeFrom !== undefined && priceChangeTo !== undefined
      ? ` · ${formatPriceForDisplay(priceChangeFrom)}→${formatPriceForDisplay(priceChangeTo)}`
      : ''

  const collapsedPreview =
    (title || '').trim() !== '' ? `${title}${oilCollapsedSuffix}` : oilCollapsedSuffix ? oilCollapsedSuffix.replace(/^ · /, '') : undefined

  const fromStr = priceChangeFrom !== undefined && Number.isFinite(priceChangeFrom) ? String(priceChangeFrom) : ''
  const toStr = priceChangeTo !== undefined && Number.isFinite(priceChangeTo) ? String(priceChangeTo) : ''

  return (
    <Block
      label={NEWSLETTER_SECTION_EDIT_LABEL[NEWSLETTER_SECTION_CODE.TITLE]}
      order={blockOrder}
      collapsedPreview={collapsedPreview}
      showRequiredIndicator={showRequiredIndicator}
      visibility={sectionVisibility}
      onVisibilityChange={onSectionVisibilityChange}
    >
      <Stack gap="12px">
        <MIMaskInput
          label="뉴스레터 제목"
          placeholder="뉴스레터 제목 입력"
          value={title}
          onUpdateValue={onTitleChange}
          maxLength={100}
          required
        />
        <MIMaskInput
          label="뉴스레터 부제"
          placeholder="뉴스레터 부제 입력"
          value={subtitle}
          onUpdateValue={onSubtitleChange}
          maxLength={100}
        />
        {showOilRow && (
          <Stack gap="6px" sx={{ pt: '6px' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              <Typography component="div" variant="body2" fontWeight={600} color="contentText.Normal" sx={{ lineHeight: 1.4 }}>
                유가 변동(USD/bbl)
              </Typography>
              <Box
                component="span"
                width={4}
                height={4}
                borderRadius="50%"
                bgcolor="point.red1"
                sx={{ mt: '5px', ml: '4px', flexShrink: 0 }}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <MIMaskInput value={fromStr} onUpdateValue={onPriceChangeFromChange} width={160} inputProps={{ inputMode: 'decimal' }} />
              <EastIcon sx={{ fontSize: 24, color: 'contentText.Normal', flexShrink: 0 }} />
              <MIMaskInput value={toStr} onUpdateValue={onPriceChangeToChange} width={160} inputProps={{ inputMode: 'decimal' }} />
            </Box>
          </Stack>
        )}
      </Stack>
    </Block>
  )
}

export default TitleSection
