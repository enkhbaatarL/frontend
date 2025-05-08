import { GridColDef } from '@mui/x-data-grid'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminTable from '@/components/admin/AdminTable.tsx'
import MIButton from '@/components/common/button/MIButton'
import MIChip from '@/components/common/chip/MIChip'
import Flex from '@/components/common/display/Flex'
import MITableCell from '@/components/common/table/MITableCell'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter.tsx'
import dataProviderService, { IProviderListInfo } from '@/service/admin/dataProvider'
import { IPaginationRequest, IPaginationResponse } from '@/types/api.ts'

const AdminDataProvidersListPageHeader = () => {
  const navigate = useNavigate()

  return (
    <Flex gap={4}>
      <MIButton size="h34" onClick={() => navigate('/admin/data-providers/registration')}>
        데이터 프로바이더 등록
      </MIButton>
    </Flex>
  )
}

const AdminDataProvidersListPage = () => {
  const navigate = useNavigate()
  const { setCustomComponent } = useAdminHeader()

  const { pagination, updateSize, updatePage, data, isLoading } = useSearchFilter<
    IPaginationRequest,
    IPaginationResponse<IProviderListInfo>
  >(dataProviderService.getProviderList, {
    page: 1,
    size: 20,
  })

  const columns: GridColDef[] = [
    {
      field: 'providerNm',
      headerName: '데이터 프로바이더 명',
      flex: 1,
      renderCell(params) {
        return <MITableCell value={params.value} typography={{ variant: 'body2SB14' }} />
      },
    },
    { field: 'providerId', headerName: '고유 코드', maxWidth: 180, align: 'center' },
    {
      field: 'isUsed',
      headerName: '사용 상태',
      maxWidth: 180,
      align: 'center',
      renderCell(params) {
        return (
          <MITableCell>
            <MIChip label={params.value === true ? '활성' : '비활성'} color={params.value === true ? 'blue' : 'gray'} />
          </MITableCell>
        )
      },
    },
    {
      field: 'createDt',
      headerName: '등록일',
      maxWidth: 150,
      align: 'center',
      renderCell(params) {
        return <MITableCell value={params.value} typography={{ color: 'gray.60' }} />
      },
    },
    { field: 'goodsCount', headerName: '상품 수', maxWidth: 80, align: 'right' },
  ]

  useEffect(() => {
    setCustomComponent(<AdminDataProvidersListPageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return (
    <div>
      <AdminTable
        getRowId={(row) => row.providerId}
        columns={columns}
        data={data}
        isLoading={isLoading}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        onRowClick={({ row }) => {
          navigate(`/admin/member-mgmt/managers/detail/${row.userNo}`)
        }}
        maxVisibleRowCount={20}
      />
    </div>
  )
}

export default AdminDataProvidersListPage
