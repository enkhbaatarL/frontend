import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import { Box, FormControlLabel, InputAdornment, MenuItem, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminDatePicker from '@/components/admin/AdminDatePicker'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import DetailItem from '@/components/common/detail-item'
import SearchIcon from '@/components/common/icons/SearchIcon'
import SettingIcon from '@/components/common/icons/SettingIcon'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import companiesService, { ICompanyProviderInfo } from '@/service/admin/companies'
import memebersService, { IUserInfo } from '@/service/admin/members'
import { IPaginationResponse } from '@/types/api'

interface AdminCustomerDataProviderTableProps {
  data: ICompanyProviderInfo
}
interface AdminCustomerMemberTableProps {
  data: IPaginationResponse<IUserInfo>
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

const AdminCustomerDataProviderTable = ({ data }: AdminCustomerDataProviderTableProps) => {
  // Define columns
  const columns: GridColDef[] = [
    {
      field: 'providerNm',
      headerName: t('데이터 프로바이더'),
      flex: 1,
      renderCell(params) {
        return <AdminTableCell>{params.value}</AdminTableCell>
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
        return <AdminTableCell>{params.value}</AdminTableCell>
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
        return <AdminTableCell typography={{ color: 'gray.60' }}>{dayjs(createDt).format('YYYY-MM-DD')}</AdminTableCell>
      },
    },
  ]

  const [openConfirmRegistration, setOpenConfirmRegistration] = useState(false)
  // const { getPath } = useAdminMenuItems()

  const handleOnRowClick = () => {
    // navigate(getPath('customer-company-data-provider-detail'))
  }
  const registerDataProvider = () => {
    setOpenConfirmRegistration(true)
  }

  return (
    <Box mb="30px">
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
        <Typography color="gray.90">데이터 프로바이더 목록</Typography>
        <AdminButton color="secondary" variant="outlined" size="h34" onClick={registerDataProvider}>
          데이터 프로바이더 등록
        </AdminButton>
      </Box>
      <AdminTable getRowId={(row) => row.providerNo} columns={columns} data={data} onRowClick={handleOnRowClick} />
      <AdminConfirm
        open={openConfirmRegistration}
        title={<>데이터 프로바이더 등록</>}
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
            onClick: () => {
              setOpenConfirmRegistration(false)
              // showSnackbar('등록되었습니다.', { variant: 'success' }) // Please use 1 of the snack bar in real case
              // showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' }) // Please use 1 of the snack bar in real case
            },
          },
        ]}
      >
        <Box>
          <Typography component={'p'} variant="body3" color="gray.70">
            데이터 프로바이더{' '}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component={'p'} variant="subtext" color="gray.60" mb="6px">
            등록된 프로바이더 중 선택하세요.
            <br />
            등록 완료 시 &#123;SK실트론&#125;의 회원이 해당 프로바이더의 데이터에 접근 가능합니다.
          </Typography>
          <AdminSelect fullWidth>
            <MenuItem value={'provider1'}>provider1</MenuItem>
            <MenuItem value={'provider2'}>provider2</MenuItem>
            <MenuItem value={'provider3'}>provider3</MenuItem>
          </AdminSelect>
        </Box>
      </AdminConfirm>
    </Box>
  )
}

