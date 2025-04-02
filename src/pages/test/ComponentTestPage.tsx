import ErrorIcon from '@mui/icons-material/Error'
import { MenuItem, FormControl, FormControlLabel, RadioGroup, Radio } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import clsx from 'clsx'
import { useState } from 'react'

import style from './ComponentTestPage.module.scss'

import AdminButton from '@/components/admin/AdminButton.tsx'
import AdminConfirm from '@/components/admin/AdminConfirm.tsx'
import AdminSelect from '@/components/admin/AdminSelect.tsx'
import AdminTable from '@/components/admin/AdminTable.tsx'
import Flex from '@/components/common/display/Flex.tsx'
import useSnackbar from '@/hooks/useSnackbar'

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
  const [showConfirmPrimary, setShowConfirmPrimary] = useState(false)
  const [showConfirmPrimary2, setShowConfirmPrimary2] = useState(false)
  const [showConfirmPrimary3, setShowConfirmPrimary3] = useState(false)
  const [showConfirmError, setShowConfirmError] = useState(false)

  const [showPopupContent1, setShowPopupContent1] = useState(false)
  const [showPopupContent2, setShowPopupContent2] = useState(false)
  const [showPopupContent3, setShowPopupContent3] = useState(false)
  const { showSnackbar } = useSnackbar()

  return (
    <>
      <h1 style={{ margin: 0, marginBottom: '40px' }}>Component Test Page</h1>
      <Flex direction="column" align="start" gap={60}>
        <Flex gap={6}>
          <div>Admin Button</div>
          <AdminButton variant="outlined" color="primary">
            Button
          </AdminButton>
          <AdminButton variant="contained" color="primary">
            Button
          </AdminButton>
          <AdminButton variant="contained" color="error">
            Button
          </AdminButton>
          <AdminButton variant="outlined" color="secondary">
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
          <div>Admin Table No Data</div>
          <div style={{ width: '600px', height: '300px' }}>
            <AdminTable getRowId={(row) => row.companyCd} columns={columns} noRowMessage="표시할 데이터가 없습니다." />
          </div>
        </Flex>
        <Flex gap={6}>
          <div>Admin Table User/Information</div>
          <div style={{ width: '600px', height: '300px' }}>
            <AdminTable getRowId={(row) => row.companyCd} columns={columns} noRowMessage="사용자를 검색하세요." />
          </div>
        </Flex>
        <Flex gap={6}>
          <div>Admin Table Filter</div>
          <div style={{ width: '600px', height: '300px' }}>
            <AdminTable getRowId={(row) => row.companyCd} columns={columns} noRowMessage="해당 조건에 맞는 검색 결과가 없습니다." />
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
          <AdminButton color="primary" variant="contained" onClick={() => setShowConfirmPrimary(true)}>
            Show Confirm Primary
          </AdminButton>
          <AdminButton color="primary" variant="contained" onClick={() => setShowConfirmPrimary2(true)}>
            Show Confirm
          </AdminButton>
          <AdminButton color="primary" variant="contained" onClick={() => setShowConfirmPrimary3(true)}>
            Show Confirm
          </AdminButton>
          <AdminButton color="error" variant="contained" onClick={() => setShowConfirmError(true)}>
            Show Confirm Error
          </AdminButton>

          <AdminConfirm
            open={showConfirmPrimary}
            title="Popup title"
            width={450}
            handleClose={() => setShowConfirmPrimary(false)}
            actions={[
              { label: '취소', variant: 'outlined', color: 'secondary', onClick: () => setShowConfirmPrimary(false) },
              { label: '확인', variant: 'contained', color: 'primary', onClick: () => setShowConfirmPrimary(false) },
            ]}
          >
            Contents
          </AdminConfirm>
          <AdminConfirm
            open={showConfirmPrimary2}
            title="세션이 만료되었습니다."
            width={350}
            handleClose={() => setShowConfirmPrimary2(false)}
            actions={[
              {
                label: '로그인',
                variant: 'contained',
                color: 'primary',
                onClick: () => setShowConfirmPrimary2(false),
              },
            ]}
          />
          <AdminConfirm
            open={showConfirmPrimary3}
            title="Main text"
            width={350}
            handleClose={() => setShowConfirmPrimary3(false)}
            actions={[
              {
                label: 'Button',
                variant: 'outlined',
                color: 'secondary',
                onClick: () => setShowConfirmPrimary3(false),
              },
              { label: 'Button', variant: 'contained', color: 'primary', onClick: () => setShowConfirmPrimary3(false) },
            ]}
          />
          <AdminConfirm
            open={showConfirmError}
            title={
              <>
                <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
                삭제하시겠습니까?
              </>
            }
            width={450}
            handleClose={() => setShowConfirmError(false)}
            actions={[
              { label: '취소', variant: 'outlined', color: 'secondary', onClick: () => setShowConfirmError(false) },
              { label: '삭제', variant: 'contained', color: 'error', onClick: () => setShowConfirmError(false) },
            ]}
          >
            삭제된 데이터는 복구할 수 없습니다.
          </AdminConfirm>
        </Flex>

        <Flex gap={6}>
          <div>Popup content</div>
          <AdminButton color="primary" variant="contained" onClick={() => setShowPopupContent1(true)}>
            Show popup content 1
          </AdminButton>
          <AdminButton color="primary" variant="contained" onClick={() => setShowPopupContent2(true)}>
            Show popup content 2
          </AdminButton>
          <AdminButton color="primary" variant="contained" onClick={() => setShowPopupContent3(true)}>
            Show popup content 3
          </AdminButton>

          <AdminConfirm
            open={showPopupContent1}
            title="Popup title"
            width={450}
            handleClose={() => setShowPopupContent1(false)}
            actions={[
              { label: '취소', variant: 'outlined', color: 'secondary', onClick: () => setShowPopupContent1(false) },
              { label: '확인', variant: 'contained', color: 'primary', onClick: () => setShowPopupContent1(false) },
            ]}
          >
            <p style={{ marginBottom: '20px' }}>
              Lorem ipsum dolor sit amet consectetur. Scelerisque turpis mauris vulputate turpis semper tempus.
            </p>
            <FormControl sx={{ mb: '20px' }}>
              <RadioGroup aria-labelledby="demo-radio-buttons-group-label" defaultValue="female" name="radio-buttons-group">
                <FormControlLabel value="female" control={<Radio size="small" />} label="Radio btn Label" />
                <FormControlLabel value="male" control={<Radio size="small" />} label="Radio btn Label" />
              </RadioGroup>
            </FormControl>
          </AdminConfirm>

          <AdminConfirm
            open={showPopupContent3}
            title="Popup title"
            width={450}
            handleClose={() => setShowPopupContent3(false)}
            actions={[
              { label: '취소', variant: 'outlined', color: 'secondary', onClick: () => setShowPopupContent3(false) },
              { label: '확인', variant: 'contained', color: 'primary', onClick: () => setShowPopupContent3(false) },
            ]}
          >
            <p style={{ marginBottom: '20px' }}>
              Lorem ipsum dolor sit amet consectetur. Scelerisque turpis mauris vulputate turpis semper tempus.
            </p>
            <div className={clsx(style.boxDescription)}>*description text</div>
          </AdminConfirm>

          <AdminConfirm
            open={showPopupContent2}
            title="회원 상세"
            width={450}
            handleClose={() => setShowPopupContent2(false)}
            actions={[
              { label: '취소', variant: 'outlined', color: 'secondary', onClick: () => setShowPopupContent2(false) },
              { label: '확인', variant: 'contained', color: 'primary', onClick: () => setShowPopupContent2(false) },
            ]}
          >
            <div className={clsx(style.boxTable)}>
              <table>
                <tr>
                  <td>회사명</td>
                  <td>SK실트론</td>
                </tr>
                <tr>
                  <td>소속</td>
                  <td>AI Market Intelligence팀</td>
                </tr>
                <tr>
                  <td>직위/직함</td>
                  <td>Manager</td>
                </tr>
                <tr>
                  <td>이름</td>
                  <td>홍길동</td>
                </tr>
                <tr>
                  <td>이메일</td>
                  <td>gildong.hone@sk.com</td>
                </tr>
              </table>
            </div>
          </AdminConfirm>
        </Flex>

        <Flex gap={6}>
          <div>Admin Snackbar</div>
          <AdminButton
            variant="contained"
            color="success"
            onClick={() => {
              showSnackbar('Message success', { variant: 'success' })
            }}
          >
            Show Snackbar success
          </AdminButton>
          <AdminButton
            variant="contained"
            color="error"
            onClick={() => {
              showSnackbar('Message error', { variant: 'error', body: 'Description error' })
            }}
          >
            Show Snackbar error
          </AdminButton>
        </Flex>
      </Flex>
    </>
  )
}

export default ComponentTestPage
