import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useForm, useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminCompanySelectorIconButton from '@/components/admin/AdminCompanySelectorIconButton.tsx'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminLoading from '@/components/admin/AdminLoading.tsx'
import AdminTable from '@/components/admin/AdminTable.tsx'
import DetailItem from '@/components/common/detail-item/DetailItem'
import SearchIcon from '@/components/common/icons/SearchIcon.tsx'
import SettingIcon from '@/components/common/icons/SettingIcon'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import { uppercase, require } from '@/components/common/input/validators'
import MITableCell from '@/components/common/table/MITableCell'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar.tsx'
import queryClient from '@/lib/queryClient'
import dataProviderService, { IProviderInfo } from '@/service/admin/dataProvider.ts'

const AdminDataProvidersDetailPageHeaderButton = (props: { onChange: (value: boolean) => void; value: boolean; label: string }) => {
  const toggle = (value: boolean) => {
    props.onChange(value)
  }

  return (
    <Stack direction="row" alignItems="center" sx={{ ml: 'auto' }}>
      <Switch
        checked={props.value}
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

export default function AdminDataProvidersDetailPage() {
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent, setSubHeader } = useAdminHeader()
  const { providerNo } = useParams()
  const [isActive, setIsActive] = useState(true)
  const [openModifiedData, setOpenModifiedData] = useState(false)
  const [openEditingConfirm, setOpenEditingConfirm] = useState(false)
  const [openActiveConfirm, setOpenActiveConfirm] = useState(false)
  const [keyValue, setKeyValue] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const navigate = useNavigate()

  const { data, isLoading: dataProviderDetailIsLoading } = useQuery({
    queryKey: ['providerDetail', providerNo],
    queryFn: async () => await dataProviderService.getProviderDetail(Number(providerNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!providerNo,
  })

  const { data: dataProvidersName, isLoading: dataProvidersNameIsLoading } = useQuery({
    queryKey: ['dataProviderName'],
    queryFn: async () => await dataProviderService.getProviders(),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
  })

  const { data: dataProviderGoods, isLoading: dataProviderGoodsIsLoading } = useQuery({
    queryKey: ['dataProviderGoods', providerNo, keyValue],
    queryFn: async () =>
      await dataProviderService.getProviderGoodsList(Number(providerNo), {
        keyword: keyValue,
        page: 1,
        size: 20,
      }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!providerNo,
  })

  const providerOptions = useMemo(
    () =>
      (Array.isArray(dataProvidersName)
        ? dataProvidersName?.map((provider: IProviderInfo) => ({
          value: String(provider.providerNo),
          label: provider.providerNm,
        }))
        : []) ?? [],
    [dataProvidersName],
  )

  const initialProvider =
    providerOptions.find((option) => option.value === providerNo) ||
    (providerOptions.length > 0 ? providerOptions[0] : { value: '', label: '' })

  const [selectedProvider, setSelectedProvider] = useState<{ value: string; label: string }>(initialProvider)

  const isLoading = dataProviderDetailIsLoading || dataProvidersNameIsLoading || dataProviderGoodsIsLoading

  const editForm = useForm({
    defaultValues: {
      name: data?.providerNm,
      code: data?.providerId,
      description: data?.providerExpn,
    },
    validators: {
      onChange: ({ value }) => ({
        fields: {
          name: require(value.name ?? ''),
          code: require(value.code ?? '') || uppercase(value.code ?? ''),
          description: require(value.description ?? ''),
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
  const canActive = useStore(activeForm.store, (state) => state.isDirty && state.values.name === data?.providerNm)

  const toggle = (checked: boolean) => {
    // 현재 상태와 변경하려는 상태가 다른 경우에만 확인 대화상자 표시
    if (isActive !== checked) {
      // 확인 대화상자 표시
      setOpenActiveConfirm(true)
    }
  }

  // 활성/비활성 변경
  const handleChangeActive = async () => {
    try {
      await dataProviderService.updateProvider(Number(providerNo), {
        providerNm: data?.providerNm ?? '',
        providerExpn: data?.providerExpn ?? '',
        isUsed: !isActive,
      })
      setIsActive(!isActive)
      setOpenActiveConfirm(false)
      showSnackbar(t(!isActive ? '활성' : '비활성') + t('으로 변경되었습니다.'), { variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['providerDetail', providerNo] })
    } catch (error) {
      console.error(error)
    }
  }

  // 고객사 기본정보 수정
  const handleSave = async () => {
    try {
      await dataProviderService.updateProvider(Number(providerNo), {
        providerNm: editForm.getFieldValue('name') ?? '',
        providerExpn: editForm.getFieldValue('description') ?? '',
        isUsed: isActive,
      })
      // 쿼리 무효화를 통해 서버에서 최신 데이터 다시 가져오기
      await queryClient.invalidateQueries({ queryKey: ['providerDetail', providerNo] })

      setOpenModifiedData(false)
      setOpenEditingConfirm(false)
      showSnackbar('저장되었습니다.', { variant: 'success' })
    } catch (error) {
      console.error(error)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'isPublic',
      headerName: '타입',
      maxWidth: 80,
      align: 'center',
      renderCell: (param) => (param.value ? 'Public' : 'Private'),
    },
    {
      field: 'goodsNm',
      headerName: '상품명',
      maxWidth: 360,
      renderCell(params) {
        return <MITableCell value={params.value} typography={{ variant: 'body2SB14' }} />
      },
    },
    { field: 'goodsExpn', headerName: '상품 설명', flex: 1 },
    { field: 'goodsDataSourceCount', headerName: '데이터 개수', maxWidth: 120, align: 'right' },
  ]

  useEffect(() => {
    if (data && providerOptions) {
      setIsActive(data?.isUsed)
      setCustomComponent(
        <AdminDataProvidersDetailPageHeaderButton value={isActive} onChange={toggle} label={isActive ? '활성' : '비활성'} />,
      )
      setSubHeader(
        <DetailItem
          title={
            <Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography variant="contentTitle" color="gray.90" mr={'4px'}>
                  {data?.providerNm}
                </Typography>
                <AdminCompanySelectorIconButton
                  value={selectedProvider}
                  onChange={(provider) => setSelectedProvider(provider)}
                  options={providerOptions}
                />
              </Box>
            </Box>
          }
          subTitle={
            <Typography variant="subtext" color="gray.60">
              {data?.providerExpn}
            </Typography>
          }
          fields={[
            {
              label: '등록일',
              value: dayjs(String(data?.auditInfo.createDt)).format('YYYY-MM-DD'),
            },
            {
              label: '수정일',
              value: dayjs(String(data?.auditInfo.modifyDt)).format('YYYY-MM-DD'),
            },
            {
              label: '등록자',
              value: String(data?.auditInfo.createUserNm),
            },
            {
              label: '수정자',
              value: String(data?.auditInfo.modifyUserNm),
            },
          ]}
          tooltipMessage="기본 정보 수정"
          icon={<SettingIcon />}
          onAction={() => {
            setOpenModifiedData(true)
          }}
        />,
      )
    }

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
    }
  }, [setCustomComponent, setSubHeader, isActive, data, dataProvidersName, providerOptions, selectedProvider])

  return isLoading ? (
    <AdminLoading />
  ) : (
    <>
      <Box>
        <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
          <Box>
            <Typography component={'p'} variant="contentTitle" color="gray.90">
              {t('상품 목록')}
            </Typography>
            <Typography variant="subtext" color="gray.60">
              {t('리스트 클릭 시 해당 상품의 상세 화면으로 이동 및 상세 권한 설정이 가능합니다.')}
            </Typography>
          </Box>

          <Box display={'flex'} alignItems={'center'} columnGap={'10px'}>
            <MIInput
              placeholder="상품 또는 상품 설명을 검색하세요."
              endIcon={
                <SearchIcon
                  onClick={() => {
                    setKeyValue(keyword)
                  }}
                />
              }
              contentWidth={196}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setKeyValue(keyword)
                }
              }}
              onClear={() => {
                setKeyValue('')
                setKeyword('')
              }}
            />
          </Box>
        </Box>
        <AdminTable
          getRowId={(row) => row.goodsNo}
          columns={columns}
          data={dataProviderGoods}
          onRowClick={({ row }) => {
            navigate(`/admin/data-providers/providers/product-detail/${providerNo}/${row.goodsNo}`)
          }}
        />
      </Box>
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
            label: '저장',
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
            onClick: async () => {
              await handleSave()
            },
          },
        ]}
      />

      <AdminConfirm
        open={openActiveConfirm}
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
            onClick: async () => {
              await handleChangeActive()
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
    </>
  )
}
