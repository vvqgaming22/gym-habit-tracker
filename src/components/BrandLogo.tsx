type BrandLogoProps = {
  compact?: boolean
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`} aria-label="VVQ · Vũ Vinh Quang Gym Habit Tracker">
      <img
        src={`${import.meta.env.BASE_URL}vq-logo.svg`}
        alt="VVQ · Vũ Vinh Quang logo"
        className={`shrink-0 rounded-2xl shadow-lg shadow-cyan-500/25 ${compact ? 'h-11 w-11' : 'h-12 w-12'}`}
      />
      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-[15px] font-black tracking-tight text-white">
            Vũ Vinh Quang
          </div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            Gym · Habit Tracker
          </div>
        </div>
      )}
    </div>
  )
}
