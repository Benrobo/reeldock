import { Segmented } from "@reeldock/ui";
import { SIZE_LABELS, type ElementSize } from "@reeldock/shared";

type FieldSegmentedProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

export function FieldSegmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: FieldSegmentedProps<T>) {
  const labels = options.map((option) => SIZE_LABELS[option as ElementSize] ?? option);
  const selectedLabel = SIZE_LABELS[value as ElementSize] ?? value;

  return (
    <div>
      <div className="text-fg-2 mb-2 text-[12.5px]">{label}</div>
      <Segmented
        onChange={(next) => {
          const index = labels.indexOf(next);
          onChange(options[index] ?? (next as T));
        }}
        options={labels}
        value={selectedLabel}
      />
    </div>
  );
}
