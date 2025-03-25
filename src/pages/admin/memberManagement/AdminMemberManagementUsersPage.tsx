import { Delete, MoreVert } from '@mui/icons-material'
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { isEmpty } from 'lodash-es'
import { useEffect, useMemo, useState, MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTable from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import companiesService, { IUserInfo, IUserRequest } from '@/service/admin/companies'
import { IPaginationResponse } from '@/types/api'
import { Nullable } from '@/types/common'

const PageHeader = () => {
  const navigate = useNavigate()

  return (
    <Flex gap={4}>
      <AdminButton variant="contained" color="primary" size="small" onClick={() => navigate('/admin/member-mgmt/users/registration')}>
        {t('회원 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminMemberManagementUsersPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { filter, updateFilter, resetFilter, search, data, isInitialState, isSearchedState, isLoading } = useSearchFilter<
    Omit<IUserRequest, 'userRoleCd'>,
    IPaginationResponse<IUserInfo>
  >(
    companiesService.getUsers,
    {
      companyNo: '',
      departmentNm: '',
      userNm: '',
      emailAddress: '',
      page: 1,
      size: 10,
    },
    { usePagination: true },
  )

  const [menuAnchorEl, setMenuAnchorEl] = useState<Nullable<HTMLElement>>(null)
  const openMenu = Boolean(menuAnchorEl)

  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => await companiesService.getDepartmentAll(),
  })

  const departmentOptions = useMemo(() => {
    updateFilter('departmentNm', '')

    return (filterOptions?.find(({ companyNo }) => companyNo === filter.companyNo)?.departmentNm ?? []).map((departmentNm) => ({
      label: departmentNm,
      value: departmentNm,
    }))
  }, [filter.companyNo, filterOptions, updateFilter])

  const columns: GridColDef[] = [
    { field: 'customerCompanyNm', headerName: t('회사명'), minWidth: 150, flex: 1 },
    { field: 'departmentNm', headerName: t('소속'), width: 160 },
    { field: 'onDutyNm', headerName: t('직위/직함'), width: 180 },
    { field: 'userNm', headerName: t('이름'), width: 120 },
    { field: 'userLoginId', headerName: t('이메일'), width: 180 },
    {
      field: 'creatorUserNm',
      headerName: t('등록자'),
      width: 120,
      renderCell: (param) => {
        const { creatorUserNm, creatorDepartmentNm, creatorCompanyNm } = param.row

        return creatorUserNm ? (
          <Tooltip title={`${creatorUserNm} / ${creatorDepartmentNm} / ${creatorCompanyNm}`} arrow>
            {creatorUserNm}
          </Tooltip>
        ) : null
      },
    },
    {
      field: 'createDt',
      headerName: t('등록일'),
      width: 150,
      align: 'center',
      valueFormatter: ({ value }) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      field: 'menu',
      headerName: '',
      width: 52,
      align: 'center',
      renderCell: (_param) => (
        <IconButton onClick={handleMenuClick}>
          <MoreVert />
        </IconButton>
      ),
    },
  ]

  const handleMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  useEffect(() => {
    setCustomComponent(<PageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return (
    <>
      <Flex direction="column" gap={30} fullWidth>
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
        <AdminTable getRowId={(row) => row.userNo} columns={columns} rows={data?.detail ?? []} isLoading={isLoading} />
      </Flex>
      <Menu anchorEl={menuAnchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <Flex gap={4}>
            <Delete />
            <span>삭제</span>
          </Flex>
        </MenuItem>
      </Menu>
    </>
  )
}

export default AdminMemberManagementUsersPage
