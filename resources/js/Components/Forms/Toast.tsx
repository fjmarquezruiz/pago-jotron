// Toast.tsx
import React, { useEffect, useState } from "react";
import { Transition } from "@headlessui/react"; // Import Transition component from @headlessui/react

// Interface defining the props for the Toast component
interface ToastProps {
    message: string; // The message to display in the toast
    type?: "success" | "error" | "warning" | "info"; // Type of the toast (default: "info")
    duration?: number; // Duration in milliseconds for which the toast should be visible (default: 3000ms)
    onClose: () => void; // Callback function to close the toast
}

/**
 * Toast Component
 * This component displays a toast notification with a message and automatically closes after a specified duration.
 */
const Toast = ({
    message,
    type = "info",
    duration = 3000,
    onClose,
}: ToastProps) => {
    // State to manage the visibility of the toast
    const [isVisible, setIsVisible] = useState(true);

    // useEffect to handle the automatic closing of the toast after the specified duration
    useEffect(() => {
        // Set a timer to close the toast after the specified duration
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        // Cleanup function to clear the timer if the component unmounts before the timer completes
        return () => clearTimeout(timer); // Cleanup timer on unmount
    }, [duration]);

    // Effect to trigger the onClose callback when the toast becomes invisible
    useEffect(() => {
        if (!isVisible) {
            onClose();
        }
    }, [isVisible, onClose]);

    // Determine the background and text color based on the type
    const typeClasses = {
        success:
            "bg-emerald-400 text-gray-900 dark:bg-emerald-700 dark:text-gray-50",
        error: "bg-red-400 text-gray-900 dark:bg-red-700 dark:text-gray-50",
        warning:
            "bg-yellow-400 text-gray-900 dark:bg-yellow-700 dark:text-gray-50",
        info: "bg-blue-400 text-gray-900 dark:bg-blue-700 dark:text-gray-50",
    };

    // Combine default classes with type-specific classes
    const combinedClasses = `fixed top-4 right-4 py-4 px-6 rounded shadow-lg transition-transform transform-gpu duration-300 ease-in-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
    } ${typeClasses[type]}`;

    // Render the toast notification
    return (
        <Transition
            show={isVisible}
            enter="transform transition-transform duration-300 ease-out"
            enterFrom="translate-x-4 opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transform transition-transform duration-300 ease-in"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="translate-x-4 opacity-0"
        >
            <div
                className={combinedClasses}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
            >
                {message}
            </div>
        </Transition>
    );
};

export default Toast;
