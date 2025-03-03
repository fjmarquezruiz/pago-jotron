import { ToastActionTypes } from "@/constants";
import type { ToastActionElement, ToastProps } from "@/Components/ui/toast";

// Interface for a toast notification
export interface ToasterToast extends ToastProps {
    id: string;
    title?: string;
    description?: React.ReactNode;
    action?: ToastActionElement;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

// Interface for the state of the toast notifications
export interface ToastState {
    toasts: ToasterToast[];
  }


// Type definition for actions
export type ToastAction =
    | { type: ToastActionTypes.ADD_TOAST; toast: ToasterToast }
    | { type: ToastActionTypes.UPDATE_TOAST; toast: Partial<ToasterToast> }
    | { type: ToastActionTypes.DISMISS_TOAST; toastId?: string }
    | { type: ToastActionTypes.REMOVE_TOAST; toastId?: string };


// Type definition for a toast without the ID
export type Toast = Omit<ToasterToast, "id">;

