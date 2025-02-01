/**
 * Handles the action to navigate back to the previous page.
 * This function uses the browser's history API to go back one step in the history stack.
 */
export const handleBack = () => {
    // Use window.history.back() to navigate to the previous page
    window.history.back();
};

/**
 * Handles the action to redirect to a specified page.
 * This function changes the browser's location to the given URL, causing a full page reload.
 *
 * @param page - The URL to which the user should be redirected.
 */
export const handleGoToPage = (page: string) => {
    // Redirect to the specified page using window.location.href
    window.location.href = page;
};

/**
 * Retrieves the current year.
 * This function returns the current year based on the system's date and time.
 *
 * @returns The current year as a number.
 */
export const getCurrentYear = () => {
    // Create a new Date object representing the current date and time
    const currentDate = new Date();
    // Extract the year from the current date
    return currentDate.getFullYear();
};

export const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
    )
        .toISOString()
        .split("T")[0];

    return maxDate;
}
