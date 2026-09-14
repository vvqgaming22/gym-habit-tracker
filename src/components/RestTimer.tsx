import { useEffect, useState } from 'react'

const timerOptions = [30, 60, 90, 120, 180]

export function RestTimer() {
  const [duration, setDuration] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return

    const timer = window.setInterval(() => {
      setRemaining(value => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }

        return value - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [running])

  function selectDuration(value: number) {
    setDuration(value)
    setRemaining(value)
    setRunning(false)
  }

  function reset() {
    setRemaining(duration)
    setRunning(false)
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = String(remaining % 60).padStart(2, '0')

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 dark:border-cyan-400/20 dark:bg-cyan-400/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
            Rest timer
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
            {minutes}:{seconds}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning(value => !value)}
            className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-cyan-500"
          >
            {running ? 'Pause' : remaining === 0 ? 'Restart' : 'Start'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-cyan-500/30 bg-white/70 px-3 py-2 text-sm font-medium text-cyan-800 transition hover:bg-white dark:bg-slate-900/60 dark:text-cyan-200 dark:hover:bg-slate-900"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {timerOptions.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => selectDuration(option)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${duration === option
              ? 'bg-cyan-600 text-white'
              : 'bg-white/70 text-cyan-800 hover:bg-white dark:bg-slate-900/60 dark:text-cyan-200 dark:hover:bg-slate-900'
              }`}
          >
            {option}s
          </button>
        ))}
      </div>
    </div>
  )
}
