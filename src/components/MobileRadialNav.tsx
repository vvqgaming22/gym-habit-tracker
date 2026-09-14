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

type MobileRadialNavProps = {
  page: MobilePage
  onSelect: (page: MobilePage) => void
}

const navItems: Array<{ page: MobilePage; shortLabel: string; icon: string }> = [
  { page: 'Dashboard', shortLabel: 'Home', icon: '⌂' },
  { page: 'Habits', shortLabel: 'Habits', icon: '✓' },
  { page: 'Gym', shortLabel: 'Gym', icon: '🏋' },
  { page: 'Calendar', shortLabel: 'Calendar', icon: '▦' },
  { page: 'Analytics', shortLabel: 'Stats', icon: '↗' },
  { page: 'Reports', shortLabel: 'Reports', icon: '▤' },
  { page: 'Settings', shortLabel: 'Settings', icon: '⚙' },
]

export function MobileRadialNav({ page, onSelect }: MobileRadialNavProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<MobilePage | null>(null)
  const movedRef = useRef(false)
  const openedByPointerRef = useRef(false)
  const startPointRef = useRef({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  function updateHighlight(clientY: number) {
    const currentIndex = navItems.findIndex(item => item.page === page)
    const deltaY = clientY - startPointRef.current.y
    const offset = Math.round(deltaY / 52)
    const nextIndex = Math.max(0, Math.min(navItems.length - 1, currentIndex + offset))
    setHighlighted(navItems[nextIndex].page)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    startPointRef.current = { x: event.clientX, y: event.clientY }
    movedRef.current = false
    openedByPointerRef.current = !open
    event.currentTarget.setPointerCapture(event.pointerId)
    if (!open) setOpen(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!open) return

    event.preventDefault()

    const distance = Math.hypot(
      event.clientX - startPointRef.current.x,
      event.clientY - startPointRef.current.y
    )

    if (distance > 12) movedRef.current = true
    updateHighlight(event.clientY)
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (movedRef.current && highlighted) {
      onSelect(highlighted)
      setOpen(false)
      setHighlighted(null)
    }

    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleButtonClick() {
    if (openedByPointerRef.current) {
      openedByPointerRef.current = false
      return
    }

    if (movedRef.current) return
    setOpen(value => !value)
    setHighlighted(null)
  }

  return (
    <div
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-50 select-none touch-none lg:hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        movedRef.current = false
        setHighlighted(null)
      }}
    >
      {open && (
        <div className="absolute bottom-16 right-0 flex max-h-[70vh] w-[148px] justify-center overflow-y-auto p-1">
          <div className="flex min-h-max w-full flex-col items-stretch gap-1.5">
          {navItems.map((item, index) => {
            const isSelected = highlighted === item.page || (!highlighted && page === item.page)

            return (
              <button
                key={item.page}
                type="button"
                tabIndex={-1}
                onClick={() => {
                  onSelect(item.page)
                  setOpen(false)
                  setHighlighted(null)
                }}
                className={`vvq-radial-item pointer-events-auto flex h-12 w-full shrink-0 items-center gap-3 rounded-full border border-transparent px-3 text-left text-xs font-bold transition-all duration-150 ${isSelected
                  ? 'scale-125 bg-orange-700 text-white shadow-[0_12px_30px_rgba(124,45,18,0.45)]'
                  : 'bg-white text-slate-800 shadow-lg shadow-slate-950/20 dark:bg-slate-800 dark:text-slate-100 dark:shadow-slate-950/40'
                  }`}
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <span className={`flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-full text-base leading-none ${isSelected
                  ? 'bg-orange-900/40 text-orange-50'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                  }`}>{item.icon}</span>
                <span className="truncate">{item.shortLabel}</span>
              </button>
            )
          })}
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        aria-label={open ? 'Close page navigation' : `Open page navigation, current page ${page}`}
        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-black shadow-2xl transition-all ${open
          ? 'rotate-45 border-orange-400 bg-slate-900 text-orange-100 shadow-slate-950/50 dark:border-orange-500 dark:bg-slate-950'
          : 'border-slate-700 bg-slate-950 text-orange-200 shadow-slate-950/50 dark:border-slate-600 dark:bg-slate-900 dark:text-orange-100'
          }`}
      >
        {open ? '+' : <BrandLogo compact />}
      </button>

      {open && (
        <p className="pointer-events-none absolute bottom-16 right-0 w-44 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          Swipe up or down, then release
        </p>
      )}
    </div>
  )
}
