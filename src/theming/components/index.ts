import ThemeAlert from './ThemeAlert'
import ThemeBreadcrumbs from './ThemeBreadcrumbs'
import ThemeButton from './ThemeButton'
import ThemeCheckbox from './ThemeCheckbox'
import ThemeDialog from './ThemeDialog'
import ThemeFormControl from './ThemeFormControl'
import ThemeFormControlLabel from './ThemeFormControlLabel'
import ThemeIconButton from './ThemeIconButton'
import ThemeLinearProgress from './ThemeLinearProgress'
import ThemePagination from './ThemePagination'
import ThemeRadio from './ThemeRadio'
import ThemeSelect from './ThemeSelect'
import ThemeSkeleton from './ThemeSkeleton'
import ThemeSwitch from './ThemeSwitch'
import ThemeTextField from './ThemeTextField'
import ThemeTooltip from './ThemeTooltip'

const components = {
  MuiAlert: ThemeAlert.MuiAlert,
  MuiAlertTitle: ThemeAlert.MuiAlertTitle,
  MuiButton: ThemeButton,
  // MuiSelect: ThemeSelect.MuiSelect,
  MuiTextField: ThemeTextField,
  MuiList: ThemeSelect.MuiList,
  MuiMenuItem: ThemeSelect.MuiMenuItem,
  MuiDialog: ThemeDialog.MuiDialog,
  MuiDialogTitle: ThemeDialog.MuiDialogTitle,
  MuiDialogActions: ThemeDialog.MuiDialogActions,
  MuiDialogContent: ThemeDialog.MuiDialogContent,
  MuiDialogContentText: ThemeDialog.MuiDialogContentText,
  MuiRadio: ThemeRadio,
  MuiFormControlLabel: ThemeFormControlLabel,
  MuiFormControl: ThemeFormControl,
  MuiSkeleton: ThemeSkeleton,
  MuiBreadcrumbs: ThemeBreadcrumbs,
  MuiTooltip: ThemeTooltip,
  MuiIconButton: ThemeIconButton,
  MuiPagination: ThemePagination,
  MuiSwitch: ThemeSwitch,
  MuiCheckbox: ThemeCheckbox,
  MuiLinearProgress: ThemeLinearProgress,
}

export default components
