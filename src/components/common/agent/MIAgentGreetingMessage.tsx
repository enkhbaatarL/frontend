import { Box, Button, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import agentService from '@/service/mi/agent'
import useAuthStore from '@/store/useAuthStore'

interface Props {
  handleSendMessage: (message: string) => void
}

const BtnMessage = ({ text, onSendMessage }: { text: string; onSendMessage: (message: string) => void }) => (
  <Button
    disableRipple
    sx={{
      marginBottom: '10px',
      borderRadius: '4px',
      background: '#fff',
      border: '1px solid',
      borderColor: 'commonColor.Primary',
      '&:last-child': {
        marginBottom: '0px',
      },
      '&:hover': {
        backgroundColor: '#EDECEA',
      },
    }}
    onClick={() => onSendMessage(text)}
  >
    <Typography color="commonColor.Primary" variant="subtext3">
      {text}
    </Typography>
  </Button>
)

const MIAgentGreetingMessage = ({ handleSendMessage }: Props) => {
  const { accessCompanyInfo } = useAuthStore.getState()

  const { data: majorQuestions, isLoading } = useQuery({
    queryKey: ['majorQuestion', accessCompanyInfo?.customerCompanyNo],
    queryFn: () => agentService.getMajorQuestions(),
    gcTime: 1000 * 60 * 5,
  })

  /*
    [2025-07-07 kmjung] 변경 내역
    - before: ?.slice(0, 3)
    - after: ?.slice(0, questionLimit)
  */

  const questionLimit = majorQuestions && majorQuestions.length >= 5 ? 5 : 3

  return (
    <Box width={'100%'} display={'flex'} justifyContent={'center'} alignItems={'center'} flexDirection={'column'} marginY={'24px'}>
      <Typography color="gray.90" variant="messageText1" marginBottom={'4px'}>
        {t('신뢰도 높은 데이터로 시장의 흐름을 정확하게 읽을 수 있습니다')}
      </Typography>
      <Typography color="gray.90" variant="messageText2" marginBottom={'1px'}>
        {t('LSEG에서 수집된 글로벌 데이터를 기반으로')}
      </Typography>
      <Typography color="gray.90" variant="messageText2" marginBottom={'1px'}>
        {t('가격 수준, 추세 변화, 이상 여부 등 단일 지표에 대한 핵심 정보를 확인하고')}
      </Typography>
      <Typography color="gray.90" variant="messageText2" marginBottom={'20px'}>
        {t('해당 지표와 관련된 시황 흐름을 간결하게 파악할 수 있습니다.')}
      </Typography>
      {isLoading ? (
        <Box display={'flex'} justifyContent={'center'} alignItems={'center'} height={'116px'}>
          <MIAgentSpinner />
        </Box>
      ) : (
        majorQuestions
          ?.slice(0, questionLimit)
          .map(({ majorQuestionNo, majorQuestion }) => (
            <BtnMessage key={majorQuestionNo} text={majorQuestion} onSendMessage={handleSendMessage} />
          ))
      )}
    </Box>
  )
}

export default MIAgentGreetingMessage
