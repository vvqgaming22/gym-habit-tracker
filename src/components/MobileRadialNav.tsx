import { useRef, useState } from 'react'

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

const radius = 88
const angleStep = 360 / navItems.length

function angleDifference(first: number, second: number) {
  return Math.abs(((first - second + 540) % 360) - 180)
}

export function MobileRadialNav({ page, onSelect }: MobileRadialNavProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<MobilePage | null>(null)
  const movedRef = useRef(false)
  const startPointRef = useRef({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  function updateHighlight(clientX: number, clientY: number) {
    const button = buttonRef.current
    if (!button) return

    const bounds = button.getBoundingClientRect()
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    const deltaX = clientX - centerX
    const deltaY = clientY - centerY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance < 28) {
      setHighlighted(null)
      return
    }

    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    let selected = navItems[0].page
    let closestDifference = Number.POSITIVE_INFINITY

    navItems.forEach((item, index) => {
      const difference = angleDifference(angle, -90 + index * angleStep)
      if (difference < closestDifference) {
        closestDifference = difference
        selected = item.page
      }
    })

    setHighlighted(selected)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    startPointRef.current = { x: event.clientX, y: event.clientY }
    movedRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    setOpen(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!open) return

    const distance = Math.hypot(
      event.clientX - startPointRef.current.x,
      event.clientY - startPointRef.current.y
    )

    if (distance > 12) movedRef.current = true
    updateHighlight(event.clientX, event.clientY)
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
    if (movedRef.current) return
    setOpen(value => !value)
    setHighlighted(null)
  }

  return (
    <div
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-50 lg:hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setOpen(false)
        setHighlighted(null)
      }}
    >
      {open && (
        <div className="pointer-events-none absolute bottom-7 right-7 h-44 w-44">
          {navItems.map((item, index) => {
            const angle = (-90 + index * angleStep) * (Math.PI / 180)
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
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
                className={`pointer-events-auto absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-[10px] font-bold shadow-xl transition-all ${isSelected
                  ? 'scale-110 border-cyan-300 bg-cyan-500 text-white shadow-cyan-500/30'
                  : 'border-slate-200 bg-white/95 text-slate-700 dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-200'
                  }`}
                style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="mt-1 max-w-[52px] truncate">{item.shortLabel}</span>
              </button>
            )
          })}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        aria-label={open ? 'Close page navigation' : `Open page navigation, current page ${page}`}
        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-black shadow-2xl transition-all ${open
          ? 'rotate-45 border-cyan-300 bg-cyan-500 text-white shadow-cyan-500/30'
          : 'border-slate-900 bg-slate-950 text-cyan-300 shadow-slate-950/30 dark:border-cyan-300 dark:bg-cyan-400 dark:text-slate-950'
          }`}
      >
        {open ? '+' : '☰'}
      </button>

      {open && (
        <p className="pointer-events-none absolute bottom-16 right-0 w-44 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          Swipe around the circle, then release
        </p>
      )}
    </div>
  )
}
