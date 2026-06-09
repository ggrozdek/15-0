import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary" | "ghost";
};

export default function ActionButton({
  children,
  tone = "primary",
  className = "",
  ...props
}: ActionButtonProps) {
  const tones = {
    primary:
      "bg-frost text-night-950 shadow-[0_18px_45px_rgba(210,225,245,0.22)] hover:bg-white",
    secondary:
      "border border-flood/45 bg-flood/12 text-frost hover:bg-flood/22",
    ghost: "border border-frost/12 bg-frost/5 text-steel hover:bg-frost/10",
  };

  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.12em] transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
