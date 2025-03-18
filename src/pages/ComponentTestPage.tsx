import { MenuItem } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { SnackbarProvider } from 'notistack'
import { useState } from 'react'

import AdminButton from '@/components/admin/AdminButton.tsx'
import AdminConfirm from '@/components/admin/AdminConfirm.tsx'
import AdminSelect from '@/components/admin/AdminSelect.tsx'
import AdminSnackbar from '@/components/admin/AdminSnackbar'
import AdminTable from '@/components/admin/AdminTable.tsx'
import Flex from '@/components/common/display/Flex.tsx'
import useAdminSnackbar from '@/hooks/useAdminSnackbar'
const columns: GridColDef[] = [
  { field: 'companyNm', headerName: '회사명', minWidth: 150, flex: 1 },
  { field: 'companyNo', headerName: '상태', width: 120, align: 'center' },
  { field: 'companyCd', headerName: '회사 코드', width: 120, align: 'center' },
]

const rows = [
  { companyNm: '회사1', companyNo: 'Active', companyCd: '001' },
  { companyNm: '회사2', companyNo: 'Inactive', companyCd: '002' },
  { companyNm: '회사3', companyNo: 'Active', companyCd: '003' },
  { companyNm: '회사4', companyNo: 'Inactive', companyCd: '004' },
  { companyNm: '회사5', companyNo: 'Active', companyCd: '005' },
  { companyNm: '회사6', companyNo: 'Inactive', companyCd: '006' },
  { companyNm: '회사7', companyNo: 'Active', companyCd: '007' },
  { companyNm: '회사8', companyNo: 'Inactive', companyCd: '008' },
  { companyNm: '회사9', companyNo: 'Active', companyCd: '009' },
  { companyNm: '회사10', companyNo: 'Inactive', companyCd: '010' },
  { companyNm: '회사11', companyNo: 'Active', companyCd: '011' },
  { companyNm: '회사12', companyNo: 'Inactive', companyCd: '012' },
  { companyNm: '회사13', companyNo: 'Active', companyCd: '013' },
  { companyNm: '회사14', companyNo: 'Inactive', companyCd: '014' },
  { companyNm: '회사15', companyNo: 'Active', companyCd: '015' },
  { companyNm: '회사16', companyNo: 'Inactive', companyCd: '016' },
  { companyNm: '회사17', companyNo: 'Active', companyCd: '017' },
  { companyNm: '회사18', companyNo: 'Inactive', companyCd: '018' },
  { companyNm: '회사19', companyNo: 'Active', companyCd: '019' },
  { companyNm: '회사20', companyNo: 'Inactive', companyCd: '020' },
]

const ComponentTestPage = () => {
  const [select, setSelect] = useState<string>('all')
  const [showConfirm, setShowConfirm] = useState(false)
  const { showSnackbar } = useAdminSnackbar()

  return (
    <>
      <h1 style={{ margin: 0, marginBottom: '40px' }}>Component Test Page</h1>
      <Flex direction="column" align="start" gap={60}>
        <Flex gap={6}>
          <div>Admin Button</div>
          <AdminButton variant="contained" color="primary" size="small">
            Button
          </AdminButton>
        </Flex>
        <Flex gap={6}>
          <div>Admin Table</div>
          <div style={{ width: '600px', height: '300px' }}>
            <AdminTable getRowId={(row) => row.companyCd} columns={columns} rows={rows} />
          </div>
        </Flex>
        <Flex gap={6}>
          <div>Admin Select</div>
          <AdminSelect value={select} onChange={(e) => setSelect(String(e.target.value))}>
            <MenuItem value={'all'}>전체</MenuItem>
            <MenuItem value={'Active'}>Active</MenuItem>
            <MenuItem value={'Inactive'}>Inactive</MenuItem>
          </AdminSelect>
        </Flex>
        <Flex gap={6}>
          <div>Admin Confirm</div>
          <AdminButton onClick={() => setShowConfirm(true)}>Show Confirm</AdminButton>
          <AdminConfirm
            open={showConfirm}
            title="Confirm Test"
            handleClose={() => setShowConfirm(false)}
            handleConfirm={() => setShowConfirm(false)}
          >
            TEST
          </AdminConfirm>
        </Flex>
        <Flex gap={6}>
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
          >
            <div>Admin Snackbar</div>
            <AdminButton
              onClick={() => {
                showSnackbar('Message', { variant: 'success', body: 'test' })
              }}
            >
              Show Snackbar
            </AdminButton>
          </SnackbarProvider>
        </Flex>
      </Flex>
    </>
  )
}

export default ComponentTestPage
