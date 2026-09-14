import { useRef, useState } from 'react'
import { BrandLogo } from './BrandLogo'

type MobilePage =
  | 'Dashboard'
  | 'Habits'
  | 'Gym'
  | 'Calendar'
  | 'Analytics'
  | 'Reports'
  | 'Settings'

type MobilePageNavProps = {
  page: MobilePage
  onSelect: (page: MobilePage) => void
}

const navItems: Array<{ page: MobilePage; label: string; icon: string }> = [
  { page: 'Dashboard', label: 'Home', icon: '⌂' },
  { page: 'Habits', label: 'Habits', icon: '✓' },
  { page: 'Gym', label: 'Gym', icon: '🏋' },
  { page: 'Calendar', label: 'Calendar', icon: '▦' },
  { page: 'Analytics', label: 'Stats', icon: '↗' },
  { page: 'Reports', label: 'Reports', icon: '▤' },
  { page: 'Settings', label: 'Settings', icon: '⚙' },
]

export function MobileRadialNav({ page, onSelect }: MobilePageNavProps) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<MobilePage | null>(null)
  const startY = useRef(0)
  const dragged = useRef(false)
  const ignoreClick = useRef(false)

  const currentIndex = navItems.findIndex(item => item.page === page)
  const activePage = target ?? page

  function selectFromSwipe(clientY: number) {
    const steps = Math.round((clientY - startY.current) / 48)
    const index = Math.max(0, Math.min(navItems.length - 1, currentIndex + steps))
    setTarget(navItems[index].page)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    startY.current = event.clientY
    dragged.current = false
    ignoreClick.current = !open
    if (!open) setOpen(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!open) return
    event.preventDefault()
    if (Math.abs(event.clientY - startY.current) > 10) dragged.current = true
    selectFromSwipe(event.clientY)
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragged.current && target) {
      onSelect(target)
      setOpen(false)
      setTarget(null)
    }
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function toggleMenu() {
    if (ignoreClick.current || dragged.current) {
      ignoreClick.current = false
      return
    }
    setOpen(value => !value)
    setTarget(null)
  }

  return (
    <div
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 select-none touch-none lg:hidden"
      role="navigation"
      aria-label="Page navigation"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragged.current = false
        setTarget(null)
      }}
    >
      {open && (
        <div className="absolute bottom-[4.25rem] right-0 flex flex-col items-end gap-3 pb-2">
          {navItems.map((item, index) => {
            const selected = activePage === item.page

            return (
              <button
                key={item.page}
                type="button"
                tabIndex={-1}
                aria-current={selected ? 'page' : undefined}
                aria-label={`Go to ${item.label}`}
                onClick={() => {
                  onSelect(item.page)
                  setOpen(false)
                  setTarget(null)
                }}
                className={`vvq-radial-item flex items-center gap-2 transition-all duration-200 ${selected ? 'translate-x-[-3px] scale-110' : ''}`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {selected && (
                  <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white shadow-lg dark:bg-slate-800">
                    {item.label}
                  </span>
                )}
                <span className={`flex h-12 w-12 aspect-square items-center justify-center rounded-full text-lg shadow-lg transition-colors ${selected
                  ? 'bg-orange-700 text-white shadow-orange-950/40'
                  : 'bg-slate-950 text-slate-100 shadow-slate-950/30 dark:bg-slate-800'
                  }`}>
                  {item.icon}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={open}
        aria-label={open ? 'Close page navigation' : `Open page navigation, current page ${page}`}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 shadow-2xl shadow-slate-950/40 transition-transform active:scale-95 dark:bg-slate-900"
      >
        {open ? <span className="text-2xl font-light text-orange-200">×</span> : <BrandLogo compact />}
      </button>
    </div>
  )
}
