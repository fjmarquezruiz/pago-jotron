import { APP_NAME } from "@/constants";

interface LogoProps {
    mode?: "light" | "dark";
}

const Logo = ({ mode = "light" }: LogoProps) => {
    return (
        <span
            className={`inline-flex h-[30px] items-center justify-center rounded-sm px-2 font-display text-[22px] font-bold uppercase leading-none tracking-tighter ${
                mode === "dark" ? "bg-black text-white" : "bg-white text-black"
            } `}
        >
            {APP_NAME}
        </span>
    );
};

export default Logo;
