import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'

import AdminTable from '@/components/admin/AdminTable'
import MIButton from '@/components/common/button/MIButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import MISelect from '@/components/common/select/MISelect'
import MITableCell from '@/components/common/table/MITableCell'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService from '@/service/admin/companies'
import systemService, { IApiKeyInfo } from '@/service/admin/system'
import { IPaginationRequest, IPaginationResponse } from '@/types/api'

const AdminApiPageHeader = ({ onCreateClick }: { onCreateClick: () => void }) => (
  <Flex gap={4}>
    <MIButton onClick={onCreateClick}>{t('Key 생성')}</MIButton>
  </Flex>
)

const AdminApiPage = () => {
  const { setCustomComponent, setCustomTitle } = useAdminHeader()
  const { showSnackbar } = useSnackbar()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isReissueModalOpen, setIsReissueModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [clientAccessRegNo, setClientAccessRegNo] = useState<number | null>(null)
  const [decodedSecretKey, setDecodedSecretKey] = useState<string | null>(null)
  const [viewSecretModal, setViewSecretModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [clientId, setClientId] = useState<string>('')
  const [isError, setIsError] = useState<boolean>(false)

  // Client Secret 보기
  const handleViewSecret = async (clientAccessRegNo: number) => {
    try {
      const response = await systemService.getDecryptedClientSecretKey(clientAccessRegNo)
      if (response.status) {
        setDecodedSecretKey(response.data.clientSecretKey)
        setViewSecretModal(true)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // API Key 목록 조회
  const {
    pagination,
    updateSize,
    updatePage,
    data: apiKeyList,
    refetch,
  } = useSearchFilter<IPaginationRequest, IPaginationResponse<IApiKeyInfo>>((params) => systemService.getApiKeyList(params), {
    page: 1,
    size: 20,
  })

  // 고객사 조회
  const { data: customerCompanyList } = useQuery({
    queryKey: ['customerCompanyList'],
    queryFn: async () => await companiesService.getCompanyList(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const companyOptions = useMemo(() => {
    const customerCompanies = customerCompanyList?.find((item) => item.companyType === 'CUSTOMER')?.companies || []

    const companyOptions = customerCompanies.map((company) => ({
      value: company.companyNo,
      label: company.companyNm,
    }))

    return companyOptions
  }, [customerCompanyList])

  const columns: GridColDef[] = [
    {
      field: 'customerCompanyNm',
      headerName: '회사명',
      flex: 1,
      minWidth: 100,
      align: 'left',
      renderCell(params) {
        return <MITableCell value={params.value} typography={{ variant: 'tableBody1' }} />
      },
    },
    {
      field: 'clientCertId',
      headerName: 'Client ID',
      flex: 1,
      minWidth: 150,
      align: 'left',
      renderCell(params) {
        return <MITableCell value={params.value} />
      },
    },
    {
      field: 'clientSecretKey',
      headerName: 'Client Secret',
      flex: 1,
      minWidth: 150,
      align: 'left',
      renderCell(params) {
        const maskedValue = params.value ? '*'.repeat(params.value.length) : '********'
        return <MITableCell value={maskedValue} />
      },
    },
    {
      field: 'viewSecret',
      headerName: 'Client Secret 보기',
      flex: 1,
      minWidth: 150,
      align: 'center',
      renderCell(params) {
        return (
          <MITableCell>
            <MIButton
              width={'100%'}
              size="h28"
              type="outlined"
              onClick={(e) => {
                e.stopPropagation()
                handleViewSecret(params.row.clientAccessRegNo)
              }}
            >
              <Typography variant="body3SB12" color="gray.70">
                Client Secret
              </Typography>
            </MIButton>
          </MITableCell>
        )
      },
    },
    {
      field: 'createDt',
      headerName: '등록일',
      minWidth: 130,
      flex: 0.5,
      align: 'center',
      renderCell(params) {
        const { createDt } = params.row.auditInfo
        return (
          <MITableCell
            value={dayjs(createDt).format('YYYY-MM-DD')}
            typography={{
              color: 'gray.60',
            }}
          />
        )
      },
    },
    {
      field: 'createUserNm',
      headerName: '등록자',
      minWidth: 130,
      flex: 0.5,
      align: 'left',
      renderCell(params) {
        const { createUserNm, createUserDeptNm, createUserCpnyNm } = params.row.auditInfo
        return <MITableCell value={createUserNm} tooltip tooltipContent={`${createUserNm} / ${createUserDeptNm} / ${createUserCpnyNm}`} />
      },
    },
    {
      field: 'modifyDt',
      headerName: '수정일',
      minWidth: 130,
      flex: 0.5,
      align: 'center',
      renderCell(params) {
        const { modifyDt } = params.row.auditInfo
        return (
          <MITableCell
            value={dayjs(modifyDt).format('YYYY-MM-DD')}
            typography={{
              color: 'gray.60',
            }}
          />
        )
      },
    },
    {
      field: 'modifyUserNm',
      headerName: '수정자',
      minWidth: 130,
      flex: 0.5,
      align: 'left',
      renderCell(params) {
        const { modifyUserNm, modifyUserDeptNm, modifyUserCpnyNm } = params.row.auditInfo
        return <MITableCell value={modifyUserNm} tooltip tooltipContent={`${modifyUserNm} / ${modifyUserDeptNm} / ${modifyUserCpnyNm}`} />
      },
    },
    {
      field: 'reissue',
      headerName: '재발행',
      minWidth: 100,
      flex: 0.5,
      align: 'center',
      renderCell(params) {
        return (
          <MITableCell>
            <MIButton
              width={'100%'}
              size="h28"
              color="primary"
              type="outlined"
              onClick={(e) => {
                e.stopPropagation()
                setClientAccessRegNo(params.row.clientAccessRegNo)
                setIsReissueModalOpen(true)
              }}
            >
              <Typography variant="body3SB12" color="gray.70">
                {t('재발행')}
              </Typography>
            </MIButton>
          </MITableCell>
        )
      },
    },
    {
      field: 'delete',
      headerName: '',
      maxWidth: 50,
      flex: 1,
      align: 'center',
      renderCell(params) {
        return (
          <MITableCell>
            <DeleteIcon
              sx={{ color: 'gray.60', cursor: 'pointer' }}
              fontSize="small"
              onClick={(e) => {
                e.stopPropagation()
                setClientAccessRegNo(params.row.clientAccessRegNo)
                setIsDeleteModalOpen(true)
              }}
            />
          </MITableCell>
        )
      },
    },
  ]

  // 재발행
  const handleReIssueApiKey = async () => {
    try {
      if (!clientAccessRegNo) {
        throw new Error('clientAccessRegNo is required')
      }
      const response = await systemService.reissueClientSecretKey(clientAccessRegNo)
      setIsReissueModalOpen(false)
      setClientAccessRegNo(null)
      if (response.status) {
        showSnackbar(t('재발행되었습니다.'), { variant: 'success' })
        await refetch()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Client Secret 복사
  const handleCopyClientSecret = () => {
    if (decodedSecretKey) {
      navigator.clipboard.writeText(decodedSecretKey)
      showSnackbar(t('복사되었습니다.'), { variant: 'success' })
    }
  }

  // Key 생성
  const handleCreateApiKey = async () => {
    try {
      const response = await systemService.createClientAccess({
        customerCompanyNo: Number(selectedCompany),
        clientCertId: clientId,
      })
      if (response.status) {
        showSnackbar(t('생성되었습니다.'), { variant: 'success' })
        setIsCreateModalOpen(false)
        setSelectedCompany('')
        setClientId('')
        setIsError(false)
        await refetch()
      } else {
        if (response.code === 'RSC-003') {
          setIsError(true)
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  // API Key 삭제
  const handleDeleteApiKey = async () => {
    try {
      const response = await systemService.deleteClientAccess(Number(clientAccessRegNo))
      if (response.status) {
        showSnackbar(t('삭제되었습니다.'), { variant: 'success' })
        setIsDeleteModalOpen(false)
        setClientAccessRegNo(null)
        await refetch()
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    setCustomComponent(<AdminApiPageHeader onCreateClick={() => setIsCreateModalOpen(true)} />)
    setCustomTitle(
      <Typography color="gray.90" variant="heading2">
        {t('API 관리')}
      </Typography>,
    )

    return () => {
      setCustomComponent(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, setCustomTitle])

  return (
    <Box px={3} py={2.5}>
      <AdminTable
        getRowId={(row) => row.clientCertId}
        columns={columns}
        data={apiKeyList}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
      />
      <MIConfirm
        open={isReissueModalOpen}
        title={t('API Key를 재발행 하시겠습니까?')}
        width={450}
        handleClose={() => setIsReissueModalOpen(false)}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsReissueModalOpen(false)
            },
          },
          {
            label: t('재발행'),
            variant: 'filled',
            color: 'primary',
            onClick: () => handleReIssueApiKey(),
          },
        ]}
      ></MIConfirm>
      <MIConfirm
        open={viewSecretModal}
        title={t('Client Secret 보기')}
        width={450}
        handleClose={() => setViewSecretModal(false)}
        actions={[
          {
            label: t('Key 복사'),
            variant: 'filled',
            color: 'primary',
            onClick: () => handleCopyClientSecret(),
          },
        ]}
      >
        <Typography variant="body1R16" color="gray.60" sx={{ mb: 3, display: 'block' }} fontSize="14px">
          {t('안전한 사용을 위해 공개된 곳에 공유하거나 삽입하지 마세요.')}
        </Typography>
        <MIField>
          <MIInput
            value={decodedSecretKey}
            readOnly
            size="h34"
            sx={{
              background: '#F1F3F5',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#343A40',
              width: '100%',
              mb: 2,
            }}
          />
        </MIField>
      </MIConfirm>
      <MIConfirm
        open={isCreateModalOpen}
        title={t('API Key 생성')}
        width={450}
        handleClose={() => setIsCreateModalOpen(false)}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsCreateModalOpen(false)
            },
          },
          {
            label: t('생성'),
            variant: 'filled',
            color: 'primary',
            onClick: () => handleCreateApiKey(),
          },
        ]}
      >
        <Box sx={{ width: '100%', mt: 2 }}>
          <MIField label={t('고객사 선택')} required labelSize="sm"></MIField>
          <MISelect
            fullWidth
            value={selectedCompany}
            options={companyOptions}
            onChange={(e) => setSelectedCompany(e.target.value as string)}
            useAllOption={false}
          />
          <Box mt={5}>
            <MIField
              label="Client ID"
              required
              labelSize="sm"
              subText={t('영문 대소문자 및 "-"만 입력 가능합니다. 동일한 고객사에 API Key를 추가하는 경우 ID를 다르게 입력해 주세요.')}
            >
              <MIInput
                size="h34"
                placeholder={t('입력하세요')}
                value={clientId}
                onChange={(e) => setClientId(e.target.value as string)}
                error={isError}
                errorMessage={isError ? t('중복되는 Client ID 입니다.') : ''}
              />
            </MIField>
          </Box>
        </Box>
      </MIConfirm>
      <MIConfirm
        open={isDeleteModalOpen}
        title={t('API Key를 삭제하시겠습니까?')}
        width={450}
        handleClose={() => setIsDeleteModalOpen(false)}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => setIsDeleteModalOpen(false),
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: 'primary',
            onClick: () => handleDeleteApiKey(),
          },
        ]}
      >
        <Typography variant="body1R16" color="gray.60" sx={{ mb: 3, display: 'block' }} fontSize="14px">
          {t('API Key는 삭제 후 되돌릴 수 없습니다.')}
        </Typography>
      </MIConfirm>
    </Box>
  )
}

export default AdminApiPage
