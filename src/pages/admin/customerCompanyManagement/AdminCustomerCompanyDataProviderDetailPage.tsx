import { Box, FormControlLabel, Radio, RadioGroup, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminCompanySelectorIconButton from '@/components/admin/AdminCompanySelectorIconButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import DetailItem from '@/components/common/detail-item'
import SearchIcon from '@/components/common/icons/SearchIcon'
import SettingIcon from '@/components/common/icons/SettingIcon'
import MIInput from '@/components/common/input/MIInput'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService from '@/service/admin/companies'

const AdminCustomerCompanyProviderDetailPageHeader = (props: {
  onChange: (value: boolean | undefined) => void
  label: string
  value: boolean
}) => {
  const toogle = (value: boolean | undefined) => {
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
  const [openConfirmActive, setOpenConfirmActive] = useState(false)
  const [openProductRegistrationConfirm, setOpenProductRegistrationConfirm] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState({ value: '', label: '' })
  const { companyNo, providerNo } = useParams()
  const [selectedProviderNo, setSelectedProviderNo] = useState<string | undefined>(providerNo)
  const { showSnackbar } = useSnackbar()

  const { data: providerDetailData } = useQuery({
    queryKey: ['providerDetail', companyNo, selectedProviderNo],
    queryFn: async () => await companiesService.getCompanyProviderDetail(Number(companyNo), Number(selectedProviderNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!selectedProviderNo,
  })

  const [isActive, setIsActive] = useState<boolean>(providerDetailData?.isUsed ?? true)

  const { data: providerLatestUpdatedData } = useQuery({
    queryKey: ['latestUpdateData', companyNo, selectedProviderNo],
    queryFn: async () => await companiesService.getProviderLatestUpdated(Number(companyNo), Number(selectedProviderNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!selectedProviderNo,
  })

  const { data: providerData } = useQuery({
    queryKey: ['provider', companyNo],
    queryFn: async () => await companiesService.getCompanyProviders(Number(companyNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo,
  })

  const { data: providerGoodsData } = useQuery({
    queryKey: ['providerGoodsData', companyNo, selectedProviderNo, isActive],
    queryFn: async () =>
      await companiesService.getProviderGoods(Number(companyNo), Number(selectedProviderNo), {
        search: '',
        page: 1,
        size: 20,
      }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!selectedProviderNo,
  })

  const options = useMemo(
    () =>
      Array.isArray(providerData)
        ? providerData.map((provider) => ({
          value: provider.providerNo,
          label: provider.providerNm,
        }))
        : [],
    [providerData],
  )

  const columns: GridColDef[] = [
    {
      field: 'goodsNm',
      headerName: t('상품명'),
      flex: 1,
      sortable: false,
      renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
    },
    {
      field: 'goodsExpn',
      headerName: t('상품 설명'),
      flex: 1,
      sortable: false,
      renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
    },
    {
      field: 'numberOfData',
      headerName: t('데이터 개수'),
      minWidth: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
    },
    {
      field: 'isUsed',
      headerName: t('사용 여부'),
      minWidth: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <AdminTableCell
          type="chip"
          chip={{
            color: params.value ? 'green' : 'white',
          }}
        >
          {params.value ? '사용 중' : '미사용'}
        </AdminTableCell>
      ),
    },
    {
      field: 'goodsAuthManagementSeparateNm',
      headerName: t('권한'),
      minWidth: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <AdminTableCell>{params.value === '개인' ? '개별 권한' : '회사 권한'}</AdminTableCell>,
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

  useEffect(() => {
    if (providerDetailData) {
      setSelectedCompany({ value: String(providerDetailData.providerNo), label: providerDetailData.providerNm })
      setIsActive(providerDetailData.isUsed)
    }
  }, [providerDetailData])

  useEffect(() => {
    if (providerDetailData && providerLatestUpdatedData) {
      setCustomComponent(
        <AdminCustomerCompanyProviderDetailPageHeader
          value={isActive}
          onChange={() => setOpenConfirmActive(true)}
          label={isActive ? '사용' : '미사용'}
        />,
      )

      setSubHeader(
        <DetailItem
          title={
            <Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography variant="body1" color="gray.70">
                  {providerDetailData?.companyNm}
                </Typography>
                <Box width={'1px'} height={'14px'} bgcolor="common.black" mx="10px" />
                <Typography variant="contentTitle" color="gray.90" mr={'4px'}>
                  {selectedCompany ? selectedCompany.label : providerDetailData.providerNm}
                </Typography>
                <AdminCompanySelectorIconButton
                  value={selectedCompany}
                  onChange={(v) => {
                    setSelectedCompany(v)
                    setSelectedProviderNo(v.value)
                  }}
                  options={options}
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
              value: dayjs(providerDetailData?.auditInfo.createDt).format('YYYY-MM-DD'),
            },
            {
              label: '수정일',
              value: dayjs(providerLatestUpdatedData?.modifyDt).format('YYYY-MM-DD'),
            },
            {
              label: '등록자',
              value: String(providerDetailData?.auditInfo.createUserNm),
            },
            {
              label: '수정자',
              value: String(providerLatestUpdatedData?.modifyUserNm),
            },
          ]}
          tooltipMessage="기본 정보 수정"
          onAction={() => {
            //   setOpenInformationDialog(true)
          }}
        />,
      )
    }

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
    }
  }, [providerDetailData, providerLatestUpdatedData, options, selectedCompany, isActive])

  const handleOnRowClick = () => {
    // navigate(getPath('customer-company-product-detail'))
  }

  const registerProduct = () => {
    setOpenProductRegistrationConfirm(true)
  }

  // 사용/미사용 변경
  const handleChangeUsage = async () => {
    try {
      const request = {
        isUsed: isActive ? false : true,
      }
      const response = await companiesService.changeUsage(Number(companyNo), Number(selectedProviderNo), request)
      setIsActive(response.isUsed)
      setOpenConfirmActive(false)
      showSnackbar(t(response.isUsed ? '사용' : '미사용') + t('으로 변경되었습니다.'), { variant: 'success' })
    } catch (error) {
      console.error('error', error)
    }
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
        <AdminTable getRowId={(row) => row.goodsNo} columns={columns} data={providerGoodsData} onRowClick={handleOnRowClick} />
      </Box>
      <AdminConfirm
        open={openConfirmActive}
        title={<>{isActive ? '미사용으로 변경하시겠습니까?' : '사용으로 변경하시겠습니까?'}</>}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenConfirmActive(false)
            },
          },
          {
            label: '변경',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              handleChangeUsage()
            },
          },
        ]}
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
