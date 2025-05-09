import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridRowParams } from '@mui/x-data-grid'
import { useForm, useStore } from '@tanstack/react-form'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AdminCompanySelectorIconButton from '@/components/admin/AdminCompanySelectorIconButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import MIChip from '@/components/common/chip/MIChip'
import DetailItem from '@/components/common/detail-item'
import SettingIcon from '@/components/common/icons/SettingIcon'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import { uppercase, require } from '@/components/common/input/validators'
import MITableCell from '@/components/common/table/MITableCell'
import MITableLayout from '@/components/common/table/MITableLayout'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar.tsx'
import { getMockTableData } from '@/utils/mock-data'

const AdminDataProvidersDetailPageHeaderButton = (props: { onChange: (value: boolean) => void; value: boolean; label: string }) => {
  const toggle = (value: boolean) => {
    props.onChange(value)
  }

  return (
    <Stack direction="row" alignItems="center" sx={{ ml: 'auto' }}>
      <Switch
        defaultChecked
        onChange={(e) => toggle(e.target.checked)}
        onContextMenu={(e) => {
          e.preventDefault()
          const target = e.target as HTMLInputElement

          toggle(target.checked)
        }}
      />
      <Typography variant="body2M14" color={'gray.70'} onClick={(e) => e.stopPropagation()}>
        {props.label}
      </Typography>
    </Stack>
  )
}

const CustomPageTitle = (props: { label: string }) => (
  <Box display="flex" alignItems="center" columnGap={'10px'}>
    {props.label && <MIChip label={props.label} color={props.label === '활성화' ? 'gray' : 'blue'} size="h24" />}
    <Typography color="gray.90" variant="heading2">
      데이터 프로바이더 상세
    </Typography>
  </Box>
)

