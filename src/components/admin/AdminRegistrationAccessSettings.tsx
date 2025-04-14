import { Box, IconButton, Typography } from '@mui/material'
import { FunctionComponent, useState } from 'react'

import AdminCheckboxField from '@/components/admin/AdminCheckboxField'
import AdminTextField from '@/components/admin/AdminTextField'
import AddIcon from '@/components/common/icons/AddIcon'
import TrashIcon from '@/components/common/icons/TrashIcon'

export type AdminRegistrationAccessSettingsValue = {
  admin?: { name: string; position: string; department: string; companyName: string }
  allowExternalService?: boolean
  adminIps?: string[]
}

type AdminAccessSettingsProps = {
  value?: AdminRegistrationAccessSettingsValue
  onChange?: (data: AdminRegistrationAccessSettingsValue) => void
  disabled?: boolean
}

export const AdminRegistrationAccessSettings: FunctionComponent<AdminAccessSettingsProps> = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const admin = value.admin ? `${value.admin.name} • ${value.admin.position} • ${value.admin.department} • ${value.admin.companyName}` : ''
  const [allowExternalService, setAllowExternalService] = useState<boolean>(value.allowExternalService || false)
  const [adminIps, setAdminIps] = useState<string[]>(value.adminIps || [])
  const [newIp, setNewIp] = useState<string>('')

  const handleAddIp = (): void => {
    if (newIp && !adminIps.includes(newIp)) {
      const updatedIps = [...adminIps, newIp]

      setAdminIps(updatedIps)
      onChange?.({ allowExternalService, adminIps: updatedIps })
      setNewIp('')
    }
  }

  const handleToggleAccess = (): void => {
    const updatedAccess = !allowExternalService

    setAllowExternalService(updatedAccess)
    onChange?.({ allowExternalService: updatedAccess, adminIps })
  }

  return (
    <Box>
      <Typography component="p" mb={3} variant="contentTitle">
        상세 권한 설정
      </Typography>
      <Box p={5} sx={{ backgroundColor: 'gray.5', borderRadius: '4px' }}>
        <Box mb="30px">
          <Typography sx={{ mb: 1 }} component="span" variant="subtitle">
            사용자 정보
            <Typography component={'sup'} variant="asterisk" color="point.red1">
              *
            </Typography>
          </Typography>

          <Typography component="p" variant="subtext2" color="gray.60">
            {disabled
              ? '관리자 정보는 수정이 불가능합니다. 수정 필요 시 삭제 후 신규 사용자를 등록해 주세요.'
              : '상단 검색 후 사용자 선택 시 자동 입력됩니다.'}
          </Typography>
          <AdminTextField
            sx={{ width: '500px', mt: 3 }}
            value={admin}
            disabled
            placeholder={disabled ? '사용자 검색 목록에서 사용자를 선택하세요.' : '선택하세요'}
          />
        </Box>

        <Box mb="30px">
          <Typography variant="subtitle" mb={1}>
            타사 서비스 접근 여부
          </Typography>
          <Typography component="p" variant="subtext2" color="gray.60">
            접근 허용 시 모든 고객사의 MI 서비스 접근이 가능합니다. 단, 데이터는 기본 정보만 표기됩니다.
          </Typography>
          <Box mt={3}>
            <AdminCheckboxField disabled={disabled} label="접근 허용" checked={allowExternalService} onChange={handleToggleAccess} />
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle" mb={1}>
            관리자 IP
            <Typography component={'sup'} variant="asterisk" color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component="p" variant="subtext2" color="gray.60">
            등록한 IP에서만 접속이 가능합니다. 등록할 관리자 IP를 입력하세요.
          </Typography>
          <Box display="flex" width="500px" mt={3}>
            <AdminTextField
              fullWidth
              disabled={disabled}
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="입력하세요."
            />
            <IconButton onClick={handleAddIp} color={disabled ? 'gray.40' : 'gray.60'} disabled={disabled}>
              <AddIcon />
            </IconButton>
          </Box>

          {adminIps.length > 0 &&
            adminIps.map((ip, idx) => (
              <Box key={ip} display="flex" width="500px" mt={3}>
                <AdminTextField
                  sx={{
                    '&[aria-readonly="true"] .MuiInputBase-input': {
                      background: '#ffffff',
                    },
                  }}
                  fullWidth
                  value={ip}
                  aria-readonly={true}
                />
                <IconButton
                  type="button"
                  onClick={() => {
                    const updated = adminIps.filter((_, i) => i !== idx)

                    setAdminIps(updated)
                    onChange?.({ allowExternalService, adminIps: updated })
                  }}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                  aria-label="Delete IP"
                >
                  <TrashIcon />
                </IconButton>
              </Box>
            ))}
        </Box>
      </Box>
    </Box>
  )
}
