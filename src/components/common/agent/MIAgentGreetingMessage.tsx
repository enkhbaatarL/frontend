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

  return (
    <Box width={'100%'} display={'flex'} justifyContent={'center'} alignItems={'center'} flexDirection={'column'} marginY={'24px'}>
      <Typography color="gray.90" variant="messageText1" marginBottom={'4px'}>
        {t('시장의 핵심 흐름을 한눈에, Mari에서 찾아보세요.')}
      </Typography>
      <Typography color="gray.90" variant="messageText2" marginBottom={'20px'}>
        {t('복잡한 시장 정보, 구조화된 인사이트로 정리합니다')}
      </Typography>
      {isLoading ? (
        <Box display={'flex'} justifyContent={'center'} alignItems={'center'} height={'116px'}>
          <MIAgentSpinner />
        </Box>
      ) : (
        majorQuestions
          ?.slice(0, 3)
          .map(({ majorQuestionNo, majorQuestion }) => (
            <BtnMessage key={majorQuestionNo} text={majorQuestion} onSendMessage={handleSendMessage} />
          ))
      )}
    </Box>
  )
}

export default MIAgentGreetingMessage
