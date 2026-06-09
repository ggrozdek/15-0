import type { ReactNode } from "react";

type BottomActionBarProps = {
  note?: ReactNode;
  children: ReactNode;
};

export default function BottomActionBar({ note, children }: BottomActionBarProps) {
  return (
    <div className="bottom-action-bar">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {note && <div className="text-xs font-bold leading-5 text-steel/78 sm:max-w-md">{note}</div>}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">{children}</div>
      </div>
    </div>
  );
}
