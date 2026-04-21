import { Box, Stack, Switch, Typography } from '@mui/material'

import MIMaskInput from '@/components/common/input/MIMaskInput'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import Block from '@/pages/mi/newsletter/components/edit/sections/Block'
import { NEWSLETTER_SECTION_CODE, NEWSLETTER_SECTION_EDIT_LABEL } from '@/pages/mi/newsletter/utils/snapshotUtils'
import { FREQUENCY_LABEL, NewsletterFrequency } from '@/service/mi/newsletter'

interface CoverSectionProps {
  image: string
  publishCycle?: NewsletterFrequency
  name?: string
  description?: string
  showImage?: boolean
  onShowImageChange?: (show: boolean) => void
  onNameChange?: (value?: string) => void
  onDescriptionChange?: (value?: string) => void
  showRequiredIndicator?: boolean
  sectionVisibility?: boolean
  onSectionVisibilityChange?: (visible: boolean) => void
}

const CoverSection = ({
  image,
  publishCycle = NewsletterFrequency.DAILY,
  name = '',
  description = '',
  showImage = true,
  onShowImageChange,
  onNameChange,
  onDescriptionChange,
  showRequiredIndicator = false,
  sectionVisibility,
  onSectionVisibilityChange,
}: CoverSectionProps) => (
  <Block
    label={NEWSLETTER_SECTION_EDIT_LABEL[NEWSLETTER_SECTION_CODE.COVER]}
    fixed
    collapsedPreview={name || undefined}
    showRequiredIndicator={showRequiredIndicator}
    visibility={sectionVisibility}
    onVisibilityChange={onSectionVisibilityChange}
  >
    <Stack gap="12px">
      <Stack direction="row" justifyContent="space-between" gap="12px">
        <Stack
          direction="row"
          alignItems="center"
          gap="12px"
          padding="12px"
          bgcolor="commonColor.White"
          borderRadius="10px"
          border="1px solid"
          borderColor="contentBorder.Normal"
          flex={1}
        >
          <Box
            component="img"
            src={image}
            alt="cover"
            width="80px"
            height="50px"
            borderRadius="6px"
            border="0.5px solid"
            borderColor="contentBorder.Active"
            draggable={false}
          />
          <Stack justifyContent="center" gap="4px" flex={1}>
            <Typography variant="body2SB14" color="contentText.Normal">
              뉴스레터 커버 이미지
            </Typography>
            <Typography variant="body3" color="contentText.Subtext">
              작성된 뉴스를 뉴스레터 발행 목록에 노출합니다.
            </Typography>
          </Stack>
          <Switch checked={showImage} onChange={(_, checked) => onShowImageChange?.(checked)} disabled={!onShowImageChange} size="small" />
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          gap="12px"
          padding="12px"
          bgcolor="commonColor.White"
          borderRadius="10px"
          border="1px solid"
          borderColor="contentBorder.Normal"
          flexShrink={0}
        >
          <Stack justifyContent="center" gap="4px">
            <Typography variant="body2SB14" color="contentText.Normal">
              발행 주기
            </Typography>
            <Typography variant="body3" color="contentText.Subtext">
              뉴스레터의 발행 주기를 설정합니다.
            </Typography>
          </Stack>
          <MISelectMenu
            variant="outlined"
            selected={publishCycle}
            onSelected={() => {}}
            items={[
              { label: FREQUENCY_LABEL[NewsletterFrequency.DAILY], value: NewsletterFrequency.DAILY },
              { label: FREQUENCY_LABEL[NewsletterFrequency.WEEKLY], value: NewsletterFrequency.WEEKLY },
              { label: FREQUENCY_LABEL[NewsletterFrequency.ON_DEMAND], value: NewsletterFrequency.ON_DEMAND },
            ]}
            sx={{
              height: '36px',
            }}
            disabled
          />
        </Stack>
      </Stack>
      <Stack>
        <MIMaskInput label="뉴스레터명" placeholder="뉴스레터명 입력" value={name} onUpdateValue={onNameChange} maxLength={100} required />
        <MIMaskInput
          label="뉴스레터 소개"
          placeholder="뉴스레터 소개 입력"
          value={description}
          onUpdateValue={onDescriptionChange}
          multiline
          rows={7}
          maxLength={500}
        />
      </Stack>
    </Stack>
  </Block>
)

export default CoverSection
