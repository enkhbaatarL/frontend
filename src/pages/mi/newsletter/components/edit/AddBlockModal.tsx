import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ReferenceContentBlockKind } from '@/pages/mi/newsletter/utils/snapshotUtils'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import useSnackbar from '@/hooks/useSnackbar'

const TITLE_MAX = 100
/** {@link NewsFormFields} 뉴스 본문과 동일 */
const CONTENT_MAX = 1000
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

export interface AddBlockModalProps {
  open: boolean
  onClose: () => void
  onAdd: (payload: { kind: ReferenceContentBlockKind; title: string; content: string; imageBase64?: string; fileName?: string }) => void
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const AddBlockModal = ({ open, onClose, onAdd }: AddBlockModalProps) => {
  const { showSnackbar } = useSnackbar()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<ReferenceContentBlockKind>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [fileName, setFileName] = useState('')

  const reset = useCallback(() => {
    setKind('text')
    setTitle('')
    setContent('')
    setImageBase64('')
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const trimmedTitle = title.trim()
  const textValid = trimmedTitle.length > 0
  const imageValid = trimmedTitle.length > 0 && imageBase64.length > 0
  const canSubmit = kind === 'text' ? textValid : imageValid

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      showSnackbar('JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다.', { variant: 'warning' })
      e.target.value = ''
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showSnackbar('이미지 크기는 5MB 이하여야 합니다.', { variant: 'warning' })
      e.target.value = ''
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setImageBase64(dataUrl)
      setFileName(file.name)
    } catch {
      showSnackbar('이미지를 읽는 데 실패했습니다.', { variant: 'error' })
    }
  }

  const clearImage = () => {
    setImageBase64('')
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAdd = useCallback(() => {
    if (!canSubmit) return
    onAdd({
      kind,
      title: trimmedTitle,
      content: content.trim(),
      ...(kind === 'image' ? { imageBase64, fileName } : {}),
    })
    onClose()
  }, [canSubmit, kind, trimmedTitle, content, imageBase64, fileName, onAdd, onClose])

  return (
    <MIConfirm
      open={open}
      title="블록 추가"
      width={700}
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
          disabled: !canSubmit,
        },
      ]}
    >
      <Stack gap="20px" padding="24px">
        <Stack gap="8px" display="none">
          <Typography variant="body3" color="contentText.Subtext" component="p">
            블록 타입
          </Typography>
          <MISlidingSegmented
            options={[
              { value: 'text', label: '텍스트' },
              { value: 'image', label: '이미지' },
            ]}
            value={kind}
            onChange={(v) => setKind(v as ReferenceContentBlockKind)}
          />
        </Stack>

        <MIMaskInput
          label="제목"
          placeholder="제목 입력"
          value={title}
          onUpdateValue={(v) => setTitle(v ?? '')}
          maxLength={TITLE_MAX}
          required
        />

        {kind === 'text' ? (
          <MIMaskInput
            label="내용"
            placeholder="내용 입력"
            value={content}
            onUpdateValue={(v) => setContent(v ?? '')}
            multiline
            rows={6}
            maxLength={CONTENT_MAX}
          />
        ) : (
          <Stack gap="12px">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={handleFileChange} />
            <Stack direction="row" alignItems="center" gap="12px" flexWrap="wrap">
              <MIBaseButton
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                이미지 선택
              </MIBaseButton>
              {fileName ? (
                <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body3" color="contentText.Normal" noWrap title={fileName}>
                    {fileName}
                  </Typography>
                  <MIBaseButton
                    variant="text"
                    enableHoverBackground
                    onClick={clearImage}
                    sx={{ flexShrink: 0, minWidth: 0, p: '6px' }}
                    aria-label="이미지 제거"
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </MIBaseButton>
                </Stack>
              ) : (
                <Typography variant="body3" color="contentText.Disabled">
                  파일을 선택하세요 (최대 5MB)
                </Typography>
              )}
            </Stack>
            {imageBase64 ? (
              <Box
                component="img"
                src={imageBase64}
                alt=""
                sx={{ maxWidth: '100%', maxHeight: 240, borderRadius: '8px', objectFit: 'contain' }}
              />
            ) : null}
            <MIMaskInput
              label="내용"
              placeholder="내용 입력"
              value={content}
              onUpdateValue={(v) => setContent(v ?? '')}
              multiline
              rows={6}
              maxLength={CONTENT_MAX}
            />
          </Stack>
        )}

        <Typography variant="body3" color="contentText.Subtext" component="p">
          {kind === 'text'
            ? '추가된 블록은 섹션 하단에 붙으며, 블록 헤더에서 순서를 변경할 수 있습니다.'
            : '이미지는 JPG, PNG, GIF, WEBP만 등록할 수 있습니다.'}
        </Typography>
      </Stack>
    </MIConfirm>
  )
}

export default AddBlockModal
