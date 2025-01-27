import { TableProps } from "@/types";

/**
 * A reusable and stylish table component that dynamically generates
 * rows and columns based on the provided data.
 *
 * @param {TableProps} props - The props for the TableComponent.
 * @param {TableData[]} props.data - An array of objects representing the table data.
 * @returns {JSX.Element} A JSX element representing the table.
 */
const TableComponent: React.FC<TableProps> = ({ data }) => {
    // Check if data is empty or not provided
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-500">No data available</p>;
    }

    // Extract column headers from the keys of the first object
    const headers = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {header.charAt(0).toUpperCase() +
                                    header.slice(1)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map((header) => (
                                <td
                                    key={header}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                >
                                    {row[header] !== undefined
                                        ? row[header].toString()
                                        : "-"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableComponent;
