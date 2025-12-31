import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Box, Button, ClickAwayListener, Paper, Popper, Stack, Typography } from '@mui/material'
import { ReactNode, useState, useRef, useEffect } from 'react'

import AdminCheckbox from '@/components/admin/AdminCheckbox'
import theme from '@/theming'

export interface FilterOption {
  label: ReactNode
  value: string
  disabled?: boolean
}

interface MIFilterDropdownProps {
  label?: string
  options: FilterOption[]
  selectedValues: string[]
  onApply: (values: string[]) => void
  onClear?: () => void
  maxHeight?: number
  disabled?: boolean
}

const MIFilterDropdown = ({
  label = 'Filter',
  options,
  selectedValues,
  onApply,
  onClear,
  maxHeight = 300,
  disabled = false,
}: MIFilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [draftValues, setDraftValues] = useState<string[]>([])

  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      setDraftValues(selectedValues)
    }
  }, [isOpen, selectedValues])

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return
    setAnchorEl(event.currentTarget)
    setDraftValues(selectedValues)
    setIsOpen((prev) => !prev)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const toggleDraftValue = (value: string) => {
    setDraftValues((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const handleApply = () => {
    onApply(draftValues)
    handleClose()
  }

  const handleClear = () => {
    setDraftValues([])
    if (onClear) {
      onClear()
    }
  }

  return (
    <Box position="relative">
      <Button
        ref={buttonRef}
        variant="outlined"
        endIcon={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: theme.palette.content['backgroundHover'],
              },
            }}
          >
            <KeyboardArrowDownIcon
              sx={{
                color: isOpen ? '#343A40 !important' : '#868E96 !important',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out',
              }}
              fontSize="small"
            />
          </Box>
        }
        onClick={handleOpen}
        disabled={disabled}
        sx={{
          borderColor: isOpen ? '#868E96' : '#DEE2E6',
          color: '#495057',
          backgroundColor: isOpen ? '#E9ECEF' : '#FFFFFF',
          borderRadius: '10px',
          width: 105,
          height: 36,
          padding: '8px',
          fontSize: 14,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            borderColor: isOpen ? '#868E96' : '#DEE2E6',
            backgroundColor: isOpen ? '#E9ECEF' : '#FFFFFF',
            boxShadow: 'none',
          },
          '&:focus': {
            outline: 'none',
          },
          '&.Mui-disabled': {
            borderColor: '#DEE2E6',
            backgroundColor: '#F8F9FA',
            color: theme.palette.gray[50],
          },
        }}
      >
        {label}
      </Button>
      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 5],
            },
          },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={0}
            sx={{
              width: '224px !important',
              height: '250px !important',
              borderRadius: '10px',
              padding: '12px',
              boxShadow: '0px 0px 4px 0px #0000001A',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DEE2E6',
              boxSizing: 'border-box',
            }}
          >
            <Stack spacing="12px" sx={{ maxHeight, overflowY: 'auto', marginBottom: '12px' }}>
              {options.map((option) => {
                const checked = draftValues.includes(option.value)
                const isDisabled = option.disabled || disabled
                return (
                  <Box
                    key={option.value}
                    onClick={() => !isDisabled && toggleDraftValue(option.value)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '24px',
                      padding: '2px 4px',
                      boxSizing: 'border-box',
                      cursor: isDisabled ? 'default' : 'pointer',
                      ...(checked
                        ? {
                          ...theme.typography.body2M14,
                          color: theme.palette.gray[90],
                        }
                        : {
                          ...theme.typography.body2R14,
                          color: theme.palette.gray[70],
                        }),
                      ...(isDisabled && {
                        color: theme.palette.gray[50],
                        cursor: 'not-allowed',
                      }),
                      '&:hover': {
                        ...(isDisabled
                          ? {}
                          : {
                            ...theme.typography.body2M14,
                            color: theme.palette.gray[90],
                          }),
                      },
                    }}
                  >
                    <AdminCheckbox
                      checked={checked}
                      disabled={isDisabled}
                      sx={{
                        padding: 0,
                        marginRight: 1.5,
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        userSelect: 'none',
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        color: 'inherit',
                      }}
                    >
                      {option.label}
                    </Typography>
                  </Box>
                )
              })}
            </Stack>
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              gap="12px"
              borderTop="1px solid"
              borderColor="gray.30"
              pt="12px"
              pb="12px"
            >
              <Button
                variant="text"
                onClick={handleClear}
                disabled={draftValues.length === 0}
                sx={{
                  width: 67,
                  height: 34,
                  fontSize: 14,
                  fontWeight: 500,
                  color: draftValues.length === 0 ? theme.palette.gray[50] : theme.palette.gray[70],
                  textTransform: 'none',
                  padding: 0,
                  minWidth: 'auto',
                  border: draftValues.length === 0 ? 'none' : `1px solid ${theme.palette.primary.main}`,
                  borderRadius: '4px',
                  transition: 'none',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: theme.palette.gray[90],
                  },
                  '&.Mui-disabled': {
                    color: theme.palette.gray[50],
                    border: 'none',
                  },
                }}
              >
                Clear
              </Button>
              <Button
                variant={draftValues.length === 0 ? 'text' : 'contained'}
                onClick={handleApply}
                disabled={draftValues.length === 0}
                sx={{
                  width: 67,
                  height: 34,
                  fontSize: 14,
                  fontWeight: 500,
                  color: draftValues.length === 0 ? theme.palette.gray[50] : '#FFFFFF',
                  ...(draftValues.length === 0
                    ? {}
                    : {
                      backgroundColor: theme.palette.primary.main,
                      boxShadow: 'none',
                    }),
                  textTransform: 'none',
                  padding: 0,
                  borderRadius: '4px',
                  minWidth: 'auto',
                  border: 'none',
                  transition: 'none',
                  '&:hover': {
                    ...(draftValues.length === 0
                      ? {
                        backgroundColor: 'transparent',
                        color: theme.palette.gray[90],
                      }
                      : {
                        backgroundColor: theme.palette.primary.dark,
                        color: '#FFFFFF',
                        boxShadow: 'none',
                      }),
                  },
                  '&.Mui-disabled': {
                    color: theme.palette.gray[50],
                    border: 'none',
                  },
                }}
              >
                Apply
              </Button>
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  )
}

export default MIFilterDropdown
