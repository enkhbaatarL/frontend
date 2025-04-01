import ThemeAlert from './ThemeAlert.ts'
import ThemeButton from './ThemeButton.ts'
import ThemeDialog from './ThemeDialog.ts'
import ThemeFormControlLabel from './ThemeFormControlLabel.ts'
import ThemeRadio from './ThemeRadio.ts'
import ThemeSelect from './ThemeSelect.ts'
import ThemeSkeleton from './ThemeSkeleton.ts'

const components = {
  MuiAlert: ThemeAlert.MuiAlert,
  MuiAlertTitle: ThemeAlert.MuiAlertTitle,
  MuiButton: ThemeButton,
  MuiSelect: ThemeSelect,
  MuiDialog: ThemeDialog.MuiDialog,
  MuiDialogTitle: ThemeDialog.MuiDialogTitle,
  MuiDialogActions: ThemeDialog.MuiDialogActions,
  MuiDialogContent: ThemeDialog.MuiDialogContent,
  MuiDialogContentText: ThemeDialog.MuiDialogContentText,
  MuiRadio: ThemeRadio,
  MuiFormControlLabel: ThemeFormControlLabel,
  MuiSkeleton: ThemeSkeleton,
}

export default components
