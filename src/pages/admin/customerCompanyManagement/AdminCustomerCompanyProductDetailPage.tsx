import { Box, FormControlLabel, Radio, RadioGroup, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminCheckboxField from '@/components/admin/AdminCheckboxField'
import AdminChip from '@/components/admin/AdminChip'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminDatePicker from '@/components/admin/AdminDatePicker'
import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable'
import DetailItem from '@/components/common/detail-item'
import Flex from '@/components/common/display/Flex'
import DownloadIcon from '@/components/common/icons/DownloadIcon'
import PersonIcon from '@/components/common/icons/PersonIcon'
import VisibilityIcon from '@/components/common/icons/VisibilityIcon'
import MICheckBox from '@/components/common/input/MICheckBox'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import { IDetail } from '@/service/admin/companies'
import companiesService from '@/service/admin/companies'

const AdminCustomerCompanyProductDetailPageHeader = (props: {
  onChange: (value: boolean) => void
  label: string
  value: boolean
  editMode: boolean
  changeMode: (value: boolean) => void
  onCancel: () => void
  onSave: () => void
}) => {
  const toogle = (value: boolean) => {
    props.onChange(value)
  }

  return (
    <Flex gap={4} align="center">
      <FormControlLabel
        control={<Switch defaultChecked checked={props.value} onChange={(e) => toogle(e.target.checked)} />}
        label={props.label}
      />
      {props.editMode ? (
        <Box display={'flex'} columnGap={'10px'}>
          <AdminButton variant="outlined" color="secondary" size="h34" onClick={() => props.onCancel()}>
            취소
          </AdminButton>
          <AdminButton variant="contained" color="primary" size="h34" onClick={() => props.onSave()}>
            저장
          </AdminButton>
        </Box>
      ) : (
        <AdminButton variant="contained" color="primary" size="h34" onClick={() => props.changeMode(true)}>
          상세 권한 설정
        </AdminButton>
      )}
    </Flex>
  )
}

const CustomPageTitle = (props: { isEdit: boolean }) => (
  <Box display="flex" alignItems="center" columnGap={'10px'}>
    {props.isEdit && <AdminChip label="사용중" color="green" size="h24" />}
    <Typography color="gray.90" variant="heading2">
      {props.isEdit ? '상품 상세 권한 설정' : '상품 상세'}
    </Typography>
  </Box>
)

const AdminCustomerCompanyProductDetailPage = () => {
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent, setSubHeader, setCustomTitle } = useAdminHeader()
  const [openConfirmActive, setOpenConfirmActive] = useState(false)
  const [isDetailPermissionSetting, setIsDetailPermissionSetting] = useState(false)
  const [openCancelConfirm, setOpenCancelConfirm] = useState(false)
  const [openSaveConfirm, setOpenSaveConfirm] = useState(false)
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')

  const { companyNo, providerNo, goodsNo } = useParams()
  const { state } = useLocation()
  const { companyNm } = state as { companyNm: string }

  const { data: goodsDetailData } = useQuery({
    queryKey: ['goodsDetail', companyNo, providerNo, goodsNo],
    queryFn: async () => await companiesService.getGoodsDetail(Number(companyNo), Number(providerNo), Number(goodsNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!providerNo || !!goodsNo,
  })

  const { data: goodsDetailLatestData } = useQuery({
    queryKey: ['goodsDetailLatest', companyNo, providerNo, goodsNo],
    queryFn: async () => await companiesService.getGoodsLatestUpdated(Number(companyNo), Number(providerNo), Number(goodsNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!providerNo || !!goodsNo,
  })

  const { data: userPermissions } = useQuery({
    queryKey: ['userPermissions', companyNo, providerNo, goodsNo],
    queryFn: async () =>
      await companiesService.getUserPermissions(Number(companyNo), Number(providerNo), Number(goodsNo), { page: 1, size: 20 }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!providerNo || !!goodsNo,
  })

  const [isActive, setIsActive] = useState<boolean>(goodsDetailData?.isUsed ?? true)
  const [permission, setPermission] = useState<string>(goodsDetailData?.goodsAuthManagementSeparateCd ?? 'INDIVIDUAL')

  const toogle = () => {
    setOpenConfirmActive(true)
  }

  useEffect(() => {
    setIsDetailPermissionSetting(mode === 'set-permission')
  }, [mode])

  useEffect(() => {
    if (goodsDetailData && goodsDetailLatestData) {
      setCustomComponent(
        <AdminCustomerCompanyProductDetailPageHeader
          editMode={isDetailPermissionSetting}
          changeMode={setIsDetailPermissionSetting}
          onSave={() => setOpenSaveConfirm(true)}
          onCancel={() => setOpenCancelConfirm(true)}
          value={isActive}
          onChange={toogle}
          label={isActive ? '사용' : '미사용'}
        />,
      )
      setSubHeader(
        <DetailItem
          title={
            <Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography variant="body1" color="gray.70">
                  {companyNm}
                </Typography>
                <Box width={'1px'} height={'14px'} bgcolor="common.black" mx="10px" />
                <Typography variant="contentTitle" color="gray.90">
                  {goodsDetailData?.goodsNm}
                </Typography>
              </Box>
            </Box>
          }
          subTitle={
            <Typography variant="subtext" color="gray.60">
              {goodsDetailData?.goodsExpn}
            </Typography>
          }
          fields={[
            {
              label: t('등록일'),
              value: dayjs(goodsDetailData?.auditInfo.createDt).format('YYYY-MM-DD'),
            },
            {
              label: t('수정일'),
              value: dayjs(goodsDetailLatestData?.modifyDt).format('YYYY-MM-DD'),
            },
            {
              label: t('등록자'),
              value: String(goodsDetailData?.auditInfo.createUserNm),
            },
            {
              label: t('수정자'),
              value: String(goodsDetailLatestData?.modifyUserNm),
            },
          ]}
          tooltipMessage="기본 정보 수정"
        />,
      )
      setCustomTitle(<CustomPageTitle isEdit={isDetailPermissionSetting} />)
    }

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, setSubHeader, isActive, isDetailPermissionSetting, mode, goodsDetailData])

  const [_users, setUsers] = useState([
    {
      id: 1,
      name: '홍길동',
      department: 'Manager/AI Market Intelligence팀 / SK',
      hasAdminAccess: true,
      hasDataAccess: true,
      accessStartDate: null,
      accessEndDate: null,
    },
    {
      id: 2,
      name: '김길동',
      department: 'Manager/AI Market Intelligence팀 / SK',
      hasAdminAccess: true,
      hasDataAccess: true,
      accessStartDate: null,
      accessEndDate: null,
    },
    {
      id: 3,
      name: '나길동',
      department: 'Manager/AI Market Intelligence팀 / SK',
      hasAdminAccess: true,
      hasDataAccess: true,
      accessStartDate: null,
      accessEndDate: null,
    },
    {
      id: 4,
      name: '다길동',
      department: 'Manager/AI Market Intelligence팀 / SK',
      hasAdminAccess: true,
      hasDataAccess: true,
      accessStartDate: null,
      accessEndDate: null,
    },
    {
      id: 5,
      name: '라길동',
      department: 'Manager/AI Market Intelligence팀 / SK',
      hasAdminAccess: true,
      hasDataAccess: true,
      accessStartDate: null,
      accessEndDate: null,
    },
    {
      id: 6,
      name: '마길동',
      department: 'Manager/AI Market Intelligence팀 / SK',
      hasAdminAccess: true,
      hasDataAccess: true,
      accessStartDate: null,
      accessEndDate: null,
    },
    {
      id: 7,
      name: '바길동',
      department: 'Manager/AI Market Intelligence팀 / SK',
      hasAdminAccess: true,
      hasDataAccess: true,
      accessStartDate: null,
      accessEndDate: null,
    },
    {
      id: 8,
      name: '사길동',
      department: 'Manager/AI Market Intelligence팀 / SK',
      hasAdminAccess: true,
      hasDataAccess: true,
      accessStartDate: null,
      accessEndDate: null,
    },
  ])

  const changeField = (id: number, field: string, value: string | boolean) => {
    setUsers((cloneUsers) =>
      cloneUsers.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: value,
          }
        }

        return item
      }),
    )
  }

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'userNo',
        headerName: t('No.'),
        width: 50,
        sortable: false,
        align: 'center',
        renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
      },
      {
        field: 'userNm',
        headerName: '이름',
        width: 120,
        sortable: false,
        renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
      },
      {
        field: 'department',
        headerName: t('직위/부서명/회사명'),
        width: 392,
        flex: 1,
        sortable: false,
        renderCell: (params) => <AdminTableCell>{`${params.row.onDutyNm} / ${params.row.departmentNm} / ${companyNm}`}</AdminTableCell>,
      },
      {
        field: 'isViewable',
        headerName: '조회 권한',
        width: 100,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <MICheckBox
            checked={params.row.isViewable}
            onChange={(e) => changeField(params.row.userNo, 'isViewable', e.target.checked)}
            disabled={!isDetailPermissionSetting}
          />
        ),
      },
      {
        field: 'isDownloadable',
        headerName: t('다운로드 권한'),
        width: 100,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <MICheckBox
            checked={params.row.isDownloadable}
            onChange={(e) => changeField(params.row.userNo, 'isDownloadable', e.target.checked)}
            disabled={!isDetailPermissionSetting}
          />
        ),
      },
      {
        field: 'accessStartDate',
        headerName: t('권한 적용 기간'),
        width: 391,
        sortable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box display={'flex'} alignItems={'center'} maxWidth={'100%'} padding="7px 12px">
            <AdminDatePicker
              readOnly={!isDetailPermissionSetting}
              disabled={!params.row.hasDataAccess && !params.row.hasAdminAccess}
              size="h26"
              value={params.row.accessStartDate}
            />
            <Typography component={'div'} mx={'8px'} color="gray.50" variant="breadcrumbs">
              ~
            </Typography>
            <AdminDatePicker
              readOnly={!isDetailPermissionSetting}
              disabled={!params.row.hasDataAccess && !params.row.hasAdminAccess}
              size="h26"
              value={params.row.accessEndDate}
            />
          </Box>
        ),
      },
    ],
    [isDetailPermissionSetting],
  )

  return (
    <>
      <Box>
        <Box display={'flex'} alignItems={'center'}>
          <Box minWidth={'210px'}>
            <Typography component={'p'} variant="subtitle" color="gray.90" mb="12px">
              <Box>
                {t('권한 유형')}
                {isDetailPermissionSetting && (
                  <Typography component={'sup'} variant="asterisk" color="point.red1">
                    *
                  </Typography>
                )}
              </Box>
            </Typography>
            <RadioGroup row value={permission} onChange={(e) => setPermission(e.target.value)}>
              <FormControlLabel disabled={!isDetailPermissionSetting} value="INDIVIDUAL" control={<Radio />} label="개별 권한" />
              <FormControlLabel disabled={!isDetailPermissionSetting} value="COMPANY" control={<Radio />} label="회사 권한" />
            </RadioGroup>
          </Box>
          {permission === 'COMPANY' && (
            <>
              <Box minWidth={'210px'}>
                <Typography component={'p'} variant="subtitle" color="gray.90" mb="12px">
                  회사 권한 설정
                </Typography>

                <Flex>
                  <AdminCheckboxField disabled={!isDetailPermissionSetting} checked label="조회" />
                  <AdminCheckboxField disabled={!isDetailPermissionSetting} checked label="다운로드" />
                </Flex>
              </Box>
              <Box minWidth={'210px'}>
                <Typography component={'p'} variant="subtitle" color="gray.90" mb="12px">
                  권한 적용 기간
                  {isDetailPermissionSetting && (
                    <Typography component={'sup'} variant="asterisk" color="point.red1">
                      *
                    </Typography>
                  )}
                </Typography>
                <Box display={'flex'} alignItems={'center'} maxWidth={'100%'}>
                  <AdminDatePicker readOnly={!isDetailPermissionSetting} size="h26" />
                  <Typography component={'div'} mx={'8px'} color="gray.50" variant="breadcrumbs">
                    ~
                  </Typography>
                  <AdminDatePicker readOnly={!isDetailPermissionSetting} size="h26" />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
      <Box>
        <Box minWidth={'210px'} mb="5px">
          <Typography component={'p'} variant="subtitle" color="gray.90">
            {t('상세 권한 설정')}
          </Typography>
          <Typography variant="subtext" color="gray.60">
            {t('회원별 상세 권한은 회사 권한 설정과 동일합니다.')}
          </Typography>
        </Box>
        <Box
          display={'flex'}
          alignItems={'center'}
          padding="10px 12px"
          height={'54px'}
          boxSizing={'border-box'}
          bgcolor={'gray.5'}
          borderBottom={'1px solid'}
          borderTop={'1px solid'}
          borderColor={'gray.30'}
        >
          <>
            <Box display={'flex'} alignItems={'center'} columnGap={'4px'}>
              <Box>{<PersonIcon />}</Box>
              <Typography variant="subtitle2" color="gray.60">
                {t('회원')}
              </Typography>
              <Typography variant="chip1">{userPermissions?.extension?.numberOfUsers}</Typography>
            </Box>
            <Box width={'1px'} height={'14px'} bgcolor={'gray.30'} mx="8px" />
            <Box display={'flex'} alignItems={'center'} columnGap={'4px'}>
              <Box>{<VisibilityIcon />}</Box>
              <Typography variant="subtitle2" color="gray.60">
                {t('조회')}
              </Typography>
              <Typography variant="chip1">{userPermissions?.extension?.numberOfViewable}</Typography>
            </Box>
            <Box width={'1px'} height={'14px'} bgcolor={'gray.30'} mx="8px" />
            <Box display={'flex'} alignItems={'center'} columnGap={'4px'}>
              <Box>{<DownloadIcon />}</Box>
              <Typography variant="subtitle2" color="gray.60">
                {t('다운로드')}
              </Typography>
              <Typography variant="chip1">{userPermissions?.extension?.numberOfDownloadable}</Typography>
            </Box>
            <Box width={'1px'} height={'14px'} bgcolor={'gray.30'} mx="8px" />
          </>
        </Box>
        <AdminTable getRowId={(row: IDetail) => row.userNo} columns={columns} data={userPermissions} />
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
              setOpenConfirmActive(false)
              showSnackbar(isActive ? '미사용으로 변경되었습니다.' : '사용으로 변경되었습니다.', { variant: 'success' })
              setIsActive((value) => !value)
            },
          },
        ]}
      >
        {isActive ? '변경 시 해당 프로바이더와 연계된 상품도 비활성화됩니다.' : '변경 시 해당 프로바이더와 연계된 상품도 활성화됩니다.'}
      </AdminConfirm>

      <AdminConfirm
        open={openCancelConfirm}
        title={<>취소하시겠습니까?</>}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: '이어서 작성',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenCancelConfirm(false)
            },
          },
          {
            label: '취소 및 이동',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setOpenCancelConfirm(false)
            },
          },
        ]}
      >
        취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.
      </AdminConfirm>

      <AdminConfirm
        open={openSaveConfirm}
        title={<>저장하시겠습니까?</>}
        width={450}
        handleClose={() => {
          setOpenSaveConfirm(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenSaveConfirm(false)
            },
          },
          {
            label: '저장',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setOpenSaveConfirm(false)
              showSnackbar('저장되었습니다.', { variant: 'success' })
              showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
              setIsDetailPermissionSetting(false)
            },
          },
        ]}
      ></AdminConfirm>
    </>
  )
}

export default AdminCustomerCompanyProductDetailPage
