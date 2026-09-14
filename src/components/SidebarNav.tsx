type SidebarNavProps = {
  page: string
  onSelect: (page: 'Dashboard' | 'Habits' | 'Gym' | 'Calendar' | 'Analytics' | 'Reports' | 'Settings') => void
}

const navItems = [
  'Dashboard',
  'Habits',
  'Gym',
  'Calendar',
  'Analytics',
  'Reports',
  'Settings',
] as const

export function SidebarNav({ page, onSelect }: SidebarNavProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-slate-950 p-5 text-slate-100 shadow-[inset_-1px_0_0_rgba(148,163,184,0.12)] transition-colors lg:block dark:border-slate-700 dark:bg-slate-950">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
            G
          </div>
          <div>
            <div className="text-lg font-bold text-white">Gym & Habit</div>
            <div className="text-xs text-slate-400">Tracker</div>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(item => (
            <button
              key={item}
              onClick={() => onSelect(item)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                page === item
                  ? 'bg-white text-slate-900 shadow-lg shadow-slate-950/20 dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

    </>
  )
}
