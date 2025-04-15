import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import { Box, FormControlLabel, InputAdornment, MenuItem, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminDatePicker from '@/components/admin/AdminDatePicker'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTable, { AdminTableAction, AdminTableCell, AdminTableHeader } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import DetailItem from '@/components/common/detail-item'
import SearchIcon from '@/components/common/icons/SearchIcon'
import SettingIcon from '@/components/common/icons/SettingIcon'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'

interface DataProvider {
  id: number
  name: string
  count: number
  date: string
}

interface Member {
  id: number
  company: string
  department: string
  position: string
  name: string
  email: string
  registrationDate: string
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

const AdminCustomerDataProviderTable = () => {
  // const { showSnackbar } = useAdminSnackbar()
  // Sample data
  const data: DataProvider[] = [
    { id: 1, name: 'LSEG', count: 12, date: 'yyyy-mm-dd' },
    { id: 2, name: 'Bloomberg', count: 35, date: 'yyyy-mm-dd' },
    { id: 3, name: 'Investing', count: 24, date: 'yyyy-mm-dd' },
    { id: 4, name: 'S&P Global', count: 11, date: 'yyyy-mm-dd' },
  ]

  // Define columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      // renderHeader: () => <AdminTableHeader fontWeight={600}>데이터 프로바이더</AdminTableHeader>,
      flex: 1,
      renderCell(params) {
        return <AdminTableCell>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'count',
      // renderHeader: () => <AdminTableHeader fontWeight={600}>정품</AdminTableHeader>,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      width: 120,
      renderCell(params) {
        return <AdminTableCell>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'date',
      // renderHeader: () => <AdminTableHeader fontWeight={600}>등록일</AdminTableHeader>,
      align: 'center',
      headerAlign: 'center',
      width: 200,
      renderCell(params) {
        return <AdminTableCell typography={{ color: 'gray.60' }}>{params.value}</AdminTableCell>
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
      <AdminTable getRowId={(row) => row.id} columns={columns} rows={data ?? []} onRowClick={handleOnRowClick} />
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

const AdminCustomerMemberTable = () => {
  const [isOpenDelete, setIsOpenDelete] = useState(false)
  // const { showSnackbar } = useAdminSnackbar()
  const members: Member[] = [
    {
      id: 1,
      company: 'SK 실트론',
      department: 'ESG플랫폼사업팀',
      position: 'Manager',
      name: '홍길동',
      email: 'a.b@ekcc.com',
      registrationDate: 'yyyy-mm-dd',
    },
    {
      id: 2,
      company: 'SK 실트론',
      department: 'ESG플랫폼사업팀',
      position: 'Manager',
      name: '나길동',
      email: 'a.b@ekcc.com',
      registrationDate: 'yyyy-mm-dd',
    },
    {
      id: 3,
      company: 'SK 실트론',
      department: 'ESG플랫폼사업팀',
      position: 'Manager',
      name: '다길동',
      email: 'a.b@ekcc.com',
      registrationDate: 'yyyy-mm-dd',
    },
    {
      id: 4,
      company: 'SK 실트론',
      department: 'ESG플랫폼사업팀',
      position: 'Manager',
      name: '다길동',
      email: 'a.b@ekcc.com',
      registrationDate: 'yyyy-mm-dd',
    },
    {
      id: 5,
      company: 'SK 실트론',
      department: 'ESG플랫폼사업팀',
      position: 'Manager',
      name: '다길동',
      email: 'a.b@ekcc.com',
      registrationDate: 'yyyy-mm-dd',
    },
  ]
  const navigate = useNavigate()
  // const { getPath } = useAdminMenuItems()

  const columns: GridColDef[] = [
    {
      field: 'company',
      renderHeader: () => <AdminTableHeader>회사명</AdminTableHeader>,
      width: 250,
      flex: 1,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody1' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'department',
      renderHeader: () => <AdminTableHeader>소속</AdminTableHeader>,
      width: 182,
      flex: 1,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody2' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'position',
      headerName: '직위',
      renderHeader: () => <AdminTableHeader>직위</AdminTableHeader>,
      width: 182,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody2' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'name',
      renderHeader: () => <AdminTableHeader>이름</AdminTableHeader>,
      width: 120,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody2' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'email',
      renderHeader: () => <AdminTableHeader>이메일</AdminTableHeader>,
      width: 182,
      sortable: false,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody2' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'registrationDate',
      renderHeader: () => <AdminTableHeader>등록일</AdminTableHeader>,
      width: 182,
      sortable: false,
      renderCell(params) {
        return (
          <AdminTableCell
            typography={{
              color: 'gray.60',
              variant: 'tableBody2',
            }}
          >
            {params.value}
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
      <AdminTable getRowId={(row) => row.id} columns={columns} rows={members ?? []} onRowClick={handleOnRowClick} />
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

  // const { showSnackbar } = useAdminSnackbar()

  const toogle = () => {
    setOpenConfirmActive(true)
  }

  useEffect(() => {
    setCustomComponent(<AdminCustomerCompanyDetailPageHeader value={isActive} onChange={toogle} label={isActive ? '활성' : '비활성'} />)
    setSubHeader(
      <DetailItem
        title="SK 하이닉스"
        fields={[
          {
            label: '수정일',
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
          {
            label: '사용기간',
            value: 'yyyy-mm-dd ~ 9999-12-31',
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
  }, [setCustomComponent, setSubHeader, isActive])

  return (
    <>
      <AdminCustomerDataProviderTable />
      <AdminCustomerMemberTable />
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
