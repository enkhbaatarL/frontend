import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { isEmpty } from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import AdminUserInfo from '@/components/admin/AdminUserInfo'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService from '@/service/admin/companies'
import membersService, { IUserInfo, IUserRequest } from '@/service/admin/members'
import { IPaginationResponse } from '@/types/api'

const PageHeader = () => {
  const navigate = useNavigate()

  return (
    <Flex gap={4}>
      <AdminButton variant="contained" color="primary" size="h34" onClick={() => navigate('/admin/member-mgmt/users/registration')}>
        {t('회원 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminMemberManagementUsersPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { showSnackbar } = useSnackbar()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false)
  const [deleteUserRequest, setDeleteUserRequest] = useState<number>()

  const [selectedUser, setSelectedUser] = useState<Partial<IUserInfo>>({})

  const {
    filter,
    updateFilter,
    pagination,
    updateSize,
    updatePage,
    resetFilter,
    search,
    data,
    refetch,
    isInitialState,
    isSearchedState,
    isPureState,
    isLoading,
  } = useSearchFilter<Omit<IUserRequest, 'userRoleCd'>, IPaginationResponse<IUserInfo>>(
    membersService.getUsers,
    {
      companyNo: '',
      departmentNm: '',
      userNm: '',
      emailAddress: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  const { data: filterOptions } = useQuery({
    queryKey: ['getDepartmentAll'],
    queryFn: async () => await companiesService.getDepartmentAll(),
    refetchOnWindowFocus: false,
  })

  const departmentOptions = useMemo(() => {
    updateFilter('departmentNm', '')

    return (filterOptions?.find(({ companyNo }) => companyNo === filter.companyNo)?.departmentNm ?? []).map((departmentNm) => ({
      label: departmentNm,
      value: departmentNm,
    }))
  }, [filter.companyNo, filterOptions, updateFilter])

  /**
   * 회원 삭제
   */
  const handleDeleteUser = useCallback(async () => {
    try {
      const request = showMemberDetailModal ? selectedUser.userNo : deleteUserRequest
      if (request) {
        const response = await membersService.deleteUser(request)
        setShowDeleteModal(false)
        setShowMemberDetailModal(false)
        if (response.status) {
          showSnackbar(t('삭제되었습니다.'), { variant: 'success' })
          await refetch()
        }
      }
    } catch (error) {
      console.error(error)
    }
  }, [deleteUserRequest, selectedUser.userNo, showMemberDetailModal, showSnackbar, refetch])

  const columns: GridColDef[] = [
    {
      field: 'customerCompanyNm',
      headerName: t('회사명'),
      width: 150,
      renderCell: (param) => (
        <AdminTableCell typography={{ variant: 'tableBody1' }} ellipsis cursorPointer>
          {param.value}
        </AdminTableCell>
      ),
    },
    {
      field: 'departmentNm',
      headerName: t('소속'),
      width: 160,
    },
    {
      field: 'onDutyNm',
      headerName: t('직위'),
      width: 180,
    },
    {
      field: 'userNm',
      headerName: t('이름'),
      width: 120,
    },
    {
      field: 'userLoginId',
      headerName: t('이메일'),
      width: 180,
    },
    {
      field: 'createUserNm',
      headerName: t('등록자'),
      width: 120,
      renderCell: (param) => {
        const { createUserNm, createUserDeptNm, createUserCpnyNm } = param.row.auditInfo
        const tooltipContent = `${createUserNm} / ${createUserDeptNm} / ${createUserCpnyNm}`

        return <AdminTableCell tooltipContent={tooltipContent}>{createUserNm}</AdminTableCell>
      },
    },
    {
      field: 'createDt',
      headerName: t('등록일'),
      width: 150,
      align: 'center',
      renderCell: (param) => {
        const { createDt } = param.row.auditInfo

        return createDt ? dayjs(createDt).format('YYYY-MM-DD') : null
      },
    },
    {
      field: 'actions',
      headerName: '',
      maxWidth: 52,
      cellClassName: 'cellAction',
      align: 'center',
      renderCell: (param) => (
        <AdminTableAction
          actions={[
            {
              label: t('삭제'),
              icon: <DeleteIcon fontSize="small" />,
              onClick: () => {
                setDeleteUserRequest(param.row.userNo)
                setShowDeleteModal(true)
              },
            },
          ]}
        />
      ),
    },
  ]

  useEffect(() => {
    setCustomComponent(<PageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return (
    <>
      <AdminSearchFilter onSearch={search} onReset={resetFilter} disabledSearch={isSearchedState} disabledReset={isInitialState}>
        <AdminSelect
          label={t('회사명')}
          value={filter.companyNo}
          onChange={(e) => {
            updateFilter('companyNo', e.target.value as string)
          }}
          options={filterOptions?.map(({ companyNo, companyNm }) => ({ label: companyNm, value: companyNo })) ?? []}
        />
        <AdminSelect
          label={t('소속')}
          value={filter.departmentNm}
          onChange={(e) => {
            updateFilter('departmentNm', e.target.value as string)
          }}
          disabled={isEmpty(departmentOptions)}
          options={departmentOptions}
        />
        <AdminTextField
          label={t('이름')}
          value={filter.userNm}
          onChange={(e) => {
            updateFilter('userNm', e.target.value)
          }}
        />
        <AdminTextField
          label={t('이메일')}
          value={filter.emailAddress}
          onChange={(e) => {
            updateFilter('emailAddress', e.target.value)
          }}
        />
      </AdminSearchFilter>
      <AdminTable
        getRowId={(row) => row.userNo}
        columns={columns}
        data={data}
        isLoading={isLoading}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        onRowClick={({ row }) => {
          setSelectedUser(row)
          setShowMemberDetailModal(true)
        }}
        noRowMessage={isPureState ? t('회원을 검색하세요.') : undefined}
      />
      <AdminConfirm
        open={showMemberDetailModal}
        title={t('회원 상세')}
        justifyContentAction="space-between"
        width={450}
        handleClose={() => setShowMemberDetailModal(false)}
        actions={[
          {
            label: t('회원 삭제'),
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setShowDeleteModal(true)
            },
          },
          {
            label: t('확인'),
            variant: 'contained',
            color: 'primary',
            onClick: () => setShowMemberDetailModal(false),
          },
        ]}
      >
        <AdminUserInfo info={selectedUser} />
      </AdminConfirm>
      <AdminConfirm
        open={showDeleteModal}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('회원을 삭제하시겠습니까?')}
          </>
        }
        width={450}
        handleClose={() => {
          setShowDeleteModal(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setShowDeleteModal(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'contained',
            color: 'error',
            onClick: async () => {
              await handleDeleteUser()
            },
          },
        ]}
      >
        {t('회원 정보 삭제 시 해당 회원은 서비스에 접근이 불가합니다.')}
      </AdminConfirm>
    </>
  )
}

export default AdminMemberManagementUsersPage
