import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import MIChip from '@/components/common/chip/MIChip'
import DetailItem from '@/components/common/detail-item/DetailItem'
import SearchIcon from '@/components/common/icons/SearchIcon'
import SettingIcon from '@/components/common/icons/SettingIcon'
import UpdateIcon from '@/components/common/icons/UpdateIcon'
import MIInput from '@/components/common/input/MIInput'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import dataProviderService, { IProductCompanyPermissionInfo, IProviderGoodsDataInfo } from '@/service/admin/dataProvider'
import { IPaginationResponse } from '@/types/api'

interface ProductDataTableProps {
  data: IPaginationResponse<IProviderGoodsDataInfo>
  isPublic: boolean
  search: string
  setSearch: (value: string) => void
  setSearchValue: (value: string) => void
}
interface AuthorityDetailTableProps {
  data: IPaginationResponse<IProductCompanyPermissionInfo>
  searchCompanyNm: string
  setCompanyNmSearch: (value: string) => void
  setCompanyNmSearchValue: (value: string) => void
}
const AdminDataProviderProductDetailPageHeader = (props: { onChange: (value: boolean) => void; value: boolean; label: string }) => {
  const toogle = (value: boolean) => {
    props.onChange(value)
  }

  return (
    <Stack direction="row" alignItems="center" sx={{ ml: 'auto' }}>
      <Switch
        defaultChecked
        onChange={(e) => toogle(e.target.checked)}
        onContextMenu={(e) => {
          e.preventDefault()
          const target = e.target as HTMLInputElement

          toogle(target.checked)
        }}
      />
      <Typography variant="body2M14" color={'gray.70'} onClick={(e) => e.stopPropagation()}>
        {props.label}
      </Typography>
    </Stack>
  )
}

const CustomPageTitle = (props: { label: string }) => (
  <Box display="flex" alignItems="center" columnGap={'10px'}>
    {props.label && <MIChip label={props.label} color={props.label === t('활성화') ? 'gray' : 'blue'} size="h24" />}
    <Typography color="gray.90" variant="heading2">
      {t('상품 상세')}
    </Typography>
  </Box>
)

// 데이터 목록 테이블
const ProductDataListTable = ({ data, isPublic, search, setSearch, setSearchValue }: ProductDataTableProps) => {
  const columns: GridColDef[] = [
    {
      field: 'customerCompanyNm',
      headerName: t('고객사'),
      maxWidth: 120,
      flex: 1,
      renderCell(params) {
        return <AdminTableCell>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'goodsDataNm',
      headerName: t('데이터명'),
      maxWidth: 360,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'body2SB14' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'goodsDataExpn',
      headerName: t('데이터 설명'),
      flex: 1,
      renderCell(params) {
        return <AdminTableCell>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'actions',
      headerName: '',
      maxWidth: 52,
      cellClassName: 'cellAction',
      align: 'center',
      renderCell: () => (
        <AdminTableAction
          actions={[
            {
              label: t('데이터 업데이트'),
              icon: <UpdateIcon fontSize="small" />,
              disabled: !isPublic,
              onClick: () => {
                // setIsOpenDelete(true)
                // setSelectedUser(params.row)
              },
            },
          ]}
        />
      ),
    },
  ]

  return (
    <Box>
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
        <Typography color="gray.90">{t('데이터 목록')}</Typography>
        <Box display={'flex'} alignItems={'center'} columnGap={'10px'}>
          <MIInput
            placeholder={t('검색하세요.')}
            endIcon={
              <SearchIcon
                onClick={() => {
                  setSearchValue(search)
                }}
              />
            }
            contentWidth={270}
            value={null}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchValue(search)
              }
            }}
            onClear={() => {
              setSearchValue('')
              setSearch('')
            }}
          />
          <AdminButton
            color="secondary"
            variant="outlined"
            size="h34"
            onClick={() => {
              // navigate('/admin/member-mgmt/users/registration')
            }}
          >
            {t('데이터 등록')}
          </AdminButton>
        </Box>
      </Box>
      <AdminTable getRowId={(row) => row.goodsDataNo} columns={columns} data={data} />
      {/* <AdminConfirm
        open={isOpenDelete}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('회원을 삭제하시겠습니까?')}
          </>
        }
        width={450}
        handleClose={() => {
          setIsOpenDelete(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsOpenDelete(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: 'red',
            onClick: async () => {
              await handleDelete()
            },
          },
        ]}
      >
        회원 정보 삭제 시 해당 회원은 서비스에 접근이 불가합니다.
      </AdminConfirm> */}
    </Box>
  )
}

