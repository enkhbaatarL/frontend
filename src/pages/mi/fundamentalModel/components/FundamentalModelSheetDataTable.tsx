import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'

import type { FundamentalModelSheetData } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'

import {
  getCachedFundamentalModelSheetData,
  getFundamentalModelSheetDataPreview,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelSheetDataMock'

interface FundamentalModelSheetDataTableProps {
  file: File
  sheetName: string
  children?: (data: FundamentalModelSheetData) => ReactNode
  onLoadingChange?: (isLoading: boolean) => void
}

const FundamentalModelSheetDataTable = ({ file, sheetName, children, onLoadingChange }: FundamentalModelSheetDataTableProps) => {
  const [sheetData, setSheetData] = useState<FundamentalModelSheetData | undefined>(() =>
    getCachedFundamentalModelSheetData(file, sheetName),
  )
  const [error, setError] = useState<string>()

  useEffect(() => {
    let isCurrentRequest = true

    const cachedData = getCachedFundamentalModelSheetData(file, sheetName)
    setSheetData(cachedData)
    setError(undefined)
    if (cachedData) {
      onLoadingChange?.(false)
    } else {
      onLoadingChange?.(true)
      void getFundamentalModelSheetDataPreview(file, sheetName)
        .then((data) => {
          if (isCurrentRequest) {
            setSheetData(data)
            onLoadingChange?.(false)
          }
        })
        .catch((loadError: unknown) => {
          if (isCurrentRequest) {
            setError(loadError instanceof Error ? loadError.message : '시트 데이터를 불러오지 못했습니다.')
            onLoadingChange?.(false)
          }
        })
    }

    return () => {
      isCurrentRequest = false
    }
  }, [file, sheetName, onLoadingChange])

  if (error) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" padding="20px">
        <Typography variant="body2M14" color="point.red1" textAlign="center">
          {error}
        </Typography>
      </Stack>
    )
  }

  if (!sheetData) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" role="status" aria-label="시트 데이터 로딩 중">
        <CircularProgress size={24} thickness={4} sx={{ color: 'contentIcon.ActiveSecondary' }} />
      </Stack>
    )
  }

  if (sheetData.rows.length === 0) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Typography variant="body2M14" color="contentText.Subtext">
          표시할 데이터가 없습니다.
        </Typography>
      </Stack>
    )
  }

  if (children) return children(sheetData)

  return (
    <Box
      component="pre"
      flex={1}
      minHeight={0}
      margin={0}
      padding="16px"
      overflow="auto"
      bgcolor="gray.5"
      sx={{
        color: 'contentText.Normal',
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: 1.5,
        whiteSpace: 'pre',
      }}
    >
      {JSON.stringify(sheetData, null, 2)}
    </Box>
  )
}

export default FundamentalModelSheetDataTable
