import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'

import MIAccordion from '@/components/common/accordion/MIAccordion'
import MIInput from '@/components/common/input/MIInput.tsx'
import MITablePagination from '@/components/common/table/MITablePagination.tsx'
import MITabs from '@/components/common/tabs/MITabs.tsx'

const QaPage = () => {
  const createQAItems = (prefix: string, titlePrefix: string) =>
    Array.from({ length: 10 }, (_, index) => ({
      key: `${prefix}${index + 1}`,
      title: `${titlePrefix} ${index + 1}?`,
      content: `
          예시문장입니다. This is sample content for question number ${index + 1}. The US horizontal rig count decreased by three this week,
          bringing the total to 529.
          예시문장입니다. This is sample content for question number ${index + 1}. The US horizontal rig count decreased by three this week,
          bringing the total to 529.
          예시문장입니다. This is sample content for question number ${index + 1}. The US horizontal rig count decreased by three this week,
          bringing the total to 529.
      `,
    }))

  const QAItems1 = createQAItems('qa1-', '데이터는 어떻게 조회하나요')
  const QAItems2 = createQAItems('qa2-', '사용 안내 질문')
  const QAItems3 = createQAItems('qa3-', '권한 및 접근 질문')
  const QAItems4 = createQAItems('qa4-', '기타 질문')

  const tabsData = [
    { label: '전체', content: <MIAccordion isBorder items={QAItems1} /> },
    { label: '사용 안내', content: <MIAccordion isBorder items={QAItems2} /> },
    { label: '권한 및 접근', content: <MIAccordion isBorder items={QAItems3} /> },
    { label: '기타', content: <MIAccordion isBorder items={QAItems4} /> },
  ]

  return (
    <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
      <Box paddingTop={10}>
        <Typography variant="heading2" component="div" mb={5} color="gray.90">
          Help Center
        </Typography>
        <MIInput
          width={458}
          maxWidth={'100%'}
          placeholder="Search for help center"
          size="h46"
          startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
        />
      </Box>
      <Box paddingTop={5} paddingBottom={5}>
        <MITabs size={'h52'} arrayItem={tabsData} />
        <MITablePagination />
      </Box>
    </Box>
  )
}

export default QaPage
