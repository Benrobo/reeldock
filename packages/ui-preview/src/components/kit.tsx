import type { ReactNode } from "react";
import { Note, Panel } from "@reeldock/ui";

type SpecimenProps = {
  id: string;
  label: string;
  note?: ReactNode;
  children: ReactNode;
  wide?: boolean;
};

export function Specimen({ id, label, note, children, wide = false }: SpecimenProps) {
  return (
    <section className={wide ? "scroll-mt-8 md:col-span-2" : "scroll-mt-8"} id={id}>
      <Panel label={label}>
        <div className="mt-[18px]">{children}</div>
        {note ? <Note className="mt-[18px]">{note}</Note> : null}
      </Panel>
    </section>
  );
}

export function Wrap({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2.5">{children}</div>;
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3.5">{children}</div>;
}
