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

const radius = 88
const angleStep = 360 / navItems.length

function angleDifference(first: number, second: number) {
  return Math.abs(((first - second + 540) % 360) - 180)
}

export function MobileRadialNav({ page, onSelect }: MobileRadialNavProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<MobilePage | null>(null)
  const movedRef = useRef(false)
  const openedByPointerRef = useRef(false)
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
                className={`pointer-events-auto absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-[10px] font-bold shadow-xl transition-all duration-150 ${isSelected
                  ? 'scale-125 border-2 border-orange-100 bg-orange-700 text-white shadow-[0_0_0_5px_rgba(194,65,12,0.38),0_12px_30px_rgba(124,45,18,0.45)] dark:border-orange-200'
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
          ? 'rotate-45 border-orange-400 bg-slate-900 text-orange-100 shadow-slate-950/50 dark:border-orange-500 dark:bg-slate-950'
          : 'border-slate-700 bg-slate-950 text-orange-200 shadow-slate-950/50 dark:border-slate-600 dark:bg-slate-900 dark:text-orange-100'
          }`}
      >
        {open ? '+' : <BrandLogo compact />}
      </button>

      {open && (
        <p className="pointer-events-none absolute bottom-16 right-0 w-44 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          Swipe around the circle, then release
        </p>
      )}
    </div>
  )
}