export default function AdminDataProvidersDetailPage() {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent, setSubHeader, setCustomTitle } = useAdminHeader()
  const [isActive, setIsActive] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState({
    value: 'company1',
    label: 'LSEG',
  })
  const [openModifiedData, setOpenModifiedData] = useState(false)
  const [openEditingConfirm, setOpenEditingConfirm] = useState(false)
  const [openActiveCofirm, setOpenActiveConfirm] = useState(false)

  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'admin'
  const status = searchParams.get('status') || ''
  const isAdmin = role === 'admin'

  const toogle = () => {
    setOpenActiveConfirm(true)
  }

  const editForm = useForm({
    defaultValues: {
      name: 'LSEG',
      code: 'RFTV',
      description: '프로바이더명$에 대한 설명입니다.',
    },
    validators: {
      onChange: ({ value }) => ({
        fields: {
          name: require(value.name),
          code: require(value.code) || uppercase(value.code),
          description: require(value.description),
        },
      }),
    },
  })

  const canEdit = useStore(editForm.store, (state) => state.canSubmit)

  const activeForm = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onChange: ({ value }) => {
        const isRequire = (v: string) => (v.length === 0 ? true : undefined)

        return {
          fields: {
            name: isRequire(value.name),
          },
        }
      },
    },
  })
  const canActive = useStore(activeForm.store, (state) => state.canSubmit && state.isDirty)

  useEffect(() => {
    setCustomComponent(<AdminDataProvidersDetailPageHeaderButton value={isActive} onChange={toogle} label={isActive ? '활성' : '비활성'} />)
    setSubHeader(
      <DetailItem
        title={
          <Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography variant="contentTitle" color="gray.90" mr={'4px'}>
                {selectedCompany.label}
              </Typography>
              <AdminCompanySelectorIconButton
                value={selectedCompany}
                onChange={({ value, label }) => {
                  setSelectedCompany({
                    value: value as string,
                    label: typeof label === 'string' ? label : '',
                  })
                }}
              />
            </Box>
          </Box>
        }
        subTitle={
          <Typography variant="subtext" color="gray.60">
            상세 설명 내용입니다. 최대 100자까지 입력됩니다.
          </Typography>
        }
        fields={[
          {
            label: '등록일',
            value: 'yyyy-mm-dd',
          },
          {
            label: '수정일',
            value: 'yyyy-mm-dd',
          },
          {
            label: '등록자',
            value: '홍길동',
          },
          {
            label: '수정자',
            value: '김선경',
          },
        ]}
        tooltipMessage="기본 정보 수정"
        icon={<SettingIcon />}
        onAction={() => {
          setOpenModifiedData(true)
        }}
      />,
    )

    setCustomTitle(<CustomPageTitle label={!isAdmin ? status : ''} />)

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, setSubHeader, setCustomTitle, isActive, selectedCompany, isAdmin, status])

  const handleRowClick = useCallback(
    (data: GridRowParams<{ type: string; productName: string }>) => {
      const type = data.row.type
      const productName = data.row.productName

      navigate({
        pathname: 'data-provider-product-detail',
        search: `?type=${type.toLowerCase()}&role=${role}&status=${status}&companyName=${selectedCompany.label}&productName=${productName}`,
      })
    },
    [navigate, role, selectedCompany.label, status],
  )

  return (
    <div>
      <MITableLayout
        label="상품 목록"
        search={{
          placeholder: '상품명 또는 상품 설명을 검색하세요',
          onSearch: () => {},
        }}
        tableProps={{
          onRowClick: (e) => handleRowClick(e),
          columns: [
            { field: 'type', headerName: '타입', width: 80, align: 'center' },
            {
              field: 'productName',
              headerName: '상품명',
              width: 360,
              renderCell(params) {
                return <MITableCell value={params.value} typography={{ variant: 'body2SB14' }} />
              },
            },
            { field: 'productDescription', headerName: '상품 설명', flex: 1 },
            { field: 'dataCount', headerName: '데이터 개수', width: 120, align: 'right' },
          ],
          rows: getMockTableData(
            {
              type: ['Public', 'Private'],
              productName: ['제조사별 DRAM 생산량'],
              productDescription: ['제조사별 DRAM 생산량 설명 정보'],
              dataCount: ['0,000'],
            },
            5,
          ),
          rowId: 'id',
        }}
      />

      <AdminConfirm
        width={500}
        open={openModifiedData}
        title={'데이터 프로바이더 기본정보 수정'}
        handleClose={() => setOpenModifiedData(false)}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => setOpenModifiedData(false),
          },
          {
            label: '등록',
            variant: 'filled',
            color: 'primary',
            disabled: !canEdit,
            onClick: () => {
              setOpenEditingConfirm(true)
            },
          },
        ]}
      >
        <Box display={'flex'} flexDirection={'column'} rowGap={'20px'}>
          <editForm.Field name="name">
            {(field) => (
              <MIField label="데이터 프로바이더 명" required subText="데이터 프로바이더의 이름을 입력해주세요.">
                <MIInput
                  placeholder="입력하세요"
                  fullWidth
                  maxLength={50}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </MIField>
            )}
          </editForm.Field>

          <editForm.Field name="code">
            {(field) => (
              <MIField
                label="고유 코드"
                required
                subText="프로바이더 구분을 위한 고유 코드를 입력해주세요."
                title="영문 대문자만 입력 가능, 최대 20글자"
              >
                <MIInput
                  readOnly
                  placeholder="입력하세요"
                  fullWidth
                  maxLength={6}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  error={field.state.meta.errors.some((msg) => typeof msg === 'string')}
                  errorMessage={field.state.meta.errors.filter((item) => typeof item === 'string').join(',') || ''}
                />
              </MIField>
            )}
          </editForm.Field>

          <editForm.Field name="description">
            {(field) => (
              <MIField label="데이터 프로바이더 설명" required subText="데이터 프로바이더에 대한 간략한 설명을 입력해주세요.">
                <MIInput
                  placeholder="입력하세요"
                  fullWidth
                  maxLength={100}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  multiline
                />
              </MIField>
            )}
          </editForm.Field>
        </Box>
      </AdminConfirm>

      <AdminConfirm
        open={openEditingConfirm}
        title={<>저장하시겠습니까?</>}
        width={350}
        handleClose={() => {
          setOpenEditingConfirm(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenEditingConfirm(false)
            },
          },
          {
            label: <Typography variant="body2SB14">저장</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setOpenEditingConfirm(false)
              setOpenModifiedData(false)
              showSnackbar('저장되었습니다.', { variant: 'success' })
              showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
            },
          },
        ]}
      />

      <AdminConfirm
        open={openActiveCofirm}
        title={isActive ? <>비활성으로 변경하시겠습니까?</> : <>활성으로 변경하시겠습니까?</>}
        width={502}
        handleClose={() => {
          setOpenActiveConfirm(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenActiveConfirm(false)
            },
          },
          {
            label: <Typography variant="body2SB14">변경</Typography>,
            variant: 'filled',
            color: 'primary',
            disabled: !canActive,
            onClick: () => {
              setOpenActiveConfirm(false)
              setIsActive((value) => !value)
              showSnackbar('저장되었습니다.', { variant: 'success' })
            },
          },
        ]}
      >
        <Typography component={'p'} variant="body2R14" color="gray.70" mb={'20px'} sx={{ letterSpacing: '-0.1px' }}>
          {isActive
            ? '변경 후에도 해당 데이터 프로바이더의 기존에 설정된 상품 및 사용자 권한 정보는 유지됩니다. 다시 활성 상태로 변경하면 이전의 권한 설정을 그대로 사용할 수 있습니다.'
            : '변경 시 해당 데이터 프로바이더의 기존에 설정되었던 권한이 있는 경우 기존 권한이 적용됩니다. 변경 후 최종 권한을 다시 한 번 확인해주세요.'}
        </Typography>
        <activeForm.Field name="name">
          {(field) => (
            <MIField
              label="변경할 데이터 프로바이더 명 입력"
              required
              helper="데이터 프로바이더명을 동일하게 입력해주세요."
              helperStyle={{ color: 'chart.blue2' }}
            >
              <MIInput fullWidth value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
            </MIField>
          )}
        </activeForm.Field>
      </AdminConfirm>
    </div>
  )
}
