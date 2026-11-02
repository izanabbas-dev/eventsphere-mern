import Modal from "./Modal";
import Button from "./Button";

// "Are you sure?" popup before a risky action like delete
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  variant = "danger",
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}
