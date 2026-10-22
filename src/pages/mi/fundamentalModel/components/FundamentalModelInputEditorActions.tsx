import { Stack } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'

interface Props {
  canReset?: boolean
  canSubmit?: boolean
  onReset?: () => void
  onSubmit?: () => void
}

const FundamentalModelInputEditorActions = ({ canReset = false, canSubmit = false, onReset, onSubmit }: Props) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    height="64px"
    minHeight="64px"
    padding="12px 20px"
    borderTop="1px solid"
    borderColor="contentBorder.Normal"
    boxSizing="border-box"
    flexShrink={0}
  >
    <MIBaseButton
      variant="outlined"
      disabled={!canReset}
      onClick={onReset}
      sx={{ height: '36px', padding: '8px 10px', borderRadius: '8px' }}
    >
      셀 값 초기화
    </MIBaseButton>
    <MIBaseButton
      variant="contained"
      disabled={!canSubmit}
      onClick={onSubmit}
      sx={{ height: '36px', padding: '8px 10px', borderRadius: '8px' }}
    >
      MI 수급모델 실행
    </MIBaseButton>
  </Stack>
)

export default FundamentalModelInputEditorActions
