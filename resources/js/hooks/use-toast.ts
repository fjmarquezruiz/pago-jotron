"use client";

import * as React from "react";
import { ToastActionTypes, TOAST_LIMIT, TOAST_REMOVE_DELAY } from "@/constants";
import { Toast, ToastAction, ToasterToast, ToastState } from "@/types/use-toast";

// Function to generate a unique ID for each toast
let count = 0;
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}


// Map to store timeouts for removing toasts
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// Function to add a toast to the removal queue
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: ToastActionTypes.REMOVE_TOAST, toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// Reducer function to handle state transitions based on actions
const reducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case ToastActionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case ToastActionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case ToastActionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    }

    case ToastActionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

// Listeners to update state across components
const listeners: Array<(state: ToastState) => void> = [];

// In-memory state to store current toasts
let memoryState: ToastState = { toasts: [] };

// Dispatch function to update the state and notify listeners
function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Function to create and manage a toast notification
function toast({ ...props }: Toast) {
  const id = genId();

  // Function to update an existing toast
  const update = (props: Partial<ToasterToast>) =>
    dispatch({ type: ToastActionTypes.UPDATE_TOAST, toast: { ...props, id } });

  // Function to dismiss a toast
  const dismiss = () => dispatch({ type: ToastActionTypes.DISMISS_TOAST, toastId: id });

  // Dispatch action to add a new toast
  dispatch({
    type: ToastActionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

// Custom hook to use toast state and functions
function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  // Add the current state setter to listeners
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: ToastActionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };