type StatCardProps = {
  label: string
  value: string | number
  subLabel: string
  valueClassName?: string
}

export function StatCard({
  label,
  value,
  subLabel,
  valueClassName = '',
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subLabel}</p>
    </div>
  )
}
