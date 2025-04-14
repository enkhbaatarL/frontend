import ThemeAlert from './ThemeAlert.ts'
import ThemeBreadcrumbs from './ThemeBreadcrumbs.ts'
import ThemeButton from './ThemeButton.ts'
import ThemeCheckbox from './ThemeCheckbox.ts'
import ThemeDialog from './ThemeDialog.ts'
import ThemeFormControlLabel from './ThemeFormControlLabel.ts'
import ThemeIconButton from './ThemeIconButton.ts'
import ThemePagination from './ThemePagination.ts'
import ThemeRadio from './ThemeRadio.ts'
import ThemeSelect from './ThemeSelect.ts'
import ThemeSkeleton from './ThemeSkeleton.ts'
import ThemeSwitch from './ThemeSwitch.ts'
import ThemeTextField from './ThemeTextField.ts'
import ThemeTooltip from './ThemeTooltip.ts'

const components = {
  MuiAlert: ThemeAlert.MuiAlert,
  MuiAlertTitle: ThemeAlert.MuiAlertTitle,
  MuiButton: ThemeButton,
  MuiSelect: ThemeSelect.MuiSelect,
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
  MuiSkeleton: ThemeSkeleton,
  MuiBreadcrumbs: ThemeBreadcrumbs,
  MuiTooltip: ThemeTooltip,
  MuiIconButton: ThemeIconButton,
  MuiPagination: ThemePagination,
  MuiSwitch: ThemeSwitch,
  MuiCheckbox: ThemeCheckbox,
}

export default components
