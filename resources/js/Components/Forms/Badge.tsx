/**
 * Interface defining the props for the Badge component.
 */
interface BadgeProps {
    // The label text to be displayed inside the badge.
    label: string;
    /**
     * The status of the badge, which determines its color scheme.
     * Possible values are "success", "warning", "error", and "info".
     */
    status: "success" | "warning" | "error" | "info";
    /**
     * Optional additional class names to extend the default styles.
     */
    className?: string;
}

/**
 * Badge component to display status labels with appropriate styling.
 *
 * @param {BadgeProps} props - The props object containing label and status.
 * @returns {JSX.Element} - The rendered Badge component.
 */
const Badge = ({ label, status, className = "" }: BadgeProps) => {
    /**
     * Object mapping status values to corresponding CSS classes.
     */
    const statusClasses = {
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        error: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
    };

    // Combine default classes with any additional classes passed via props
    const combinedClasses = `inline-flex items-center px-2 py-0.5 ml-2 rounded-md text-xs uppercase font-semibold ${statusClasses[status]} ${className}`;

    return (
        <span
            className={combinedClasses}
            role="status"
            aria-label={`${status} badge: ${label}`}
        >
            {label}
        </span>
    );
};

export default Badge;
