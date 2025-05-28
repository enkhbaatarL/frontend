import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, Stack, TextField } from '@mui/material'
import { useState } from 'react'

import type React from 'react'

import MIButton from '@/components/common/button/MIButton'

// Styled Paper component with dashed border
// const DashedPaper = styled(Paper)(({ theme }) => ({
//   padding: theme.spacing(3),
//   borderRadius: theme.shape.borderRadius,
//   border: `1px dashed ${theme.palette.divider}`,
// }))

export interface FeedbackOption {
  id: string
  label: string
}

export interface MIAgentFeedbackProps {
  title?: string
  description?: string
  options: FeedbackOption[]
  onSubMIt: (selectedOption: string) => void
  onCancel: () => void
  onChange?: (value: string) => void
  subMItButtonText?: string
  cancelButtonText?: string
}

const MIAgentFeedback: React.FC<MIAgentFeedbackProps> = ({
  title = 'Feedback',
  description = '어떤 점이 불만족스러우셨나요? 알려주시면 개선하겠습니다.',
  options,
  onSubMIt,
  onCancel,
  onChange,
  subMItButtonText = '확인',
  cancelButtonText = '취소',
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(event.target.value as string)
    setSelectedOption(event.target.value)
  }

  const handleSubMIt = () => {
    if (selectedOption) {
      onSubMIt(selectedOption)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        minWidth: '450px',
        maxWidth: '800px',
        minHeight: '186px',
        maxHeight: '800px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: '12px',
        border: '1px solid #DEE2E6',
        background: '#FFF',
        padding: '20px',
        boxSizing: 'border-box',
        ' p': {
          margin: '0 !important',
        },
      }}
    >
      <Box mb={7.5}>
        <Typography variant="contentTitle" color="gray.70" component={'div'}>
          {title}
        </Typography>
        <Typography variant="body2R14" color="gray.60">
          {description}
        </Typography>
      </Box>

      <FormControl component="fieldset">
        <RadioGroup value={selectedOption} onChange={handleChange}>
          {options.map((option) => (
            <FormControlLabel
              key={option.id}
              value={option.id}
              control={<Radio size="small" />}
              label={
                <Typography variant="body2M14" sx={{ ml: 0.5 }}>
                  {option.label}
                </Typography>
              }
              sx={{ mb: 1 }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {selectedOption === 'other' && <TextField fullWidth={true} placeholder="불만족 사유 입력" rows={4} multiline></TextField>}

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3, width: '100%' }}>
        <MIButton type={'outlined'} color={'gray'} size="h34" onClick={onCancel}>
          {cancelButtonText}
        </MIButton>
        <MIButton type={'filled'} color={'primary'} size="h34" onClick={handleSubMIt} disabled={!selectedOption}>
          {subMItButtonText}
        </MIButton>
      </Stack>
    </Box>
  )
}

export default MIAgentFeedback