// 권한 상세 테이블
const AuthorityDetailTable = ({ data, searchCompanyNm, setCompanyNmSearch, setCompanyNmSearchValue }: AuthorityDetailTableProps) => {
  const columns: GridColDef[] = [
    {
      field: 'companyNm',
      headerName: t('회사명'),
      flex: 1,
      renderCell(params) {
        return <AdminTableCell>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'isUsed',
      headerName: t('사용 여부'),
      maxWidth: 120,
      align: 'center',
      renderCell(params) {
        return <MIChip color={params.value ? 'green' : 'gray'} label={params.value ? t('사용중') : t('미사용')} />
      },
    },
    {
      field: 'goodsAuthManagementSeparateCd',
      headerName: t('타입'),
      maxWidth: 120,
      renderCell(params) {
        return <AdminTableCell>{params.value === 'COMPANY' ? t('회사 권한') : t('개별 권한')}</AdminTableCell>
      },
    },
    {
      field: 'viewPermission',
      headerName: t('조회(명)'),
      maxWidth: 120,
      align: 'right',
      renderCell(params) {
        const { type, count } = params.row.viewPermission
        return <AdminTableCell>{type === 'ALL' ? 'All' : type === 'NONE' ? t('없음') : type === 'SOME' ? count : '-'}</AdminTableCell>
      },
    },
    {
      field: 'downloadPermission',
      headerName: t('다운로드(명)'),
      maxWidth: 120,
      align: 'right',
      renderCell(params) {
        const { type, count } = params.row.downloadPermission
        return <AdminTableCell>{type === 'ALL' ? 'All' : type === 'NONE' ? t('없음') : type === 'SOME' ? count : '-'}</AdminTableCell>
      },
    },
  ]

  return (
    <Box>
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
        <Typography color="gray.90">{t('권한 상세')}</Typography>
        <Box display={'flex'} alignItems={'center'} columnGap={'10px'}>
          <MIInput
            placeholder={t('회사명을 검색하세요.')}
            endIcon={
              <SearchIcon
                onClick={() => {
                  setCompanyNmSearchValue(searchCompanyNm)
                }}
              />
            }
            contentWidth={270}
            value={searchCompanyNm}
            onChange={(e) => setCompanyNmSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCompanyNmSearchValue(searchCompanyNm)
              }
            }}
            onClear={() => {
              setCompanyNmSearchValue('')
              setCompanyNmSearch('')
            }}
          />
        </Box>
      </Box>
      <AdminTable getRowId={(row) => row.companyNo} columns={columns} data={data} />
    </Box>
  )
}

