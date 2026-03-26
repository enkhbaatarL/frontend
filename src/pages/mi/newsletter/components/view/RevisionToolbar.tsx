import { InfoOutlined, Logout } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MISelectMenu from '@/components/common/menu/MISelectMenu'

export interface RevisionVersion {
  id: string
  label: string
  date: string
}

export type RevisionToolbarProps = {
  versions?: RevisionVersion[]
  isLoading?: boolean
  selectedVersionId?: string
  onVersionChange?: (versionId: string) => void
  onEndRevision?: () => void
}

export const INITIAL_VERSION_ID = 'initial'
const INITIAL_VERSION: RevisionVersion = { id: INITIAL_VERSION_ID, label: '최초버전', date: '' }

const RevisionToolbar = ({
  versions = [],
  isLoading = false,
  selectedVersionId = INITIAL_VERSION_ID,
  onVersionChange,
  onEndRevision,
}: RevisionToolbarProps) => {
  const [open, setOpen] = useState(false)

  const selectedId = selectedVersionId

  const handleVersionSelect = (versionId: string) => {
    onVersionChange?.(versionId)
    setOpen(false)
  }

  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        py="4px"
        bgcolor="commonColor.Black"
        sx={{ transition: 'background-color 0.25s ease' }}
      >
        <Stack direction="row" justifyContent="center" alignItems="center" gap="8px" width="800px" style={{ userSelect: 'none' }}>
          <Typography variant="body1" color="contentText.White">
            Version History
          </Typography>
        </Stack>
      </Box>

      <Stack paddingTop="8px" paddingBottom="8px" bgcolor="gray.40" sx={{ transition: 'background-color 0.25s ease' }}>
        <Stack width="800px" margin="0 auto" direction="row" justifyContent="space-between" alignItems="center" boxSizing="border-box">
          <Stack direction="row" alignItems="center" flex={1}>
            <MISelectMenu
              open={open}
              onOpenChange={setOpen}
              label={isLoading ? '로딩 중...' : 'Version'}
              variant="outlined"
              placement="bottom-end"
              selected={selectedId ?? ''}
              onSelected={handleVersionSelect}
              items={[
                ...versions.map((version) => ({ label: version.label, value: version.id })),
                { label: INITIAL_VERSION.label, value: INITIAL_VERSION.id },
              ]}
              disabled={isLoading}
              buttonHoverBgColor={open ? 'contentBG.Active' : 'commonColor.White'}
              sx={{
                height: '36px',
                backgroundColor: open ? 'contentBG.Active' : 'commonColor.White',
              }}
              footer={
                <Stack direction="row" alignItems="center" gap="4px" p="12px">
                  <InfoOutlined sx={{ fontSize: 16, color: 'contentText.Subtext' }} />
                  <Typography variant="body2M14" color="contentText.Subtext" sx={{ fontSize: 12 }}>
                    최근 20개 버전까지 저장
                  </Typography>
                </Stack>
              }
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap="10px">
            <MIBaseButton
              variant="outlined"
              onClick={onEndRevision}
              sx={{
                height: '36px',
                backgroundColor: 'commonColor.White',
                borderRadius: '10px',
                padding: '8px',
                '&:hover': {
                  backgroundColor: 'commonColor.White',
                },
              }}
              buttonHoverBgColor="commonColor.White"
            >
              <Stack direction="row" alignItems="center" gap="6px" color="contentText.Normal">
                <Logout sx={{ fontSize: '20px' }} />
                <Typography variant="body2SB14" color="contentText.Normal" noWrap>
                  변경이력 종료
                </Typography>
              </Stack>
            </MIBaseButton>
          </Stack>
        </Stack>
      </Stack>
    </>
  )
}

export default RevisionToolbar
