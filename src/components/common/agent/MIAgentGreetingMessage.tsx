import { Box, Button, Typography } from '@mui/material'

const BtnMessage = ({ text, onSendMessage }: { text: string; onSendMessage: (message?: string) => void }) => (
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

const MIAgentGreetingMessage = ({ handleSendMessage }: { handleSendMessage: (message?: string) => void }) => (
  <Box width={'100%'} display={'flex'} justifyContent={'center'} alignItems={'center'} flexDirection={'column'} marginY={'24px'}>
    <Typography color="gray.90" variant="messageText1" marginBottom={'4px'}>
        오늘의 시장 인사이트, Mari에게 물어보세요.
    </Typography>
    <Typography color="gray.90" variant="messageText2" marginBottom={'20px'}>
        오늘의 상황을 반영한 추천 질문입니다
    </Typography>
    <BtnMessage text="최근 미국 관세 정책이 유가에 미친 영향은 무엇인가요" onSendMessage={handleSendMessage}></BtnMessage>
    <BtnMessage text="지난 한 달간 주요 유종의 가격 흐름을 요약해 주세요" onSendMessage={handleSendMessage}></BtnMessage>
    <BtnMessage text="이번 주 유가에 영향을 줄 수 있는 주요 글로벌 이벤트는 무엇인가요" onSendMessage={handleSendMessage}></BtnMessage>
  </Box>
)

export default MIAgentGreetingMessage
