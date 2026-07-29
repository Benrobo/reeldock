const ROWS = [
  { n: "1", title: "Proverbs 3", sub: "4 min read" },
  { n: "2", title: "Psalm 27", sub: "3 min read" },
  { n: "3", title: "Reflection", sub: "Write a note" },
];

const TABS = ["Today", "Plans", "Notes", "You"];

export function PhoneMock() {
  return (
    <div className="relative h-full w-full">
      <div className="flex h-14 items-end justify-between px-7 pb-2">
        <span className="text-[15px] font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <span className="bg-screen-ink h-2.5 w-4 rounded-[2px]" />
          <span className="bg-screen-ink h-2.5 w-3.5 rounded-[2px]" />
          <span className="border-screen-ink h-[11px] w-6 rounded-[3px] border-[1.5px]" />
        </div>
      </div>

      <div className="px-7 pt-4">
        <p className="text-screen-ink-2 text-[13px] font-semibold uppercase tracking-[0.12em]">
          Today
        </p>
        <h2 className="mt-2 text-[34px] font-semibold leading-[1.12] tracking-[-0.02em]">
          Reading plan
        </h2>

        <div className="bg-screen-track mt-[22px] h-2 overflow-hidden rounded-[4px]">
          <div className="bg-screen-accent h-full w-2/5" />
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {ROWS.map((row) => (
            <div
              className="border-screen-line bg-screen flex items-center gap-3.5 rounded-2xl border p-4"
              key={row.n}
            >
              <span className="bg-screen-accent-soft text-screen-accent flex size-[38px] items-center justify-center rounded-xl text-[15px] font-semibold">
                {row.n}
              </span>
              <div className="flex-1">
                <div className="text-base font-semibold">{row.title}</div>
                <div className="text-screen-ink-2 mt-0.5 text-[13px]">{row.sub}</div>
              </div>
              <span className="border-screen-control size-5 rounded-full border-[1.5px]" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-screen-line absolute inset-x-0 bottom-0 flex h-[86px] items-start border-t bg-[color-mix(in_oklab,var(--color-screen)_95%,transparent)] pt-3">
        {TABS.map((tab) => (
          <div className="flex flex-1 flex-col items-center gap-1.5" key={tab}>
            <span className="bg-screen-tab-icon size-[22px] rounded-[7px]" />
            <span className="text-screen-ink-2 text-[11px]">{tab}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
