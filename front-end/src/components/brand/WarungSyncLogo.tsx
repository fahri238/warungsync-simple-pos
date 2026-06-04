import { cn } from "@/lib/utils";
import { BRAND_NAME, BRAND_TAGLINE } from "@/constants/brand";

interface WarungSyncLogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 32, text: "text-base" },
  md: { icon: 40, text: "text-lg" },
  lg: { icon: 48, text: "text-xl" },
};

export const WarungSyncLogo = ({
  className,
  showWordmark = true,
  size = "md",
}: WarungSyncLogoProps) => {
  const { icon, text } = sizes[size];
  const gradId = `warungsync-grad-${size}`;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="44" y2="44">
            <stop stopColor="hsl(122, 45%, 42%)" />
            <stop offset="1" stopColor="hsl(122, 39%, 55%)" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill={`url(#${gradId})`} />
        <path
          d="M12 30V18l6 8 6-8 6 8V18"
          stroke="white"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 14a4 4 0 0 1 4 4v2M34 14v6M34 17h-2"
          stroke="hsl(36, 100%, 55%)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-display font-bold tracking-tight text-foreground", text)}>
            {BRAND_NAME}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {BRAND_TAGLINE}
          </span>
        </div>
      )}
    </div>
  );
};

export default WarungSyncLogo;
