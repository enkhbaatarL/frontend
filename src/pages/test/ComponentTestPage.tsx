import ErrorIcon from '@mui/icons-material/Error'
import { MenuItem, FormControl, FormControlLabel, RadioGroup, Radio, Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import clsx from 'clsx'
import { useState } from 'react'

import style from './ComponentTestPage.module.scss'

import AdminAutoComplete from '@/components/admin/AdminAutoComplete'
import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminDatePicker from '@/components/admin/AdminDatePicker'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTable from '@/components/admin/AdminTable'
import DetailItem from '@/components/common/detail-item'
import Flex from '@/components/common/display/Flex'
import SettingIcon from '@/components/common/icons/SettingIcon'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
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

const companies = [
  'SUPEX추구협의회',
  'SK주식회사',
  'SK이노베이션',
  'SK하이닉스',
  'SK텔레콤',
  'SK에코플랜트',
  'SK실트론',
  'SK네트웍스',
  'SK스퀘어',
  'SKC',
  'SK바이오팜',
  'SK디스커버리',
  'SK케미칼',
  'SK가스',
  'SK머티리얼즈',
  'SK이노베이션 E&S',
  'SK에너지',
  'SK지오센트릭',
  'SK온',
  'SK렌무브',
  'SK브로드밴드',
  'SK아이이테크놀로지',
  'SK USA',
  'SK China',
  '행복나눔재단',
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
  const autoCompleteData = companies.map((company, index) => ({
    value: index,
    label: company,
  }))

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
            Show session expired
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
                label: 'Login',
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

      <Flex gap={6}>
        <div>Admin DatePicker</div>
        <AdminDatePicker />
      </Flex>

      <Flex>
        <div>Admin Autocomplete</div>
        <AdminAutoComplete<{ value: number; label: string }> options={autoCompleteData} />
      </Flex>

      <Flex>
        <div>Detail item component: </div>
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
          tooltipMessage="test"
        />
      </Flex>
      <Box mb={5}>
        <Typography variant="body1" mb={3}>
          Input style
        </Typography>
        <Box display={'flex'} flexDirection={'column'} rowGap={5} paddingLeft={5} mb={6}>
          <Flex gap={10}>
            <div>h26</div>
            <MIInput size="h26" />
          </Flex>
          <Flex gap={10}>
            <div>h34</div>
            <MIInput size="h34" />
          </Flex>
          <Flex gap={10}>
            <div>h36</div>
            <MIInput size="h36" />
          </Flex>
        </Box>

        <Box display={'flex'} flexDirection={'column'} rowGap={5} paddingLeft={5} mb={5}>
          <Flex gap={10}>
            <div>h26 error</div>
            <MIInput size="h26" error />
          </Flex>
          <Flex gap={10}>
            <div>h34 error</div>
            <MIInput size="h34" error />
          </Flex>
          <Flex gap={10}>
            <div>h36 error</div>
            <MIInput size="h36" error />
          </Flex>
        </Box>

        <Box display={'flex'} flexDirection={'column'} rowGap={5} paddingLeft={5} mb={5}>
          <Flex gap={10}>
            <div>h26 success</div>
            <MIInput size="h26" success />
          </Flex>
          <Flex gap={10}>
            <div>h34 success</div>
            <MIInput size="h34" success />
          </Flex>
          <Flex gap={10}>
            <div>h36 success</div>
            <MIInput size="h36" success />
          </Flex>
        </Box>

        <Box display={'flex'} flexDirection={'column'} rowGap={5} paddingLeft={5} mb={5}>
          <Flex gap={10}>
            <div>h26 disabled</div>
            <MIInput size="h26" disabled />
            <MIInput size="h26" disabled value="Value" />
          </Flex>
          <Flex gap={10}>
            <div>h34 disabled</div>
            <MIInput size="h34" disabled />
            <MIInput size="h34" disabled value="Value" />
          </Flex>
          <Flex gap={10}>
            <div>h36 disabled</div>
            <MIInput size="h36" disabled />
            <MIInput size="h36" disabled value="Value" />
          </Flex>
        </Box>

        <Box display={'flex'} flexDirection={'column'} rowGap={5} paddingLeft={5}>
          <Flex gap={10}>
            <div>h26 read only</div>
            <MIInput size="h26" readOnly />
            <MIInput size="h26" readOnly value="Value" />
          </Flex>
          <Flex gap={10}>
            <div>h34 read only</div>
            <MIInput size="h34" readOnly />
            <MIInput size="h34" readOnly value="Value" />
          </Flex>
          <Flex gap={10}>
            <div>h36 read only</div>
            <MIInput size="h36" readOnly />
            <MIInput size="h36" readOnly value="Value" />
          </Flex>
        </Box>
      </Box>

      <Box>
        <Typography variant="body1" mb={3}>
          Field style
        </Typography>
        <Box display={'flex'} flexDirection={'column'} rowGap={5} paddingLeft={5} mb={6}>
          <Flex gap={10}>
            <div>Field default</div>
            <MIField label="Label" subText="Guide text" helper="Helper text">
              <MIInput />
            </MIField>
          </Flex>
          <Flex gap={10}>
            <div>Field requrie</div>
            <MIField label="Label" subText="Guide text" helper="Helper text" required>
              <MIInput />
            </MIField>
          </Flex>
          <Flex gap={10}>
            <div>Field requrie has icon</div>
            <MIField label="Label" subText="Guide text" helper="Helper text" required title="Extra infomration">
              <MIInput />
            </MIField>
          </Flex>
          <Flex gap={10}>
            <div>Field have helper text only</div>
            <MIField helper="Helper text" required title="Extra infomration">
              <MIInput />
            </MIField>
          </Flex>
          <Flex gap={10}>
            <div>Field in form</div>
            <MIField labelSize="lg" label="Label" subText="Sub text" helper="Helper text" required title="Extra infomration">
              <MIInput />
            </MIField>
          </Flex>
        </Box>
      </Box>
    </>
  )
}

export default ComponentTestPage
