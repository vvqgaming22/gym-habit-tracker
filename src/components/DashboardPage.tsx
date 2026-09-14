import type { Exercise, Habit, Workout } from '../db'

type Page =
  | 'Dashboard'
  | 'Habits'
  | 'Gym'
  | 'Calendar'
  | 'Analytics'
  | 'Reports'
  | 'Settings'

type HabitEntry = Habit & {
  completed: boolean
}

type DashboardPageProps = {
  todayHabits: HabitEntry[]
  bestCurrentStreak: number
  weeklyHabitSummary: Array<{
    label: string
    completed: number
    total: number
  }>
  workouts: Workout[]
  exercises: Exercise[]
  setPage: (page: Page) => void
  toggleHabit: (habitId: number, date: string) => Promise<void>
  loadWorkout: (workoutId: number) => Promise<void>
  formatDate: (date: string) => string
  todayISO: () => string
}

export function DashboardPage({
  todayHabits,
  bestCurrentStreak,
  weeklyHabitSummary,
  workouts,
  exercises,
  setPage,
  toggleHabit,
  loadWorkout,
  formatDate,
  todayISO,
}: DashboardPageProps) {
  const completedHabits = todayHabits.filter(h => h.completed).length
  const todayWorkout = workouts.find(workout => workout.date === todayISO())
  const completionRate = todayHabits.length
    ? Math.round((completedHabits / todayHabits.length) * 100)
    : 0

  return (
    <div className="vvq-stagger space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-slate-700/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-slate-50 shadow-[0_20px_45px_rgba(2,6,23,0.38)] md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Today
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-300">
              Your momentum is building. Keep the gains rolling.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">
              Progress
            </p>
            <p className="mt-1 text-2xl font-black text-cyan-300">{completionRate}%</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            onClick={() => setPage('Habits')}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Habits</p>
            <p className="mt-2 text-xl font-bold text-white">
              {completedHabits}
              <span className="ml-1 text-sm font-medium text-slate-300">/{todayHabits.length}</span>
            </p>
          </button>

          <button
            onClick={() => setPage('Gym')}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Workout</p>
            <p className="mt-2 text-xl font-bold text-white">
              {!todayWorkout
                ? 'Ready'
                : todayWorkout.status === 'done'
                  ? 'Complete'
                  : todayWorkout.status === 'in_progress'
                    ? 'In progress'
                    : 'Planned'}
            </p>
          </button>

          <button
            onClick={() => setPage('Analytics')}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Best streak</p>
            <p className="mt-2 text-xl font-bold text-white">{bestCurrentStreak} {bestCurrentStreak === 1 ? 'day' : 'days'}</p>
          </button>
        </div>
      </section>

      <section className="rounded-[26px] border border-cyan-500/20 bg-cyan-500/10 p-4 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-400/10 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Quick actions</p>
            <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Keep momentum moving</h3>
          </div>
          <span className="hidden text-xs text-cyan-800/70 dark:text-cyan-200/70 sm:block">One tap away</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" onClick={() => setPage('Habits')} className="min-h-12 rounded-2xl bg-cyan-600 px-3 py-3 text-left text-sm font-bold text-white transition hover:bg-cyan-500">
            <span className="block text-base">✓</span>
            Check habits
          </button>
          <button type="button" onClick={() => { setPage('Gym'); if (todayWorkout) void loadWorkout(todayWorkout.id!) }} className="min-h-12 rounded-2xl bg-slate-900 px-3 py-3 text-left text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
            <span className="block text-base">🏋</span>
            {todayWorkout ? 'Open workout' : 'Start workout'}
          </button>
          <button type="button" onClick={() => setPage('Analytics')} className="min-h-12 rounded-2xl border border-cyan-500/30 bg-white/70 px-3 py-3 text-left text-sm font-bold text-cyan-900 transition hover:bg-white dark:bg-slate-900/60 dark:text-cyan-100 dark:hover:bg-slate-900">
            <span className="block text-base">↗</span>
            View progress
          </button>
          <button type="button" onClick={() => setPage('Calendar')} className="min-h-12 rounded-2xl border border-cyan-500/30 bg-white/70 px-3 py-3 text-left text-sm font-bold text-cyan-900 transition hover:bg-white dark:bg-slate-900/60 dark:text-cyan-100 dark:hover:bg-slate-900">
            <span className="block text-base">▦</span>
            Open calendar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Habits</p>
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {completedHabits}
            <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">/{todayHabits.length}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">done today</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Workouts</p>
          <p className="mt-3 text-2xl font-black text-cyan-900 dark:text-cyan-100">{workouts.length}</p>
          <p className="mt-2 text-xs text-cyan-800/80 dark:text-cyan-200/80">saved total</p>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Exercises</p>
          <p className="mt-3 text-2xl font-black text-violet-900 dark:text-violet-100">{exercises.length}</p>
          <p className="mt-2 text-xs text-violet-800/80 dark:text-violet-200/80">in library</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Status</p>
          <p className="mt-3 text-2xl font-black text-emerald-900 dark:text-emerald-100">
            {todayWorkout?.status === 'done' ? '✓' : todayWorkout ? '•' : '—'}
          </p>
          <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-200/80">
            {todayWorkout?.status === 'done'
              ? 'workout complete'
              : todayWorkout
                ? 'session active'
                : 'no workout today'}
          </p>
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weekly habit progress</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Completed scheduled habits over the last 7 days.</p>
          </div>
          <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
            {weeklyHabitSummary.reduce((sum, day) => sum + day.completed, 0)} completed
          </span>
        </div>

        <div className="grid grid-cols-7 items-end gap-2 sm:gap-3">
          {weeklyHabitSummary.map(day => {
            const height = day.total > 0 ? Math.max(8, Math.round((day.completed / day.total) * 100)) : 4

            return (
              <div key={day.label} className="flex min-w-0 flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {day.completed}/{day.total}
                </span>
                <div className="flex h-28 w-full items-end rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-cyan-600 to-cyan-300 transition-all dark:from-cyan-500 dark:to-cyan-200"
                    style={{ height: `${height}%` }}
                    title={`${day.completed} of ${day.total} habits completed`}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[26px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Today's Habits</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {completedHabits}/{todayHabits.length} completed
              </p>
            </div>

            <button
              onClick={() => setPage('Habits')}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              View all
            </button>
          </div>

          {todayHabits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center dark:border-slate-600">
              <p className="text-sm text-slate-500 dark:text-slate-400">No habits yet.</p>
              <button
                onClick={() => setPage('Habits')}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                + Add Habit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayHabits.map(habit => (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id!, todayISO())}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                      habit.completed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {habit.completed ? '✓' : ''}
                  </span>

                  <span
                    className={
                      habit.completed
                        ? 'text-sm font-medium text-slate-400 line-through dark:text-slate-500'
                        : 'text-sm font-medium text-slate-700 dark:text-slate-200'
                    }
                  >
                    {habit.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Workout</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Track session</p>
            </div>

            <button
              onClick={() => setPage('Gym')}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Open Gym
            </button>
          </div>

          {(() => {
            if (!todayWorkout) {
              return (
                <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center dark:border-slate-600">
                  <div className="text-3xl">🏋️</div>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">No workout today</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Create your session and start tracking.
                  </p>
                  <button
                    onClick={() => setPage('Gym')}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                  >
                    + Create Workout
                  </button>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setPage('Gym')
                    loadWorkout(todayWorkout.id!)
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{todayWorkout.topic}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(todayWorkout.date)}</p>
                    </div>

                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${todayWorkout.status === 'done'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : todayWorkout.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}>
                      {todayWorkout.status === 'done'
                        ? 'Completed'
                        : todayWorkout.status === 'in_progress'
                          ? 'In progress'
                          : 'Planned'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPage('Gym')
                    loadWorkout(todayWorkout.id!)
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Open Workout
                </button>
              </div>
            )
          })()}
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Latest sessions</p>
          </div>

          <button
            onClick={() => setPage('Gym')}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            View Gym
          </button>
        </div>

        {workouts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No workouts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {workouts
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map(workout => (
                <button
                  key={workout.id}
                  onClick={() => {
                    setPage('Gym')
                    loadWorkout(workout.id!)
                  }}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{workout.topic}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(workout.date)}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${workout.status === 'done'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : workout.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                      {workout.status === 'done'
                        ? 'Done'
                        : workout.status === 'in_progress'
                          ? 'Active'
                          : 'Planned'}
                    </span>
                    <span className="text-lg text-slate-400">→</span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </section>
    </div>
  )
}
