type MetricPillProps = {
  label: string;
  value: string | number;
  muted?: boolean;
};

export default function MetricPill({ label, value, muted = false }: MetricPillProps) {
  return (
    <div className={`rounded-2xl border px-3 py-2.5 ${muted ? "border-frost/8 bg-frost/5" : "border-flood/35 bg-flood/10"}`}>
      <div className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-steel/70">{label}</div>
      <div className="mt-1 text-base font-black text-frost">{value}</div>
    </div>
  );
}