const AdminCustomerMemberTable = ({ data }: AdminCustomerMemberTableProps) => {
  const [isOpenDelete, setIsOpenDelete] = useState(false)
  const navigate = useNavigate()

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
      renderCell: () => (
        <AdminTableAction
          actions={[
            {
              label: '삭제',
              icon: <DeleteIcon fontSize="small" />,
              onClick: () => {
                setIsOpenDelete(true)
              },
            },
          ]}
        />
      ),
    },
  ]

  const handleOnRowClick = () => {}

  return (
    <Box>
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
        <Typography color="gray.90">회원 목록</Typography>
        <Box display={'flex'} alignItems={'center'} columnGap={'10px'}>
          <AdminTextField
            placeholder="검색하세요"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment sx={{ cursor: 'pointer' }} position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          <AdminButton
            color="secondary"
            variant="outlined"
            size="h34"
            onClick={() => {
              navigate('/admin/customer-company/companies/registration')
            }}
          >
            회원 등록
          </AdminButton>
        </Box>
      </Box>
      <AdminTable getRowId={(row) => row.userNo} columns={columns} data={data} onRowClick={handleOnRowClick} />
      <AdminConfirm
        open={isOpenDelete}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            회원을 삭제하시겠습니까?
          </>
        }
        width={450}
        handleClose={() => {
          setIsOpenDelete(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setIsOpenDelete(false)

              //showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
            },
          },
          {
            label: 'Button',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setIsOpenDelete(false)

              // showSnackbar('삭제되었습니다. ', { variant: 'success' })
              // showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
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
  const [isActive, setIsActive] = useState(true)
  const [openConfirmActive, setOpenConfirmActive] = useState(false)
  const [openInformationDialog, setOpenInformationDialog] = useState(false)
  const [openConfirmSaving, setOpenConfirmSaving] = useState(false)

  const { companyNo } = useParams()

  // const { showSnackbar } = useAdminSnackbar()

  const { data } = useQuery({
    queryKey: ['customerCompanyDetail', companyNo],
    queryFn: async () => await companiesService.getCompanyDetail(Number(companyNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo,
  })

  const { data: dataProviderData } = useQuery({
    queryKey: ['dataProvider', companyNo],
    queryFn: async () => await companiesService.getCompanyProviders(Number(companyNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo,
  })

  const { data: userData } = useQuery({
    queryKey: ['user', companyNo],
    queryFn: async () =>
      await memebersService.getUsers({
        companyNo,
        page: 1,
        size: 20,
      }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo,
  })

  const toogle = () => {
    setOpenConfirmActive(true)
  }

  useEffect(() => {
    setCustomComponent(
      <AdminCustomerCompanyDetailPageHeader
        value={data?.isActivated ?? false}
        onChange={toogle}
        label={data?.isActivated ? '활성' : '비활성'}
      />,
    )
    setSubHeader(
      <DetailItem
        title={data?.companyNm}
        fields={[
          {
            label: '등록일',
            value: String(data?.auditInfo.createDt),
          },
          {
            label: '수정일',
            value: String(data?.auditInfo.modifyDt),
          },
          {
            label: '등록자',
            value: String(data?.auditInfo.createUserId),
          },
          {
            label: '수정자',
            value: String(data?.auditInfo.modifyUserId),
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

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
    }
  }, [setCustomComponent, setSubHeader, isActive, data])

  return (
    <>
      {dataProviderData && <AdminCustomerDataProviderTable data={dataProviderData} />}
      {userData && <AdminCustomerMemberTable data={userData} />}
      <AdminConfirm
        open={openConfirmActive}
        title={<>{isActive ? '비활성으로 변경하시겠습니까?' : '활성으로 변경하시겠습니까?'}</>}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenConfirmActive(false)
            },
          },
          {
            label: '변경',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setOpenConfirmActive(false)
              setIsActive((value) => !value)
              // showSnackbar(isActive ? '비활성으로 변경되었습니다.' : '활성으로 변경되었습니다.', { variant: 'success' }) // Please use 1 of the snack bar in real case
            },
          },
        ]}
      >
        <Typography component={'p'} variant="body2R14" color="gray.70" mb="30px">
          변경 시 해당 고객사의 기존에 설정되었던 권한이 있는 경우 기존 권한이 적용됩니다. 변경 후 최종 권한을 다시 한 번 확인해 주세요.
        </Typography>
        <Box>
          <Typography component={'p'} variant="body3" color="gray.70">
            변경할 고객사명{' '}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <AdminTextField fullWidth />
          <Typography component={'p'} variant="subtext2" color="point.red1" mt={1}>
            고객사명을 동일하게 입력해 주세요.
          </Typography>
        </Box>
      </AdminConfirm>

      <AdminConfirm
        open={openInformationDialog}
        title={<>고객사 기본정보 수정</>}
        width={450}
        handleClose={() => {
          setOpenInformationDialog(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenInformationDialog(false)
            },
          },
          {
            label: '저장',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setOpenInformationDialog(false)
              setOpenConfirmSaving(true)
              //   showSnackbar('비활성으로 변경되었습니다.', { variant: 'success' }) // Please use 1 of the snack bar in real case
            },
          },
        ]}
      >
        <Box mb={5}>
          <Typography component={'p'} variant="body3" color="gray.70">
            고객사명{' '}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component={'p'} variant="subtext" color="gray.60" mb="6px">
            고객사로 등록할 회사를 선택하세요.
          </Typography>
          <AdminTextField value={'SK 하이닉스'} aria-readonly fullWidth />
        </Box>
        <Box>
          <Typography component={'p'} variant="body3" color="gray.70">
            고객사명{' '}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component={'p'} variant="subtext" color="gray.60" mb="6px">
            고객사로 등록할 회사를 선택하세요.
          </Typography>
          <Box display="flex" alignItems={'center'} columnGap={'8px'}>
            <AdminDatePicker />
            <Typography variant="breadcrumbs" color="gray.50">
              ~
            </Typography>
            <AdminDatePicker />
          </Box>
        </Box>
      </AdminConfirm>

      <AdminConfirm
        open={openConfirmSaving}
        title={<>저장하시겠습니까?</>}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenConfirmSaving(false)
            },
          },
          {
            label: '변경',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setOpenConfirmSaving(false)
              // showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' }) // Please use 1 of the snack bar in real case
              // showSnackbar('비활성으로 변경되었습니다.', { variant: 'success' }) // Please use 1 of the snack bar in real case
            },
          },
        ]}
      ></AdminConfirm>
    </>
  )
}

export default AdminCustomerCompanyDetailPage
