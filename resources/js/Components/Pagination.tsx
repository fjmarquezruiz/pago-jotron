import { Link } from "@inertiajs/react";

// Define the interface for a pagination link
interface LinkItem {
    url: string | null; // The URL of the link or null if it's not a valid link
    label: string; // The text to be displayed on the link
    active: boolean; // Indicates if the link is the active page
}

// Define the interface for the properties of the Pagination component
interface PaginationProps {
    links: LinkItem[]; // An array of LinkItem objects representing the pagination links
    queryParams?: Record<string, string>; // Optional additional query parameters to include in the link URLs
}

/**
 * Pagination component that displays links to navigate between pages.
 * @param links - An array of LinkItem objects representing the pagination links.
 * @param queryParams - Additional query parameters to include in the link URLs.
 */
export default function Pagination({
    links,
    queryParams = {},
}: PaginationProps) {
    // Filter links to exclude those that are not valid URLs
    const validLinks = links.filter((link) => link.url !== null);

    return (
        // Check if there is more than one valid link (more than one page)
        validLinks.length > 1 && (
            <nav className="mt-4 text-center">
                {/* Iterate over each valid link in the links array */}
                {validLinks.map((link) => {
                    // Construct the URL with query parameters
                    const urlWithParams = new URL(
                        link.url!,
                        window.location.origin,
                    );
                    Object.keys(queryParams).forEach((key) => {
                        urlWithParams.searchParams.append(
                            key,
                            queryParams[key],
                        );
                    });

                    return (
                        <Link
                            key={link.label}
                            preserveScroll
                            href={urlWithParams.toString()} // Use the constructed URL
                            className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-widest transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                                link.active
                                    ? "bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-white dark:focus:bg-white dark:active:bg-gray-300"
                                    : "text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-800"
                            } ${
                                !link.url
                                    ? "cursor-not-allowed text-gray-500"
                                    : ""
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        >
                            {/* {link.label} */}
                        </Link>
                    );
                })}
            </nav>
        )
    );
}
