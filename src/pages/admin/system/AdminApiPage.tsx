import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useState } from 'react'

// import AdminConfirm from '@/components/admin/AdminConfirm'
// import ApiKeyCreateModal from '@/components/admin/ApiKeyCreateModal'
import AdminTable from '@/components/admin/AdminTable'
import MIButton from '@/components/common/button/MIButton'
import MIChip from '@/components/common/chip/MIChip'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
// import MITableLayout from '@/components/common/table/MITableLayout'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
// import useAdminSnackbar from '@/hooks/useAdminSnackbar'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import systemService, { IApiKeyInfo } from '@/service/admin/system'
import { IPaginationRequest, IPaginationResponse } from '@/types/api'

// Header component with Create Key button
const AdminApiPageHeader = ({ onCreateClick }: { onCreateClick: () => void }) => (
  <Flex gap={4}>
    <MIButton onClick={onCreateClick}>{t('Key 생성')}</MIButton>
  </Flex>
)

// Main component
const AdminApiPage = () => {
  const { setCustomComponent, setCustomTitle } = useAdminHeader()
  const { showSnackbar } = useSnackbar()
  // const { showSnackbar } = useAdminSnackbar()
  const [_isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isReissueModalOpen, setIsReissueModalOpen] = useState(false)
  const [_isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [clientAccessRegNo, setClientAccessRegNo] = useState<number | null>(null)
  const [decodedSecretKey, setDecodedSecretKey] = useState<string | null>(null)
  // State for view secret modal
  const [viewSecretModal, setViewSecretModal] = useState(false)

  // Function to copy client secret to clipboard
  // const handleCopyClientSecret = useCallback(
  //   (secret: string) => {
  //     showSnackbar('Client Secret가 복사되었습니다.', { variant: 'success' })
  //     setViewSecretModal({ open: false, secret })
  //   },
  //   [showSnackbar],
  // )

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

  const columns: GridColDef[] = [
    {
      field: 'customerCompanyNm',
      headerName: '회사명',
      width: 100,
      align: 'left',
      renderCell(params) {
        return <MITableCell value={params.value} typography={{ variant: 'tableBody1' }} />
      },
    },
    {
      field: 'isOwnerCompany',
      headerName: '구분',
      width: 80,
      align: 'center',
      renderCell(params) {
        return (
          <MITableCell>
            <MIChip label={params.value ? '관리자사' : '고객사'} color={params.value ? 'blue' : 'orange'} size="h20" />
          </MITableCell>
        )
      },
    },
    {
      field: 'clientCertId',
      headerName: 'Client ID',
      width: 150,
      align: 'left',
      renderCell(params) {
        return <MITableCell value={params.value} />
      },
    },
    {
      field: 'clientSecretKey',
      headerName: 'Client Secret',
      flex: 1,
      width: 150,
      align: 'left',
      renderCell(params) {
        const maskedValue = params.value ? '*'.repeat(params.value.length) : '********'
        return <MITableCell value={maskedValue} />
      },
    },
    {
      field: 'viewSecret',
      headerName: 'Client Secret 보기',
      width: 150,
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
      minWidth: 94,
      flex: 0.5,
      align: 'center',
      renderCell(params) {
        const { createUserNm, createUserDeptNm, createUserCpnyNm, createDt } = params.row.auditInfo
        return (
          <MITableCell
            tooltipContent={`${createUserNm} / ${createUserDeptNm} / ${createUserCpnyNm}`}
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
      minWidth: 94,
      flex: 0.5,
      align: 'left',
      renderCell(params) {
        const { createUserNm } = params.row.auditInfo
        return <MITableCell>{createUserNm}</MITableCell>
      },
    },
    {
      field: 'modifyDt',
      headerName: '수정일',
      minWidth: 94,
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
      minWidth: 94,
      flex: 0.5,
      align: 'left',
      renderCell(params) {
        const { createUserNm, createUserDeptNm, createUserCpnyNm, modifyUserNm } = params.row.auditInfo
        return <MITableCell value={modifyUserNm} tooltip tooltipContent={`${createUserNm} / ${createUserDeptNm} / ${createUserCpnyNm}`} />
      },
    },
    {
      field: 'reissue',
      headerName: '재발행',
      width: 94,
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
      width: 50,
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

  // Handle API key creation
  // const handleCreateApiKey = (_clientId: string, companySelection: string) => {
  //   createApiKey({
  //     companyName: companySelection,
  //     category: '고객사',
  //     registrant: 'Admin User',
  //     modifier: 'Admin User',
  //   })
  //   // showSnackbar('API Key가 생성되었습니다.', { variant: 'success' })
  // }

  // Handle API key deletion
  // const handleDeleteApiKey = () => {
  //   if (selectedKeyId) {
  //     setIsDeleteModalOpen(false)
  //   }
  // }

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

      {/* Create API Key Modal */}
      {/* <ApiKeyCreateModal
        open={isCreateModalOpen}
        handleClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateApiKey}
        existingClientIds={data.map((item) => item.clientId)}
      /> */}

      {/* Delete API Key Modal */}
      {/* <AdminConfirm
        open={isDeleteModalOpen}
        title={
          <Box display={'flex'} alignItems={'center'}>
            <Box component="span" sx={{ color: 'error.main', marginRight: '12px', display: 'inline-flex', alignItems: 'center' }}>
              <ErrorIcon color="error" fontSize="medium" />
            </Box>
            API Key를 삭제하시겠습니까?
          </Box>
        }
        width={450}
        handleClose={() => setIsDeleteModalOpen(false)}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => setIsDeleteModalOpen(false),
          },
          {
            label: '삭제',
            variant: 'filled',
            color: 'red',
            onClick: handleDeleteApiKey,
          },
        ]}
      >
        API Key는 삭제 후 되돌릴 수 없습니다.
      </AdminConfirm> */}
      {/* View Client Secret Modal */}
      {/* <AdminConfirm
        open={viewSecretModal.open}
        title="Client Secret 보기"
        width={480}
        handleClose={() => setViewSecretModal({ open: false, secret: '' })}
        actions={[
          {
            label: 'Key 복사',
            variant: 'filled',
            color: 'primary',
            onClick: () => handleCopyClientSecret(viewSecretModal.secret),
          },
        ]}
      >
        <Box>
          <Typography variant="body1R16" color="gray.60" sx={{ mb: 3, display: 'block' }}>
            안전한 사용을 위해 공개된 곳에 공유하거나 삽입하지 마세요.
          </Typography>
          <MIField>
            <MIInput
              value={viewSecretModal.secret}
              readOnly
              size="h34"
              sx={{
                background: '#F1F3F5',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#343A40',
                width: '100%',
                mb: 2,
              }}
            />
          </MIField>
        </Box>
      </AdminConfirm> */}
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
    </Box>
  )
}

export default AdminApiPage
