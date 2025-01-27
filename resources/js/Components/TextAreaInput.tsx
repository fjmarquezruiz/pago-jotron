import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";

export default forwardRef(function TextAreaInput(
    {
        className = "",
        isFocused = false,
        rows = 6,
        ...props
    }: InputHTMLAttributes<HTMLTextAreaElement> & {
        isFocused?: boolean;
        rows?: number;
    },
    ref,
) {
    const localRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <textarea
            {...props}
            className={
                "rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-600 dark:focus:ring-blue-600 " +
                className
            }
            rows={rows}
            ref={localRef}
        ></textarea>
    );
});
