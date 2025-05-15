import { Box, Typography } from '@mui/material'
import { useForm, useStore } from '@tanstack/react-form'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminConfirm from '@/components/admin/AdminConfirm'
import MIButton from '@/components/common/button/MIButton'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import { require, uppercaseWithLength } from '@/components/common/input/validators'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import dataProviderService from '@/service/admin/dataProvider'

const AdminDataProviderRegistrationPageHeader = (props: { onCancel: () => void; onRegister: () => void; disabled: boolean }) => (
  <Flex gap={4}>
    <MIButton size="h34" type="outlined" color="gray" onClick={props.onCancel}>
      취소
    </MIButton>
    <MIButton size="h34" onClick={props.onRegister} disabled={props.disabled}>
      등록
    </MIButton>
  </Flex>
)

export default function AdminDataProviderRegistrationPage() {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent } = useAdminHeader()
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isOpenRegistration, setIsOpenRegistration] = useState(false)

  const form = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
    },
    validators: {
      onChange: ({ value }) => ({
        fields: {
          name: require(value.name),
          code: require(value.code) || uppercaseWithLength(value.code),
          description: require(value.description),
        },
      }),
    },
  })
  const canRegister = useStore(form.store, (state) => state.isDirty && state.canSubmit)

  const handleCancel = () => {
    setIsOpenCancel(true)
  }
  const handleRegister = () => {
    setIsOpenRegistration(true)
  }

  const formValues = useStore(form.store, (state) => state.values)

  const onSave = useCallback(async () => {
    const response = await dataProviderService.registerProvider({
      providerNm: formValues.name, // 데이터 프로바이더 명
      providerId: formValues.code, // 고유 코드
      providerExpn: formValues.description, // 데이터 프로바이더 설명
      isUsed: true,
    })

    setIsOpenRegistration(false)
    if (response.status) {
      navigate('/admin/data-providers/providers')
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
    } else {
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
    }
  }, [formValues.code, formValues.description, formValues.name, navigate, showSnackbar])

  useEffect(() => {
    setCustomComponent(
      <AdminDataProviderRegistrationPageHeader onCancel={handleCancel} onRegister={handleRegister} disabled={!canRegister} />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent, canRegister])

  return (
    <form>
      <Box display={'flex'} flexDirection={'column'} rowGap={'30px'} maxWidth={'700px'}>
        <form.Field name="name">
          {(field) => (
            <MIField
              labelSize="lg"
              label="데이터 프로바이더 명"
              required
              subText="데이터 프로바이더의 이름을 입력해주세요. 입력한 데이터 프로바이더명은 서비스 화면에 노출됩니다."
            >
              <MIInput
                placeholder="입력하세요"
                fullWidth
                maxLength={20}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </MIField>
          )}
        </form.Field>

        <form.Field name="code">
          {(field) => (
            <MIField
              labelSize="lg"
              label="고유 코드"
              required
              subText="프로바이더 구분을 위한 고유 코드를 입력해주세요."
              title="영문 대문자만 입력 가능, 최대 20글자"
            >
              <MIInput
                placeholder="입력하세요"
                fullWidth
                maxLength={20}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.errors.some((msg) => typeof msg === 'string')}
                errorMessage={field.state.meta.errors.filter((item) => typeof item === 'string').join(',') || ''}
              />
            </MIField>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <MIField labelSize="lg" label="데이터 프로바이더 설명" required subText="데이터 프로바이더에 대한 간략한 설명을 입력해주세요.">
              <MIInput
                placeholder="입력하세요"
                fullWidth
                maxLength={100}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </MIField>
          )}
        </form.Field>
      </Box>

      <AdminConfirm
        open={isOpenCancel}
        title={<>취소하시겠습니까?</>}
        width={450}
        handleClose={() => {
          setIsOpenCancel(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">이어서 작성</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsOpenCancel(false)
            },
          },
          {
            label: <Typography variant="body2SB14">취소 및 이동</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setIsOpenCancel(false)
              navigate('/admin/data-providers/providers')
            },
          },
        ]}
      >
        취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.
      </AdminConfirm>

      <AdminConfirm
        open={isOpenRegistration}
        title={<>등록하시겠습니까?</>}
        width={450}
        handleClose={() => {
          setIsOpenRegistration(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsOpenRegistration(false)
            },
          },
          {
            label: <Typography variant="body2SB14">등록</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => onSave(),
          },
        ]}
      >
        프로바이더 고유 코드는 최초 등록 이후 변경이 불가합니다.
      </AdminConfirm>
    </form>
  )
}
