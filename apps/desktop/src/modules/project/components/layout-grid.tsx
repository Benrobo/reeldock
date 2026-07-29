import { LAYOUTS, LAYOUT_THUMBS, type LayoutId } from "@reeldock/shared";
import { ChoiceCard } from "@reeldock/ui";

type LayoutGridProps = {
  value: LayoutId;
  onChange: (layout: LayoutId) => void;
};

export function LayoutGrid({ value, onChange }: LayoutGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => {
        const thumb = LAYOUT_THUMBS[id];

        return (
          <ChoiceCard
            camera={{
              x: thumb.cx,
              y: thumb.cy,
              w: thumb.cw,
              h: thumb.ch,
              radius: thumb.cr,
            }}
            key={id}
            label={LAYOUTS[id].label}
            onSelect={() => onChange(id)}
            phone={{ x: thumb.px, y: thumb.py, w: thumb.pw, h: thumb.ph }}
            selected={value === id}
          />
        );
      })}
    </div>
  );
}
