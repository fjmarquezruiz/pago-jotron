import { InputHTMLAttributes } from "react";

// Construct the className for the toggle switch thumb
const toggleThumbClassName = `absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition duration-200 ease-in-out transform `;

export default function Radio({
    className = "",
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="radio"
            className={
                "round-full border-gray-300 bg-white text-blue-500 checked:bg-blue-500 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 focus:ring-offset-1 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400 dark:checked:bg-blue-400" +
                className
            }
        />
    );
}
