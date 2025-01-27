import { IconDotsVertical } from "@tabler/icons-react";
import Dropdown from "./Dropdown";
import { Feature } from "@/types";

function FeatureActionsDropdown({ feature }: { feature: Feature }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <span className="inline-flex rounded-md">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <IconDotsVertical
                            stroke={1.5}
                            className="size-5 text-gray-900 dark:text-gray-100"
                        />
                    </button>
                </span>
            </Dropdown.Trigger>

            <Dropdown.Content>
                <Dropdown.Link href={route("feature.edit", feature.id)}>
                    Edit
                </Dropdown.Link>
                <Dropdown.Link
                    href={route("feature.destroy", feature.id)}
                    method="delete"
                >
                    Delete
                </Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );
}

export default FeatureActionsDropdown;
