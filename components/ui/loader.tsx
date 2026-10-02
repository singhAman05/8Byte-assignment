import { cn } from "@/lib/utils";

type LoaderProps = {
  /** Diameter in pixels. */
  size?: number;
  /** Number of spokes. */
  segments?: number;
  /** Full rotation duration in seconds. */
  speed?: number;
  className?: string;
  label?: string;
};

/**
 * Apple-style activity indicator: fading spokes rotating around a center.
 * Color follows `currentColor`, so set text color on a parent to theme it.
 */
export function Loader({
  size = 20,
  segments = 12,
  speed = 1,
  className,
  label = "Loading",
}: LoaderProps) {
  const barWidth = Math.max(1.5, size * 0.085);
  const barHeight = size * 0.28;

  return (
    <span
      role="status"
      aria-label={label}
      className={cn("relative inline-block shrink-0 text-current", className)}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: segments }).map((_, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-0 block"
          style={{
            width: barWidth,
            height: barHeight,
            marginLeft: -barWidth / 2,
            borderRadius: barWidth,
            background: "currentColor",
            transformOrigin: `50% ${size / 2}px`,
            transform: `rotate(${(index * 360) / segments}deg)`,
            animation: `apple-spinner-fade ${speed}s linear infinite`,
            animationDelay: `${(-(segments - index) / segments) * speed}s`,
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}
