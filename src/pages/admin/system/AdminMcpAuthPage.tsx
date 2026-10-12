import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'

import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable'
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
import systemService, { IMcpAuthInfo, IMcpAuthIssue } from '@/service/admin/system'
import { IPaginationRequest, IPaginationResponse } from '@/types/api'

const AdminMcpAuthPageHeader = ({ onCreateClick }: { onCreateClick: () => void }) => (
  <Flex gap={4}>
    <MIButton onClick={onCreateClick}>{t('Key 생성')}</MIButton>
  </Flex>
)

// [MCP 인증] 시스템 관리 > MCP API 인증관리. AdminApiPage 구성을 따르며 차이는 다음과 같다.
// - Secret 은 단방향 저장이라 다시 볼 수 없음 → "Secret 보기" 없음, 발급·재발행 직후 1회만 표시(복사 버튼)
// - ID 형식 검사(영문·숫자·"-", 50자)와 입력 중 중복 확인
const AdminMcpAuthPage = () => {
  const { setCustomComponent, setCustomTitle } = useAdminHeader()
  const { showSnackbar } = useSnackbar()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isReissueModalOpen, setIsReissueModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [mcpAuthRegNo, setMcpAuthRegNo] = useState<number | null>(null)
  const [issuedAuth, setIssuedAuth] = useState<IMcpAuthIssue | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string>('')

  const [companyType, setCompanyType] = useState<'customer' | 'manager'>('customer')
  const [mcpAuthId, setMcpAuthId] = useState<string>('')
  const [isDuplicated, setIsDuplicated] = useState<boolean>(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false)

  // MCP 인증 키 목록 조회
  const {
    pagination,
    updateSize,
    updatePage,
    data: mcpAuthList,
    refetch,
    isLoading,
  } = useSearchFilter<IPaginationRequest, IPaginationResponse<IMcpAuthInfo>>((params) => systemService.getMcpAuthList(params), {
    page: 1,
    size: 20,
  })

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
      field: 'isOwnerCompany',
      headerName: t('구분'),
      maxWidth: 80,
      align: 'center',
      renderCell: (param) => {
        const color = param.value ? 'blue' : 'orange'
        const label = param.value ? t('관리회사') : t('고객사')
        return (
          <AdminTableCell type="chip" chip={{ color }}>
            {label}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'mcpAuthId',
      headerName: 'ID',
      flex: 1,
      minWidth: 150,
      align: 'left',
      renderCell(params) {
        return <MITableCell value={params.value} />
      },
    },
    {
      field: 'secretPrefix',
      headerName: 'Secret',
      flex: 1,
      width: 120,
      maxWidth: 200,
      align: 'left',
      renderCell(params) {
        return (
          <MITableCell value={`${params.value}${'*'.repeat(8)}`} tooltip tooltipContent={t('Secret은 발급 시에만 확인할 수 있습니다.')} />
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
                setMcpAuthRegNo(params.row.mcpAuthRegNo)
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
                setMcpAuthRegNo(params.row.mcpAuthRegNo)
                setIsDeleteModalOpen(true)
              }}
            />
          </MITableCell>
        )
      },
    },
  ]

  // 재발행 — 새 Secret 은 이 응답에서만 받을 수 있으므로 바로 보여줌
  const handleReissueSecret = async () => {
    try {
      if (!mcpAuthRegNo) {
        throw new Error('mcpAuthRegNo is required')
      }
      const response = await systemService.reissueMcpAuthSecret(mcpAuthRegNo)
      setIsReissueModalOpen(false)
      setMcpAuthRegNo(null)
      if (response.status) {
        setIssuedAuth(response.data)
        await refetch()
      }
    } catch {
      return
    }
  }

  // Secret 복사
  const handleCopySecret = () => {
    if (issuedAuth) {
      navigator.clipboard.writeText(issuedAuth.secret).then(() => {
        showSnackbar(t('복사되었습니다.'), { variant: 'success' })
      })
    }
  }

  // Key 생성 — 새 Secret 은 이 응답에서만 받을 수 있으므로 바로 보여줌
  const handleCreateMcpAuth = async () => {
    try {
      const response = await systemService.createMcpAuth({
        customerCompanyNo: Number(selectedCompany),
        mcpAuthId,
      })
      if (response.status) {
        setIsCreateModalOpen(false)
        setIssuedAuth(response.data)
        await refetch()
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.code === 'RSC-003') {
        setIsDuplicated(true)
      }
    }
  }

  // 컴페니 조회
  const { data: companyList = { customer: [], manager: [] } } = useQuery({
    queryKey: ['getCompanyList'],
    queryFn: async () => await companiesService.getCompanyList(),
    select: (res) =>
      res.reduce(
        (acc, cur) => {
          const key = cur.companyType.toLowerCase()
          acc[key] = cur.companies.map((c) => ({
            value: c.companyNo,
            label: c.companyNm,
          }))
          return acc
        },
        {} as Record<string, { value: number; label: string }[]>,
      ),
  })

  // MCP 인증 키 삭제
  const handleDeleteMcpAuth = async () => {
    try {
      const response = await systemService.deleteMcpAuth(Number(mcpAuthRegNo))
      if (response.status) {
        showSnackbar(t('삭제되었습니다.'), { variant: 'success' })
        setIsDeleteModalOpen(false)
        setMcpAuthRegNo(null)
        await refetch()
      }
    } catch {
      return
    }
  }

  useEffect(() => {
    setCustomComponent(<AdminMcpAuthPageHeader onCreateClick={() => setIsCreateModalOpen(true)} />)
    setCustomTitle(
      <Typography color="gray.90" variant="heading2">
        {t('MCP API 인증관리')}
      </Typography>,
    )

    return () => {
      setCustomComponent(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, setCustomTitle])

  // backend McpAuthInfoReq 의 입력 규칙과 같음
  const isIdFormatInvalid = mcpAuthId !== '' && (!/^[A-Za-z0-9-]+$/.test(mcpAuthId) || mcpAuthId.length > 50)

  // ID 중복 확인 — 입력이 멈추면 조회 (등록 시 서버에서도 다시 검사함)
  useEffect(() => {
    setIsDuplicated(false)
    if (mcpAuthId === '' || isIdFormatInvalid) {
      setIsCheckingDuplicate(false)
      return undefined
    }

    let ignore = false
    setIsCheckingDuplicate(true)
    const timer = setTimeout(async () => {
      try {
        const response = await systemService.existsMcpAuthId(mcpAuthId)
        if (!ignore && response.status) {
          setIsDuplicated(response.data.exists)
        }
      } catch {
        return
      } finally {
        if (!ignore) {
          setIsCheckingDuplicate(false)
        }
      }
    }, 300)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [mcpAuthId, isIdFormatInvalid])

  const idErrorMessage = useMemo(() => {
    if (isIdFormatInvalid) {
      return t('영문 대소문자, 숫자, "-"만 50자 이내로 입력 가능합니다.')
    }
    if (isDuplicated) {
      return t('이미 사용 중인 ID 입니다.')
    }
    return ''
  }, [isDuplicated, isIdFormatInvalid])

  const canCreate = selectedCompany !== '' && mcpAuthId !== '' && !isIdFormatInvalid && !isDuplicated && !isCheckingDuplicate

  const clearParamValues = useCallback(() => {
    setMcpAuthId('')
    setCompanyType('customer')
    setSelectedCompany('')
    setIsDuplicated(false)
  }, [])

  useEffect(() => clearParamValues(), [clearParamValues, isCreateModalOpen])
  return (
    <Box px={3} py={2.5}>
      <AdminTable
        getRowId={(row) => row.mcpAuthRegNo}
        columns={columns}
        data={mcpAuthList}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        isLoading={isLoading}
      />
      <MIConfirm
        open={isReissueModalOpen}
        title={t('Secret을 재발행 하시겠습니까?')}
        width={450}
        handleClose={() => setIsReissueModalOpen(false)}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => setIsReissueModalOpen(false),
          },
          {
            label: t('재발행'),
            variant: 'filled',
            color: 'primary',
            onClick: () => handleReissueSecret(),
          },
        ]}
      >
        <Typography variant="body1R16" color="gray.60" sx={{ mb: 3, display: 'block' }} fontSize="14px">
          {t('재발행하면 기존 Secret은 즉시 사용할 수 없습니다.')}
        </Typography>
      </MIConfirm>
      <MIConfirm
        open={issuedAuth !== null}
        title={t('Secret 발급 완료')}
        width={450}
        handleClose={() => setIssuedAuth(null)}
        actions={[
          {
            label: t('닫기'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => setIssuedAuth(null),
          },
          {
            label: t('Secret 복사'),
            variant: 'filled',
            color: 'primary',
            onClick: () => handleCopySecret(),
          },
        ]}
      >
        <Typography variant="body1R16" color="gray.60" sx={{ mb: 3, display: 'block' }} fontSize="14px">
          {t('창을 닫으면 Secret을 다시 확인할 수 없습니다. 지금 복사해 안전한 곳에 보관하세요.')}
        </Typography>
        <MIField label="ID" labelSize="sm">
          <MIInput value={issuedAuth?.mcpAuthInfo.mcpAuthId} readOnly size="h34" />
        </MIField>
        <Box mt={3}>
          <MIField label="Secret" labelSize="sm">
            <MIInput
              value={issuedAuth?.secret}
              readOnly
              multiline
              minRows={2}
              maxRows={2}
              size="h34"
              endIcon={
                <Tooltip title={t('Secret 복사')}>
                  <IconButton size="small" aria-label={t('Secret 복사')} onClick={handleCopySecret}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
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
        </Box>
      </MIConfirm>
      <MIConfirm
        open={isCreateModalOpen}
        title={t('MCP API 인증 Key 생성')}
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
            disabled: !canCreate,
            onClick: () => handleCreateMcpAuth(),
          },
        ]}
      >
        <Box sx={{ width: '100%', mt: 2 }}>
          <MIField label={t('구분')} required labelSize="sm" />
          <MISelect
            fullWidth
            value={companyType}
            options={[
              { label: '고객사', value: 'customer' },
              { label: '관리사', value: 'manager' },
            ]}
            placeholder="선택하세요. (고객사/관리사)"
            onChange={(e) => {
              setCompanyType(e.target.value as 'customer' | 'manager')
              setSelectedCompany('')
            }}
            useAllOption={false}
          />
          <Box sx={{ width: '100%', mt: 5 }}>
            <MIField label={t('회사 선택')} required labelSize="sm" />
            <MISelect
              fullWidth
              value={selectedCompany}
              options={companyList[companyType]}
              onChange={(e) => setSelectedCompany(e.target.value as string)}
              useAllOption={false}
            />
          </Box>
          <Box mt={5} mb={5}>
            <MIField
              label="ID"
              required
              labelSize="sm"
              subText={t('영문 대소문자, 숫자, "-"만 입력 가능합니다. 삭제된 ID는 다시 사용할 수 있습니다.')}
            >
              <MIInput
                size="h34"
                placeholder={t('입력하세요')}
                value={mcpAuthId}
                onChange={(e) => setMcpAuthId(e.target.value)}
                error={idErrorMessage !== ''}
                errorMessage={idErrorMessage}
              />
            </MIField>
          </Box>
        </Box>
      </MIConfirm>
      <MIConfirm
        open={isDeleteModalOpen}
        title={t('MCP API 인증 Key를 삭제하시겠습니까?')}
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
            onClick: () => handleDeleteMcpAuth(),
          },
        ]}
      >
        <Typography variant="body1R16" color="gray.60" sx={{ mb: 3, display: 'block' }} fontSize="14px">
          {t('삭제하면 이 Key로 MCP API를 호출할 수 없으며 되돌릴 수 없습니다.')}
        </Typography>
      </MIConfirm>
    </Box>
  )
}

export default AdminMcpAuthPage
