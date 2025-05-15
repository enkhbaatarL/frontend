import { Box, Stack, RadioGroup, FormControlLabel, Radio } from '@mui/material'
import { t } from 'i18next'

import AdminCheckboxField from '@/components/admin/AdminCheckboxField'
import AdminIpInput from '@/components/admin/AdminIpInput'
import AdminTextField from '@/components/admin/AdminTextField'
import MIChip from '@/components/common/chip/MIChip'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import { UserRole } from '@/service/admin/members'

type FormMode = 'register' | 'edit' | 'view'

interface AdminAccessControlFormProps {
  mode: FormMode
  displayManagerInfo: string
  userRoleCd?: UserRole
  isOtherServiceAccessPossible: boolean
  accessAllowedIpAddress: string[]
  onToggleAccess?: () => void
  onIpUpdate?: (ipList: string[]) => void
  onUserRoleChange?: (role: UserRole) => void
  disabled?: boolean
}

const AdminAccessControlForm = ({
  mode,
  displayManagerInfo,
  userRoleCd,
  isOtherServiceAccessPossible,
  accessAllowedIpAddress = [],
  onToggleAccess,
  onIpUpdate,
  onUserRoleChange,
  disabled,
}: AdminAccessControlFormProps) => {
  const isRegisterMode = mode === 'register'
  const isViewMode = mode === 'view'

  const userRoleOptions = [
    { value: UserRole.ADMIN, label: t('Admin') },
    { value: UserRole.OPERATOR, label: t('운영자') },
  ]

  return (
    <Box className="content-body">
      <Box>
        <MIField
          labelSize="lg"
          label={t(isRegisterMode ? '사용자 정보' : '관리자 정보')}
          subText={
            isRegisterMode
              ? t('상단 검색 후 사용자 선택 시 자동 입력됩니다.')
              : t('관리자 정보는 수정이 불가합니다. 수정 필요 시 삭제 후 신규 사용자를 등록해 주세요.')
          }
          required={isRegisterMode}
        >
          <MIInput
            width={500}
            readOnly
            placeholder={isRegisterMode ? t('선택하세요') : t('사용자 검색 목록에서 사용자를 선택하세요.')}
            value={displayManagerInfo}
            disabled={disabled}
          />
        </MIField>
      </Box>
      <Box>
        <MIField
          labelSize="lg"
          label={t('구분')}
          subText={t('관리자는 프라이빗 데이터의 등록을 제외한 모든 관리가 가능합니다. 운영자는 프라이빗 데이터의 등록만 가능합니다.')}
          required={!isViewMode}
        >
          {isViewMode ? (
            <MIChip
              color={userRoleCd === UserRole.ADMIN ? 'blue' : 'orange'}
              size="h24"
              label={userRoleCd === UserRole.ADMIN ? t('Admin') : t('운영자')}
            />
          ) : (
            <RadioGroup
              row
              value={userRoleCd ?? ''}
              onChange={(event) => {
                const newValue = event.target.value as UserRole

                onUserRoleChange?.(newValue)
              }}
            >
              {userRoleOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  disabled={disabled || !isRegisterMode}
                />
              ))}
            </RadioGroup>
          )}
        </MIField>
      </Box>
      {userRoleCd === UserRole.ADMIN && (
        <Box>
          <MIField
            labelSize="lg"
            label={t('타사 서비스 접근 여부')}
            subText={t('접근 허용 시 모든 고객사의 MI 서비스 접근이 가능합니다. 단, 데이터는 기본 정보만 표기됩니다.')}
          >
            {isViewMode ? (
              <MIChip
                color={isOtherServiceAccessPossible ? 'blue' : 'gray'}
                size="h24"
                label={isOtherServiceAccessPossible ? t('허용') : t('비허용')}
              />
            ) : (
              <AdminCheckboxField
                label={t('접근 허용')}
                checked={isOtherServiceAccessPossible}
                onChange={onToggleAccess}
                disabled={disabled || isViewMode}
              />
            )}
          </MIField>
        </Box>
      )}
      <Box>
        <MIField
          labelSize="lg"
          label={t('관리자 IP')}
          subText={t('등록한 IP에서만 접속이 가능합니다. 등록할 관리자의 IP를 입력하세요.')}
          required={isRegisterMode}
        >
          <Stack spacing={2} mt={3}>
            {isViewMode
              ? accessAllowedIpAddress.map((ip) => <AdminTextField key={ip} sx={{ width: '500px' }} value={ip} aria-readonly="true" />)
              : onIpUpdate && <AdminIpInput ipList={accessAllowedIpAddress} onUpdate={onIpUpdate} disabled={disabled} />}
          </Stack>
        </MIField>
      </Box>
    </Box>
  )
}

export default AdminAccessControlForm
