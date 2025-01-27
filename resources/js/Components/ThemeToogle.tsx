import { menuLinkClasses } from "@/styles";
import { IconMoon, IconSunHigh } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const ThemeToggle = () => {
    const [theme, setTheme] = useState<Theme>("light");

    useEffect(() => {
        // Check local storage for theme preference
        const savedTheme = localStorage.getItem("color-theme") as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle(
                "dark",
                savedTheme === "dark",
            );
        } else {
            // Check system preference
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)",
            ).matches;
            setTheme(prefersDark ? "dark" : "light");
            document.documentElement.classList.toggle("dark", prefersDark);
        }
    }, []);

    const newTheme = theme === "light" ? "dark" : "light";

    const toggleTheme = () => {
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        localStorage.setItem("color-theme", newTheme);
    };

    const icon = useMemo(() => {
        return theme === "dark" ? (
            <IconSunHigh stroke={1.5} className="size-5" />
        ) : (
            <IconMoon stroke={1.5} className="size-5" />
        );
    }, [theme]);

    return (
        <button
            id="theme-toggle"
            className={menuLinkClasses}
            onClick={toggleTheme}
            aria-label={`Toogle to ${newTheme} theme`}
            title={`Toogle to ${newTheme} theme`}
        >
            {icon}
        </button>
    );
};

export default ThemeToggle;
