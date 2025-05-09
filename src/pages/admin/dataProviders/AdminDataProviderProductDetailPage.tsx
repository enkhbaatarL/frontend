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
import MIChip from '@/components/common/chip/MIChip'
import DetailItem from '@/components/common/detail-item/DetailItem'
import SearchIcon from '@/components/common/icons/SearchIcon'
import SettingIcon from '@/components/common/icons/SettingIcon'
import UpdateIcon from '@/components/common/icons/UpdateIcon'
import MIInput from '@/components/common/input/MIInput'
import MITableLayout from '@/components/common/table/MITableLayout'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import dataProviderService, { IProviderGoodsDataInfo } from '@/service/admin/dataProvider'
import { IPaginationResponse } from '@/types/api'
import { getMockTableData } from '@/utils/mock-data'

interface ProductDataTableProps {
  data: IPaginationResponse<IProviderGoodsDataInfo>
  isPublic: boolean
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
const ProductDataListTable = ({ data, isPublic }: ProductDataTableProps) => {
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
                  // setSearchValue(search)
                }}
              />
            }
            contentWidth={270}
            value={null}
            // onChange={(e) => setSearch(e.target.value)}
            // onKeyDown={(e) => {
            //   if (e.key === 'Enter') {
            //     setSearchValue(search)
            //   }
            // }}
            onClear={() => {
              // setSearchValue('')
              // setSearch('')
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
      <AdminTable
        getRowId={(row) => row.goodsDataNo}
        columns={columns}
        data={data}
        // onRowClick={}
      />
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
// const AuthorityDetailTable = ({ data }: ProductDataTableProps) => {
//   const columns: GridColDef[] = [
//     {
//       field: 'customerCompanyNm',
//       headerName: t('고객사'),
//       maxWidth: 120,
//       flex: 1,
//       renderCell(params) {
//         return <AdminTableCell>{params.value}</AdminTableCell>
//       }
//     },
//     {
//       field: 'goodsDataNm',
//       headerName: t('데이터명'),
//       maxWidth: 360,
//       renderCell(params) {
//         return <AdminTableCell typography={{ variant: 'body2SB14' }}>{params.value}</AdminTableCell>
//       }
//     },
//     {
//       field: 'goodsDataExpn',
//       headerName: t('데이터 설명'),
//       flex: 1,
//       renderCell(params) {
//         return <AdminTableCell>{params.value}</AdminTableCell>
//       }
//     },
//     {
//       field: 'actions',
//       headerName: '',
//       maxWidth: 52,
//       cellClassName: 'cellAction',
//       align: 'center',
//       renderCell: (params) => (
//         <AdminTableAction
//           actions={[
//             {
//               label: t('삭제'),
//               icon: <DeleteIcon fontSize="small" />,
//               onClick: () => {
//                 // setIsOpenDelete(true)
//                 // setSelectedUser(params.row)
//               },
//             },
//           ]}
//         />
//       ),
//     },
//   ]

//   return (
//     <Box>
//       <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb={3}>
//         <Typography color="gray.90">{t('데이터 목록')}</Typography>
//         <Box display={'flex'} alignItems={'center'} columnGap={'10px'}>
//           <MIInput
//             placeholder={t('검색하세요.')}
//             endIcon={
//               <SearchIcon
//                 onClick={() => {
//                   // setSearchValue(search)
//                 }}
//               />
//             }
//             contentWidth={270}
//             value={null}
//             // onChange={(e) => setSearch(e.target.value)}
//             // onKeyDown={(e) => {
//             //   if (e.key === 'Enter') {
//             //     setSearchValue(search)
//             //   }
//             // }}
//             onClear={() => {
//               // setSearchValue('')
//               // setSearch('')
//             }}
//           />
//           <AdminButton
//             color="secondary"
//             variant="outlined"
//             size="h34"
//             onClick={() => {
//               // navigate('/admin/member-mgmt/users/registration')
//             }}
//           >
//             {t('데이터 등록')}
//           </AdminButton>
//         </Box>
//       </Box>
//       <AdminTable
//         getRowId={(row) => row.goodsDataNo}
//         columns={columns}
//         data={data}
//         // onRowClick={}
//       />
//       {/* <AdminConfirm
//         open={isOpenDelete}
//         title={
//           <>
//             <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
//             {t('회원을 삭제하시겠습니까?')}
//           </>
//         }
//         width={450}
//         handleClose={() => {
//           setIsOpenDelete(false)
//         }}
//         actions={[
//           {
//             label: t('취소'),
//             variant: 'outlined',
//             color: 'gray',
//             onClick: () => {
//               setIsOpenDelete(false)
//             },
//           },
//           {
//             label: t('삭제'),
//             variant: 'filled',
//             color: 'red',
//             onClick: async () => {
//               await handleDelete()
//             },
//           },
//         ]}
//       >
//         회원 정보 삭제 시 해당 회원은 서비스에 접근이 불가합니다.
//       </AdminConfirm> */}
//     </Box>
//   )
// }

const AdminDataProviderProductDetailPage = () => {
  const { providerNo, goodsNo } = useParams()
  const { state } = useLocation()
  const [search, _setSearch] = useState('')

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
    queryKey: ['dataList'],
    queryFn: async () =>
      await dataProviderService.getProviderGoodsDataList(Number(providerNo), Number(goodsNo), {
        keyword: search,
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
  // const { showSnackbar } = useAdminSnackbar()
  const [isActive, setIsActive] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [openActiveCofirm, setOpenActiveConfirm] = useState(false)
  // const activeForm = useForm({
  //   defaultValues: {
  //     name: '',
  //   },
  //   validators: {
  //     onChange: ({ value }: { value: { name: string } }) => {
  //       const isRequire = (v: string) => (v.length === 0 ? true : undefined)

  //       return {
  //         fields: {
  //           name: isRequire(value.name),
  //         },
  //       }
  //     },
  //   },
  // })
  // const canActive = useStore(activeForm.store, (state: { canSubmit: boolean; isDirty: boolean }) => {
  //   return state.canSubmit && state.isDirty
  // })

  const toogle = () => {
    setOpenActiveConfirm(true)
  }

  const [openEditConfirm, setOpenEditingConfirm] = useState(false)
  const [openModifiedData, setOpenModifiedData] = useState(false)

  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'admin'
  const status = searchParams.get('status') || ''
  const isAdmin = role === 'admin'

  // const editForm = useForm({
  //   defaultValues: {
  //     name: '제조사별 DRAM 생산량',
  //     description: '제조사별 DRAM 생산량 상품의 상세 정보입니다.',
  //   },
  //   validators: {
  //     onChange: ({ value }: { value: { name: string; description: string } }) => {
  //       const isRequire = (v: string) => (v.length === 0 ? true : undefined)

  //       return {
  //         fields: {
  //           name: isRequire(value.name),
  //           description: isRequire(value.description),
  //         },
  //       }
  //     },
  //   },
  // })

  // const canEdit = useStore(editForm.store, (state: { canSubmit: boolean; isDirty: boolean }) => {
  //   return state.canSubmit
  // })

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

  return (
    <>
      {dataList && <ProductDataListTable data={dataList} isPublic={isPublic} />}
      {/* <Box>
        <MITableLayout
          label="데이터 목록"
          search={{
            placeholder: '검색하세요.',
          }}
          actionButtons={
            <MIButton
              disabled={(type === 'private' && role === 'admin') || (type === 'public' && role === 'user')}
              type="outlined"
              color="gray"
              onClick={() => {
                navigate({
                  // pathname: getPath('data-provider-data-registration'),
                })
              }}
            >
              데이터 등록
            </MIButton>
          }
          tableProps={{
          onRowClick: handleRowClick,
            columns: [
              ...(type === 'public' ? [] : [{ field: 'customer', headerName: '고객사', width: 120 }]),
              {
                field: 'dataName',
                headerName: '데이터명',
                width: 360,
                renderCell: (param) => <MITableCell value={param.value} typography={{ variant: 'body2SB14' }} />,
              },
              { field: 'dataDescription', headerName: '데이터 설명', flex: 1 },
              {
                field: 'actions',
                headerName: '',
                width: 52,
                align: 'center',
                renderCell: () => (
                  <AdminTableAction
                    actions={[
                      {
                        label: '데이터 업데이트',
                        icon: <UpdateIcon className="MuiSvgIcon-root" />,
                        // disabled: (type === 'public' && role === 'user') || (type === 'private' && role === 'admin'),
                        onClick: () => {
                          // navigate(getPath('data-provider-data-detail'))
                        },
                      },
                    ]}
                  />
                ),
              },
            ],
            rows: getMockTableData(
              {
                customer: ['SK 실트론', 'SK 하이닉스', 'SK ON', 'SK C&C'],
                dataName: ['Fab Utilization Rate (%)', 'Global Semiconductor Revenue ($B)', 'DRAM ASP ($ per Gb)'],
                dataDescription: [
                  'Fab Utilization Rate (%)',
                  'Global Semiconductor Revenue ($B) Global Semiconductor Revenue ($B) Global Semiconductor Revenue ($B)',
                ],
              },
              6,
            ),
            rowId: 'id',
          }}
        />
      </Box> */}
      {role === 'admin' && (
        <Box>
          <MITableLayout
            label="권한 상세"
            search={{
              placeholder: '회사명을 검색하세요.',
            }}
            tableProps={{
              columns: [
                { field: 'companyName', headerName: '회사명', flex: 1 },
                {
                  field: 'usage',
                  headerName: '사용 여부',
                  width: 120,
                  align: 'center',
                  renderCell: (param) => <MIChip color={param.value === '사용중' ? 'green' : 'gray'} label={param.value} />,
                },
                { field: 'type', headerName: '타입', width: 120 },
                { field: 'views', headerName: '조회(명)', width: 120, align: 'right' },
                {
                  field: 'downloads',
                  headerName: '다운로드(명)',
                  width: 120,
                  align: 'right',
                },
              ],
              rows: getMockTableData(
                {
                  companyName: ['SK 실트론', 'SK 하이닉스', 'SK ON', 'SK C&C'],
                  usage: ['사용중', '미사용'],
                  type: ['회사 권한', '개별 권한'],
                  views: ['All'],
                  downloads: ['없음', '000'],
                },
                2,
              ),
              rowId: 'id',
            }}
          ></MITableLayout>
        </Box>
      )}

      <AdminConfirm
        open={openActiveCofirm}
        title={isActive ? <>비활성으로 변경하시겠습니까?</> : <>활성으로 변경하시겠습니까?</>}
        width={502}
        handleClose={() => {
          setOpenActiveConfirm(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenActiveConfirm(false)
            },
          },
          {
            label: <Typography variant="body2SB14">변경</Typography>,
            variant: 'filled',
            color: 'primary',
            // disabled: !canActive,
            onClick: () => {
              setOpenActiveConfirm(false)
              setIsActive((value) => !value)
              // showSnackbar('저장되었습니다.', { variant: 'success' })
            },
          },
        ]}
      >
        <Typography component={'p'} variant="body2R14" color="gray.70" mb={'20px'} sx={{ letterSpacing: '-0.1px' }}>
          {isActive
            ? '변경 후에도 해당 데이터 프로바이더의 기존에 설정된 상품 및 사용자 권한 정보는 유지됩니다. 다시 활성 상태로 변경하면 이전의 권한 설정을 그대로 사용할 수 있습니다.'
            : '변경 시 해당 데이터 프로바이더의 기존에 설정되었던 권한이 있는 경우 기존 권한이 적용됩니다. 변경 후 최종 권한을 다시 한 번 확인해주세요.'}
        </Typography>
        {/* <activeForm.Field name="name">
          {(field: { state: { value: string } }) => (
            <MIField
              label="변경할 데이터 프로바이더 명 입력"
              required
              helper="데이터 프로바이더명을 동일하게 입력해주세요."
              helperStyle={{ color: 'chart.blue2' }}
            >
              <MIInput fullWidth value={field.state.value} />
            </MIField>
          )}
        </activeForm.Field> */}
      </AdminConfirm>

      <AdminConfirm
        open={openModifiedData}
        title={<>상품 수정</>}
        width={502}
        handleClose={() => {
          setOpenModifiedData(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenModifiedData(false)
            },
          },
          {
            label: <Typography variant="body2SB14">저장</Typography>,
            variant: 'filled',
            color: 'primary',
            // disabled: !canEdit,
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
