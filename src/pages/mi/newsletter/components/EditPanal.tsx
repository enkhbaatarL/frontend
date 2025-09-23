import { Box, Button, FormControlLabel, Switch, Typography } from '@mui/material'
import { ChangeEvent, useState, useEffect } from 'react'

import TrashIcon from '@/components/common/icons/TrashIcon'
import MISelect from '@/components/common/select/MISelect'

export interface EditPannalProps {
  isPublished?: boolean
  inflectionPoint?: string
  onPublishedChange?: (isPublished: boolean) => void
  useInflectionPointSelect?: boolean
  onInflectionPointChange?: (inflectionPoint: string) => void
  onDeleteNews?: () => void
}

const EditPannal = ({
  isPublished = false,
  onPublishedChange,
  useInflectionPointSelect = false,
  inflectionPoint = '',
  onInflectionPointChange,
  onDeleteNews,
}: EditPannalProps) => {
  const [published, setPublished] = useState(isPublished)
  const [selectedInflectionPoint, setSelectedInflectionPoint] = useState(inflectionPoint)

  useEffect(() => {
    setPublished(isPublished)
  }, [isPublished])

  useEffect(() => {
    setSelectedInflectionPoint(inflectionPoint)
  }, [inflectionPoint])

  const inflectionPointOptions = [
    { label: '미등록', value: '' },
    { label: '상승', value: 'UP' },
    { label: '중립', value: 'NONE' },
    { label: '하락', value: 'DOWN' },
  ]

  const handlePublishedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked
    setPublished(newValue)
    onPublishedChange?.(newValue)
  }

  const handleInflectionPointChange = (event: { target: { value: string | number | boolean | (string | number | boolean)[] } }) => {
    const newValue = String(event.target.value)
    setSelectedInflectionPoint(newValue)
    onInflectionPointChange?.(newValue)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '10px 20px',
        backgroundColor: '#F8F9FA',
        border: '1px solid #DEE2E6',
        borderRadius: '4px',
        width: 'fit-content',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          width: '100%',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Pretendard',
            fontWeight: 600,
            fontSize: '14px',
            lineHeight: '1.4',
            color: '#868E96',
            width: '50px',
            textAlign: 'left',
          }}
        >
          게시
        </Typography>
        <FormControlLabel control={<Switch checked={published} onChange={handlePublishedChange} />} label="" />
      </Box>

      {useInflectionPointSelect && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Pretendard',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '1.4',
                color: '#868E96',
                width: '50px',
                textAlign: 'left',
              }}
            >
              변곡점
            </Typography>
            <MISelect
              type="button"
              value={selectedInflectionPoint}
              onChange={handleInflectionPointChange}
              options={inflectionPointOptions}
              width={93}
              sizeSelect="h34"
              placeholder="미등록"
              darkPlaceholder
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '34px',
                  '& fieldset': {
                    borderColor: '#DEE2E6',
                    borderRadius: '4px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#DEE2E6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#DEE2E6',
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '6px 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#495057',
                },
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Button variant="text" onClick={onDeleteNews} sx={{ color: 'red', svg: { color: 'red !important' }, marginLeft: '-12px' }}>
              <TrashIcon />
              삭제
            </Button>
          </Box>
        </>
      )}
    </Box>
  )
}

export default EditPannal
