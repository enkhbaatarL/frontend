import { Components, Theme } from '@mui/material/styles'

const ThemeTextField: Components<Omit<Theme, 'components'>>['MuiTextField'] = {
  styleOverrides: {
    root: ({ theme, ownerState }) => ({
      backgroundColor: '#fff',
      minWidth: '200px',
      fontWeight: '400',
      lineHeight: 1.4,
      boxSizing: 'border-box',
      color: theme.palette.gray['90'],
      padding: 0,
      '& .MuiInputBase-root': {
        border: `1px solid ${theme.palette.content['borderEnabled']}`,
        borderRadius: 4,
        '.MuiInputAdornment-root': {
          width: 'auto',
          height: 'auto',
          marginLeft: 'auto',
          marginRight: '7px',
        },
        '.MuiTouchRipple-root': {
          display: 'none',
        },
        '&:hover': {
          borderColor: theme.palette.content['borderHover'],
          '.MuiAutocomplete-popupIndicator': {
            '.MuiBox-root': {
              backgroundColor: theme.palette.content['backgroundHover'],
            },
          },
          '.MuiInputAdornment-root': {
            '.MuiIconButton-edgeEnd': {
              backgroundColor: theme.palette.content['backgroundHover'],
              svg: {
                color: theme.palette.content['iconHover'],
                path: {
                  fill: theme.palette.content['iconHover'],
                },
              },
            },
          },
        },
        '&.Mui-focused': {
          borderColor: theme.palette.content['borderActivePrimary'],
          '.MuiInputAdornment-root': {
            '.MuiIconButton-edgeEnd': {
              backgroundColor: theme.palette.content['backgroundHover'],
              svg: {
                color: theme.palette.content['iconHover'],
                path: {
                  fill: theme.palette.content['iconHover'],
                },
              },
            },
          },
        },
        '&.Mui-disabled': {
          borderColor: theme.palette.content['borderDisabled'],
          backgroundColor: theme.palette.content['backgroundDisabled'],
          '& .MuiInputBase-input': {
            color: theme.palette.content['textDisabled'],
          },
          '.MuiInputAdornment-root': {
            '.MuiIconButton-edgeEnd': {
              backgroundColor: theme.palette.content['backgroundHover'],
              svg: {
                color: theme.palette.content['iconDisabled'],
                path: {
                  fill: theme.palette.content['iconDisabled'],
                },
              },
            },
          },
        },
        '&.Mui-readOnly': {
          borderColor: theme.palette.content['borderDisabled'],
          backgroundColor: theme.palette.content['backgroundDisabled'],
          '& .MuiInputBase-input': {
            color: theme.palette.gray['70'],
          },
          '.MuiInputAdornment-root': {
            '.MuiIconButton-edgeEnd': {
              backgroundColor: theme.palette.content['backgroundHover'],
              svg: {
                color: theme.palette.content['iconDisabled'],
                path: {
                  fill: theme.palette.content['iconDisabled'],
                },
              },
            },
          },
        },
        '&.MuiAutocomplete-inputRoot': {
          paddingRight: '32px !important',
          '.MuiAutocomplete-clearIndicator': {
            display: 'none',
          },
          '.MuiAutocomplete-endAdornment': {
            // position: 'unset',
            // marginRight: '12px'
          },
          '.MuiChip-root': {
            color: '#495057',
            fontSize: '14px',
            fontWeight: 400,
            backgroundColor: '#fff',
            borderColor: '#DEE2E6',
            lineHeight: 1.4,
            height: '28px',
            border: '1px solid #DEE2E6',
            margin: '1px',
            '.MuiSvgIcon-root': {
              width: '16px',
              height: '16px',
              color: '#ced4da',
            },
          },
          '.MuiInputBase-input': {
            minWidth: '100px',
            border: 0,
            outline: 'none !important',
          },
        },
      },
      '& .MuiInputBase-input': {
        fontWeight: '400',
        borderRadius: 4,
        color: theme.palette.gray['90'],
        border: 0,
        fontSize: (ownerState.size as 'small' | 'medium') === 'small' ? '12px' : '14px',
        padding: (ownerState.size as 'small' | 'medium') === 'small' ? '5px 12px' : '8px 12px',
      },
      '& .MuiInputBase-input[readonly]': {
        borderColor: theme.palette.content['borderDisabled'],
        backgroundColor: theme.palette.content['backgroundDisabled'],
      },

      '& .MuiInputBase-input.Mui-disabled': {
        // borderColor: '#E9ECEF',
        // backgroundColor: '#F1F3F5',
        color: theme.palette.gray['70'],
        WebkitTextFillColor: 'unset',
      },
      '&[aria-readonly="true"] .MuiInputBase-input': {
        //border: '1px solid #E9ECEF',
        //backgroundColor: '#F1F3F5',
      },
      '& .MuiInputBase-multiline': {
        padding: 0,
      },
    }),
  },
}

export default ThemeTextField
