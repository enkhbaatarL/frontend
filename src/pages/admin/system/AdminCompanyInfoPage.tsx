import { ArrowForward } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'

import logoImg from '@/assets/logo.svg'
import AdminUpload from '@/components/admin/AdminUpload'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import TrashIcon from '@/components/common/icons/TrashIcon'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService, { ICompanyLogoInfo } from '@/service/admin/companies'
import useAuthStore from '@/store/useAuthStore'

interface LogoPreviewProps {
  title: string
  imageUrl?: string
  alt: string
  emptyText?: string
  onDelete?: () => void
  isDeleteDisabled?: boolean
}

interface AdminCompanyInfoPageProps {
  customerCompanyNo?: number
  useCurrentCompanyLogoApi?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const LogoPreview = ({ title, imageUrl, alt, emptyText, onDelete, isDeleteDisabled }: LogoPreviewProps) => (
  <Stack gap="8px" minWidth={0}>
    <Stack alignItems="center" direction="row" justifyContent="space-between" minHeight="28px">
      <Typography color="gray.90" component="h3" variant="subtitle">
        {title}
      </Typography>
      {onDelete && (
        <MIBaseButton
          aria-label={t('선택한 로고 삭제')}
          disabled={isDeleteDisabled}
          disableRipple
          variant="text"
          onClick={onDelete}
          sx={{
            width: '18px',
            height: '18px',
            padding: '2px',
            borderRadius: '4px',
            color: 'contentIcon.Enabled',
            '&:hover:not(:disabled)': {
              backgroundColor: 'transparent',
              color: 'point.red1',
            },
          }}
        >
          <TrashIcon height="14px" width="14px" />
        </MIBaseButton>
      )}
    </Stack>
    <Stack
      alignItems="center"
      border="1px solid"
      borderColor="gray.30"
      borderRadius="8px"
      boxSizing="border-box"
      height="80px"
      justifyContent="center"
      padding="24px"
    >
      {imageUrl ? (
        <img alt={alt} src={imageUrl} style={{ width: '201px', maxWidth: '100%', height: '30px', objectFit: 'contain' }} />
      ) : (
        <Typography color="gray.50" textAlign="center" variant="body3R12">
          {emptyText}
        </Typography>
      )}
    </Stack>
  </Stack>
)

const AdminCompanyInfoPage = ({ customerCompanyNo, useCurrentCompanyLogoApi = false, isOpen, onClose }: AdminCompanyInfoPageProps) => {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const accessCompanyInfo = useAuthStore((state) => state.accessCompanyInfo)
  const setAccessCompanyInfo = useAuthStore((state) => state.setAccessCompanyInfo)

  const updateSessionLogo = useCallback(
    (companyLogo: ICompanyLogoInfo) => {
      if (accessCompanyInfo?.customerCompanyNo !== companyLogo.customerCompanyNo) return

      setAccessCompanyInfo({ ...accessCompanyInfo, logoUrl: companyLogo.logoUrl })
    },
    [accessCompanyInfo, setAccessCompanyInfo],
  )

  const { data: companyLogo } = useQuery({
    queryKey: ['company-logo', useCurrentCompanyLogoApi ? 'me' : customerCompanyNo],
    queryFn: () =>
      useCurrentCompanyLogoApi ? companiesService.getMyCompanyLogo() : companiesService.getCompanyLogo(customerCompanyNo ?? 0),
    refetchOnWindowFocus: false,
  })

  const { mutate: uploadCompanyLogo, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return useCurrentCompanyLogoApi
        ? companiesService.updateMyCompanyLogo(formData)
        : companiesService.updateCompanyLogo(formData, customerCompanyNo ?? 0)
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ICompanyLogoInfo>(['company-logo', useCurrentCompanyLogoApi ? 'me' : customerCompanyNo], data)
      updateSessionLogo(data)
      setLogoFile(null)
      showSnackbar(t('로고가 저장되었습니다.'), { variant: 'success' })
    },
    onError: () => {
      setLogoFile(null)
      showSnackbar(t('로고 저장에 실패했습니다.'), { variant: 'error' })
    },
  })

  const { mutate: deleteCompanyLogo, isPending: isDeleting } = useMutation({
    mutationFn: () =>
      useCurrentCompanyLogoApi ? companiesService.deleteMyCompanyLogo() : companiesService.deleteCompanyLogo(customerCompanyNo ?? 0),
    onSuccess: (data) => {
      queryClient.setQueryData<ICompanyLogoInfo>(['company-logo', useCurrentCompanyLogoApi ? 'me' : customerCompanyNo], data)
      updateSessionLogo(data)
      setIsDeleteConfirmOpen(false)
      showSnackbar(t('기본 로고가 적용되었습니다.'), { variant: 'success' })
    },
    onError: () => showSnackbar(t('로고 삭제에 실패했습니다.'), { variant: 'error' }),
  })

  useEffect(() => {
    if (!logoFile) {
      setUploadedLogoUrl(null)
      return undefined
    }

    const logoUrl = URL.createObjectURL(logoFile)

    setUploadedLogoUrl(logoUrl)

    return () => URL.revokeObjectURL(logoUrl)
  }, [logoFile])

  const handleLogoUpload = (file: File) => {
    setLogoFile(file)
    uploadCompanyLogo(file)
  }

  const handleLogoDelete = () => {
    deleteCompanyLogo()
  }

  const logoManagementContent = (
    <Stack gap="24px">
      {isOpen !== undefined && (
        <Typography color="gray.60" variant="subtext2">
          {t('회사 브랜드를 반영할 수 있도록 서비스에 표시되는 로고를 관리합니다.')}
        </Typography>
      )}
      <Stack gap="8px">
        <Typography color="gray.90" component="h2" variant="subtitle">
          {t('로고 이미지')}
        </Typography>
        <AdminUpload
          acceptedTypes={['image/jpg', 'image/jpeg', 'image/png']}
          disabled={isUploading}
          draggable
          guideText={t('JPG, PNG · 최대 3MB · 권장 높이 30px')}
          maxSize={3}
          minWidth={1}
          onUploadAction={handleLogoUpload}
        />
      </Stack>

      <Box display="grid" gap="12px" gridTemplateColumns="minmax(0, 1fr) auto minmax(0, 1fr)">
        <LogoPreview alt={t('서비스 기본 로고')} imageUrl={logoImg} title="Default" />
        <Stack alignItems="center" alignSelf="end" height="80px" justifyContent="center">
          <ArrowForward color="disabled" fontSize="small" />
        </Stack>
        <LogoPreview
          alt={logoFile?.name ?? t('변경 로고 미리보기')}
          emptyText={t('파일을 선택하면 미리보기가 표시됩니다.')}
          imageUrl={uploadedLogoUrl ?? companyLogo?.logoUrl ?? undefined}
          isDeleteDisabled={isUploading || isDeleting}
          onDelete={companyLogo?.logoUrl ? () => setIsDeleteConfirmOpen(true) : undefined}
          title="Preview"
        />
      </Box>
    </Stack>
  )

  return (
    <>
      {isOpen === undefined ? (
        <Box maxWidth="700px">
          <Stack gap="8px" marginBottom="24px">
            <Typography color="contentText.Black" component="h1" variant="contentTitle">
              {t('화이트라벨 설정')}
            </Typography>
            <Typography color="gray.60" variant="subtext2">
              {t('회사 브랜드를 반영할 수 있도록 서비스에 표시되는 로고를 관리합니다.')}
            </Typography>
          </Stack>
          {logoManagementContent}
        </Box>
      ) : (
        <MIConfirm
          contentSx={{ padding: '0 24px 40px' }}
          handleClose={onClose ?? (() => undefined)}
          hideFooter
          open={isOpen}
          title={t('화이트라벨 설정')}
          width="760px"
        >
          {logoManagementContent}
        </MIConfirm>
      )}
      <MIConfirm
        actions={[
          { label: t('취소'), variant: 'outlined', color: 'gray', onClick: () => setIsDeleteConfirmOpen(false) },
          { label: t('삭제'), variant: 'filled', color: 'red', disabled: isDeleting, onClick: handleLogoDelete },
        ]}
        handleClose={() => setIsDeleteConfirmOpen(false)}
        open={isDeleteConfirmOpen}
        title={t('선택한 로고를 삭제하시겠습니까?')}
      >
        {t('서비스에 기본 로고가 적용됩니다.')}
      </MIConfirm>
    </>
  )
}

export default AdminCompanyInfoPage
