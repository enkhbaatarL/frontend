import { Stack } from '@mui/material'

import MIMaskInput from '@/components/common/input/MIMaskInput'
import Block, { type BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'
import { NEWSLETTER_SECTION_CODE, NEWSLETTER_SECTION_EDIT_LABEL } from '@/pages/mi/newsletter/utils/snapshotUtils'

interface SummarySectionProps {
  summary: string
  onSummaryChange?: (value?: string) => void
  blockOrder?: BlockOrderProps
  showRequiredIndicator?: boolean
  sectionVisibility?: boolean
  onSectionVisibilityChange?: (visible: boolean) => void
}

const SummarySection = ({
  summary,
  onSummaryChange,
  blockOrder,
  showRequiredIndicator = false,
  sectionVisibility,
  onSectionVisibilityChange,
}: SummarySectionProps) => (
  <Block
    label={NEWSLETTER_SECTION_EDIT_LABEL[NEWSLETTER_SECTION_CODE.SUMMARY]}
    order={blockOrder}
    collapsedPreview={summary?.trim().split(/\n/)[0] || undefined}
    showRequiredIndicator={showRequiredIndicator}
    visibility={sectionVisibility}
    onVisibilityChange={onSectionVisibilityChange}
  >
    <Stack>
      <MIMaskInput
        label="핵심 요약"
        placeholder="핵심 요약 입력"
        value={summary}
        onUpdateValue={onSummaryChange}
        multiline
        rows={8}
        maxLength={1000}
        required
      />
    </Stack>
  </Block>
)

export default SummarySection
