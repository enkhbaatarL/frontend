import { Box, FormControlLabel, Radio, RadioGroup, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminCompanySelectorIconButton from '@/components/admin/AdminCompanySelectorIconButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminTable, { AdminTableAction, AdminTableCell, AdminTableHeader } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import DetailItem from '@/components/common/detail-item'
import SearchIcon from '@/components/common/icons/SearchIcon'
import SettingIcon from '@/components/common/icons/SettingIcon'
import MIInput from '@/components/common/input/MIInput'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import companiesService from '@/service/admin/companies'

interface Product {
  id: number
  productName: string
  productDesc: string
  dataCount: string
  usageStatus: 'active' | 'inactive'
  rightsType: string
}

const AdminCustomerCompanyProviderDetailPageHeader = (props: { onChange: (value: boolean) => void; label: string; value: boolean }) => {
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

const AdminCustomerCompanyDataProviderDetailPage = () => {
  const navigate = useNavigate()
  const { setCustomComponent, setSubHeader } = useAdminHeader()
  const [isActive, _setIsActive] = useState(true)
  const [openConfirmActive, setOpenConfirmActive] = useState(false)
  const [openProductRegistrationConfirm, setOpenProductRegistrationConfirm] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState({
    value: 'company1',
    label: 'LSEG',
  })
  const { companyNo, providerNo } = useParams()

  const { data } = useQuery({
    queryKey: ['providerDetail', companyNo, providerNo],
    queryFn: async () => await companiesService.getCompanyProviderDetail(Number(companyNo), Number(providerNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!providerNo,
  })

  const products: Product[] = [
    {
      id: 1,
      productName: '제조사별 DRAM 생산량',
      productDesc: '제조사별 DRAM 생산량 설명 정보',
      dataCount: '000',
      usageStatus: 'active',
      rightsType: '회사 권한',
    },
    {
      id: 2,
      productName: '제조사별 DRAM 생산량',
      productDesc: '제조사별 DRAM 생산량 설명 정보',
      dataCount: '000',
      usageStatus: 'active',
      rightsType: '개별 권한',
    },
    {
      id: 3,
      productName: '제조사별 DRAM 생산량',
      productDesc: '제조사별 DRAM 생산량 설명 정보',
      dataCount: '000',
      usageStatus: 'inactive',
      rightsType: '회사 권한',
    },
    {
      id: 4,
      productName: '제조사별 DRAM 생산량',
      productDesc: '제조사별 DRAM 생산량 설명 정보',
      dataCount: '000',
      usageStatus: 'active',
      rightsType: '개별 권한',
    },
    {
      id: 5,
      productName: '제조사별 DRAM 생산량',
      productDesc: '제조사별 DRAM 생산량 설명 정보',
      dataCount: '000',
      usageStatus: 'active',
      rightsType: '개별 권한',
    },
  ]

  const columns: GridColDef[] = [
    {
      field: 'productName',
      renderHeader: () => <AdminTableHeader>상품명</AdminTableHeader>,
      flex: 1,
      sortable: false,
      renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
    },
    {
      field: 'productDesc',
      renderHeader: () => <AdminTableHeader>상품 설명</AdminTableHeader>,
      flex: 1,
      sortable: false,
      renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
    },
    {
      field: 'dataCount',
      renderHeader: () => <AdminTableHeader>데이터 개수</AdminTableHeader>,
      minWidth: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
    },
    {
      field: 'usageStatus',
      renderHeader: () => <AdminTableHeader>사용 여부</AdminTableHeader>,
      minWidth: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <AdminTableCell
          type="chip"
          chip={{
            color: params.value === 'active' ? 'green' : 'white',
          }}
        >
          {params.value === 'active' ? '사용 중' : '미사용'}
        </AdminTableCell>
      ),
    },
    {
      field: 'rightsType',
      renderHeader: () => <AdminTableHeader>권한</AdminTableHeader>,
      minWidth: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
    },
    {
      field: 'actions',
      headerName: '',
      minWidth: 52,
      cellClassName: 'cellAction',
      align: 'right',
      renderCell: () => (
        <AdminTableAction
          actions={[
            {
              label: '상세 권한 설정',
              icon: <SettingIcon className="MuiSvgIcon-root" />,
              onClick: () => {
                navigate({
                  // pathname: getPath('customer-company-product-detail'),
                  search: '?mode=set-permission',
                })
              },
            },
          ]}
        />
      ),
    },
  ]

  const toogle = () => {
    setOpenConfirmActive(true)
  }

  useEffect(() => {
    setCustomComponent(
      <AdminCustomerCompanyProviderDetailPageHeader value={isActive} onChange={toogle} label={isActive ? '활성' : '비활성'} />,
    )
    setSubHeader(
      <DetailItem
        title={
          <Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography variant="body1" color="gray.70">
                {data?.companyNm}
              </Typography>
              <Box width={'1px'} height={'14px'} bgcolor="common.black" mx="10px" />
              <Typography variant="contentTitle" color="gray.90" mr={'4px'}>
                {selectedCompany.label}
              </Typography>
              <AdminCompanySelectorIconButton
                value={selectedCompany}
                onChange={({ value, label }) => setSelectedCompany({ value: value as string, label })}
              />
            </Box>
          </Box>
        }
        subTitle={
          <Typography variant="subtext" color="gray.60">
            프로바이더 등록 시 관리자가 입력한 설명이 출력됩니다. 글자 수 제한은 100자입니다.
          </Typography>
        }
        fields={[
          {
            label: '등록일',
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
        ]}
        tooltipMessage="기본 정보 수정"
        onAction={() => {
          //   setOpenInformationDialog(true)
        }}
      />,
    )

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
    }
  }, [setCustomComponent, setSubHeader, isActive, selectedCompany])

  const handleOnRowClick = () => {
    // navigate(getPath('customer-company-product-detail'))
  }

  const registerProduct = () => {
    setOpenProductRegistrationConfirm(true)
  }

  return (
    <>
      <Box>
        <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
          <Box>
            <Typography component={'p'} variant="contentTitle" color="gray.90">
              상품 목록
            </Typography>
            <Typography variant="subtext" color="gray.60">
              리스트 클릭 시 해당 상품의 상세 화면으로 이동 및 상세 권한 설정이 가능합니다.
            </Typography>
          </Box>

          <Box display={'flex'} alignItems={'center'} columnGap={'10px'}>
            <MIInput placeholder="상품 또는 상품 설명을 검색하세요." endIcon={<SearchIcon />} contentWidth={196} />
            <AdminButton color="secondary" variant="outlined" size="h34" onClick={registerProduct}>
              상품 등록
            </AdminButton>
          </Box>
        </Box>
        <AdminTable getRowId={(row) => row.id} columns={columns} rows={products ?? []} onRowClick={handleOnRowClick} />
      </Box>
      <AdminConfirm
        open={openConfirmActive}
        title={<>{isActive ? '미사용으로 변경하시겠습니까?' : '사용으로 변경하시겠습니까?'}</>}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        // actions={[
        //   {
        //     label: <Typography variant="body2SB14">취소</Typography>,
        //     variant: 'outlined',
        //     color: 'secondary',
        //     onClick: () => {
        //       setOpenConfirmActive(false)
        //     },
        //   },
        //   {
        //     label: <Typography variant="body2SB14">변경</Typography>,
        //     variant: 'contained',
        //     color: 'primary',
        //     onClick: () => {
        //       setOpenConfirmActive(false)
        //       showSnackbar(isActive ? '미사용으로 변경되었습니다.' : '사용으로 변경되었습니다.', { variant: 'success' })
        //       setIsActive((value) => !value)
        //     },
        //   },
        // ]}
      >
        {isActive ? '변경 시 해당 프로바이더와 연계된 상품도 비활성화됩니다.' : '변경 시 해당 프로바이더와 연계된 상품도 활성화됩니다.'}
      </AdminConfirm>

      <AdminConfirm
        open={openProductRegistrationConfirm}
        title={<>상품 등록</>}
        width={450}
        handleClose={() => {
          setOpenProductRegistrationConfirm(false)
        }}
        // actions={[
        //   {
        //     label: <Typography variant="body2SB14">취소</Typography>,
        //     variant: 'outlined',
        //     color: 'secondary',
        //     onClick: () => {
        //       setOpenProductRegistrationConfirm(false)
        //     },
        //   },
        //   {
        //     label: <Typography variant="body2SB14">등록</Typography>,
        //     variant: 'contained',
        //     color: 'primary',
        //     onClick: () => {
        //       setOpenProductRegistrationConfirm(false)
        //       showSnackbar('등록되었습니다', { variant: 'success' })
        //       showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
        //     },
        //   },
        // ]}
      >
        <Box mb="20px">
          <Typography component={'p'} variant="body3M12" color="gray.70">
            상품{' '}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component={'p'} variant="subtext" color="gray.60" mb="6px">
            &#123;레피니티브&#125;에 등록된 상품 중 &#123;SK 실트론&#125;에 등록할 상품을 선택하세요. 등록 완료 시 &#123;SK실트론&#125;의
            회원이 해당 상품에 접근 가능합니다.
          </Typography>
          <AdminTextField fullWidth />
        </Box>
        <Box>
          <Typography component={'p'} variant="body3M12" color="gray.70">
            권한 유형
          </Typography>
          <RadioGroup row value="individualPermission">
            <FormControlLabel value="individualPermission" control={<Radio />} label="개별 권한" />
            <FormControlLabel value="companyPermission" control={<Radio />} label="회사 권한" />
          </RadioGroup>
        </Box>
      </AdminConfirm>
    </>
  )
}

export default AdminCustomerCompanyDataProviderDetailPage
