import toast from "react-hot-toast";

export function toastSuccess(message: string) {
  return toast.success(message);
}

export function toastError(message: string) {
  return toast.error(message);
}

export function toastLoading(message: string) {
  return toast.loading(message);
}

export function dismissToast(id?: string) {
  toast.dismiss(id);
}
