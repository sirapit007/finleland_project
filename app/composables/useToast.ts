type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    to: string;
  };
};

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export function useToast() {
  const toast = useState<Toast | null>("app-toast", () => null);

  function dismissToast() {
    toast.value = null;

    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
  }

  function showToast(
    message: string,
    type: ToastType = "success",
    duration = 3500,
    action?: Toast["action"],
  ) {
    toast.value = { id: Date.now(), message, type, action };

    if (!import.meta.client) {
      return;
    }

    if (dismissTimer) {
      clearTimeout(dismissTimer);
    }

    dismissTimer = setTimeout(dismissToast, duration);
  }

  return { dismissToast, showToast, toast };
}
