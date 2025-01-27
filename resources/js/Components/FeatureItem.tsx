import { Feature } from "@/types";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import FeatureActionsDropdown from "./FeatureActionsDropdown";
import { can } from "@/helpers";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

function FeatureItem({ feature }: { feature: Feature }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const user = usePage<{ auth: { user: any } }>().props.auth.user;

    const toogleReadMore = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800 mb-4">
            <div className="p-6 text-gray-900 dark:text-gray-100 flex gap-8">
                <div className="flex items-center flex-col gap-2">
                    {/* Upvote button */}
                    <button aria-label="Upvote this feature">
                        <IconChevronUp
                            stroke={1.5}
                            className="size-5 text-gray-900 dark:text-gray-100"
                        />
                        {/* <ChevronUpIcon className="size-6 text-gray-900 dark:text-gray-100" /> */}
                    </button>
                    <span className="font-semibold">12</span>
                    {/* Downvote button */}
                    <button aria-label="Downvote this feature">
                        <IconChevronDown
                            stroke={1.5}
                            className="size-5 text-gray-900 dark:text-gray-100"
                        />
                        {/* <ChevronDownIcon className="size-6 text-gray-900 dark:text-gray-100" /> */}
                    </button>
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl mb-2">
                        <Link href={route("feature.show", feature)}>
                            {feature.name}
                        </Link>
                    </h2>
                    {feature.description === null ? (
                        <></>
                    ) : feature.description.length > 200 ? (
                        <>
                            <p>
                                {isExpanded
                                    ? feature.description
                                    : `${feature.description.slice(0, 200)}...`}
                            </p>
                            <button
                                onClick={toogleReadMore}
                                className="text-amber-500 hover:underline"
                                aria-label={
                                    isExpanded ? "Read less" : "Read more"
                                }
                            >
                                {isExpanded ? "Read less" : "Read more"}
                            </button>
                        </>
                    ) : (
                        <p>{feature.description}</p>
                    )}
                </div>

                {can(user, "manage_features") && (
                    <div>
                        <FeatureActionsDropdown feature={feature} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeatureItem;
