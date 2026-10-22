import { CheckRounded, KeyboardArrowDownRounded, KeyboardArrowUpRounded } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import type { FundamentalModelCaseList } from '@/service/mi/fundamentalModel/case'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIMenu from '@/components/common/menu/MIMenu'
import { FUNDAMENTAL_UPLOAD_MAX_FILES } from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'

interface FundamentalModelInputSourceMenuProps {
  selected: string
  sources?: FundamentalModelCaseList
  disabled?: boolean
  loading?: boolean
  onSelected: (source: string) => void
}

const FundamentalModelInputSourceMenu = ({ selected, sources, disabled, loading, onSelected }: FundamentalModelInputSourceMenuProps) => {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const selectedCase = selected
    ? sources?.miBase?.caseId === Number(selected)
      ? sources.miBase
      : sources?.cases.find((item) => String(item.caseId) === selected)
    : undefined
  const cases = sources?.cases.filter((item) => item.caseId !== sources.miBase?.caseId) ?? []
  const bcBadge = (
    <Stack
      component="span"
      alignItems="center"
      justifyContent="center"
      height="21px"
      boxSizing="border-box"
      padding="2px 6px"
      borderRadius="8px"
      bgcolor="mari.Primary"
      flexShrink={0}
    >
      <Typography component="span" variant="body3SB12" color="commonColor.White">
        BC
      </Typography>
    </Stack>
  )

  useEffect(() => {
    if (!open) return undefined
    const frame = requestAnimationFrame(() => {
      const option =
        panelRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]') ??
        panelRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"]:not(:disabled)')
      option?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  const renderOption = (value: string, label: string, suffix?: ReactNode, description?: string) => (
    <MIBaseButton
      key={value}
      variant="text"
      role="menuitemradio"
      aria-checked={selected === value}
      aria-haspopup={undefined}
      disabled={disabled}
      disableRipple
      labelTextAlign="left"
      prefix={
        <CheckRounded
          fontSize="small"
          sx={{ color: 'mari.Primary', flexShrink: 0, visibility: selected === value ? 'visible' : 'hidden' }}
        />
      }
      suffix={suffix}
      buttonHoverBgColor={selected === value ? 'contentBG.PrimaryFade' : 'contentBG.Active'}
      onClick={() => {
        onSelected(value)
        setOpen(false)
      }}
      sx={{
        width: '100%',
        height: description ? '53px' : '36px',
        padding: '8px 12px 8px 6px',
        bgcolor: selected === value ? 'contentBG.PrimaryFade' : undefined,
      }}
    >
      <Stack component="span" width="100%" minWidth={0} gap="1px" textAlign="left">
        <Typography component="span" variant="body2M14" color={selected === value ? 'commonColor.Black' : 'contentText.Normal'} noWrap>
          {label}
        </Typography>
        {description && (
          <Typography component="span" variant="body3R12" color="gray.60" noWrap>
            {description}
          </Typography>
        )}
      </Stack>
    </MIBaseButton>
  )

  return (
    <MIMenu
      id="fundamental-model-input-source"
      aria-label="입력값 출처"
      variant="outlined"
      color="secondary"
      buttonHoverBgColor="commonColor.White"
      label={
        selectedCase && selectedCase.caseId === sources?.miBase?.caseId ? (
          <Typography component="span" variant="body2M14" color="contentText.Normal" noWrap>
            플랫폼 MI Base{' '}
            <Typography component="span" variant="inherit" color="gray.60">
              ({selectedCase.title})
            </Typography>
          </Typography>
        ) : selected === 'EXCEL_UPLOAD' ? (
          '엑셀 파일 업로드'
        ) : (
          (selectedCase?.title ?? '-')
        )
      }
      labelColor={!selected ? 'contentText.Placeholder' : undefined}
      labelTextAlign="left"
      suffix={
        open ? (
          <KeyboardArrowUpRounded sx={{ color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled' }} />
        ) : (
          <KeyboardArrowDownRounded sx={{ color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled' }} />
        )
      }
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          setOpen(true)
        }
      }}
      zIndex={1400}
      sx={{ width: '400px', height: '36px', borderRadius: '8px' }}
    >
      <ScrollWrapper maxHeight="min(450px, calc(100dvh - 120px))" thumbInsetTop={12} thumbInsetBottom={12} scrollbarGap={6}>
        <Stack
          ref={panelRef}
          role="menu"
          aria-label="입력값 출처 목록"
          gap="19px"
          padding="12px"
          onKeyDown={(event) => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
            const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]:not(:disabled)'))
            if (!options.length) return
            event.preventDefault()
            const index = options.indexOf(document.activeElement as HTMLButtonElement)
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? options.length - 1
                  : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
            options[next]?.focus()
          }}
        >
          <Stack gap="4px">
            <Typography variant="body3SB12" color="commonColor.Primary" letterSpacing="0.3px">
              MI Base
            </Typography>
            {sources?.miBase
              ? renderOption(String(sources.miBase.caseId), sources.miBase.title, bcBadge)
              : (loading || sources) && (
                <Typography variant="body3R12" color="contentText.Subtext" padding="8px 12px 8px 34px">
                  {loading ? '불러오는 중...' : '등록된 MI Base가 없습니다.'}
                </Typography>
              )}
          </Stack>
          <Stack gap="4px">
            <Typography variant="body3SB12" color="commonColor.Primary" letterSpacing="0.3px">
              과거 실행건
            </Typography>
            {cases.map((item) => renderOption(String(item.caseId), item.title))}
            {!cases.length && (loading || sources) && (
              <Typography variant="body3R12" color="contentText.Subtext" padding="8px 12px 8px 34px">
                {loading ? '불러오는 중...' : '등록된 실행건이 없습니다.'}
              </Typography>
            )}
          </Stack>
          <Stack gap="4px">
            <Typography variant="body3SB12" color="commonColor.Primary" letterSpacing="0.3px">
              파일 업로드
            </Typography>
            {renderOption('EXCEL_UPLOAD', '엑셀 파일 업로드', undefined, `.xlsx / .xlsm 파일 ${FUNDAMENTAL_UPLOAD_MAX_FILES}개 업로드`)}
          </Stack>
        </Stack>
      </ScrollWrapper>
    </MIMenu>
  )
}

export default FundamentalModelInputSourceMenu