const AdminDataProviderProductDetailPage = () => {
  const { providerNo, goodsNo } = useParams()
  const { state } = useLocation()
  const [search, setSearch] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [searchCompanyNm, setSearchCompanyNm] = useState('')
  const [searchCompanyNmValue, setSearchCompanyNmValue] = useState('')
  const [inputProviderName, setInputProviderName] = useState('')
  const [isErrorProviderName, setIsErrorProviderName] = useState(true)

  // 상품 상세
  const { data: productDetailData } = useQuery({
    queryKey: ['productDetailData'],
    queryFn: async () => await dataProviderService.getProviderGoodsDetail(Number(providerNo), Number(goodsNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!providerNo && !!goodsNo,
  })

  const { data: latestUpdatedData } = useQuery({
    queryKey: ['latestUpdatedData'],
    queryFn: async () => await dataProviderService.getProviderGoodsLatestUpdated(Number(providerNo), Number(goodsNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!providerNo && !!goodsNo,
  })

  // 데이터 목록
  const { data: dataList } = useQuery({
    queryKey: ['dataList', searchValue],
    queryFn: async () =>
      await dataProviderService.getProviderGoodsDataList(Number(providerNo), Number(goodsNo), {
        keyword: searchValue,
        page: 1,
        size: 20,
      }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!providerNo && !!goodsNo,
  })

  // 권한 상세 목록
  const { data: companyPermissionList } = useQuery({
    queryKey: ['companyPermissionList', searchCompanyNmValue],
    queryFn: async () =>
      await dataProviderService.getProductCompanyPermissionList(Number(providerNo), Number(goodsNo), {
        companyNm: searchCompanyNmValue,
        page: 1,
        size: 20,
      }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!providerNo && !!goodsNo,
  })

  const { setCustomComponent, setSubHeader, setCustomTitle } = useAdminHeader()
  const [isActive, setIsActive] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [openActiveCofirm, setOpenActiveConfirm] = useState(false)

  const toogle = () => {
    setOpenActiveConfirm(true)
  }

  const [openEditConfirm, setOpenEditingConfirm] = useState(false)
  const [openModifiedData, setOpenModifiedData] = useState(false)

  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'admin'
  const status = searchParams.get('status') || ''
  const isAdmin = role === 'admin'

  // 활성/비활성 변경
  const handleUpdateActive = async () => {
    try {
      const response = await dataProviderService.updateProviderGoods(Number(providerNo), Number(goodsNo), {
        goodsNm: productDetailData?.goodsNm ?? '',
        goodsId: productDetailData?.goodsId ?? '',
        goodsExpn: productDetailData?.goodsExpn ?? '',
        isUsed: !isActive,
        isPublic,
      })
      console.log('Response ==> ', response)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (productDetailData) {
      setIsActive(productDetailData.isUsed)
      setIsPublic(productDetailData.isPublic)
      setCustomComponent(
        <AdminDataProviderProductDetailPageHeader value={isActive} onChange={toogle} label={isActive ? '활성' : '비활성'} />,
      )
      setSubHeader(
        <DetailItem
          title={
            <Box>
              <Box display={'flex'} alignItems={'center'}>
                <MIChip
                  color="white"
                  variant="outlined"
                  label={productDetailData.isPublic ? 'Public' : 'Private'}
                  sx={{ textTransform: 'capitalize', mr: '10px' }}
                />
                <Typography variant="body1B16" color="gray.90">
                  {state?.providerNm}
                </Typography>
                <Typography variant="body1B16" color="gray.90" px={'8px'}>
                  •
                </Typography>
                <Typography variant="body1B16" color="gray.90">
                  {productDetailData?.goodsNm}
                </Typography>
              </Box>
            </Box>
          }
          subTitle={
            <Typography variant="subtext" color="gray.60">
              {productDetailData?.goodsExpn}
            </Typography>
          }
          fields={[
            {
              label: t('등록일'),
              value: dayjs(productDetailData?.auditInfo.createDt).format('YYYY-MM-DD'),
            },
            {
              label: t('수정일'),
              value: dayjs(latestUpdatedData?.modifyDt).format('YYYY-MM-DD'),
            },
            {
              label: t('등록자'),
              value: productDetailData?.auditInfo.createUserNm,
            },
            {
              label: t('수정자'),
              value: String(latestUpdatedData?.modifyUserName),
            },
          ]}
          tooltipMessage={t('기본 정보 수정')}
          icon={<SettingIcon />}
          onAction={() => {
            setOpenModifiedData(true)
          }}
        />,
      )
      setCustomTitle(<CustomPageTitle label={!isAdmin ? status : ''} />)
    }

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, setSubHeader, setCustomTitle, isActive, productDetailData, latestUpdatedData, state])

  useEffect(() => {
    setIsErrorProviderName(inputProviderName.replace(/\s/g, '') !== state?.providerNm.replace(/\s/g, ''))
  }, [inputProviderName, state])

  return (
    <>
      {dataList && (
        <ProductDataListTable data={dataList} isPublic={isPublic} search={search} setSearch={setSearch} setSearchValue={setSearchValue} />
      )}
      {companyPermissionList && (
        <AuthorityDetailTable
          data={companyPermissionList}
          searchCompanyNm={searchCompanyNm}
          setCompanyNmSearch={setSearchCompanyNm}
          setCompanyNmSearchValue={setSearchCompanyNmValue}
        />
      )}

      <AdminConfirm
        open={openActiveCofirm}
        title={isActive ? t('비활성으로 변경하시겠습니까?') : t('활성으로 변경하시겠습니까?')}
        width={502}
        handleClose={() => {
          setOpenActiveConfirm(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenActiveConfirm(false)
            },
          },
          {
            label: t('변경'),
            variant: 'filled',
            color: 'primary',
            disabled: isErrorProviderName,
            onClick: () => handleUpdateActive(),
          },
        ]}
      >
        <Typography component={'p'} variant="body2R14" color="gray.70" mb={'20px'} sx={{ letterSpacing: '-0.1px' }}>
          {isActive
            ? t(
              '변경 시에도 해당 상품의 기존에 설정된 권한 정보는 유지됩니다. 다시 사용중 설정 시 이전의 권한 설정 그대로 사용이 가능합니다.',
            )
            : t(
              '변경 시 해당 상품의 기존에 설정되었던 권한이 있는 경우 기존 권한이 적용됩니다. 변경 후 최종 권한을 다시 한 번 확인해주세요.',
            )}
        </Typography>
        <Box>
          <Typography component={'p'} variant="body3" color="gray.70">
            {t('변경할 상품명 입력 ')}
            <Typography component={'span'} color="point.red1">
              *
            </Typography>
          </Typography>
          <AdminTextField fullWidth onChange={(e) => setInputProviderName(e.target.value)} />
          {isErrorProviderName && (
            <Typography component={'p'} variant="subtext2" color="#5191F5" mt={1}>
              {t('상품명을 동일하게 입력해주세요.')}
            </Typography>
          )}
        </Box>
      </AdminConfirm>

      <AdminConfirm
        open={openModifiedData}
        title={t('상품 수정')}
        width={502}
        handleClose={() => {
          setOpenModifiedData(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenModifiedData(false)
            },
          },
          {
            label: t('저장'),
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setOpenEditingConfirm(true)
            },
          },
        ]}
      >
        <Box display={'flex'} flexDirection={'column'} rowGap={'20px'}>
          {/* <editForm.Field name="name">
            {(field: { state: { value: string } }) => (
              <MIField label="상품명" required subText="상품의 이름을 입력해주세요.">
                <MIInput
                  placeholder="입력하세요"
                  fullWidth
                  maxLength={50}
                  value={field.state.value}
                  // onChange={(e) => field.handleChange(e.target.value)}
                />
              </MIField>
            )}
          </editForm.Field>

          <editForm.Field name="description">
            {(field: { state: { value: string } }) => (
              <MIField label="상품 설명" required subText="상품에 대한 간략한 설명을 입력해주세요.">
                <MIInput
                  placeholder="입력하세요"
                  fullWidth
                  maxLength={100}
                  value={field.state.value}
                  // onChange={(e) => field.handleChange(e.target.value)}
                  multiline
                />
              </MIField>
            )}
          </editForm.Field> */}
        </Box>
      </AdminConfirm>

      <AdminConfirm
        open={openEditConfirm}
        title={<>저장하시겠습니까?</>}
        width={350}
        handleClose={() => {
          setOpenEditingConfirm(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenEditingConfirm(false)
            },
          },
          {
            label: <Typography variant="body2SB14">저장</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setOpenEditingConfirm(false)
              setOpenModifiedData(false)
              // showSnackbar('저장되었습니다.', { variant: 'success' })
              // showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
            },
          },
        ]}
      />
    </>
  )
}

export default AdminDataProviderProductDetailPage
