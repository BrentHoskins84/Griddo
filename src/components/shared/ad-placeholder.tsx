import { cn } from "@/utils/cn";

// Size configurations for different ad formats
const AD_SIZES = {
  banner: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  skyscraper: { width: 160, height: 600 },
} as const;

type AdSize = keyof typeof AD_SIZES;

interface AdPlaceholderProps {
  size: AdSize;
  className?: string;
}

export function AdPlaceholder({ size, className }: AdPlaceholderProps) {
  const { width, height } = AD_SIZES[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "border-2 border-dashed border-zinc-700",
        "bg-zinc-900/50", // Background: #18181B (zinc-900)
        "rounded-lg",
        className
      )}
      style={{ width, height }}
    >
      {/* TODO: Replace this placeholder with Google AdSense code
          Example:
          <ins className="adsbygoogle"
               style={{ display: "block" }}
               data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
               data-ad-slot="XXXXXXXXXX"
               data-ad-format="auto"
               data-full-width-responsive="true" />
      */}
      <span className="text-zinc-500 text-sm font-medium">Ad</span>
    </div>
  );
}

