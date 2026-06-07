import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// 1. Use Omit to remove the native 'strokeWidth' (string | number) from SVG props
interface SpinnerProps extends Omit<
  React.ComponentProps<"svg">,
  "strokeWidth"
> {
  // 2. Explicitly define it to match what HugeiconsIcon expects
  strokeWidth?: number;
}

// 3. Destructure strokeWidth explicitly with a default fallback value
function Spinner({ className, strokeWidth = 2, ...props }: SpinnerProps) {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      strokeWidth={strokeWidth} // This is now safely recognized as a strict number
      role="status"
      aria-label="Loading..."
      className={cn("animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
