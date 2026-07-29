type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header>
      <div className="text-fg-label text-[11px] font-semibold uppercase tracking-[0.14em]">
        {eyebrow}
      </div>
      <h1 className="mt-[7px] text-[26px] font-semibold tracking-[-0.022em]">{title}</h1>
      <p className="text-fg-2 mt-1.5 max-w-[660px] text-pretty text-[13.5px] leading-[1.55]">
        {description}
      </p>
    </header>
  );
}
