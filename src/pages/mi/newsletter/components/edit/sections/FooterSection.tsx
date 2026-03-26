import { Box, Stack, Switch, Typography } from '@mui/material'
import { useState, ChangeEvent } from 'react'

import MIMaskInput from '@/components/common/input/MIMaskInput'
import Block from '@/pages/mi/newsletter/components/edit/sections/Block'
import { FOOTER_LOGO_BASE64 } from '@/pages/mi/newsletter/components/emailTemplate/Footer'
import { NEWSLETTER_SECTION_CODE, NEWSLETTER_SECTION_EDIT_LABEL } from '@/pages/mi/newsletter/utils/snapshotUtils'

interface FooterSectionProps {
  footerContent?: string
  showLogo?: boolean
  onFooterContentChange?: (value?: string) => void
  onShowLogoChange?: (show: boolean) => void
  sectionVisibility?: boolean
  onSectionVisibilityChange?: (visible: boolean) => void
}

const FooterSection = ({
  footerContent,
  showLogo = true,
  onFooterContentChange,
  onShowLogoChange,
  sectionVisibility,
  onSectionVisibilityChange,
}: FooterSectionProps) => {
  const [logoVisible, setLogoVisible] = useState(showLogo)

  const handleLogoToggle = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setLogoVisible(checked)
    onShowLogoChange?.(checked)
  }

  return (
    <Block
      label={NEWSLETTER_SECTION_EDIT_LABEL[NEWSLETTER_SECTION_CODE.FOOTER]}
      fixed
      visibility={sectionVisibility}
      onVisibilityChange={onSectionVisibilityChange}
    >
      <Stack gap="12px">
        <Stack
          maxWidth="460px"
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          padding="12px"
          bgcolor="commonColor.White"
          borderRadius="10px"
          border="1px solid"
          borderColor="contentBorder.Normal"
          boxSizing="border-box"
        >
          <Stack direction="row" alignItems="center" gap="12px" flex={1}>
            <Box
              width="70px"
              height="50px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="6px"
              border="0.5px solid"
              borderColor="contentBorder.Active"
              padding="6px"
              boxSizing="border-box"
            >
              <Box component="img" src={FOOTER_LOGO_BASE64} alt="AI Market Insights" width="100%" draggable={false} />
            </Box>
            <Stack justifyContent="center" gap="4px" flex={1}>
              <Typography variant="body2SB14" color="contentText.Normal">
                AI Market Insights 로고
              </Typography>
              <Typography variant="body3" color="contentText.Subtext">
                서비스 로고를 뉴스레터 푸터 영역에 노출합니다.
              </Typography>
            </Stack>
          </Stack>
          <Switch checked={logoVisible} onChange={handleLogoToggle} size="small" />
        </Stack>
        <MIMaskInput
          label="푸터 내용"
          placeholder="푸터 내용 입력"
          value={footerContent ?? ''}
          onUpdateValue={onFooterContentChange}
          multiline
          rows={6}
          maxLength={1000}
          required
        />
      </Stack>
    </Block>
  )
}

export default FooterSection
