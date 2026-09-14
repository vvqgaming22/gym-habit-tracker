import type {
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutPlanSet,
  WorkoutSet,
} from '../db'
import { useState } from 'react'
import { RestTimer } from './RestTimer'

export type WorkoutTemplate = {
  id: string
  name: string
  exercises: Array<{
    exerciseId: number
    order: number
    planSets: Array<Pick<WorkoutPlanSet, 'setNumber' | 'kg' | 'reps' | 'rpe' | 'note'>>
  }>
}

type GymPageProps = {
  currentWorkoutId: number | null
  workouts: Workout[]
  exercises: Exercise[]
  exerciseLibraryOpen: boolean
  exerciseDeletionEnabled: boolean
  expandedExercises: number[]
  librarySearch: string
  newExerciseName: string
  workoutExercises: WorkoutExercise[]
  workoutExerciseNames: Record<number, string>
  actualSets: Record<number, WorkoutSet[]>
  planSets: Record<number, WorkoutPlanSet[]>
  workoutDate: string
  workoutTopic: string
  templates: WorkoutTemplate[]
  setExerciseLibraryOpen: (value: boolean) => void
  setExerciseDeletionEnabled: (value: boolean) => void
  setExpandedExercises: React.Dispatch<React.SetStateAction<number[]>>
  setLibrarySearch: (value: string) => void
  setNewExerciseName: (value: string) => void
  setWorkoutDate: (value: string) => void
  setWorkoutTopic: (value: string) => void
  saveWorkoutTemplate: () => Promise<void>
  loadWorkoutTemplate: (template: WorkoutTemplate) => Promise<void>
  deleteWorkoutTemplate: (templateId: string) => void
  startNewWorkout: () => void
  createWorkout: () => Promise<void>
  loadWorkout: (workoutId: number) => Promise<void>
  addExerciseToWorkout: (exerciseId: number) => Promise<void>
  removeExerciseFromWorkout: (itemId: number) => Promise<void>
  moveExercise: (itemId: number, direction: 'up' | 'down') => Promise<void>
  addExercise: () => Promise<void>
  deleteExercise: (exerciseId: number) => Promise<void>
  deleteWorkout: (workoutId: number) => Promise<void>
  updateWorkoutInfo: () => Promise<void>
  completeWorkout: () => Promise<void>
  addActualSet: (workoutExerciseId: number) => Promise<void>
  updateActualSet: (
    set: WorkoutSet,
    field: keyof WorkoutSet,
    value: number | string | undefined
  ) => Promise<void>
  deleteActualSet: (workoutExerciseId: number, setId: number) => Promise<void>
  copyPreviousSet: (workoutExerciseId: number) => Promise<void>
  copyPlanToActual: (workoutExerciseId: number) => Promise<void>
  addPlanSet: (workoutExerciseId: number) => Promise<void>
  updatePlanSet: (
    set: WorkoutPlanSet,
    field: keyof WorkoutPlanSet,
    value: number | string | undefined
  ) => Promise<void>
  deletePlanSet: (workoutExerciseId: number, setId: number) => Promise<void>
  formatDate: (date: string) => string
}

const filteredExercises = (
  exercises: Exercise[],
  librarySearch: string
) =>
  exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(librarySearch.toLowerCase())
  )

