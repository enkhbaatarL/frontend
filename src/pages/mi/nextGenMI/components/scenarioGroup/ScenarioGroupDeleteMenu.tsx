import { Stack, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import MoreVertIcon from '@/components/common/icons/MoreVertIcon'
import TrashIcon from '@/components/common/icons/TrashIcon'
import MIMenu from '@/components/common/menu/MIMenu'
import useSnackbar from '@/hooks/useSnackbar'
import { getNextGenMITabPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

interface ScenarioGroupDeleteMenuProps {
  scenarioGroupId: string
}

const ScenarioGroupDeleteMenu = ({ scenarioGroupId }: ScenarioGroupDeleteMenuProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { mutate: deleteGroup, isPending } = useMutation({
    mutationFn: () => nextGenMIScenarioGroupService.deleteScenarioGroup(scenarioGroupId),
    onSuccess: () => {
      // 목록 쿼리는 gcTime:0 이라 재진입 시 새로 받아오지만, 캐시 잔존분 정리 위해 무효화
      void queryClient.invalidateQueries({ queryKey: ['nextGenMIScenarioGroups'] })
      void queryClient.invalidateQueries({ queryKey: ['nextGenMIScenarioGroupScenarios'] })
      setIsConfirmOpen(false)
      navigate(getNextGenMITabPath('scenarios'), {
        state: { successMessage: '시나리오 그룹이 삭제되었습니다.' },
      })
    },
    onError: () => {
      showSnackbar('시나리오 그룹 삭제에 실패했습니다.', { variant: 'error' })
    },
  })

  return (
    <>
      <MIMenu
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        placement="bottom-end"
        menuPositionOffset={{ top: 8 }}
        variant="outlined"
        aria-label="시나리오 그룹 더보기"
        label={<MoreVertIcon />}
        enableHoverBackground
        paperProps={{ sx: { width: '200px', overflow: 'hidden' } }}
        sx={{
          height: '36px',
          width: '36px',
          padding: '8px',
          color: 'contentIcon.Enabled',
        }}
      >
        <Stack padding="12px">
          <Stack
            role="button"
            tabIndex={0}
            direction="row"
            alignItems="center"
            gap="8px"
            padding="8px 12px 8px 6px"
            borderRadius="10px"
            onClick={() => {
              setIsMenuOpen(false)
              setIsConfirmOpen(true)
            }}
            sx={{
              cursor: 'pointer',
              color: 'contentText.Error',
              '&:hover': { bgcolor: 'contentBG.Hover' },
            }}
          >
            <TrashIcon />
            <Typography variant="body2M14" color="inherit" noWrap>
              시나리오 그룹 삭제
            </Typography>
          </Stack>
        </Stack>
      </MIMenu>

      <MIConfirm
        open={isConfirmOpen}
        title="시나리오 그룹을 삭제하시겠습니까?"
        width={450}
        handleClose={() => {
          if (isPending) return
          setIsConfirmOpen(false)
        }}
        disableClose={isPending}
        actions={[
          { label: '취소', variant: 'outlined', color: 'gray', disabled: isPending, onClick: () => setIsConfirmOpen(false) },
          { label: '삭제', variant: 'filled', color: 'red', disabled: isPending, onClick: () => deleteGroup() },
        ]}
      >
        <Typography variant="body2R14" color="contentText.Normal" lineHeight={1.6}>
          시나리오 그룹과 그룹 내 포함된 모든 시나리오가 삭제됩니다.
        </Typography>
      </MIConfirm>
    </>
  )
}

export default ScenarioGroupDeleteMenu
