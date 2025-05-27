import { Button, Grid2 as Grid } from '@mui/material'

type Props = {
  recommenQuestion: string[]
  handleSendMessage: (message?: string) => void
}
const BtnRecommen = ({ text, handleSendMessage }: { text: string; handleSendMessage: (message?: string) => void }) => (
  <Button
    disableRipple
    sx={{
      borderRadius: '4px',
      background: '#fff',
      border: '1px solid',
      padding: '4px 8px',
      borderColor: 'primary.main',
      color: 'primary.main',
      fontSize: '12px',
      fontWeight: '600',
      lineHeight: '1.4',
      backgroundColor: '#fff',
      '&:hover': {
        backgroundColor: '#EDECEA',
      },
    }}
    onClick={() => handleSendMessage(text)}
  >
    {text}
  </Button>
)
const MIAgentRecommenQuestion = ({ recommenQuestion, handleSendMessage }: Props) => (
  <>
    {recommenQuestion && recommenQuestion.length > 0 && (
      <Grid container gap={1.5} direction={'column'} py={4.5} alignItems={'start'}>
        {recommenQuestion.map((item, index) => (
          <BtnRecommen key={index} text={item} handleSendMessage={handleSendMessage} />
        ))}
      </Grid>
    )}
  </>
)

export default MIAgentRecommenQuestion
