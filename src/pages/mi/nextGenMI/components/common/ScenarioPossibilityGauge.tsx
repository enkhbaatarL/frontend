import { Divider, Stack, Typography } from '@mui/material'

type ScenarioPossibilityGaugeProps = {
  /** 발생 확률 (0~100 정수) */
  probability: number
  disabled?: boolean
  hideHoverBackground?: boolean
}

/** 발생가능성 퍼센트 */
const ScenarioPossibilityGauge = ({ probability, disabled = false, hideHoverBackground = false }: ScenarioPossibilityGaugeProps) => (
  <Stack
    direction="row"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    height={disabled ? '24px' : undefined}
    borderRadius="8px"
    padding="2px 6px"
    overflow="hidden"
    boxSizing="border-box"
    sx={disabled || hideHoverBackground ? undefined : { '&:hover': { bgcolor: 'gray.5' } }}
  >
    {disabled ? (
      <Divider sx={{ width: '20px', borderColor: 'contentText.Disabled' }} />
    ) : (
      <Typography variant="body2M14" color="contentText.Black" whiteSpace="nowrap">
        {Number.isFinite(probability) ? `${Math.round(Math.min(100, Math.max(0, probability)))}%` : '-'}
      </Typography>
    )}
  </Stack>
)

export default ScenarioPossibilityGauge
