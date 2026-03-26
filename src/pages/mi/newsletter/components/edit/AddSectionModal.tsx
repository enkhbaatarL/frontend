import { Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIMaskInput from '@/components/common/input/MIMaskInput'

const TITLE_MAX = 100
const SUBTITLE_MAX = 100

export interface AddSectionModalProps {
  open: boolean
  onClose: () => void
  onAdd: (title: string, subtitle: string) => void
}

const AddSectionModal = ({ open, onClose, onAdd }: AddSectionModalProps) => {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')

  const reset = useCallback(() => {
    setTitle('')
    setSubtitle('')
  }, [])

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const trimmedTitle = title.trim()
  const isValid = trimmedTitle.length > 0

  const handleAdd = useCallback(() => {
    if (!isValid) return
    onAdd(trimmedTitle, subtitle.trim())
    onClose()
  }, [isValid, trimmedTitle, subtitle, onAdd, onClose])

  return (
    <MIConfirm
      open={open}
      title="섹션 추가"
      width={500}
      handleClose={onClose}
      disableBackdropClick
      justifyContentAction="end"
      titleSx={{ padding: '12px 24px' }}
      paperSx={{
        borderRadius: '10px',
        boxShadow: '0px 18px 50px rgba(0, 0, 0, 0.1)',
      }}
      contentSx={{
        padding: 0,
        paddingTop: 0,
      }}
      actions={[
        {
          label: '취소',
          variant: 'outlined',
          color: 'gray',
          onClick: onClose,
        },
        {
          label: '추가',
          variant: 'filled',
          color: 'primary',
          onClick: handleAdd,
          disabled: !isValid,
        },
      ]}
    >
      <Stack gap="20px" padding="24px">
        <MIMaskInput
          label="제목"
          placeholder="제목을 입력하세요"
          value={title}
          onUpdateValue={(v) => setTitle(v ?? '')}
          maxLength={TITLE_MAX}
          required
        />
        <MIMaskInput
          label="부제"
          placeholder="부제를 입력하세요"
          value={subtitle}
          onUpdateValue={(v) => setSubtitle(v ?? '')}
          multiline
          minRows={1}
          maxRows={4}
          maxLength={SUBTITLE_MAX}
        />
        <Typography variant="body3" color="contentText.Subtext" component="p">
          새로 추가된 섹션은 뉴스레터 하단에 배치됩니다. 등록 후 순서 변경이 가능합니다.
        </Typography>
      </Stack>
    </MIConfirm>
  )
}

export default AddSectionModal
