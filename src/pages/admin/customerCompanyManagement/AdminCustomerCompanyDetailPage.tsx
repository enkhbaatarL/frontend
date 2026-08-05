import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import { Box, FormControlLabel, Stack, Switch, Tooltip, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminDatePicker from '@/components/admin/AdminDatePicker'
import AdminSkeleton from '@/components/admin/AdminSkeleton'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import DetailItem from '@/components/common/detail-item/DetailItem'
import SearchIcon from '@/components/common/icons/SearchIcon'
import SettingIcon from '@/components/common/icons/SettingIcon'
import MIInput from '@/components/common/input/MIInput'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import AdminCompanyInfoPage from '@/pages/admin/system/AdminCompanyInfoPage'
import companiesService, { ICompanyProviderInfo } from '@/service/admin/companies'
import dataProviderService, { IProviderInfo } from '@/service/admin/dataProvider'
import membersService, { IUserInfo, IUserRequest } from '@/service/admin/members'
import { IPaginationResponse } from '@/types/api'

interface AdminCustomerDataProviderTableProps {
  data: ICompanyProviderInfo[]
  companyNm: string
}

const AdminCustomerCompanyDetailPageHeader = (props: { onChange: (value: boolean) => void; label: string; value: boolean }) => {
  const toggle = (value: boolean) => {
    props.onChange(value)
  }

  return <FormControlLabel control={<Switch checked={props.value} onChange={(e) => toggle(e.target.checked)} />} label={props.label} />
}

const AdminCustomerDataProviderTable = ({ data, companyNm }: AdminCustomerDataProviderTableProps) => {
  const navigate = useNavigate()
  const { companyNo } = useParams()
  const [selectedValue, setSelectedValue] = useState<string>('')
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  const { data: providerData } = useQuery({
    queryKey: ['providerData'],
    queryFn: async () => await dataProviderService.getProviders(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const providerOptions =
    (Array.isArray(providerData)
      ? providerData?.map((provider: IProviderInfo) => ({
        label: provider.providerNm,
        value: provider.providerNo,
      }))
      : []) ?? []

  const columns: GridColDef[] = [
    {
      field: 'providerNm',
      headerName: t('데이터 프로바이더'),
      flex: 1,
      renderCell(params) {
        return <AdminTableCell cursorPointer>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'numberOfGoods',
      headerName: t('상품'),
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      width: 120,
      renderCell(params) {
        return <AdminTableCell cursorPointer>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'createDt',
      headerName: t('등록일'),
      align: 'center',
      headerAlign: 'center',
      maxWidth: 200,
      renderCell: (params) => {
        const { createDt } = params.row.auditInfo
        return (
          <AdminTableCell typography={{ color: 'gray.60' }} cursorPointer>
            {dayjs(createDt).format('YYYY-MM-DD')}
          </AdminTableCell>
        )
      },
    },
  ]

  const [openConfirmRegistration, setOpenConfirmRegistration] = useState(false)

  // 데이터 프로바이더 등록
  const handleRegisterProvider = async () => {
    try {
      const response = await companiesService.registerProvider(Number(companyNo), { providerNo: Number(selectedValue) })
      if (response.status) {
        setOpenConfirmRegistration(false)
        setSelectedValue('')
        showSnackbar(t('등록되었습니다.'), { variant: 'success' })
        await queryClient.invalidateQueries({ queryKey: ['dataProvider', companyNo] })
      }
    } catch {
      return
    }
  }

  return (
    <Box mb="30px">
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
        <Typography color="gray.90">{t('데이터 프로바이더 목록')}</Typography>
        <AdminButton color="secondary" variant="outlined" size="h34" onClick={() => setOpenConfirmRegistration(true)}>
          {t('데이터 프로바이더 등록')}
        </AdminButton>
      </Box>
      <AdminTable
        getRowId={(row) => row.providerNo}
        columns={columns}
        data={data}
        onRowClick={({ row }) => {
          navigate(`/admin/customer-company/companies/provider-detail/${companyNo}/${row.providerNo}`)
        }}
      />
      <MIConfirm
        open={openConfirmRegistration}
        title={t('데이터 프로바이더 등록')}
        width={450}
        handleClose={() => {
          setOpenConfirmRegistration(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenConfirmRegistration(false)
            },
          },
          {
            label: '등록',
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              await handleRegisterProvider()
            },
          },
        ]}
      >
        <Box>
          <Typography component={'p'} variant="body3" color="gray.70">
            {t('데이터 프로바이더')}{' '}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component={'p'} variant="subtext" color="gray.60" mb="6px">
            {t('등록된 프로바이더 중 선택하세요.')}
            <br />
            {t('등록 완료 시')} {companyNm}
            {t('의 회원이 해당 프로바이더의 데이터에 접근 가능합니다.')}
          </Typography>
          <MISelect
            fullWidth
            options={providerOptions}
            useAllOption={false}
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value as string)}
          />
        </Box>
      </MIConfirm>
    </Box>
  )
}

const AdminCustomerMemberTable = () => {
  const [isOpenDelete, setIsOpenDelete] = useState(false)
  const navigate = useNavigate()
  const [selectedUser, setSelectedUser] = useState<IUserInfo | null>(null)
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const { companyNo } = useParams()
  const initialFetchRef = useRef(false)

  const { filter, updateFilter, pagination, updateSize, updatePage, data, isLoading, search } = useSearchFilter<
    IUserRequest,
    IPaginationResponse<IUserInfo>
  >(
    (params) => membersService.getUsers(params),
    {
      userNm: '',
      companyNo,
    },
    {
      page: 1,
      size: 20,
    },
    {
      initialFetch: false,
    },
  )

  useEffect(() => {
    if (companyNo && !initialFetchRef.current) {
      initialFetchRef.current = true
      search()
    }
  }, [companyNo, search])

  const columns: GridColDef[] = [
    {
      field: 'customerCompanyNm',
      headerName: t('회사명'),
      width: 250,
      flex: 1,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody1' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'departmentNm',
      headerName: t('소속'),
      width: 182,
      flex: 1,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody2' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'positionNm',
      headerName: '직위',
      width: 182,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody2' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'userNm',
      headerName: t('이름'),
      width: 120,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody2' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'userLoginId',
      headerName: t('이메일'),
      width: 182,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody2' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'registrationDate',
      headerName: t('등록일'),
      width: 182,
      sortable: false,
      renderCell: (params) => {
        const { createDt } = params.row.auditInfo
        return (
          <AdminTableCell
            typography={{
              color: 'gray.60',
              variant: 'tableBody2',
            }}
          >
            {dayjs(createDt).format('YYYY-MM-DD')}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'actions',
      headerName: '',
      maxWidth: 52,
      cellClassName: 'cellAction',
      align: 'center',
      renderCell: (params) => (
        <AdminTableAction
          actions={[
            {
              label: t('삭제'),
              icon: <DeleteIcon fontSize="small" />,
              onClick: () => {
                setIsOpenDelete(true)
                setSelectedUser(params.row)
              },
            },
          ]}
        />
      ),
    },
  ]

  const handleOnRowClick = () => {}

  // 회원 삭제
  const handleDelete = async () => {
    try {
      if (selectedUser) {
        const response = await membersService.deleteUser(selectedUser.userNo)
        if (response.status) {
          showSnackbar(t('삭제되었습니다.'), { variant: 'success' })
          setIsOpenDelete(false)
          await queryClient.invalidateQueries({ queryKey: ['user', companyNo] })
        }
      }
    } catch {
      return
    }
  }

  return (
    <Box>
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
        <Typography color="gray.90">{t('회원 목록')}</Typography>
        <Box display={'flex'} alignItems={'center'} columnGap={'10px'}>
          <MIInput
            placeholder={t('검색하세요.')}
            endIcon={
              <SearchIcon
                onClick={() => {
                  search()
                }}
              />
            }
            contentWidth={196}
            value={filter.userNm}
            onChange={(e) => {
              updateFilter('userNm', e.target.value as string)
            }}
            onKeyDown={({ key }) => key === 'Enter' && search()}
            onClear={() => {
              updateFilter('userNm', '')
              search()
            }}
          />
          <AdminButton
            color="secondary"
            variant="outlined"
            size="h34"
            onClick={() => {
              navigate('/admin/member-mgmt/users/registration')
            }}
          >
            {t('회원 등록')}
          </AdminButton>
        </Box>
      </Box>
      <AdminTable
        getRowId={(row) => row.userNo}
        columns={columns}
        data={data}
        onRowClick={handleOnRowClick}
        isLoading={isLoading}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
      />
      <MIConfirm
        open={isOpenDelete}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('회원을 삭제하시겠습니까?')}
          </>
        }
        width={450}
        handleClose={() => {
          setIsOpenDelete(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsOpenDelete(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: 'red',
            onClick: async () => {
              await handleDelete()
            },
          },
        ]}
      >
        회원 정보 삭제 시 해당 회원은 서비스에 접근이 불가합니다.
      </MIConfirm>
    </Box>
  )
}

const AdminCustomerCompanyDetailPage = () => {
  const { setCustomComponent, setSubHeader } = useAdminHeader()
  const [openConfirmActive, setOpenConfirmActive] = useState(false)
  const [openInformationDialog, setOpenInformationDialog] = useState(false)
  const [openConfirmSaving, setOpenConfirmSaving] = useState(false)
  const [isWhiteLabelSettingsOpen, setIsWhiteLabelSettingsOpen] = useState(false)
  const [isErrorCompanyName, setIsErrorCompanyName] = useState(false)
  const [inputCompanyName, setInputCompanyName] = useState<string>('')
  const [inputUsageBeginDate, setInputUsageBeginDate] = useState<Dayjs | null>(null)
  const [inputUsageEndDate, setInputUsageEndDate] = useState<Dayjs | null>(null)
  const [companyNm, setCompanyNm] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  const { companyNo } = useParams()

  const { data, isLoading: customerCompanyDetailIsLoading } = useQuery({
    queryKey: ['customerCompanyDetail', companyNo],
    queryFn: async () => await companiesService.getCompanyDetail(Number(companyNo)),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!companyNo,
  })

  const { data: dataProviderData, isLoading: dataProviderDataIsLoading } = useQuery({
    queryKey: ['dataProvider', companyNo],
    queryFn: async () => await companiesService.getCompanyProviders(Number(companyNo)),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!companyNo,
  })

  const { data: companyLatestUpdatedData, isLoading: companyLatestUpdateDataIsLoading } = useQuery({
    queryKey: ['latestUpdateData', companyNo],
    queryFn: async () => await companiesService.getCompanyLatestUpdated(Number(companyNo)),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!companyNo,
  })

  const { data: companyLogo } = useQuery({
    queryKey: ['company-logo', Number(companyNo)],
    queryFn: () => companiesService.getCompanyLogo(Number(companyNo)),
    refetchOnWindowFocus: false,
    enabled: !!companyNo,
  })

  const toggle = () => {
    setOpenConfirmActive(true)
  }

  // 활성/비활성 변경
  const handleChangeActive = async () => {
    try {
      const response = await companiesService.updateCustomerCompany(Number(companyNo), {
        isActivated: !isActive,
        usageBeginDate: data?.usageBeginDate ?? '',
        usageEndDate: data?.usageEndDate ?? '',
      })
      setIsActive(response?.isActivated)
      setOpenConfirmActive(false)
      showSnackbar(t(response?.isActivated ? '활성' : '비활성') + t('으로 변경되었습니다.'), { variant: 'success' })
      setIsErrorCompanyName(true)
      await queryClient.invalidateQueries({ queryKey: ['customerCompanyDetail', companyNo] })
    } catch {
      return
    }
  }

  // 고객사 기본정보 수정
  const handleSave = async () => {
    try {
      const response = await companiesService.updateCustomerCompany(Number(companyNo), {
        isActivated: isActive,
        usageBeginDate: inputUsageBeginDate?.format('YYYYMMDD') ?? '',
        usageEndDate: inputUsageEndDate?.format('YYYYMMDD') ?? '',
      })
      queryClient.setQueryData(['customerCompanyDetail', companyNo], response)
      setOpenConfirmSaving(false)
      showSnackbar('저장되었습니다.', { variant: 'success' })
    } catch {
      return
    }
  }

  const isLoading = dataProviderDataIsLoading || companyLatestUpdateDataIsLoading || customerCompanyDetailIsLoading

  useEffect(() => {
    if (data) {
      setIsActive(data?.isActivated)
      setCompanyNm(data?.companyNm ?? '')
      setCustomComponent(<AdminCustomerCompanyDetailPageHeader value={isActive} onChange={toggle} label={isActive ? '활성' : '비활성'} />)
      setSubHeader(
        <DetailItem
          title={
            <Stack alignItems="center" direction="row" gap="16px">
              <Typography color="gray.70" variant="body1">
                {data.companyNm}
              </Typography>
              {companyLogo?.logoUrl ? (
                <Tooltip
                  arrow
                  placement="top"
                  slotProps={{
                    arrow: { sx: { color: 'common.white' } },
                    tooltip: {
                      sx: {
                        backgroundColor: 'common.white',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)',
                        lineHeight: 0,
                        padding: '12px',
                      },
                    },
                  }}
                  title={
                    <img
                      alt={t(`${data.companyNm} 로고`)}
                      src={companyLogo.logoUrl}
                      style={{ height: '30px', maxWidth: '160px', objectFit: 'contain' }}
                    />
                  }
                >
                  <span>
                    <AdminButton color="secondary" size="h34" variant="outlined" onClick={() => setIsWhiteLabelSettingsOpen(true)}>
                      {t('화이트라벨 수정')}
                    </AdminButton>
                  </span>
                </Tooltip>
              ) : (
                <AdminButton color="secondary" size="h34" variant="outlined" onClick={() => setIsWhiteLabelSettingsOpen(true)}>
                  {t('화이트라벨 설정')}
                </AdminButton>
              )}
            </Stack>
          }
          fields={[
            {
              label: '등록일',
              value: dayjs(String(data?.auditInfo.createDt)).format('YYYY-MM-DD'),
            },
            {
              label: '수정일',
              value: companyLatestUpdatedData ? dayjs(String(companyLatestUpdatedData?.modifyDt)).format('YYYY-MM-DD') : '-',
            },
            {
              label: '등록자',
              value: String(data?.auditInfo.createUserId),
            },
            {
              label: '수정자',
              value: companyLatestUpdatedData ? String(companyLatestUpdatedData?.modifyUserNm) : '-',
            },
            {
              label: '사용기간',
              value:
                data?.usageBeginDate && data?.usageEndDate
                  ? `${data?.usageBeginDate.slice(0, 4)}-${data?.usageBeginDate.slice(4, 6)}-${data?.usageBeginDate.slice(6, 8)} ~ ${data?.usageEndDate.slice(0, 4)}-${data?.usageEndDate.slice(4, 6)}-${data?.usageEndDate.slice(6, 8)}`
                  : '-',
            },
          ]}
          icon={<SettingIcon />}
          tooltipMessage="기본 정보 수정"
          onAction={() => {
            setOpenInformationDialog(true)
          }}
        />,
      )
    } else {
      setSubHeader(<AdminSkeleton loading={isLoading} subHeader />)
    }
    return () => {
      setCustomComponent(null)
      setSubHeader(null)
    }
  }, [setCustomComponent, setSubHeader, data, companyLatestUpdatedData, companyLogo, isActive, isLoading])

  useEffect(() => {
    setIsErrorCompanyName(inputCompanyName.replace(/\s/g, '') !== data?.companyNm.replace(/\s/g, ''))
  }, [inputCompanyName, data?.companyNm])

  return (
    <AdminSkeleton loading={isLoading} table>
      {dataProviderData && <AdminCustomerDataProviderTable data={dataProviderData} companyNm={companyNm} />}
      {<AdminCustomerMemberTable />}
      {companyNo && (
        <AdminCompanyInfoPage
          customerCompanyNo={Number(companyNo)}
          isOpen={isWhiteLabelSettingsOpen}
          onClose={() => setIsWhiteLabelSettingsOpen(false)}
        />
      )}
      <MIConfirm
        open={openConfirmActive}
        title={<>{data?.isActivated ? t('비활성으로 변경하시겠습니까?') : t('활성으로 변경하시겠습니까?')}</>}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenConfirmActive(false)
            },
          },
          {
            label: t('변경'),
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              await handleChangeActive()
            },
            disabled: isErrorCompanyName,
          },
        ]}
      >
        <Typography component={'p'} variant="body2R14" color="gray.70" mb="30px">
          {t(
            '변경 시 해당 고객사의 기존에 설정되었던 권한이 있는 경우 기존 권한이 적용됩니다. 변경 후 최종 권한을 다시 한 번 확인해 주세요.',
          )}
        </Typography>
        <Box>
          <Typography component={'p'} variant="body3" color="gray.70">
            {t('변경할 고객사명 ')}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <AdminTextField fullWidth onChange={(e) => setInputCompanyName(e.target.value)} />
          {isErrorCompanyName && (
            <Typography component={'p'} variant="subtext2" color="#5191F5" mt={1}>
              {t('고객사명을 동일하게 입력해 주세요.')}
            </Typography>
          )}
        </Box>
      </MIConfirm>

      <MIConfirm
        open={openInformationDialog}
        title={t('고객사 기본정보 수정')}
        width={450}
        handleClose={() => {
          setOpenInformationDialog(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenInformationDialog(false)
            },
          },
          {
            label: t('저장'),
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setOpenInformationDialog(false)
              setOpenConfirmSaving(true)
            },
          },
        ]}
      >
        <Box mb={5}>
          <Typography component={'p'} variant="body3" color="gray.70">
            {t('고객사명 ')}
          </Typography>
          <Typography component={'p'} variant="subtext" color="gray.60" mb="6px"></Typography>
          <AdminTextField value={data?.companyNm} aria-readonly fullWidth />
        </Box>
        <Box>
          <Typography component={'p'} variant="body3" color="gray.70">
            {t('사용 기간 ')}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component={'p'} variant="subtext" color="gray.60" mb="6px">
            {t('고객사의 MI platform 사용 기간을 입력하세요.')}
          </Typography>
          <Box display="flex" alignItems={'center'} columnGap={'8px'}>
            <AdminDatePicker
              defaultValue={data?.usageBeginDate ? dayjs(data?.usageBeginDate) : null}
              value={inputUsageBeginDate}
              onChange={(value) => {
                setInputUsageBeginDate(value)
              }}
            />
            <Typography variant="breadcrumbs" color="gray.50">
              ~
            </Typography>
            <AdminDatePicker
              defaultValue={data?.usageEndDate ? dayjs(data?.usageEndDate) : null}
              value={inputUsageEndDate}
              onChange={(value) => {
                setInputUsageEndDate(value)
              }}
            />
          </Box>
        </Box>
      </MIConfirm>

      <MIConfirm
        open={openConfirmSaving}
        title={t('저장하시겠습니까?')}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenConfirmSaving(false)
            },
          },
          {
            label: t('저장'),
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              await handleSave()
            },
          },
        ]}
      ></MIConfirm>
    </AdminSkeleton>
  )
}

export default AdminCustomerCompanyDetailPage
