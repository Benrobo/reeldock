const BAR_COUNT = 12;
const BARS = Array.from({ length: BAR_COUNT }, (_, index) => index);

type ActivitySpinnerProps = {
  size?: number;
  color?: string;
  className?: string;
  label?: string;
};

export function ActivitySpinner({
  size = 18,
  color = "currentColor",
  className,
  label = "Loading",
}: ActivitySpinnerProps) {
  const barWidth = Math.max(1.5, size * 0.09);
  const barHeight = Math.max(4, size * 0.28);

  return (
    <span
      aria-label={label}
      className={className}
      role="status"
      style={{ position: "relative", display: "inline-block", width: size, height: size }}
    >
      {BARS.map((index) => (
        <span
          key={index}
          style={{
            position: "absolute",
            width: barWidth,
            height: barHeight,
            borderRadius: barWidth / 2,
            background: color,
            top: size * 0.1,
            left: size / 2 - barWidth / 2,
            transformOrigin: `${barWidth / 2}px ${size / 2 - size * 0.1}px`,
            transform: `rotate(${index * 30}deg)`,
            animation: "rd-bar-fade 1s linear infinite",
            animationDelay: `${-((BAR_COUNT - index) / BAR_COUNT)}s`,
          }}
        />
      ))}
    </span>
  );
}
