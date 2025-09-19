import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import { ChangeEvent, useState } from 'react'

import MISelect from '@/components/common/select/MISelect'

export interface EditPannalProps {
  isPublished?: boolean
  inflectionPoint?: string
  onPublishedChange?: (isPublished: boolean) => void
  useInflectionPointSelect?: boolean
  onInflectionPointChange?: (inflectionPoint: string) => void
}

const EditPannal = ({
  isPublished = false,
  inflectionPoint = '미등록',
  onPublishedChange,
  useInflectionPointSelect = false,
  onInflectionPointChange,
}: EditPannalProps) => {
  const [published, setPublished] = useState(isPublished)
  const [selectedInflectionPoint, setSelectedInflectionPoint] = useState(inflectionPoint)

  const inflectionPointOptions = [
    { label: '미등록', value: '미등록' },
    { label: '등록', value: '등록' },
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
            value={selectedInflectionPoint}
            onChange={handleInflectionPointChange}
            options={inflectionPointOptions}
            width={93}
            sizeSelect="h34"
            placeholder="미등록"
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '34px',
                padding: '0 6px 0 12px',
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
      )}
    </Box>
  )
}

export default EditPannal
