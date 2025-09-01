import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
// import { useQuery } from '@tanstack/react-query'
// import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect } from 'react' // useCallback, useMemo, useState

import AdminTable from '@/components/admin/AdminTable' //{ AdminTableCell }
import MITableCell from '@/components/common/table/MITableCell'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
// import useSnackbar from '@/hooks/useSnackbar'
import tokenService, { IApiKeyInfo } from '@/service/admin/token'
import { IPaginationRequest, IPaginationResponse } from '@/types/api'

const AdminTokenManagementPage = () => {
  const { setCustomComponent, setCustomTitle } = useAdminHeader()
  // const { showSnackbar } = useSnackbar()
  // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  // const [isReissueModalOpen, setIsReissueModalOpen] = useState(false)
  // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  // const [clientAccessRegNo, setClientAccessRegNo] = useState<number | null>(null)
  // const [decodedSecretKey, setDecodedSecretKey] = useState<string | null>(null)
  // const [viewSecretModal, setViewSecretModal] = useState(false)
  // const [selectedCompany, setSelectedCompany] = useState<string>('')

  // const [companyType, setCompanyType] = useState<'customer' | 'manager'>('customer')
  // const [clientId, setClientId] = useState<string>('')
  // const [isError, setIsError] = useState<boolean>(false)

  // API Key 목록 조회
  const {
    pagination,
    updateSize,
    updatePage,
    data: apiKeyList,
    // refetch,
    isLoading,
  } = useSearchFilter<IPaginationRequest, IPaginationResponse<IApiKeyInfo>>((params) => tokenService.getApiKeyList(params), {
    //나중에 여기 api 바꾸면 돼
    page: 1,
    size: 20,
  })

  const columns: GridColDef[] = [
    {
      field: 'customerCompanyNm',
      headerName: '사용량',
      flex: 1,
      minWidth: 100,
      align: 'left',
      renderCell(params) {
        return <MITableCell value={params.value} typography={{ variant: 'tableBody1' }} />
      },
    },

    {
      field: 'clientCertId',
      headerName: 'API 한도 (월)',
      flex: 1,
      minWidth: 150,
      align: 'left',
      renderCell(params) {
        return <MITableCell value={params.value} />
      },
    },
    {
      field: 'modifyDt',
      headerName: '최종 호출일',
      minWidth: 130,
      flex: 0.5,
      align: 'center',
      renderCell(params) {
        const { modifyDt } = params.row.auditInfo
        return (
          <MITableCell
            value={dayjs(modifyDt).format('YYYY-MM-DD')}
            typography={{
              color: 'gray.60',
            }}
          />
        )
      },
    },
  ]

  useEffect(() => {
    setCustomTitle(
      <Typography color="gray.90" variant="heading2">
        {t('사용 현황 조회')}
      </Typography>,
    )

    return () => {
      setCustomComponent(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, setCustomTitle])

  // const clearParamValues = useCallback(() => {
  //   setClientId('')
  //   setCompanyType('customer')
  //   setSelectedCompany('')
  // }, [])

  // useEffect(() => clearParamValues(), [clearParamValues, isCreateModalOpen])
  return (
    <Box px={3} py={2.5}>
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
        <Typography component={'p'} variant="contentTitle" color="gray.90">
          {t('LLM 사용량')}
        </Typography>
      </Box>
      <AdminTable
        getRowId={(row) => row.clientCertId}
        columns={columns}
        data={apiKeyList}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        isLoading={isLoading}
      />
    </Box>
  )
}

export default AdminTokenManagementPage
