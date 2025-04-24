import { Box, FormControlLabel, Radio, RadioGroup, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

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
import { IDetail, IUserPermissionInfo } from '@/service/admin/companies'
import companiesService, { ICompanySetting, IIndividualSettings, IUpdateUserPermissionRequest } from '@/service/admin/companies'

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
        <>
          <FormControlLabel
            control={<Switch defaultChecked checked={props.value} onChange={(e) => toogle(e.target.checked)} />}
            label={props.label}
          />
          <AdminButton variant="contained" color="primary" size="h34" onClick={() => props.changeMode(true)}>
            상세 권한 설정
          </AdminButton>
        </>
      )}
    </Flex>
  )
}

const CustomPageTitle = (props: { isEdit: boolean; isActive: boolean }) => (
  <Box display="flex" alignItems="center" columnGap={'10px'}>
    {props.isEdit && <AdminChip label={props.isActive ? t('사용중') : t('미사용')} color={props.isActive ? 'green' : 'white'} size="h24" />}
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
  const queryClient = useQueryClient()

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

  // 회사 권한 테스트 데이터
  // const goodsDetailData = {
  //   companyNo: 2005,
  //   goodsNo: 70006,
  //   isUsed: true,
  //   goodsAuthManagementSeparateCd: "COMPANY",
  //   goodsAuthManagementSeparateNm: "회사",
  //   auditInfo: {
  //     createUserId: "SYSTEM",
  //     createDt: "2025-03-12 15:59:41",
  //     modifyUserId: "SYSTEM",
  //     modifyDt: "2025-03-20 15:07:49",
  //     createUserNm: "TEST_USER11",
  //     createUserDeptNm: "개발팀",
  //     createUserCpnyNm: "T001회사",
  //     modifyUserNm: "TEST_USER11",
  //     modifyUserDeptNm: "개발팀",
  //     modifyUserCpnyNm: "T001회사"
  //   },
  //   goodsNm: "TEST_PRODUCT1",
  //   goodsExpn: "설명설명설명설명",
  //   companySetting: {
  //     isViewable: true,
  //     isDownloadable: true,
  //     usageBeginDate: "20250101",
  //     usageEndDate: "20251231"
  //   }
  // }

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
    // await companiesService.getUserPermissions(2005, 5000, 70006, { page: 1, size: 20 }),
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
      setCustomTitle(<CustomPageTitle isEdit={isDetailPermissionSetting} isActive={isActive} />)
    }

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, setSubHeader, isActive, isDetailPermissionSetting, goodsDetailData])

  // 회사 권한 설정 상태
  const [companyPermission, setCompanyPermission] = useState<ICompanySetting>({
    isViewable: false,
    isDownloadable: false,
    usageBeginDate: '',
    usageEndDate: '',
  })

  // 개인 권한 설정 상태
  const [individualPermissions, setIndividualPermissions] = useState<IIndividualSettings[]>([])

  // 권한 설정 업데이트
  const updatePermissions = async () => {
    try {
      const requestBody: IUpdateUserPermissionRequest = {
        isUsed: isActive,
        goodsAuthManagementSeparateCd: permission,
        ...(permission === 'COMPANY' && { companySetting: companyPermission }),
        ...(permission === 'INDIVIDUAL' && { IndividualSettings: individualPermissions }),
      }

      await companiesService.updateUserPermission(Number(companyNo), Number(providerNo), Number(goodsNo), requestBody)
      setOpenSaveConfirm(false)
      showSnackbar('저장되었습니다.', { variant: 'success' })
      setIsDetailPermissionSetting(false)
      queryClient.invalidateQueries({ queryKey: ['goodsDetail', companyNo, providerNo, goodsNo] })
      queryClient.invalidateQueries({ queryKey: ['goodsDetailLatest', companyNo, providerNo, goodsNo] })
      queryClient.invalidateQueries({ queryKey: ['userPermissions', companyNo, providerNo, goodsNo] })
      setIndividualPermissions([])
      setCompanyPermission({
        isViewable: false,
        isDownloadable: false,
        usageBeginDate: '',
        usageEndDate: '',
      })
    } catch (error) {
      console.error(error)
    }
  }

  // 권한 변경
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>, row: IDetail) => {
    const { checked, name } = e.target
    const userNo = row.userNo

    const targetUser = userPermissions?.detail?.find((user: IUserPermissionInfo) => user.userNo === userNo)
    console.log('Name => ', name)
    if (!targetUser) return

    const newPermission = {
      userNo: targetUser.userNo,
      isViewable: name === 'isViewable' ? checked : targetUser.isViewable,
      isDownloadable: name === 'isDownloadable' ? checked : targetUser.isDownloadable,
      usageBeginDate: targetUser.usageBeginDate,
      usageEndDate: targetUser.usageEndDate,
    }

    setIndividualPermissions((prev) => {
      const updated = prev.map((p) => (p.userNo === userNo ? newPermission : p))

      const exists = prev.some((p) => p.userNo === userNo)
      return exists ? updated : [...prev, newPermission]
    })
  }

  // 권한 적용 기간 변경
  const handleDateChange = (value: string, row: IDetail, type: string) => {
    const userNo = row.userNo

    const targetUser = userPermissions?.detail?.find((user: IUserPermissionInfo) => user.userNo === userNo)

    if (!targetUser) return

    const newPermission = {
      userNo: targetUser.userNo,
      isViewable: targetUser.isViewable,
      isDownloadable: targetUser.isDownloadable,
      usageBeginDate: type === 'usageBeginDate' ? value : targetUser.usageBeginDate,
      usageEndDate: type === 'usageEndDate' ? value : targetUser.usageEndDate,
    }

    setIndividualPermissions((prev) => {
      const updated = prev.map((p) => (p.userNo === userNo ? newPermission : p))

      const exists = prev.some((p) => p.userNo === userNo)
      return exists ? updated : [...prev, newPermission]
    })
  }

  useEffect(() => {
    console.log('individualPermissions ==> ', individualPermissions)
  }, [individualPermissions])

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
            onChange={(e) => {
              params.row.isViewable = e.target.checked
              handlePermissionChange(e, params.row)
            }}
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
            onChange={(e) => {
              params.row.isDownloadable = e.target.checked
              handlePermissionChange(e, params.row)
            }}
            disabled={!isDetailPermissionSetting}
          />
        ),
      },
      {
        field: 'usageBeginDate',
        headerName: t('권한 적용 기간'),
        width: 391,
        sortable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box display={'flex'} alignItems={'center'} maxWidth={'100%'} padding="7px 12px">
            <AdminDatePicker
              readOnly={!isDetailPermissionSetting}
              disabled={!params.row.isViewable && !params.row.isDownloadable}
              size="h26"
              onChange={(e: Dayjs | null) => {
                if (e) {
                  const value = e.format('YYYYMMDD')
                  params.row.usageBeginDate = value
                  handleDateChange(value, params.row, 'usageBeginDate')
                }
              }}
              value={dayjs(
                `${params.row.usageBeginDate.slice(0, 4) 
                }-${ 
                  params.row.usageBeginDate.slice(4, 6) 
                }-${ 
                  params.row.usageBeginDate.slice(6, 8)}`,
              )}
            />
            <Typography component={'div'} mx={'8px'} color="gray.50" variant="breadcrumbs">
              ~
            </Typography>
            <AdminDatePicker
              readOnly={!isDetailPermissionSetting}
              disabled={!params.row.isViewable && !params.row.isDownloadable}
              size="h26"
              onChange={(e: Dayjs | null) => {
                if (e) {
                  const value = e.format('YYYYMMDD')
                  params.row.usageEndDate = value
                  handleDateChange(value, params.row, 'usageEndDate')
                }
              }}
              value={dayjs(
                `${params.row.usageEndDate.slice(0, 4)  }-${  params.row.usageEndDate.slice(4, 6)  }-${  params.row.usageEndDate.slice(6, 8)}`,
              )}
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
                  {t('회사 권한 설정')}
                </Typography>

                <Flex>
                  <AdminCheckboxField
                    disabled={!isDetailPermissionSetting}
                    checked={goodsDetailData?.companySetting.isViewable}
                    label="조회"
                  />
                  <AdminCheckboxField
                    disabled={!isDetailPermissionSetting}
                    checked={goodsDetailData?.companySetting.isDownloadable}
                    label="다운로드"
                  />
                </Flex>
              </Box>
              <Box minWidth={'210px'}>
                <Typography component={'p'} variant="subtitle" color="gray.90" mb="12px">
                  {t('권한 적용 기간')}
                  {isDetailPermissionSetting && (
                    <Typography component={'sup'} variant="asterisk" color="point.red1">
                      *
                    </Typography>
                  )}
                </Typography>
                <Box display={'flex'} alignItems={'center'} maxWidth={'100%'}>
                  <AdminDatePicker
                    readOnly={!isDetailPermissionSetting}
                    size="h26"
                    value={dayjs(
                      `${goodsDetailData?.companySetting.usageBeginDate.slice(0, 4) 
                      }-${ 
                        goodsDetailData?.companySetting.usageBeginDate.slice(4, 6) 
                      }-${ 
                        goodsDetailData?.companySetting.usageBeginDate.slice(6, 8)}`,
                    )}
                  />
                  <Typography component={'div'} mx={'8px'} color="gray.50" variant="breadcrumbs">
                    ~
                  </Typography>
                  <AdminDatePicker
                    readOnly={!isDetailPermissionSetting}
                    size="h26"
                    value={dayjs(
                      `${goodsDetailData?.companySetting.usageEndDate.slice(0, 4) 
                      }-${ 
                        goodsDetailData?.companySetting.usageEndDate.slice(4, 6) 
                      }-${ 
                        goodsDetailData?.companySetting.usageEndDate.slice(6, 8)}`,
                    )}
                  />
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
        title={<>{isActive ? t('미사용으로 변경하시겠습니까?') : t('사용으로 변경하시겠습니까?')}</>}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenConfirmActive(false)
            },
          },
          {
            label: t('변경'),
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setOpenConfirmActive(false)
              showSnackbar(isActive ? t('미사용으로 변경되었습니다.') : t('사용으로 변경되었습니다.'), { variant: 'success' })
              setIsActive((value) => !value)
            },
          },
        ]}
      >
        {isActive
          ? t('변경 시 해당 프로바이더와 연계된 상품도 비활성화됩니다.')
          : t('변경 시 해당 프로바이더와 연계된 상품도 활성화됩니다.')}
      </AdminConfirm>

      <AdminConfirm
        open={openCancelConfirm}
        title={t('취소하시겠습니까?')}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: t('이어서 작성'),
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenCancelConfirm(false)
            },
          },
          {
            label: t('취소 및 이동'),
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setOpenCancelConfirm(false)
              setIsDetailPermissionSetting(false)
            },
          },
        ]}
      >
        {t('취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.')}
      </AdminConfirm>

      <AdminConfirm
        open={openSaveConfirm}
        title={t('저장하시겠습니까?')}
        width={450}
        handleClose={() => {
          setOpenSaveConfirm(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setOpenSaveConfirm(false)
            },
          },
          {
            label: t('저장'),
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              updatePermissions()
            },
          },
        ]}
      ></AdminConfirm>
    </>
  )
}

export default AdminCustomerCompanyProductDetailPage
