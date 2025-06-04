import MIConfirm from '../confirm/MIConfirm'

import useDialog from '@/store/useDialog'

const GlobalDialog = () => {
  const { visible, dialog, onHide } = useDialog()

  if (!dialog) return null

  return (
    <MIConfirm
      open={visible}
      title={dialog.title}
      width={dialog.width}
      justifyContentAction={dialog.justifyContentAction}
      actions={dialog.actions}
      hideFooter={dialog.hideFooter}
      zIndex={dialog.zIndex}
      handleClose={onHide}
    >
      {dialog.children}
    </MIConfirm>
  )
}

export default GlobalDialog
