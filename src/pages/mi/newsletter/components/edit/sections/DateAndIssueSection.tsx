import { Stack } from '@mui/material'
import dayjs from 'dayjs'

import MIMaskInput from '@/components/common/input/MIMaskInput'
import MIDatePickerMenu from '@/components/common/menu/MIDatePickerMenu'
import Block, { type BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'
import { NEWSLETTER_SECTION_CODE, NEWSLETTER_SECTION_EDIT_LABEL } from '@/pages/mi/newsletter/utils/snapshotUtils'

interface DateAndIssueSectionProps {
  date: string
  issueNo: string
  blockOrder?: BlockOrderProps
  showRequiredIndicator?: boolean
  sectionVisibility?: boolean
  onSectionVisibilityChange?: (visible: boolean) => void
}

const DateAndIssueSection = ({
  date,
  issueNo,
  blockOrder,
  showRequiredIndicator = false,
  sectionVisibility,
  onSectionVisibilityChange,
}: DateAndIssueSectionProps) => (
  <Block
    label={NEWSLETTER_SECTION_EDIT_LABEL[NEWSLETTER_SECTION_CODE.DATE_ISSUE]}
    order={blockOrder}
    collapsedPreview={`${date} ${issueNo}`}
    showRequiredIndicator={showRequiredIndicator}
    visibility={sectionVisibility}
    onVisibilityChange={onSectionVisibilityChange}
  >
    <Stack direction="row" gap="12px" flexWrap="wrap">
      <MIDatePickerMenu label="날짜" value={dayjs(date)} onChange={() => {}} width="200px" height="36px" required disabled />
      <MIMaskInput label="Issue Number" placeholder="Issue Number 입력" value={issueNo} width="200px" required disabled />
    </Stack>
  </Block>
)

export default DateAndIssueSection