export function GymPage({
  currentWorkoutId,
  workouts,
  exercises,
  exerciseLibraryOpen,
  exerciseDeletionEnabled,
  expandedExercises,
  librarySearch,
  newExerciseName,
  workoutExercises,
  workoutExerciseNames,
  actualSets,
  planSets,
  workoutDate,
  workoutTopic,
  templates,
  setExerciseLibraryOpen,
  setExpandedExercises,
  setLibrarySearch,
  setNewExerciseName,
  setWorkoutDate,
  setWorkoutTopic,
  saveWorkoutTemplate,
  loadWorkoutTemplate,
  deleteWorkoutTemplate,
  startNewWorkout,
  createWorkout,
  loadWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  moveExercise,
  addExercise,
  deleteExercise,
  deleteWorkout,
  updateWorkoutInfo,
  completeWorkout,
  addActualSet,
  updateActualSet,
  deleteActualSet,
  copyPreviousSet,
  copyPlanToActual,
  addPlanSet,
  updatePlanSet,
  deletePlanSet,
  formatDate,
}: GymPageProps) {
  const [draggedExerciseId, setDraggedExerciseId] = useState<number | null>(null)
  const visibleExercises = filteredExercises(exercises, librarySearch)

  return (
    <div className="space-y-6">
      {!currentWorkoutId && (
        <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                Workout Setup
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                Create Workout
              </h2>
            </div>

            <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-200">
              Date → Topic → Exercises → Actual
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="date"
              value={workoutDate}
              onChange={e => setWorkoutDate(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />

            <input
              value={workoutTopic}
              onChange={e => setWorkoutTopic(e.target.value)}
              placeholder="Chest & Shoulders"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />

            <button
              onClick={createWorkout}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              + Create Workout
            </button>
          </div>

          {templates.length > 0 && (
            <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                Saved templates
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-900/50 dark:bg-violet-950/20">
                    <button type="button" onClick={() => loadWorkoutTemplate(template)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{template.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{template.exercises.length} exercises</p>
                    </button>
                    <button type="button" onClick={() => deleteWorkoutTemplate(template.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950/40" aria-label={`Delete ${template.name} template`}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {currentWorkoutId && (
        <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                Workout Detail
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                Session Builder
              </h2>
            </div>

            <button
              onClick={startNewWorkout}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              + New Workout
            </button>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Date</label>
              <input
                type="date"
                value={workoutDate}
                onChange={e => setWorkoutDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Topic</label>
              <input
                value={workoutTopic}
                onChange={e => setWorkoutTopic(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={updateWorkoutInfo}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Save Workout Info
            </button>

            {workouts.find(w => w.id === currentWorkoutId)?.status === 'in_progress' && (
              <button
                type="button"
                onClick={completeWorkout}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Complete Workout
              </button>
            )}

            {workouts.find(w => w.id === currentWorkoutId)?.status === 'done' && (
              <span className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                ✓ Workout Completed
              </span>
            )}
          </div>

          <div className="space-y-5">
            {workoutExercises.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                No exercises yet. Add them from the Exercise Library below.
              </div>
            )}

            {workoutExercises.map((item, index) => {
              const itemId = item.id!
              const actual = actualSets[itemId] ?? []
              const plan = planSets[itemId] ?? []

              return (
                <div
                  key={itemId}
                  draggable
                  onDragStart={() => setDraggedExerciseId(itemId)}
                  onDragEnd={() => setDraggedExerciseId(null)}
                  onDragOver={event => event.preventDefault()}
                  onDrop={async event => {
                    event.preventDefault()
                    if (draggedExerciseId === null || draggedExerciseId === itemId) return

                    const fromIndex = workoutExercises.findIndex(item => item.id === draggedExerciseId)
                    const toIndex = workoutExercises.findIndex(item => item.id === itemId)
                    if (fromIndex < 0 || toIndex < 0) return

                    const direction = fromIndex < toIndex ? 'down' : 'up'
                    for (let step = 0; step < Math.abs(toIndex - fromIndex); step++) {
                      await moveExercise(draggedExerciseId, direction)
                    }
                    setDraggedExerciseId(null)
                  }}
                  className={`rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition dark:border-slate-700 dark:bg-slate-800/70 ${draggedExerciseId === itemId ? 'opacity-50' : 'hover:border-violet-300 dark:hover:border-violet-500'}`}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedExercises(prev =>
                          prev.includes(itemId)
                            ? prev.filter(id => id !== itemId)
                            : [...prev, itemId]
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                        {expandedExercises.includes(itemId) ? '⌃' : '⌄'}
                      </span>

                      <div className="min-w-0">
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                          {index + 1}. {workoutExerciseNames[itemId]}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Exercise #{item.exerciseId}
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveExercise(itemId, 'up')}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveExercise(itemId, 'down')}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => removeExerciseFromWorkout(itemId)}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {expandedExercises.includes(itemId) && (
                    <>
                      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900/70">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">Plan</h4>
                          <button
                            type="button"
                            onClick={() => addPlanSet(itemId)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            + Add Plan Set
                          </button>
                        </div>

                        {plan.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No planned sets yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                  <th className="p-2">Set</th>
                                  <th className="p-2">KG</th>
                                  <th className="p-2">Reps</th>
                                  <th className="p-2">RPE</th>
                                  <th className="p-2">Note</th>
                                  <th />
                                </tr>
                              </thead>

                              <tbody>
                                {plan.map(set => (
                                  <tr key={set.id} className="border-b border-slate-200 last:border-0 dark:border-slate-700">
                                    <td className="p-2 text-slate-700 dark:text-slate-200">{set.setNumber}</td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        value={set.kg ?? ''}
                                        onChange={e =>
                                          updatePlanSet(
                                            set,
                                            'kg',
                                            e.target.value === '' ? undefined : Number(e.target.value)
                                          )
                                        }
                                        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        value={set.reps ?? ''}
                                        onChange={e =>
                                          updatePlanSet(
                                            set,
                                            'reps',
                                            e.target.value === '' ? undefined : Number(e.target.value)
                                          )
                                        }
                                        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={set.rpe ?? ''}
                                        onChange={e =>
                                          updatePlanSet(
                                            set,
                                            'rpe',
                                            e.target.value === '' ? undefined : Number(e.target.value)
                                          )
                                        }
                                        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        value={set.note ?? ''}
                                        onChange={e => updatePlanSet(set, 'note', e.target.value)}
                                        className="w-full min-w-[160px] rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <button
                                        type="button"
                                        onClick={() => deletePlanSet(itemId, set.id!)}
                                        className="text-sm font-medium text-red-600 dark:text-red-300"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">Actual Training</h4>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={saveWorkoutTemplate}
                              className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200 dark:hover:bg-violet-950/40"
                            >
                              Save Template
                            </button>

                            <button
                              type="button"
                              onClick={() => copyPlanToActual(itemId)}
                              className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200 dark:hover:bg-violet-950/40"
                            >
                              Copy Plan → Actual
                            </button>

                            <button
                              type="button"
                              onClick={() => copyPreviousSet(itemId)}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              Copy Previous
                            </button>

                            <button
                              type="button"
                              onClick={() => addActualSet(itemId)}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                            >
                              + Add Set
                            </button>
                          </div>
                        </div>

                        <div className="mb-4 max-w-sm">
                          <RestTimer />
                        </div>

                        {actual.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No actual sets entered yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                  <th className="p-2">Set</th>
                                  <th className="p-2">KG</th>
                                  <th className="p-2">Reps</th>
                                  <th className="p-2">RPE</th>
                                  <th className="p-2">Note</th>
                                  <th />
                                </tr>
                              </thead>

                              <tbody>
                                {actual.map(set => (
                                  <tr key={set.id} className="border-b border-slate-200 last:border-0 dark:border-slate-700">
                                    <td className="p-2 font-medium text-slate-700 dark:text-slate-200">{set.setNumber}</td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        value={set.kg}
                                        onChange={e => updateActualSet(set, 'kg', Number(e.target.value))}
                                        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        value={set.reps}
                                        onChange={e => updateActualSet(set, 'reps', Number(e.target.value))}
                                        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={set.rpe ?? ''}
                                        onChange={e =>
                                          updateActualSet(
                                            set,
                                            'rpe',
                                            e.target.value === '' ? undefined : Number(e.target.value)
                                          )
                                        }
                                        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        value={set.note ?? ''}
                                        onChange={e => updateActualSet(set, 'note', e.target.value)}
                                        className="w-full min-w-[200px] rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <button
                                        type="button"
                                        onClick={() => deleteActualSet(itemId, set.id!)}
                                        className="text-sm font-medium text-red-600 dark:text-red-300"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setExerciseLibraryOpen(!exerciseLibraryOpen)}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                Library
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                Exercise Library
              </h2>
            </div>

            <span className="ml-3 shrink-0 text-xl text-slate-500 dark:text-slate-300">
              {exerciseLibraryOpen ? '⌃' : '⌄'}
            </span>
          </button>
        </div>

        {exerciseLibraryOpen && (
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={newExerciseName}
                onChange={e => setNewExerciseName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229) {
                    e.preventDefault()
                    addExercise()
                  }
                }}
                placeholder="Dumbbell Press"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />

              <button
                onClick={addExercise}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                + Add Exercise
              </button>
            </div>

            {currentWorkoutId && (
              <div className="mb-5">
                <input
                  value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  placeholder="Search exercise..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            <div className="space-y-2">
              {visibleExercises.map(exercise => {
                const added = currentWorkoutId
                  ? workoutExercises.some(item => item.exerciseId === exercise.id)
                  : false

                return (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-500"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{exercise.name}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Created{' '}
                        {exercise.createdAt
                          ? formatDate(exercise.createdAt.toISOString().slice(0, 10))
                          : ''}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {currentWorkoutId && (
                        <button
                          type="button"
                          disabled={added}
                          onClick={() => addExerciseToWorkout(exercise.id!)}
                          className={`rounded-xl px-3 py-2 text-sm font-medium ${
                            added
                              ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          }`}
                        >
                          {added ? 'Added' : '+ Add'}
                        </button>
                      )}

                      {exerciseDeletionEnabled && (
                        <button
                          type="button"
                          onClick={() => deleteExercise(exercise.id!)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            History
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">Recent Workouts</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Drafts and completed sessions.</p>
        </div>

        <div className="space-y-3">
          {workouts.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No workouts created yet.</p>}

          {workouts.map(workout => (
            <div
              key={workout.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-500 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-bold text-slate-900 dark:text-white">{workout.topic}</div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                      workout.status === 'draft'
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        : workout.status === 'in_progress'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                    }`}
                  >
                    {workout.status === 'draft'
                      ? 'Draft'
                      : workout.status === 'in_progress'
                        ? 'In Progress'
                        : 'Done'}
                  </span>
                </div>

                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(workout.date)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExerciseLibraryOpen(true)
                    loadWorkout(workout.id!)
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Open
                </button>

                <button
                  onClick={() => deleteWorkout(workout.id!)}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
