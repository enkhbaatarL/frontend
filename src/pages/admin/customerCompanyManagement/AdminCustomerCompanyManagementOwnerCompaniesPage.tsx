import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { SnackbarProvider } from 'notistack'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import MISelect from '@/components/common/select/MISelect'
import MISnackbar from '@/components/common/snackbar/MISnackbar'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService, { ICompaniesRequest, ICompanyInfo } from '@/service/admin/companies'
import { IPaginationResponse } from '@/types/api'

const AdminCustomerCompanyManagementOwnerCompaniesPageHeader = ({ onRegister }: { onRegister: () => void }) => (
  <Flex gap={4}>
    <AdminButton variant="contained" color="primary" size="h34" onClick={onRegister}>
      {t('관리사 등록')}
    </AdminButton>
  </Flex>
)

const AdminCustomerCompanyManagementOwnerCompaniesPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [selectedValue, setSelectedValue] = useState<string>('')

  const { data: filterOptions } = useQuery({
    queryKey: ['group-companies'],
    queryFn: async () => await companiesService.getGroupCompanies(),
  })

  const memberOptions = useMemo(
    () =>
      filterOptions?.map((company) => ({
        value: company.companyCd,
        label: company.companyNm,
      })),
    [filterOptions],
  )

  const queryClient = useQueryClient()

  const navigateToList = useCallback(() => {
    navigate('/admin/customer-company/owner-companies', { replace: true })
  }, [navigate])

  const registerOwnerCompany = useCallback(async () => {
    try {
      const response = await companiesService.registerOwnerCompany({
        companyCd: selectedValue ?? '',
      })
      if (response.status) {
        await queryClient.invalidateQueries({ queryKey: ['owner-companies'] })
        showSnackbar(t('등록되었습니다.'), { variant: 'success' })
      }
      navigateToList()
    } catch (error) {
      console.error(error)
    }

    setShowRegistrationModal(false)
  }, [navigateToList, selectedValue, showSnackbar, queryClient])

  const [deleteOwnerCompanyRequest, setDeleteOwnerCompanyRequest] = useState<number>()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  /**
   * 관리사 삭제
   */
  const handleDeleteOwnerCompany = useCallback(
    async (companyNo: number | undefined) => {
      try {
        if (companyNo) {
          const response = await companiesService.deleteOwnerCompany(companyNo)
          setShowDeleteModal(false)
          if (response.status) {
            await queryClient.invalidateQueries({ queryKey: ['owner-companies'] })
            showSnackbar(t('삭제되었습니다.'), { variant: 'success' })
          }
          navigateToList()
        }
      } catch (error) {
        console.error(error)
      }
    },
    [showSnackbar, navigateToList, queryClient],
  )

  const {
    filter,
    updateFilter,
    pagination,
    updateSize,
    updatePage,
    resetFilter,
    search,
    data,
    isInitialState,
    isSearchedState,
    isPureState,
    isLoading,
  } = useSearchFilter<ICompaniesRequest, IPaginationResponse<ICompanyInfo>>(
    companiesService.getOwnerCompanies,
    {
      companyNm: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  useEffect(() => {
    setCustomComponent(<AdminCustomerCompanyManagementOwnerCompaniesPageHeader onRegister={() => setShowRegistrationModal(true)} />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  const columns: GridColDef[] = [
    {
      field: 'companyNm',
      headerName: '회사명',
      minWidth: 150,
      flex: 1,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody1' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'companyCd',
      headerName: '회사 코드',
      maxWidth: 120,
      align: 'center',
      renderCell(params) {
        return <AdminTableCell>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'createUserId',
      headerName: '등록자',
      maxWidth: 120,
      renderCell: (params) => {
        const { createUserNm } = params.row.auditInfo
        return <AdminTableCell>{createUserNm}</AdminTableCell>
      },
    },
    {
      field: 'createDt',
      headerName: '등록일',
      maxWidth: 150,
      align: 'center',
      renderCell: (params) => {
        const { createDt } = params.row.auditInfo
        return (
          <AdminTableCell
            typography={{
              color: 'gray.60',
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
      cellClassName: 'actions',
      align: 'center',
      renderCell: (param) => (
        <AdminTableCell
          typography={{
            color: 'gray.60',
          }}
          onClick={() => {
            const companyNo = param.row.companyNo
            setDeleteOwnerCompanyRequest(companyNo)
            setShowDeleteModal(true)
          }}
        >
          <DeleteIcon fontSize="small" />
        </AdminTableCell>
      ),
    },
  ]

  return (
    <>
      <AdminSearchFilter onSearch={search} onReset={resetFilter} disabledSearch={isSearchedState} disabledReset={isInitialState}>
        <AdminTextField
          label={t('회사명')}
          value={filter.companyNm}
          onChange={(e) => {
            updateFilter('companyNm', e.target.value)
          }}
        />
      </AdminSearchFilter>
      <AdminTable
        getRowId={(row) => row.companyNo}
        columns={columns}
        data={data}
        isLoading={isLoading}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        noRowMessage={isPureState ? t('고객사를 검색하세요.') : undefined}
        maxVisibleRowCount={20}
      />
      <SnackbarProvider
        maxSnack={8}
        autoHideDuration={2000}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        Components={{
          success: MISnackbar,
          error: MISnackbar,
          info: MISnackbar,
          warning: MISnackbar,
        }}
      />

      <MIConfirm
        open={showRegistrationModal}
        title={t('관리사 등록')}
        width={450}
        handleClose={() => setShowRegistrationModal(false)}
        actions={[
          { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setShowRegistrationModal(false) },
          {
            label: '등록',
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              await registerOwnerCompany()
            },
          },
        ]}
      >
        <Box>
          <Typography component={'p'} variant="body3" color="gray.70">
            {t('회사 선택')}{' '}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component={'p'} variant="subtext" color="gray.60" mb="6px">
            {t('관리사로 선택할 멤버사를 선택하세요.')}
          </Typography>
          <MISelect
            fullWidth
            options={memberOptions}
            useAllOption={false}
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value as string)}
          />
        </Box>
      </MIConfirm>
      <MIConfirm
        open={showDeleteModal}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('관리사를 삭제하시겠습니까?')}
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
            color: 'gray',
            onClick: () => {
              setShowDeleteModal(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: 'red',
            onClick: async () => {
              await handleDeleteOwnerCompany(deleteOwnerCompanyRequest)
            },
          },
        ]}
      ></MIConfirm>
    </>
  )
}

export default AdminCustomerCompanyManagementOwnerCompaniesPage
