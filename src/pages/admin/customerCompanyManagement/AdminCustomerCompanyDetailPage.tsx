import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminDatePicker from '@/components/admin/AdminDatePicker'
import AdminLoading from '@/components/admin/AdminLoading'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import DetailItem from '@/components/common/detail-item'
import SearchIcon from '@/components/common/icons/SearchIcon'
import SettingIcon from '@/components/common/icons/SettingIcon'
import MIInput from '@/components/common/input/MIInput'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService, { ICompanyProviderInfo } from '@/service/admin/companies'
import dataProviderService, { IProviderInfo } from '@/service/admin/dataProvider'
import membersService, { IUserInfo } from '@/service/admin/members'
import { IPaginationResponse } from '@/types/api'

interface AdminCustomerDataProviderTableProps {
  data: ICompanyProviderInfo[]
  companyNm: string
}
interface AdminCustomerMemberTableProps {
  data: IPaginationResponse<IUserInfo>
  search: string
  setSearch: (value: string) => void
  searchValue: string
  setSearchValue: (value: string) => void
}

const AdminCustomerCompanyDetailPageHeader = (props: { onChange: (value: boolean) => void; label: string; value: boolean }) => {
  const toogle = (value: boolean) => {
    props.onChange(value)
  }

  return (
    <FormControlLabel
      control={<Switch defaultChecked checked={props.value} onChange={(e) => toogle(e.target.checked)} />}
      label={props.label}
    />
  )
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
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
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
      width: 200,
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
    } catch (error) {
      console.error(error)
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
      <AdminConfirm
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
            color: 'secondary',
            onClick: () => {
              setOpenConfirmRegistration(false)
            },
          },
          {
            label: '등록',
            variant: 'contained',
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
          <AdminSelect
            fullWidth
            options={providerOptions}
            showSelectedValue={true}
            useAllOption={false}
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value as string)}
          ></AdminSelect>
        </Box>
      </AdminConfirm>
    </Box>
  )
}

const AdminCustomerMemberTable = ({ data, search, setSearch, setSearchValue }: AdminCustomerMemberTableProps) => {
  const [isOpenDelete, setIsOpenDelete] = useState(false)
  const navigate = useNavigate()
  const [selectedUser, setSelectedUser] = useState<IUserInfo | null>(null)
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const { companyNo } = useParams()

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
      width: 52,
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
    } catch (error) {
      console.error(error)
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
                  setSearchValue(search)
                }}
              />
            }
            contentWidth={196}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchValue(search)
              }
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
      <AdminTable getRowId={(row) => row.userNo} columns={columns} data={data} onRowClick={handleOnRowClick} />
      <AdminConfirm
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
            color: 'secondary',
            onClick: () => {
              setIsOpenDelete(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'contained',
            color: 'error',
            onClick: async () => {
              await handleDelete()
            },
          },
        ]}
      >
        회원 정보 삭제 시 해당 회원은 서비스에 접근이 불가합니다.
      </AdminConfirm>
    </Box>
  )
}

const AdminCustomerCompanyDetailPage = () => {
  const { setCustomComponent, setSubHeader } = useAdminHeader()
  const [openConfirmActive, setOpenConfirmActive] = useState(false)
  const [openInformationDialog, setOpenInformationDialog] = useState(false)
  const [openConfirmSaving, setOpenConfirmSaving] = useState(false)
  const [isErrorCompanyName, setIsErrorCompanyName] = useState(false)
  const [inputCompanyName, setInputCompanyName] = useState<string>('')
  const [inputUsageBeginDate, setInputUsageBeginDate] = useState<Dayjs | null>(null)
  const [inputUsageEndDate, setInputUsageEndDate] = useState<Dayjs | null>(null)
  const [companyNm, setCompanyNm] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [searchValue, setSearchValue] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  const { companyNo } = useParams()

  const { data, isLoading: customerCompanyDetailIsLoading } = useQuery({
    queryKey: ['customerCompanyDetail', companyNo],
    queryFn: async () => await companiesService.getCompanyDetail(Number(companyNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo,
  })

  const { data: dataProviderData, isLoading: dataProviderDataIsLoading } = useQuery({
    queryKey: ['dataProvider', companyNo],
    queryFn: async () => await companiesService.getCompanyProviders(Number(companyNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo,
  })

  const { data: userData, isLoading: userDataIsLoading } = useQuery({
    queryKey: ['user', companyNo, searchValue],
    queryFn: async () =>
      await membersService.getUsers({
        companyNo,
        page: 1,
        size: 20,
        userNm: searchValue,
      }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo,
  })

  const { data: companyLatestUpdatedData, isLoading: companyLatestUpdatedDataIsLoading } = useQuery({
    queryKey: ['latestUpdateData', companyNo],
    queryFn: async () => await companiesService.getCompanyLatestUpdated(Number(companyNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo,
  })

  const isLoading = customerCompanyDetailIsLoading || dataProviderDataIsLoading || userDataIsLoading || companyLatestUpdatedDataIsLoading

  const toogle = () => {
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
    } catch (error) {
      console.error(error)
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
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (data && companyLatestUpdatedData) {
      setIsActive(data?.isActivated)
      setCompanyNm(data?.companyNm ?? '')
      setCustomComponent(<AdminCustomerCompanyDetailPageHeader value={isActive} onChange={toogle} label={isActive ? '활성' : '비활성'} />)
      setSubHeader(
        <DetailItem
          title={data?.companyNm}
          fields={[
            {
              label: '등록일',
              value: dayjs(String(data?.auditInfo.createDt)).format('YYYY-MM-DD'),
            },
            {
              label: '수정일',
              value: dayjs(String(companyLatestUpdatedData?.modifyDt)).format('YYYY-MM-DD'),
            },
            {
              label: '등록자',
              value: String(data?.auditInfo.createUserId),
            },
            {
              label: '수정자',
              value: String(companyLatestUpdatedData?.modifyUserNm),
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
    }
    return () => {
      setCustomComponent(null)
      setSubHeader(null)
    }
  }, [setCustomComponent, setSubHeader, data, companyLatestUpdatedData, isActive])

  useEffect(() => {
    setIsErrorCompanyName(inputCompanyName.replace(/\s/g, '') !== data?.companyNm.replace(/\s/g, ''))
  }, [inputCompanyName, data?.companyNm])

  return isLoading ? (
    <AdminLoading />
  ) : (
    <>
      {dataProviderData && <AdminCustomerDataProviderTable data={dataProviderData} companyNm={companyNm} />}
      {userData && (
        <AdminCustomerMemberTable
          data={userData}
          search={search}
          setSearch={setSearch}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      )}
      <AdminConfirm
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
            color: 'secondary',
            onClick: () => {
              setOpenConfirmActive(false)
            },
          },
          {
            label: t('변경'),
            variant: 'contained',
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
      </AdminConfirm>

      <AdminConfirm
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
            color: 'secondary',
            onClick: () => {
              setOpenInformationDialog(false)
            },
          },
          {
            label: t('저장'),
            variant: 'contained',
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
      </AdminConfirm>

      <AdminConfirm
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
            color: 'secondary',
            onClick: () => {
              setOpenConfirmSaving(false)
            },
          },
          {
            label: t('저장'),
            variant: 'contained',
            color: 'primary',
            onClick: async () => {
              await handleSave()
            },
          },
        ]}
      ></AdminConfirm>
    </>
  )
}

export default AdminCustomerCompanyDetailPage
