import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { SnackbarProvider } from 'notistack'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminAutoComplete from '@/components/admin/AdminAutoComplete.tsx'
import AdminButton from '@/components/admin/AdminButton.tsx'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter.tsx'
import AdminSnackbar from '@/components/admin/AdminSnackbar.tsx'
import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable.tsx'
import AdminTextField from '@/components/admin/AdminTextField.tsx'
import Flex from '@/components/common/display/Flex.tsx'
import MIField from '@/components/common/input/MIField.tsx'
import { useAdminHeader } from '@/contexts/AdminHeaderContext.tsx'
import useSearchFilter from '@/hooks/useSearchFilter.tsx'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService, { ICompaniesRequest, ICompanyInfo } from '@/service/admin/companies.ts'
import { IPaginationResponse } from '@/types/api.ts'
import { Nullable, ICommonOptions } from '@/types/common.ts'

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
  const [selectedCompany, setSelectedCompany] = useState<Nullable<ICommonOptions>>(null)

  const { data: filterOptions } = useQuery({
    queryKey: ['group-companies'],
    queryFn: async () => await companiesService.getGroupCompanies(),
  })

  const options = useMemo(
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
    const response = await companiesService.registerOwnerCompany({
      companyCd: selectedCompany?.value ?? '',
    })

    setShowRegistrationModal(false)
    if (response.status) {
      await queryClient.invalidateQueries({ queryKey: ['owner-companies'] })
      navigateToList()
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
    } else {
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
    }
  }, [navigateToList, selectedCompany?.value, showSnackbar, queryClient])

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
            navigateToList()
          }
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
      headerName: 'Actions',
      width: 100,
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
          success: AdminSnackbar,
          error: AdminSnackbar,
          info: AdminSnackbar,
          warning: AdminSnackbar,
        }}
      />

      <AdminConfirm
        open={showRegistrationModal}
        title="관리사 등록"
        width={450}
        handleClose={() => setShowRegistrationModal(false)}
        actions={[
          { label: '취소', variant: 'outlined', color: 'secondary', onClick: () => setShowRegistrationModal(false) },
          { label: '등록', variant: 'contained', color: 'primary', onClick: registerOwnerCompany },
        ]}
      >
        <p style={{ marginBottom: '20px' }}>
          <MIField label="회사 선택" subText="관리사로 등록할 멤버사를 선택하세요" required>
            <AdminAutoComplete<ICommonOptions>
              fullWidth
              disablePortal
              options={options ?? []}
              onChange={(_event, newValue) => setSelectedCompany(newValue)}
              placeholder="검색 또는 선택하세요."
            />
          </MIField>
        </p>
      </AdminConfirm>
      <AdminConfirm
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
              await handleDeleteOwnerCompany(deleteOwnerCompanyRequest)
            },
          },
        ]}
      ></AdminConfirm>
    </>
  )
}

export default AdminCustomerCompanyManagementOwnerCompaniesPage
