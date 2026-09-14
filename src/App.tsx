import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  db,
  type Exercise,
  type Habit,
  type HabitCompletion,
  type Workout,
  type WorkoutExercise,
  type WorkoutPlanSet,
  type WorkoutSet,
} from './db'
import { DashboardPage } from './components/DashboardPage'
import { GymPage, type WorkoutTemplate } from './components/GymPage'
import { SidebarNav } from './components/SidebarNav'

type Page =
  | 'Dashboard'
  | 'Habits'
  | 'Gym'
  | 'Calendar'
  | 'Analytics'
  | 'Reports'
  | 'Settings'

const todayISO = () => {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDayOfWeek(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)

  return new Date(
    year,
    month - 1,
    day
  ).getDay()
}
const formatDate = (date: string) => {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function App() {
  const [page, setPage] = useState<Page>('Dashboard')

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? saved === 'true' : true
  })

  const [weeklyNotificationsEnabled, setWeeklyNotificationsEnabled] = useState(
    () => localStorage.getItem('weeklyNotificationsEnabled') === 'true'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('workoutTemplates')
      return saved ? JSON.parse(saved) as WorkoutTemplate[] : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('workoutTemplates', JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    if (page === 'Gym') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }, [page])

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (!dataLoaded || !weeklyNotificationsEnabled || typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return

    const now = new Date()
    if (now.getDay() !== 1) return

    const weekKey = `weeklySummary-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    if (localStorage.getItem(weekKey)) return

    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const today = todayISO()
    const recentWorkouts = workouts.filter(workout => workout.date >= startISO && workout.date <= today).length
    const recentCompletions = completions.filter(item => item.completed && item.date >= startISO && item.date <= today).length
    const summary = `Last 7 days: ${recentWorkouts} workouts and ${recentCompletions} completed habits.`
    new Notification('Gym & Habit Tracker', { body: summary })
    localStorage.setItem(weekKey, 'true')
  }, [dataLoaded, weeklyNotificationsEnabled, workouts, completions])
  const [exerciseLibraryOpen, setExerciseLibraryOpen] = useState(true)
  const [exerciseDeletionEnabled, setExerciseDeletionEnabled] = useState(
    localStorage.getItem('exerciseDeletionEnabled') === 'true'
  )
  const [expandedExercises, setExpandedExercises] = useState<number[]>([])

  const [currentWorkoutId, setCurrentWorkoutId] =
    useState<number | null>(null)

  const [workoutExercises, setWorkoutExercises] =
    useState<WorkoutExercise[]>([])

  const [workoutExerciseNames, setWorkoutExerciseNames] =
    useState<Record<number, string>>({})

  const [actualSets, setActualSets] =
    useState<Record<number, WorkoutSet[]>>({})

  const [planSets, setPlanSets] =
    useState<Record<number, WorkoutPlanSet[]>>({})

  const [workoutDate, setWorkoutDate] =
    useState(todayISO())

  const [workoutTopic, setWorkoutTopic] =
    useState('')

  const [newExerciseName, setNewExerciseName] =
    useState('')

  const [librarySearch, setLibrarySearch] =
    useState('')

  const [newHabitName, setNewHabitName] =
    useState('')

  const [habitSchedule, setHabitSchedule] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ])

  const [editingHabitId, setEditingHabitId] =
    useState<number | null>(null)

  const [editingHabitName, setEditingHabitName] =
    useState('')

  const [editingHabitSchedule, setEditingHabitSchedule] =
    useState<number[]>([])

  const [selectedHabitDate, setSelectedHabitDate] =
    useState(todayISO())

  const [calendarMonth, setCalendarMonth] =
    useState(() => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), 1)
    })

  const [selectedCalendarDate, setSelectedCalendarDate] =
    useState<string | null>(todayISO())
  const [reportRange, setReportRange] =
    useState<'day' | 'week' | 'month' | 'custom'>('week')

  const [reportStartDate, setReportStartDate] =
    useState(todayISO())

  const [reportEndDate, setReportEndDate] =
    useState(todayISO())

  const [reportRows, setReportRows] =
    useState<
      Array<{
        date: string
        topic: string
        exercise: string
        setNumber: number
        kg: number
        reps: number
        rpe: string
        note: string
      }>
    >([])

  const [reportSearch, setReportSearch] = useState('')

  const [savedMessage, setSavedMessage] =
    useState('')
  const [undoAction, setUndoAction] =
    useState<(() => Promise<void>) | null>(null)

  const completionMap = useMemo(() => {
    const map = new Map<string, Set<number>>()

    for (const item of completions) {
      if (!item.completed) continue

      const entries = map.get(item.date) ?? new Set<number>()
      entries.add(item.habitId)
      map.set(item.date, entries)
    }

    return map
  }, [completions])

  const habitMap = useMemo(
    () => new Map(habits.map(habit => [habit.id!, habit])),
    [habits]
  )

  const isHabitCompleted = useCallback(
    (habitId: number, date: string) =>
      completionMap.get(date)?.has(habitId) ?? false,
    [completionMap]
  )

  async function loadData() {
    const [
      exerciseData,
      workoutData,
      habitData,
      completionData,
    ] = await Promise.all([
      db.exercises.orderBy('name').toArray(),
      db.workouts.orderBy('date').reverse().toArray(),
      db.habits.orderBy('name').toArray(),
      db.habitCompletions.toArray(),
    ])

    setExercises(exerciseData)
    setWorkouts(workoutData)
    setHabits(habitData)
    setCompletions(completionData)
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([
      db.exercises.orderBy('name').toArray(),
      db.workouts.orderBy('date').reverse().toArray(),
      db.habits.orderBy('name').toArray(),
      db.habitCompletions.toArray(),
    ]).then(([exerciseData, workoutData, habitData, completionData]) => {
      if (cancelled) return

      setExercises(exerciseData)
      setWorkouts(workoutData)
      setHabits(habitData)
      setCompletions(completionData)
      setDataLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  function showSaved(message = 'Saved ✓') {
    setSavedMessage(message)

    window.setTimeout(() => {
      setSavedMessage('')
    }, 1200)
  }

  function showUndo(message: string, restore: () => Promise<void>) {
    setSavedMessage(message)
    setUndoAction(() => restore)

    window.setTimeout(() => {
      setSavedMessage('')
      setUndoAction(null)
    }, 5000)
  }

  async function toggleWeeklyNotifications() {
    if (weeklyNotificationsEnabled) {
      setWeeklyNotificationsEnabled(false)
      localStorage.setItem('weeklyNotificationsEnabled', 'false')
      return
    }

    if (typeof Notification === 'undefined') {
      alert('This browser does not support notifications.')
      return
    }

    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission

    if (permission !== 'granted') {
      alert('Notification permission was not granted.')
      return
    }

    setWeeklyNotificationsEnabled(true)
    localStorage.setItem('weeklyNotificationsEnabled', 'true')
    showSaved('Weekly notifications enabled ✓')
  }

  /* =========================
     HABITS
  ========================= */

  async function addHabit() {
    const name = newHabitName.trim()

    if (!name) return

    if (habitSchedule.length === 0) {
      alert('Hãy chọn ít nhất 1 ngày.')
      return
    }

    const exists = await db.habits
      .where('name')
      .equalsIgnoreCase(name)
      .first()

    if (exists) {
      alert('Habit này đã tồn tại.')
      return
    }

    await db.habits.add({
      name,
      createdAt: new Date(),
      schedule: habitSchedule,
    })

    setNewHabitName('')
    setHabitSchedule([0, 1, 2, 3, 4, 5, 6])
    await loadData()
  }

  async function saveHabitEdit(habitId: number) {
    const name = editingHabitName.trim()

    if (!name) return

    if (editingHabitSchedule.length === 0) {
      alert('Hãy chọn ít nhất 1 ngày.')
      return
    }

    await db.habits.update(habitId, {
      name,
      schedule: editingHabitSchedule,
    })

    setEditingHabitId(null)
    setEditingHabitName('')
    setEditingHabitSchedule([])

    await loadData()
  }

  async function deleteHabit(habitId: number) {
    const habit = await db.habits.get(habitId)

    if (!habit) return

    const habitCompletions = await db.habitCompletions
      .where('habitId')
      .equals(habitId)
      .toArray()

    const confirmed = confirm(
      `Xóa habit "${habit.name}"?\n\nLịch sử hoàn thành của habit này cũng sẽ bị xóa.`
    )

    if (!confirmed) return

    await db.transaction(
      'rw',
      [db.habits, db.habitCompletions],
      async () => {
        await db.habitCompletions
          .where('habitId')
          .equals(habitId)
          .delete()

        await db.habits.delete(habitId)
      }
    )

    showUndo(`Deleted ${habit.name}`, async () => {
      await db.transaction('rw', [db.habits, db.habitCompletions], async () => {
        await db.habits.add(habit)
        if (habitCompletions.length > 0) {
          await db.habitCompletions.bulkAdd(habitCompletions)
        }
      })
      setUndoAction(null)
      await loadData()
    })

    await loadData()
  }

  async function toggleHabit(
    habitId: number,
    date: string
  ) {
    const existing = await db.habitCompletions
      .where('[habitId+date]')
      .equals([habitId, date])
      .first()

    if (existing) {
      await db.habitCompletions.update(existing.id!, {
        completed: !existing.completed,
      })
    } else {
      await db.habitCompletions.add({
        habitId,
        date,
        completed: true,
      })
    }

    await loadData()
  }

  const calculateStreak = useCallback((habitId: number) => {
    const habit = habitMap.get(habitId)

    if (!habit || habit.schedule.length === 0) return 0

    const date = new Date()
    let streak = 0

    while (true) {
      const iso = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`

      const dayOfWeek = getDayOfWeek(iso)

      // Ngày không nằm trong lịch → bỏ qua
      if (!habit.schedule.includes(dayOfWeek)) {
        date.setDate(date.getDate() - 1)
        continue
      }

      // Ngày có lịch nhưng chưa hoàn thành → streak kết thúc
      if (!isHabitCompleted(habitId, iso)) {
        break
      }

      streak++

      date.setDate(date.getDate() - 1)
    }

    return streak
  }, [habitMap, isHabitCompleted])

  function calculateCompletionRate(habitId: number) {
    const habit = habitMap.get(habitId)

    if (!habit || habit.schedule.length === 0) {
      return 0
    }

    const start = new Date()
    start.setDate(start.getDate() - 29)

    let scheduledDays = 0
    let completed = 0

    for (let i = 0; i < 30; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)

      const iso = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`

      const dayOfWeek = getDayOfWeek(iso)

      if (!habit.schedule.includes(dayOfWeek)) {
        continue
      }

      scheduledDays++

      if (isHabitCompleted(habitId, iso)) {
        completed++
      }
    }

    if (scheduledDays === 0) {
      return 0
    }

    return Math.round(
      (completed / scheduledDays) * 100
    )
  }

  function getHistoryDaysCentered() {
    const days: string[] = []

    for (let i = -15; i <= 15; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)

      const iso = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`

      days.push(iso)
    }

    return days
  }

  /* =========================
     EXERCISES
  ========================= */

  async function addExercise() {
    const name = newExerciseName.trim()

    if (!name) return

    const exists = await db.exercises
      .where('name')
      .equalsIgnoreCase(name)
      .first()

    if (exists) {
      alert('Exercise này đã tồn tại.')
      return
    }

    await db.exercises.add({
      name,
      createdAt: new Date(),
    })

    setNewExerciseName('')
    await loadData()
  }

  async function deleteExercise(exerciseId: number) {
    const exercise = await db.exercises.get(exerciseId)

    if (!exercise) return

    const usedInWorkout = await db.workoutExercises
      .where('exerciseId')
      .equals(exerciseId)
      .first()

    if (usedInWorkout) {
      alert(
        `Không thể xóa "${exercise.name}".\n\n` +
        `Exercise này đã được sử dụng trong lịch sử workout.\n\n` +
        `Giữ lại exercise để đảm bảo dữ liệu workout cũ không bị mất.`
      )
      return
    }

    const confirmed = window.confirm(
      `Xóa "${exercise.name}" khỏi Exercise Library?\n\n` +
      `Exercise này chưa được sử dụng trong workout nên có thể xóa an toàn.\n\n` +
      `Bạn có chắc muốn tiếp tục?`
    )

    if (!confirmed) return

    await db.exercises.delete(exerciseId)

    await loadData()
  }

  /* =========================
     WORKOUT
  ========================= */

  function startNewWorkout() {
    setCurrentWorkoutId(null)
    setWorkoutExercises([])
    setWorkoutExerciseNames({})
    setActualSets({})
    setPlanSets({})
    setWorkoutDate(todayISO())
    setWorkoutTopic('')
  }

  async function createWorkout() {
    if (!workoutTopic.trim()) {
      alert('Nhập Workout Topic trước.')
      return
    }

    const id = await db.workouts.add({
      date: workoutDate,
      topic: workoutTopic.trim(),
      createdAt: new Date(),
      status: 'draft',
    })

    setCurrentWorkoutId(id)
    setWorkoutExercises([])
    setWorkoutExerciseNames({})
    setActualSets({})
    setPlanSets({})

    await loadData()
  }

  async function saveWorkoutTemplate() {
    if (!currentWorkoutId || workoutExercises.length === 0) {
      alert('Add at least one exercise before saving a template.')
      return
    }

    const template: WorkoutTemplate = {
      id: typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      name: workoutTopic.trim() || 'Workout Template',
      exercises: workoutExercises.map(item => ({
        exerciseId: item.exerciseId,
        order: item.order,
        planSets: (planSets[item.id!] ?? []).map(set => ({
          setNumber: set.setNumber,
          kg: set.kg,
          reps: set.reps,
          rpe: set.rpe,
          note: set.note,
        })),
      })),
    }

    setTemplates(current => [
      template,
      ...current.filter(item => item.name.toLowerCase() !== template.name.toLowerCase()),
    ])
    showSaved('Template saved ✓')
  }

  async function loadWorkoutTemplate(template: WorkoutTemplate) {
    const workoutId = await db.transaction(
      'rw',
      [db.workouts, db.workoutExercises, db.workoutPlanSets],
      async () => {
        const id = await db.workouts.add({
          date: todayISO(),
          topic: template.name,
          createdAt: new Date(),
          status: 'draft',
        })

        for (const templateExercise of template.exercises) {
          const workoutExerciseId = await db.workoutExercises.add({
            workoutId: id,
            exerciseId: templateExercise.exerciseId,
            order: templateExercise.order,
          })

          for (const planSet of templateExercise.planSets) {
            await db.workoutPlanSets.add({
              workoutExerciseId,
              setNumber: planSet.setNumber,
              kg: planSet.kg,
              reps: planSet.reps,
              rpe: planSet.rpe,
              note: planSet.note,
            })
          }
        }

        return id
      }
    )

    await loadData()
    await loadWorkout(workoutId)
    showSaved('Template loaded ✓')
  }

  function deleteWorkoutTemplate(templateId: string) {
    setTemplates(current => current.filter(template => template.id !== templateId))
  }

  async function loadWorkout(workoutId: number) {
    const workout = await db.workouts.get(
      workoutId
    )

    if (!workout) return

    const items = await db.workoutExercises
      .where('workoutId')
      .equals(workoutId)
      .sortBy('order')

    const names: Record<number, string> = {}

    for (const item of items) {
      const exercise = await db.exercises.get(
        item.exerciseId
      )

      if (item.id) {
        names[item.id] =
          exercise?.name ?? 'Unknown Exercise'
      }
    }

    const actual: Record<number, WorkoutSet[]> =
      {}

    const plans: Record<
      number,
      WorkoutPlanSet[]
    > = {}

    for (const item of items) {
      if (!item.id) continue

      actual[item.id] =
        await db.workoutSets
          .where('workoutExerciseId')
          .equals(item.id)
          .sortBy('setNumber')

      plans[item.id] =
        await db.workoutPlanSets
          .where('workoutExerciseId')
          .equals(item.id)
          .sortBy('setNumber')
    }

    setCurrentWorkoutId(workoutId)
    setWorkoutDate(workout.date)
    setWorkoutTopic(workout.topic)
    setWorkoutExercises(items)
    setWorkoutExerciseNames(names)
    setActualSets(actual)
    setPlanSets(plans)
  }

  async function addExerciseToWorkout(
    exerciseId: number
  ) {
    if (!currentWorkoutId) {
      alert('Tạo hoặc mở một workout trước.')
      return
    }

    const alreadyAdded =
      workoutExercises.some(
        item => item.exerciseId === exerciseId
      )

    if (alreadyAdded) {
      alert('Exercise đã có trong workout.')
      return
    }

    const nextOrder =
      workoutExercises.length > 0
        ? Math.max(
          ...workoutExercises.map(
            item => item.order
          )
        ) + 1
        : 1

    const id =
      await db.workoutExercises.add({
        workoutId: currentWorkoutId,
        exerciseId,
        order: nextOrder,
      })

    const exercise =
      await db.exercises.get(exerciseId)

    setWorkoutExercises(prev => [
      ...prev,
      {
        id,
        workoutId: currentWorkoutId,
        exerciseId,
        order: nextOrder,
      },
    ])

    setWorkoutExerciseNames(prev => ({
      ...prev,
      [id]:
        exercise?.name ??
        'Unknown Exercise',
    }))

    setActualSets(prev => ({
      ...prev,
      [id]: [],
    }))

    setPlanSets(prev => ({
      ...prev,
      [id]: [],
    }))

    showSaved()
  }

  async function removeExerciseFromWorkout(
    itemId: number
  ) {
    await db.workoutSets
      .where('workoutExerciseId')
      .equals(itemId)
      .delete()

    await db.workoutPlanSets
      .where('workoutExerciseId')
      .equals(itemId)
      .delete()

    await db.workoutExercises.delete(itemId)

    const remaining =
      workoutExercises
        .filter(
          item => item.id !== itemId
        )
        .map((item, index) => ({
          ...item,
          order: index + 1,
        }))

    for (const item of remaining) {
      if (item.id) {
        await db.workoutExercises.update(
          item.id,
          {
            order: item.order,
          }
        )
      }
    }

    setWorkoutExercises(remaining)

    setActualSets(prev => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })

    setPlanSets(prev => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })

    showSaved()
  }

  async function moveExercise(
    itemId: number,
    direction: 'up' | 'down'
  ) {
    const index =
      workoutExercises.findIndex(
        item => item.id === itemId
      )

    if (index < 0) return

    const newIndex =
      direction === 'up'
        ? index - 1
        : index + 1

    if (
      newIndex < 0 ||
      newIndex >= workoutExercises.length
    ) {
      return
    }

    const next = [...workoutExercises]

    const temp = next[index]

    next[index] = next[newIndex]
    next[newIndex] = temp

    const normalized = next.map(
      (item, i) => ({
        ...item,
        order: i + 1,
      })
    )

    for (const item of normalized) {
      if (item.id) {
        await db.workoutExercises.update(
          item.id,
          {
            order: item.order,
          }
        )
      }
    }

    setWorkoutExercises(normalized)

    showSaved()
  }

  async function deleteWorkout(
    workoutId: number
  ) {
    const workout =
      await db.workouts.get(workoutId)

    if (!workout) return

    const confirmed = confirm(
      `Xóa workout "${workout.topic}" ngày ${formatDate(
        workout.date
      )}?\n\nTất cả Plan và Actual của workout này sẽ bị xóa.`
    )

    if (!confirmed) return

    const items =
      await db.workoutExercises
        .where('workoutId')
        .equals(workoutId)
        .toArray()
    const itemIds = items.flatMap(item => item.id ? [item.id] : [])
    const workoutSets = itemIds.length > 0
      ? await db.workoutSets.where('workoutExerciseId').anyOf(itemIds).toArray()
      : []
    const workoutPlanSets = itemIds.length > 0
      ? await db.workoutPlanSets.where('workoutExerciseId').anyOf(itemIds).toArray()
      : []

    await db.transaction(
      'rw',
      [
        db.workouts,
        db.workoutExercises,
        db.workoutSets,
        db.workoutPlanSets,
      ],
      async () => {
        for (const item of items) {
          if (!item.id) continue

          await db.workoutSets
            .where('workoutExerciseId')
            .equals(item.id)
            .delete()

          await db.workoutPlanSets
            .where('workoutExerciseId')
            .equals(item.id)
            .delete()
        }

        await db.workoutExercises
          .where('workoutId')
          .equals(workoutId)
          .delete()

        await db.workouts.delete(workoutId)
      }
    )

    showUndo(`Deleted ${workout.topic}`, async () => {
      await db.transaction('rw', [db.workouts, db.workoutExercises, db.workoutSets, db.workoutPlanSets], async () => {
        await db.workouts.add(workout)
        if (items.length > 0) await db.workoutExercises.bulkAdd(items)
        if (workoutSets.length > 0) await db.workoutSets.bulkAdd(workoutSets)
        if (workoutPlanSets.length > 0) await db.workoutPlanSets.bulkAdd(workoutPlanSets)
      })
      setUndoAction(null)
      await loadData()
    })

    if (currentWorkoutId === workoutId) {
      startNewWorkout()
    }

    await loadData()
  }

  async function updateWorkoutInfo() {
    if (!currentWorkoutId) return

    await db.workouts.update(
      currentWorkoutId,
      {
        date: workoutDate,
        topic: workoutTopic.trim(),
        status: 'in_progress',
      }
    )

    await loadData()
    showSaved()
  }

  async function completeWorkout() {
    if (!currentWorkoutId) return

    await db.workouts.update(
      currentWorkoutId,
      {
        status: 'done',
      }
    )

    await loadData()
    showSaved()
  }

  /* =========================
     ACTUAL SETS
  ========================= */

  async function addActualSet(
    workoutExerciseId: number
  ) {
    const current =
      actualSets[workoutExerciseId] ?? []

    const nextNumber =
      current.length + 1

    const id =
      await db.workoutSets.add({
        workoutExerciseId,
        setNumber: nextNumber,
        kg: 0,
        reps: 0,
        rpe: undefined,
        note: '',
      })

    setActualSets(prev => ({
      ...prev,
      [workoutExerciseId]: [
        ...(prev[workoutExerciseId] ??
          []),
        {
          id,
          workoutExerciseId,
          setNumber: nextNumber,
          kg: 0,
          reps: 0,
          rpe: undefined,
          note: '',
        },
      ],
    }))

    showSaved()
  }

  async function updateActualSet(
    set: WorkoutSet,
    field: keyof WorkoutSet,
    value:
      | number
      | string
      | undefined
  ) {
    if (!set.id) return

    const updatedValue = typeof value === 'number' ? value : Number(value || 0)
    const newEstimated1RM = field === 'kg' || field === 'reps'
      ? (field === 'kg' ? updatedValue : set.kg || 0) * (1 + (field === 'reps' ? updatedValue : set.reps || 0) / 30)
      : 0
    const currentBest = Math.max(
      0,
      ...(actualSets[set.workoutExerciseId] ?? []).map(item =>
        (item.kg || 0) * (1 + (item.reps || 0) / 30)
      )
    )
    const createsPersonalRecord = (field === 'kg' || field === 'reps') && newEstimated1RM > currentBest

    await db.workoutSets.update(
      set.id,
      {
        [field]: value,
      }
    )

    setActualSets(prev => ({
      ...prev,
      [set.workoutExerciseId]: (
        prev[set.workoutExerciseId] ?? []
      ).map(item =>
        item.id === set.id
          ? {
            ...item,
            [field]: value,
          }
          : item
      ),
    }))

    showSaved(createsPersonalRecord ? 'New PR! 🎉' : 'Saved ✓')
  }

  async function deleteActualSet(
    workoutExerciseId: number,
    setId: number
  ) {
    await db.workoutSets.delete(setId)

    const current =
      actualSets[workoutExerciseId] ?? []

    const next = current
      .filter(item => item.id !== setId)
      .map((item, index) => ({
        ...item,
        setNumber: index + 1,
      }))

    for (const item of next) {
      if (item.id) {
        await db.workoutSets.update(
          item.id,
          {
            setNumber: item.setNumber,
          }
        )
      }
    }

    setActualSets(prev => ({
      ...prev,
      [workoutExerciseId]: next,
    }))

    showSaved()
  }

  async function copyPreviousSet(
    workoutExerciseId: number
  ) {
    const current =
      actualSets[workoutExerciseId] ?? []

    const previous =
      current[current.length - 1]

    if (!previous) {
      await addActualSet(
        workoutExerciseId
      )
      return
    }

    const nextNumber =
      current.length + 1

    const id =
      await db.workoutSets.add({
        workoutExerciseId,
        setNumber: nextNumber,
        kg: previous.kg,
        reps: previous.reps,
        rpe: previous.rpe,
        note: previous.note ?? '',
      })

    setActualSets(prev => ({
      ...prev,
      [workoutExerciseId]: [
        ...(prev[workoutExerciseId] ??
          []),
        {
          id,
          workoutExerciseId,
          setNumber: nextNumber,
          kg: previous.kg,
          reps: previous.reps,
          rpe: previous.rpe,
          note: previous.note ?? '',
        },
      ],
    }))

    showSaved()
  }
  async function copyPlanToActual(
    workoutExerciseId: number
  ) {
    const currentActuals =
      actualSets[workoutExerciseId] ?? []

    if (currentActuals.length > 0) {
      const confirmed = confirm(
        `Actual hiện có ${currentActuals.length} set.\n\nCopy Plan sẽ XÓA toàn bộ Actual hiện tại và thay bằng Plan.\n\nBạn có muốn tiếp tục không?`
      )

      if (!confirmed) return
    }

    const plans =
      planSets[workoutExerciseId] ?? []

    if (plans.length === 0) {
      alert('Chưa có Plan để copy sang Actual.')
      return
    }

    // Xóa Actual hiện tại
    await db.workoutSets
      .where('workoutExerciseId')
      .equals(workoutExerciseId)
      .delete()

    // Tạo Actual mới từ Plan
    const newActuals: WorkoutSet[] = []

    for (const planSet of plans) {
      const id =
        await db.workoutSets.add({
          workoutExerciseId,
          setNumber: planSet.setNumber,
          kg: planSet.kg ?? 0,
          reps: planSet.reps ?? 0,
          rpe: planSet.rpe,
          note: planSet.note ?? '',
        })

      newActuals.push({
        id,
        workoutExerciseId,
        setNumber: planSet.setNumber,
        kg: planSet.kg ?? 0,
        reps: planSet.reps ?? 0,
        rpe: planSet.rpe,
        note: planSet.note ?? '',
      })
    }

    setActualSets(prev => ({
      ...prev,
      [workoutExerciseId]: newActuals,
    }))

    showSaved()
  }

  /* =========================
     PLAN SETS
  ========================= */

  async function addPlanSet(
    workoutExerciseId: number
  ) {
    const current =
      planSets[workoutExerciseId] ?? []

    const nextNumber =
      current.length + 1

    const id =
      await db.workoutPlanSets.add({
        workoutExerciseId,
        setNumber: nextNumber,
        kg: undefined,
        reps: undefined,
        rpe: undefined,
        note: '',
      })

    setPlanSets(prev => ({
      ...prev,
      [workoutExerciseId]: [
        ...(prev[workoutExerciseId] ??
          []),
        {
          id,
          workoutExerciseId,
          setNumber: nextNumber,
          kg: undefined,
          reps: undefined,
          rpe: undefined,
          note: '',
        },
      ],
    }))

    showSaved()
  }

  async function updatePlanSet(
    set: WorkoutPlanSet,
    field: keyof WorkoutPlanSet,
    value:
      | number
      | string
      | undefined
  ) {
    if (!set.id) return

    await db.workoutPlanSets.update(
      set.id,
      {
        [field]: value,
      }
    )

    setPlanSets(prev => ({
      ...prev,
      [set.workoutExerciseId]: (
        prev[set.workoutExerciseId] ?? []
      ).map(item =>
        item.id === set.id
          ? {
            ...item,
            [field]: value,
          }
          : item
      ),
    }))

    showSaved()
  }

  async function deletePlanSet(
    workoutExerciseId: number,
    setId: number
  ) {
    await db.workoutPlanSets.delete(
      setId
    )

    const current =
      planSets[workoutExerciseId] ?? []

    const next = current
      .filter(item => item.id !== setId)
      .map((item, index) => ({
        ...item,
        setNumber: index + 1,
      }))

    for (const item of next) {
      if (item.id) {
        await db.workoutPlanSets.update(
          item.id,
          {
            setNumber: item.setNumber,
          }
        )
      }
    }

    setPlanSets(prev => ({
      ...prev,
      [workoutExerciseId]: next,
    }))

    showSaved()
  }
  async function exportBackup() {
    const backup = {
      app: 'Gym & Habit Tracker',
      version: 1,
      exportedAt: new Date().toISOString(),

      exercises: await db.exercises.toArray(),
      workouts: await db.workouts.toArray(),
      workoutExercises: await db.workoutExercises.toArray(),
      workoutSets: await db.workoutSets.toArray(),
      workoutPlanSets: await db.workoutPlanSets.toArray(),
      habits: await db.habits.toArray(),
      habitCompletions: await db.habitCompletions.toArray(),
    }

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: 'application/json' }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `gym-habit-backup-${todayISO()}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  async function importBackupFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (
        !backup ||
        !Array.isArray(backup.exercises) ||
        !Array.isArray(backup.workouts) ||
        !Array.isArray(backup.workoutExercises) ||
        !Array.isArray(backup.workoutSets) ||
        !Array.isArray(backup.workoutPlanSets) ||
        !Array.isArray(backup.habits) ||
        !Array.isArray(backup.habitCompletions)
      ) {
        throw new Error('Invalid backup format')
      }

      const confirmed = window.confirm(
        'Khôi phục backup?\n\n' +
        'Dữ liệu hiện tại sẽ bị XÓA và thay bằng dữ liệu trong file backup.\n\n' +
        'Hành động này không thể hoàn tác.'
      )

      if (!confirmed) {
        event.target.value = ''
        return
      }

      await db.transaction(
        'rw',
        [
          db.exercises,
          db.workouts,
          db.workoutExercises,
          db.workoutSets,
          db.workoutPlanSets,
          db.habits,
          db.habitCompletions,
        ],
        async () => {
          await db.exercises.clear()
          await db.workouts.clear()
          await db.workoutExercises.clear()
          await db.workoutSets.clear()
          await db.workoutPlanSets.clear()
          await db.habits.clear()
          await db.habitCompletions.clear()

          await db.exercises.bulkAdd(
            backup.exercises.map((item: Exercise) => ({
              ...item,
              createdAt: new Date(item.createdAt),
            }))
          )

          await db.workouts.bulkAdd(
            backup.workouts.map((item: Workout) => ({
              ...item,
              createdAt: new Date(item.createdAt),
            }))
          )

          await db.workoutExercises.bulkAdd(
            backup.workoutExercises
          )

          await db.workoutSets.bulkAdd(
            backup.workoutSets
          )

          await db.workoutPlanSets.bulkAdd(
            backup.workoutPlanSets
          )

          await db.habits.bulkAdd(
            backup.habits.map((item: Habit) => ({
              ...item,
              createdAt: new Date(item.createdAt),
            }))
          )

          await db.habitCompletions.bulkAdd(
            backup.habitCompletions
          )
        }
      )

      setCurrentWorkoutId(null)
      setWorkoutExercises([])
      setWorkoutExerciseNames({})
      setActualSets({})
      setPlanSets({})
      setWorkoutDate(todayISO())
      setWorkoutTopic('')

      await loadData()

      alert('Khôi phục backup thành công.')
    } catch (error) {
      console.error(error)
      alert(
        'Không thể khôi phục file backup.\n\n' +
        'Hãy chắc chắn đây là file backup của Gym & Habit Tracker.'
      )
    }

    event.target.value = ''
  }
  /* =========================
   ANALYTICS
========================= */
  const [selectedAnalyticsExercise, setSelectedAnalyticsExercise] =
    useState<number | null>(null)
  const [analyticsMetric, setAnalyticsMetric] =
    useState<'estimated1RM' | 'weight' | 'reps'>('estimated1RM')
  const [analytics, setAnalytics] = useState({
    totalVolume: 0,
    totalSets: 0,
    bestEstimated1RM: 0,
    bestEstimated1RMExercise: '',
    exerciseStats: [] as {
      exerciseId: number
      name: string
      volume: number
      sets: number
      estimated1RM: number
    }[],

    prStats: [] as {
      exerciseId: number
      name: string
      bestWeight: number
      bestReps: number
      bestEstimated1RM: number
      progressPercent: number
    }[],
    progression: [] as {
      date: string
      weight: number
      reps: number
      estimated1RM: number
    }[],
  })

  useEffect(() => {
    if (page !== 'Analytics') return

    let cancelled = false

    async function loadAnalytics() {
      const [allWorkoutExercises, allWorkoutSets] = await Promise.all([
        db.workoutExercises.toArray(),
        db.workoutSets.toArray(),
      ])

      const exerciseMap = new Map(
        exercises.map(exercise => [exercise.id!, exercise.name])
      )

      const setsByWorkoutExercise = new Map<number, WorkoutSet[]>()
      const setsByExercise = new Map<number, WorkoutSet[]>()
      const workoutExercisesByWorkout = new Map<number, WorkoutExercise[]>()

      for (const set of allWorkoutSets) {
        const current = setsByWorkoutExercise.get(set.workoutExerciseId) ?? []
        current.push(set)
        setsByWorkoutExercise.set(set.workoutExerciseId, current)
      }

      for (const workoutExercise of allWorkoutExercises) {
        const workoutItems = workoutExercisesByWorkout.get(workoutExercise.workoutId) ?? []
        workoutItems.push(workoutExercise)
        workoutExercisesByWorkout.set(workoutExercise.workoutId, workoutItems)

        const exerciseSets = setsByExercise.get(workoutExercise.exerciseId) ?? []
        exerciseSets.push(...(setsByWorkoutExercise.get(workoutExercise.id!) ?? []))
        setsByExercise.set(workoutExercise.exerciseId, exerciseSets)
      }

      const stats = new Map<
        number,
        {
          exerciseId: number
          name: string
          volume: number
          sets: number
          estimated1RM: number
        }
      >()

      let totalVolume = 0
      let totalSets = 0
      let bestEstimated1RM = 0
      let bestEstimated1RMExercise = ''

      for (const workoutExercise of allWorkoutExercises) {
        const exerciseId = workoutExercise.exerciseId
        const exerciseName =
          exerciseMap.get(exerciseId) ?? 'Unknown Exercise'

        const currentStat = stats.get(exerciseId) ?? {
          exerciseId,
          name: exerciseName,
          volume: 0,
          sets: 0,
          estimated1RM: 0,
        }

        const sets = setsByWorkoutExercise.get(workoutExercise.id!) ?? []

        for (const set of sets) {
          const volume = (set.kg || 0) * (set.reps || 0)
          const estimated1RM = (set.kg || 0) * (1 + (set.reps || 0) / 30)

          currentStat.volume += volume
          currentStat.sets += 1

          totalVolume += volume
          totalSets += 1

          if (estimated1RM > currentStat.estimated1RM) {
            currentStat.estimated1RM = estimated1RM
          }

          if (estimated1RM > bestEstimated1RM) {
            bestEstimated1RM = estimated1RM
            bestEstimated1RMExercise = exerciseName
          }
        }

        stats.set(exerciseId, currentStat)
      }

      const progressionData = new Map<
        number,
        {
          date: string
          weight: number
          reps: number
          estimated1RM: number
        }[]
      >()

      for (const workout of workouts) {
        const workoutExerciseItems = workoutExercisesByWorkout.get(workout.id!) ?? []

        for (const workoutExercise of workoutExerciseItems) {
          const sets = setsByWorkoutExercise.get(workoutExercise.id!) ?? []

          if (sets.length === 0) continue

          const bestSet = sets.reduce((best, set) => {
            const current1RM = (set.kg || 0) * (1 + (set.reps || 0) / 30)
            const best1RM = (best.kg || 0) * (1 + (best.reps || 0) / 30)

            return current1RM > best1RM ? set : best
          }, sets[0])

          const point = {
            date: workout.date,
            weight: bestSet.kg || 0,
            reps: bestSet.reps || 0,
            estimated1RM: (bestSet.kg || 0) * (1 + (bestSet.reps || 0) / 30),
          }

          const currentProgression = progressionData.get(workoutExercise.exerciseId) ?? []
          currentProgression.push(point)
          progressionData.set(workoutExercise.exerciseId, currentProgression)
        }
      }

      const exerciseStats = Array.from(stats.values()).sort((a, b) => b.volume - a.volume)

      const prStats = exerciseStats
        .map(exercise => {
          const exerciseSets = setsByExercise.get(exercise.exerciseId) ?? []
          const estimatedValues = exerciseSets.map(
            set => (set.kg || 0) * (1 + (set.reps || 0) / 30)
          )
          const firstEstimated1RM = estimatedValues.length > 0
            ? Math.min(...estimatedValues)
            : 0

          const progressPercent =
            firstEstimated1RM > 0
              ? ((exercise.estimated1RM - firstEstimated1RM) / firstEstimated1RM) * 100
              : 0

          const bestWeight =
            exerciseSets.length > 0 ? Math.max(...exerciseSets.map(set => set.kg || 0)) : 0

          const bestReps =
            exerciseSets.length > 0 ? Math.max(...exerciseSets.map(set => set.reps || 0)) : 0

          const bestEstimated1RMValue =
            estimatedValues.length > 0 ? Math.max(...estimatedValues) : 0

          return {
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            bestWeight,
            bestReps,
            bestEstimated1RM: bestEstimated1RMValue,
            progressPercent,
          }
        })
        .sort((a, b) => b.bestEstimated1RM - a.bestEstimated1RM)

      const nextAnalytics = {
        totalVolume,
        totalSets,
        bestEstimated1RM,
        bestEstimated1RMExercise,
        exerciseStats,
        prStats,
        progression: selectedAnalyticsExercise
          ? progressionData.get(selectedAnalyticsExercise) ?? []
          : [],
      }

      if (!cancelled) {
        setAnalytics(nextAnalytics)
      }
    }

    loadAnalytics()

    return () => {
      cancelled = true
    }
  }, [page, exercises, workouts, selectedAnalyticsExercise])
  /* =========================
     DERIVED DATA
  ========================= */

  const todayHabits = useMemo(
    () =>
      habits
        .filter(habit =>
          habit.schedule.includes(
            getDayOfWeek(todayISO())
          )
        )
        .map(habit => ({
          ...habit,
          completed: isHabitCompleted(
            habit.id!,
            todayISO()
          ),
        })),
    [habits, isHabitCompleted]
  )

  const bestCurrentStreak = useMemo(
    () => habits.reduce(
      (best, habit) => Math.max(best, calculateStreak(habit.id!)),
      0
    ),
    [habits, calculateStreak]
  )

  const weeklyHabitSummary = useMemo(() => {
    const today = new Date()

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const scheduled = habits.filter(habit => habit.schedule.includes(date.getDay()))
      const completed = scheduled.filter(habit => completionMap.get(iso)?.has(habit.id!) ?? false).length

      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
        total: scheduled.length,
      }
    })
  }, [habits, completionMap])

  const selectedDateHabits =
    habits.map(habit => ({
      ...habit,
      completed: isHabitCompleted(
        habit.id!,
        selectedHabitDate
      ),
    }))

  const historyDays = getHistoryDaysCentered()
  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()

  const calendarMonthName = calendarMonth.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  )

  const firstDayOfMonth = new Date(
    calendarYear,
    calendarMonthIndex,
    1
  )

  const lastDayOfMonth = new Date(
    calendarYear,
    calendarMonthIndex + 1,
    0
  )

  const calendarStartDay =
    firstDayOfMonth.getDay()

  const calendarDaysInMonth =
    lastDayOfMonth.getDate()

  const calendarCells = Array.from(
    {
      length:
        Math.ceil(
          (calendarStartDay +
            calendarDaysInMonth) /
          7
        ) * 7,
    },
    (_, index) => {
      const dayNumber =
        index - calendarStartDay + 1

      if (
        dayNumber < 1 ||
        dayNumber > calendarDaysInMonth
      ) {
        return null
      }

      const date = new Date(
        calendarYear,
        calendarMonthIndex,
        dayNumber
      )

      const iso =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}-${String(
          date.getDate()
        ).padStart(2, '0')}`

      return iso
    }
  )

  const selectedCalendarWorkouts =
    selectedCalendarDate
      ? workouts.filter(
        workout =>
          workout.date ===
          selectedCalendarDate
      )
      : []

  const selectedCalendarHabits =
    selectedCalendarDate
      ? habits.map(habit => ({
        ...habit,
        completed: isHabitCompleted(
          habit.id!,
          selectedCalendarDate
        ),
      }))
      : []

  function changeCalendarMonth(
    direction: number
  ) {
    setCalendarMonth(
      new Date(
        calendarYear,
        calendarMonthIndex + direction,
        1
      )
    )
  }

  function goToCalendarToday() {
    const now = new Date()

    setCalendarMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    )

    setSelectedCalendarDate(
      todayISO()
    )
  }

  function hasWorkoutOnDate(date: string) {
    return workouts.some(
      workout =>
        workout.date === date
    )
  }

  function hasCompletedHabitOnDate(
    date: string
  ) {
    return completions.some(
      completion =>
        completion.date === date &&
        completion.completed
    )
  }

  /* =========================
     UI
  ========================= */
  const reportDates = useMemo(() => {
    const today = new Date()

    let start = new Date(today)
    let end = new Date(today)

    if (reportRange === 'day') {
      start = new Date(today)
      end = new Date(today)
    }

    if (reportRange === 'week') {
      start = new Date(today)
      start.setDate(today.getDate() - 6)
      end = new Date(today)
    }

    if (reportRange === 'month') {
      start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
      end = new Date(today)
    }

    if (reportRange === 'custom') {
      start = new Date(
        `${reportStartDate}T00:00:00`
      )

      end = new Date(
        `${reportEndDate}T00:00:00`
      )
    }

    const dates: string[] = []
    const cursor = new Date(start)

    while (cursor <= end) {
      dates.push(
        `${cursor.getFullYear()}-${String(
          cursor.getMonth() + 1
        ).padStart(2, '0')}-${String(
          cursor.getDate()
        ).padStart(2, '0')}`
      )

      cursor.setDate(
        cursor.getDate() + 1
      )
    }

    return dates
  }, [
    reportRange,
    reportStartDate,
    reportEndDate,
  ])

  const reportWorkouts = useMemo(
    () =>
      workouts.filter(workout =>
        reportDates.includes(workout.date)
      ),
    [workouts, reportDates]
  )

  const visibleReportRows = useMemo(() => {
    const query = reportSearch.trim().toLowerCase()
    if (!query) return reportRows

    return reportRows.filter(row =>
      [row.date, row.topic, row.exercise, row.note].some(value =>
        value.toLowerCase().includes(query)
      )
    )
  }, [reportRows, reportSearch])

  const getReportRows = useCallback(async () => {
    const [workoutItems, exercisesData, sets] = await Promise.all([
      db.workoutExercises.toArray(),
      db.exercises.toArray(),
      db.workoutSets.toArray(),
    ])

    const exerciseNames = new Map(
      exercisesData.map(exercise => [exercise.id!, exercise.name])
    )
    const setsByWorkoutExercise = new Map<number, WorkoutSet[]>()

    for (const set of sets) {
      const current = setsByWorkoutExercise.get(set.workoutExerciseId) ?? []
      current.push(set)
      setsByWorkoutExercise.set(set.workoutExerciseId, current)
    }

    const rows: Array<{
      date: string
      topic: string
      exercise: string
      setNumber: number
      kg: number
      reps: number
      rpe: string
      note: string
    }> = []

    for (const workout of reportWorkouts) {
      const items = workoutItems
        .filter(item => item.workoutId === workout.id)
        .sort((a, b) => a.order - b.order)

      for (const workoutItem of items) {
        if (!workoutItem.id) continue

        const workoutSets = (setsByWorkoutExercise.get(workoutItem.id) ?? [])
          .slice()
          .sort((a, b) => a.setNumber - b.setNumber)

        for (const set of workoutSets) {
          rows.push({
            date: workout.date,
            topic: workout.topic,
            exercise: exerciseNames.get(workoutItem.exerciseId) ?? 'Unknown Exercise',
            setNumber: set.setNumber,
            kg: set.kg,
            reps: set.reps,
            rpe:
              set.rpe !== undefined
                ? String(set.rpe)
                : '',
            note: set.note ?? '',
          })
        }
      }
    }

    return rows
  }, [reportWorkouts])

  async function loadReport() {
    setReportRows(await getReportRows())
  }

  useEffect(() => {
    if (page !== 'Reports') return

    let cancelled = false

    getReportRows().then(rows => {
      if (!cancelled) setReportRows(rows)
    })

    return () => {
      cancelled = true
    }
  }, [
    page,
    reportRange,
    reportStartDate,
    reportEndDate,
    workouts,
    getReportRows,
  ])

  async function generatePDF() {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])

    const rows = await getReportRows()

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('GYM TRAINING REPORT', 14, 20)

    doc.setFontSize(10)
    doc.text(
      `${reportStartDate} - ${reportEndDate}`,
      14,
      28
    )

    const tableRows = rows.map(row => [
      row.date,
      row.topic,
      row.exercise,
      `Set ${row.setNumber}`,
      `${row.kg} kg`,
      String(row.reps),
      row.rpe,
      row.note,
    ])

    autoTable(doc, {
      startY: 35,
      head: [[
        'Date',
        'Topic',
        'Exercise',
        'Set',
        'KG',
        'Reps',
        'RPE',
        'Note',
      ]],
      body: tableRows,
      styles: {
        fontSize: 8,
      },
    })

    doc.save(
      `gym-report-${reportStartDate}-${reportEndDate}.pdf`
    )
  }

  function exportCSV() {
    const headers = [
      'Date',
      'Topic',
      'Exercise',
      'Set',
      'KG',
      'Reps',
      'RPE',
      'Note',
    ]

    const rows = reportRows.map(row => [
      row.date,
      row.topic,
      row.exercise,
      row.setNumber,
      row.kg,
      row.reps,
      row.rpe,
      row.note,
    ])

    const csv = [
      headers,
      ...rows,
    ]
      .map(row =>
        row
          .map(value =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\n')

    const blob = new Blob(
      ['\uFEFF' + csv],
      {
        type: 'text/csv;charset=utf-8;',
      }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download =
      `gym-report-${reportStartDate}-${reportEndDate}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }
  const navItems: Page[] = [
    'Dashboard',
    'Habits',
    'Gym',
    'Calendar',
    'Analytics',
    'Reports',
    'Settings',
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">

        <SidebarNav page={page} onSelect={setPage} />

        {/* MAIN */}
        <main className="min-w-0 flex-1 bg-slate-100 pb-24 transition-colors lg:pb-6 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6 lg:p-8">

            {/* HEADER */}
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6 sm:gap-4">
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">
                  {page}
                </h1>

                <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                  {formatDate(todayISO())}
                </p>
              </div>

              {savedMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-green-100 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-200">
                  <span>{savedMessage}</span>
                  {undoAction && (
                    <button
                      type="button"
                      onClick={() => void undoAction()}
                      className="rounded-lg bg-green-700 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-green-800 dark:bg-green-200 dark:text-green-950 dark:hover:bg-white"
                    >
                      Undo
                    </button>
                  )}
                </div>
              )}
            </div>

            {page === 'Dashboard' && (
              <DashboardPage
                todayHabits={todayHabits}
                bestCurrentStreak={bestCurrentStreak}
                weeklyHabitSummary={weeklyHabitSummary}
                workouts={workouts}
                exercises={exercises}
                setPage={setPage}
                toggleHabit={toggleHabit}
                loadWorkout={loadWorkout}
                formatDate={formatDate}
                todayISO={todayISO}
              />
            )}

            {/* HABITS */}
            {page === 'Habits' && (
              <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
                        Habit Studio
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                        Add Habit
                      </h2>
                    </div>

                    <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
                      {habitSchedule.length} active days
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                        Habit name
                      </label>
                      <input
                        value={newHabitName}
                        onChange={e => setNewHabitName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229) {
                            e.preventDefault()
                            addHabit()
                          }
                        }}
                        placeholder="For example: Drink 2L water"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-400"
                      />
                    </div>

                    <div className="xl:min-w-[300px]">
                      <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        Schedule
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          [1, 'Mon'],
                          [2, 'Tue'],
                          [3, 'Wed'],
                          [4, 'Thu'],
                          [5, 'Fri'],
                          [6, 'Sat'],
                          [0, 'Sun'],
                        ].map(([day, label]) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const dayNumber = day as number

                              setHabitSchedule(current =>
                                current.includes(dayNumber)
                                  ? current.filter(item => item !== dayNumber)
                                  : [...current, dayNumber].sort((a, b) => a - b)
                              )
                            }}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${habitSchedule.includes(day as number)
                              ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={addHabit}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      + Add Habit
                    </button>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        Daily Tracker
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Check off your habits for the selected day.
                      </p>
                    </div>

                    <input
                      type="date"
                      value={selectedHabitDate}
                      onChange={e => setSelectedHabitDate(e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-3">
                    {selectedDateHabits.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                        No habits yet for this date. Create your first habit to start tracking.
                      </div>
                    )}

                    {selectedDateHabits.map(habit => (
                      <div
                        key={habit.id}
                        className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-500 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <button
                            onClick={() => toggleHabit(habit.id!, selectedHabitDate)}
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg font-bold ${habit.completed
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                              : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400'
                              }`}
                          >
                            {habit.completed ? '✓' : ''}
                          </button>

                          <div className="min-w-0">
                            {editingHabitId === habit.id ? (
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <input
                                    value={editingHabitName}
                                    onChange={e => setEditingHabitName(e.target.value)}
                                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                  />

                                  <button
                                    onClick={() => saveHabitEdit(habit.id!)}
                                    className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                                  >
                                    Save
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { label: 'Mon', value: 1 },
                                    { label: 'Tue', value: 2 },
                                    { label: 'Wed', value: 3 },
                                    { label: 'Thu', value: 4 },
                                    { label: 'Fri', value: 5 },
                                    { label: 'Sat', value: 6 },
                                    { label: 'Sun', value: 0 },
                                  ].map(day => (
                                    <button
                                      key={day.value}
                                      type="button"
                                      onClick={() => {
                                        setEditingHabitSchedule(prev =>
                                          prev.includes(day.value)
                                            ? prev.filter(item => item !== day.value)
                                            : [...prev, day.value]
                                        )
                                      }}
                                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${editingHabitSchedule.includes(day.value)
                                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
                                        }`}
                                    >
                                      {day.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-base font-semibold text-slate-900 dark:text-white">
                                  {habit.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {habit.completed ? 'Completed' : 'Not completed'}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="rounded-xl bg-orange-100 px-3 py-2 text-sm font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                            🔥 {calculateStreak(habit.id!)} streak
                          </div>

                          <div className="rounded-xl bg-cyan-100 px-3 py-2 text-sm font-medium text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                            📊 {calculateCompletionRate(habit.id!)}% / 30d
                          </div>

                          {editingHabitId !== habit.id && (
                            <button
                              onClick={() => {
                                setEditingHabitId(habit.id!)
                                setEditingHabitName(habit.name)
                                setEditingHabitSchedule(habit.schedule)
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Edit
                            </button>
                          )}

                          <button
                            onClick={() => deleteHabit(habit.id!)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="mb-5 flex flex-col gap-1">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      30-Day History
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Past to present. Today sits on the far right.
                    </p>
                  </div>

                  {habits.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                      Create a habit to start tracking its history.
                    </div>
                  ) : (
                    <div className="overflow-x-auto pb-2">
                      <div className="min-w-[900px]">
                        <div className="mb-3 grid grid-cols-[180px_repeat(31,minmax(38px,1fr))] gap-1">
                          <div className="flex items-end pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Habit
                          </div>

                          {historyDays.map(date => {
                            const isToday = date === todayISO()
                            const [year, month, day] = date.split('-').map(Number)
                            const d = new Date(year, month - 1, day)
                            const dayOfWeek = d.getDay()
                            const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                            const weekday = weekdayLabels[dayOfWeek]

                            return (
                              <div
                                key={date}
                                title={formatDate(date)}
                                className={`flex flex-col items-center justify-end rounded-xl py-1.5 text-center ${isToday
                                  ? 'bg-cyan-500/10 font-bold text-cyan-700 ring-1 ring-cyan-400 dark:text-cyan-200'
                                  : 'text-slate-500 dark:text-slate-400'
                                  }`}
                              >
                                <span className="text-[10px] font-semibold">{weekday}</span>
                                <span className="text-[9px]">
                                  {String(day).padStart(2, '0')}/{String(month).padStart(2, '0')}
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        <div className="space-y-2">
                          {habits.map(habit => (
                            <div
                              key={habit.id}
                              className="grid grid-cols-[180px_repeat(31,minmax(24px,1fr))] gap-1"
                            >
                              <div className="flex min-w-0 items-center pr-3">
                                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {habit.name}
                                </span>
                              </div>

                              {historyDays.map(date => {
                                const completed = isHabitCompleted(habit.id!, date)
                                const isToday = date === todayISO()
                                const isFuture = date > todayISO()

                                return (
                                  <button
                                    key={date}
                                    onClick={() => {
                                      if (!isFuture) toggleHabit(habit.id!, date)
                                    }}
                                    disabled={isFuture}
                                    title={`${habit.name} — ${formatDate(date)}`}
                                    className={`h-9 rounded-lg transition ${isFuture
                                      ? 'cursor-not-allowed bg-slate-100 opacity-30 dark:bg-slate-800'
                                      : completed
                                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/25'
                                        : isToday
                                          ? 'bg-slate-100 ring-2 ring-cyan-400 dark:bg-slate-800'
                                          : 'bg-slate-100 dark:bg-slate-800'
                                      }`}
                                  >
                                    {completed && (
                                      <span className="text-xs font-bold text-white">✓</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-800" />
                            Not completed
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded bg-emerald-500" />
                            Completed
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded bg-slate-100 ring-2 ring-cyan-400 dark:bg-slate-800" />
                            Today
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {page === 'Gym' && (
              <GymPage
                currentWorkoutId={currentWorkoutId}
                workouts={workouts}
                exercises={exercises}
                exerciseLibraryOpen={exerciseLibraryOpen}
                exerciseDeletionEnabled={exerciseDeletionEnabled}
                expandedExercises={expandedExercises}
                librarySearch={librarySearch}
                newExerciseName={newExerciseName}
                workoutExercises={workoutExercises}
                workoutExerciseNames={workoutExerciseNames}
                actualSets={actualSets}
                planSets={planSets}
                workoutDate={workoutDate}
                workoutTopic={workoutTopic}
                templates={templates}
                setExerciseLibraryOpen={setExerciseLibraryOpen}
                setExerciseDeletionEnabled={setExerciseDeletionEnabled}
                setExpandedExercises={setExpandedExercises}
                setLibrarySearch={setLibrarySearch}
                setNewExerciseName={setNewExerciseName}
                setWorkoutDate={setWorkoutDate}
                setWorkoutTopic={setWorkoutTopic}
                saveWorkoutTemplate={saveWorkoutTemplate}
                loadWorkoutTemplate={loadWorkoutTemplate}
                deleteWorkoutTemplate={deleteWorkoutTemplate}
                startNewWorkout={startNewWorkout}
                createWorkout={createWorkout}
                loadWorkout={loadWorkout}
                addExerciseToWorkout={addExerciseToWorkout}
                removeExerciseFromWorkout={removeExerciseFromWorkout}
                moveExercise={moveExercise}
                addExercise={addExercise}
                deleteExercise={deleteExercise}
                deleteWorkout={deleteWorkout}
                updateWorkoutInfo={updateWorkoutInfo}
                completeWorkout={completeWorkout}
                addActualSet={addActualSet}
                updateActualSet={updateActualSet}
                deleteActualSet={deleteActualSet}
                copyPreviousSet={copyPreviousSet}
                copyPlanToActual={copyPlanToActual}
                addPlanSet={addPlanSet}
                updatePlanSet={updatePlanSet}
                deletePlanSet={deletePlanSet}
                formatDate={formatDate}
              />
            )}

            {/* CALENDAR */}
            {page === 'Calendar' && (
              <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Calendar</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Training Calendar</h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quick view of habits and workouts by day.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => changeCalendarMonth(-1)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">←</button>
                      <button onClick={goToCalendarToday} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Today</button>
                      <button onClick={() => changeCalendarMonth(1)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">→</button>
                    </div>
                  </div>

                  <div className="mb-4 text-center text-xl font-black text-slate-900 dark:text-white">{calendarMonthName}</div>

                  <div className="mb-2 grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarCells.map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} className="min-h-[96px] rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/50" />
                      }

                      const isToday = date === todayISO()
                      const isSelected = date === selectedCalendarDate
                      const hasWorkout = hasWorkoutOnDate(date)
                      const hasHabit = hasCompletedHabitOnDate(date)

                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedCalendarDate(date)}
                          className={`min-h-[96px] rounded-2xl border p-2 text-left transition ${
                            isSelected
                              ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200 dark:border-violet-400 dark:bg-violet-950/30 dark:ring-violet-500/30'
                              : isToday
                                ? 'border-violet-300 bg-violet-50/60 dark:border-violet-700 dark:bg-violet-950/20'
                                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-violet-600 text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                            {Number(date.slice(8, 10))}
                          </div>

                          <div className="space-y-1">
                            {hasWorkout && <div className="truncate rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">🏋 Workout</div>}
                            {hasHabit && <div className="truncate rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">✓ Habit</div>}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-900 dark:bg-slate-100" />Workout</div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" />Habit completed</div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-violet-600" />Today</div>
                  </div>
                </section>

                {selectedCalendarDate && (
                  <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="mb-5">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Day Details</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatDate(selectedCalendarDate)}</h2>
                    </div>

                    <div className="mb-6">
                      <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">🏋 Workout</h3>

                      {selectedCalendarWorkouts.length > 0 ? (
                        <div className="space-y-3">
                          {selectedCalendarWorkouts.map(workout => (
                            <div key={workout.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="text-base font-bold text-slate-900 dark:text-white">{workout.topic}</div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400">{formatDate(workout.date)}</div>
                                </div>
                                <button onClick={() => loadWorkout(workout.id!)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">Open Workout</button>
                              </div>

                              <div className="text-sm text-slate-500 dark:text-slate-400">Workout created for this day.</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">No workout for this day.</div>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">✓ Habits</h3>
                        <button onClick={() => { setSelectedHabitDate(selectedCalendarDate); setPage('Habits') }} className="text-sm font-medium text-violet-600 transition hover:text-violet-500 dark:text-violet-300 dark:hover:text-violet-200">Open Habits</button>
                      </div>

                      {selectedCalendarHabits.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">No habits for this day.</div>
                      ) : (
                        <div className="space-y-2">
                          {selectedCalendarHabits.map(habit => (
                            <button key={habit.id} onClick={() => toggleHabit(habit.id!, selectedCalendarDate)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-700">
                              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${habit.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-600'}`}>
                                {habit.completed ? '✓' : ''}
                              </span>

                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 dark:text-slate-100">{habit.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{habit.completed ? 'Completed' : 'Not completed'}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
            {/* ANALYTICS */}
            {page === 'Analytics' && (
              <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Training Analytics</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Analytics</h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aggregated actual data from your workouts.</p>
                </section>

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-violet-950/40 dark:to-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">Total Volume</p><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{analytics.totalVolume.toLocaleString()}<span className="ml-1 text-sm font-normal text-slate-400">kg</span></p></div>
                  <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><p className="text-sm text-slate-500 dark:text-slate-400">Total Sets</p><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{analytics.totalSets}</p></div>
                  <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><p className="text-sm text-slate-500 dark:text-slate-400">Best Estimated 1RM</p><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{analytics.bestEstimated1RM > 0 ? analytics.bestEstimated1RM.toFixed(1) : '—'}{analytics.bestEstimated1RM > 0 && <span className="ml-1 text-sm font-normal text-slate-400">kg</span>}</p></div>
                  <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><p className="text-sm text-slate-500 dark:text-slate-400">Best Exercise</p><p className="mt-2 truncate text-lg font-black text-slate-900 dark:text-white">{analytics.bestEstimated1RMExercise || '—'}</p></div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="mb-5"><h2 className="text-xl font-black text-slate-900 dark:text-white">Personal Records</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Best results captured from actual training data.</p></div>

                  {analytics.prStats.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No PR data yet.</p> : <div className="space-y-3">{analytics.prStats.map(pr => <div key={pr.exerciseId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70"><p className="text-base font-bold text-slate-900 dark:text-white">{pr.name}</p><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4"><div className="rounded-xl bg-white p-3 dark:bg-slate-900"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Best Weight</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">{pr.bestWeight} kg</p></div><div className="rounded-xl bg-white p-3 dark:bg-slate-900"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Best Reps</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">{pr.bestReps}</p></div><div className="rounded-xl bg-white p-3 dark:bg-slate-900"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Est. 1RM</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">{pr.bestEstimated1RM.toFixed(1)} kg</p></div><div className="rounded-xl bg-white p-3 dark:bg-slate-900"><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Progress</p><p className="mt-2 text-base font-bold text-emerald-600 dark:text-emerald-300">{pr.progressPercent >= 0 ? '+' : ''}{pr.progressPercent.toFixed(1)}%</p></div></div></div>)}</div>}
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="mb-4"><h2 className="text-xl font-black text-slate-900 dark:text-white">Progression</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track Estimated 1RM across sessions.</p></div>

                  <select value={selectedAnalyticsExercise ?? ''} onChange={event => setSelectedAnalyticsExercise(event.target.value ? Number(event.target.value) : null)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                    <option value="">Select an exercise</option>
                    {analytics.exerciseStats.map(exercise => <option key={exercise.exerciseId} value={exercise.exerciseId}>{exercise.name}</option>)}
                  </select>

                  {selectedAnalyticsExercise && analytics.progression.length > 0 ? <div className="mt-6"><div className="mb-4"><select value={analyticsMetric} onChange={event => setAnalyticsMetric(event.target.value as 'estimated1RM' | 'weight' | 'reps')} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"><option value="estimated1RM">Estimated 1RM</option><option value="weight">Best Weight</option><option value="reps">Best Reps</option></select></div>

                  <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{analyticsMetric === 'estimated1RM' ? 'Estimated 1RM' : analyticsMetric === 'weight' ? 'Best Weight' : 'Best Reps'}</p><p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{Math.max(...analytics.progression.map(point => analyticsMetric === 'estimated1RM' ? point.estimated1RM : analyticsMetric === 'weight' ? point.weight : point.reps)).toFixed(1)}{analyticsMetric === 'reps' ? ' reps' : ' kg'}</p></div></div>

                  <div className="relative h-64 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80"><div className="h-full min-w-[600px]">{(() => { const values = analytics.progression.map(point => analyticsMetric === 'estimated1RM' ? point.estimated1RM : analyticsMetric === 'weight' ? point.weight : point.reps); const max = Math.max(...values); const min = Math.min(...values); const range = max - min || 1; const width = 600; const height = 220; const paddingX = 30; const paddingY = 20; const points = analytics.progression.map((point, index) => { const x = analytics.progression.length === 1 ? width / 2 : paddingX + (index / (analytics.progression.length - 1)) * (width - paddingX * 2); const value = analyticsMetric === 'estimated1RM' ? point.estimated1RM : analyticsMetric === 'weight' ? point.weight : point.reps; const y = height - paddingY - ((value - min) / range) * (height - paddingY * 2); return { x, y, point }; }); const polylinePoints = points.map(point => `${point.x},${point.y}`).join(' '); return <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">{points.length > 1 && <polyline points={polylinePoints} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600 dark:text-violet-300" />}{points.map((item, index) => <g key={`${item.point.date}-${index}`}><circle cx={item.x} cy={item.y} r="6" className="fill-violet-600 stroke-white dark:fill-violet-300 dark:stroke-slate-900" strokeWidth="3" /><text x={item.x} y={item.y - 12} textAnchor="middle" className="fill-slate-600 text-[10px] dark:fill-slate-300">{(analyticsMetric === 'estimated1RM' ? item.point.estimated1RM : analyticsMetric === 'weight' ? item.point.weight : item.point.reps).toFixed(1)}</text></g>)}</svg>; })()}</div></div>

                  <div className="mt-4 space-y-2">{analytics.progression.map((point, index) => <div key={`${point.date}-detail-${index}`} className="flex flex-col items-start justify-between gap-1 rounded-2xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800 sm:flex-row sm:items-center"><span className="text-slate-500 dark:text-slate-400">{point.date}</span><span className="font-medium text-slate-700 dark:text-slate-200">{point.weight} kg × {point.reps}</span><span className="font-bold text-slate-900 dark:text-white">1RM {point.estimated1RM.toFixed(1)} kg</span></div>)}</div></div> : <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">Select an exercise to view progression.</div>}
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="mb-5"><h2 className="text-xl font-black text-slate-900 dark:text-white">Exercise Performance</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Volume and Estimated 1RM by exercise.</p></div>

                  {analytics.exerciseStats.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600"><p className="text-sm text-slate-500 dark:text-slate-400">No actual data available for analysis yet.</p><button onClick={() => setPage('Gym')} className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">Go to Gym</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400"><th className="px-3 py-3 font-medium">Exercise</th><th className="px-3 py-3 text-right font-medium">Sets</th><th className="px-3 py-3 text-right font-medium">Volume</th><th className="px-3 py-3 text-right font-medium">Est. 1RM</th></tr></thead><tbody>{analytics.exerciseStats.map(exercise => <tr key={exercise.exerciseId} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">{exercise.name}</td><td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300">{exercise.sets}</td><td className="px-3 py-3 text-right font-medium text-slate-800 dark:text-slate-100">{exercise.volume.toLocaleString()} <span className="text-xs text-slate-400">kg</span></td><td className="px-3 py-3 text-right font-medium text-slate-800 dark:text-slate-100">{exercise.estimated1RM.toFixed(1)} <span className="text-xs text-slate-400">kg</span></td></tr>)}</tbody></table></div>}
                </section>
              </div>
            )}
            {/* REPORTS */}
            {page === 'Reports' && (
              <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Reports</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Export & Review</h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review and export your gym training history.</p>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white">Report Range</h2>
                  <div className="flex flex-wrap gap-2">{[['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['custom', 'Custom']].map(([value, label]) => <button key={value} onClick={() => setReportRange(value as 'day' | 'week' | 'month' | 'custom')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${reportRange === value ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}>{label}</button>)}</div>

                  {reportRange === 'custom' && <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Start Date</label><input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">End Date</label><input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /></div></div>}

                  <div className="mt-4 flex flex-wrap gap-3"><button onClick={loadReport} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">Load Report</button><button onClick={generatePDF} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Export PDF</button><button onClick={exportCSV} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Export CSV</button></div>
                  <div className="mt-4"><label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Search loaded rows</label><input value={reportSearch} onChange={event => setReportSearch(event.target.value)} placeholder="Search exercise, topic, date, or note..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /></div>
                </section>

                <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><p className="text-sm text-slate-500 dark:text-slate-400">Workouts</p><p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{reportWorkouts.length}</p></div><div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><p className="text-sm text-slate-500 dark:text-slate-400">Exercises</p><p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{new Set(reportRows.map(row => row.exercise)).size}</p></div><div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><p className="text-sm text-slate-500 dark:text-slate-400">Total Sets</p><p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{reportRows.length}</p></div></div>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80"><div className="border-b border-slate-200 p-5 dark:border-slate-700"><h2 className="text-lg font-black text-slate-900 dark:text-white">Training Data</h2></div>{reportRows.length === 0 ? <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No training data found for this period.</div> : visibleReportRows.length === 0 ? <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No rows match your search.</div> : <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800/80"><th className="px-4 py-3 text-slate-500 dark:text-slate-400">Date</th><th className="px-4 py-3 text-slate-500 dark:text-slate-400">Topic</th><th className="px-4 py-3 text-slate-500 dark:text-slate-400">Exercise</th><th className="px-4 py-3 text-slate-500 dark:text-slate-400">Set</th><th className="px-4 py-3 text-slate-500 dark:text-slate-400">KG</th><th className="px-4 py-3 text-slate-500 dark:text-slate-400">Reps</th><th className="px-4 py-3 text-slate-500 dark:text-slate-400">RPE</th><th className="px-4 py-3 text-slate-500 dark:text-slate-400">Note</th></tr></thead><tbody>{visibleReportRows.map((row, index) => <tr key={`${row.date}-${row.exercise}-${row.setNumber}-${index}`} className="border-b border-slate-200 last:border-b-0 dark:border-slate-700"><td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.date}</td><td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.topic}</td><td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{row.exercise}</td><td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.setNumber}</td><td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.kg}</td><td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.reps}</td><td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.rpe || '-'}</td><td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.note || '-'}</td></tr>)}</tbody></table></div>}</section>
              </div>
            )}

            {/* SETTINGS */}
            {page === 'Settings' && (
              <div className="space-y-5">
                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80"><p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Settings</p><h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Preferences</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage app behavior and data storage.</p></section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><div className="flex items-center justify-between gap-4"><div><p className="text-lg font-bold text-slate-900 dark:text-white">Local Database</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Everything is saved on your device via IndexedDB.</p></div><span className="whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Active</span></div></section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><h3 className="text-lg font-black text-slate-900 dark:text-white">Backup & Restore</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Save or restore all gym and habit data.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={exportBackup} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"><p className="font-semibold text-slate-900 dark:text-white">Export Backup</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Download all data as a JSON file.</p></button><label className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"><p className="font-semibold text-slate-900 dark:text-white">Import Backup</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Restore data from a JSON file.</p><input type="file" accept=".json,application/json" className="hidden" onChange={importBackupFile} /></label></div><div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-200"><strong>Note:</strong> Import Backup replaces all current data.</div></section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><h3 className="text-lg font-black text-slate-900 dark:text-white">Exercise Library</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Control whether exercise deletion is enabled.</p><div className="mt-5 flex items-center justify-between gap-4"><div><p className="font-semibold text-slate-900 dark:text-white">Enable Exercise Deletion</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Show the remove button inside the exercise library.</p></div><button type="button" onClick={() => { const nextValue = !exerciseDeletionEnabled; setExerciseDeletionEnabled(nextValue); localStorage.setItem('exerciseDeletionEnabled', String(nextValue)) }} className={`relative h-7 w-12 shrink-0 rounded-full transition ${exerciseDeletionEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`} aria-label="Enable Exercise Deletion"><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${exerciseDeletionEnabled ? 'left-6' : 'left-1'}`} /></button></div>{exerciseDeletionEnabled && <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-200"><strong>Warning:</strong> When enabled, the delete button appears in the exercise library.</div>}</section>

                <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-slate-900 dark:text-white">Dark Mode</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use the dark interface</p></div><button type="button" onClick={() => setDarkMode(prev => !prev)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${darkMode ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`} aria-label="Toggle dark mode"><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${darkMode ? 'left-6' : 'left-1'}`} /></button></div></div>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><div className="flex items-center justify-between gap-4"><div><h3 className="text-lg font-black text-slate-900 dark:text-white">Weekly Summary</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Receive one local browser notification every Monday.</p></div><button type="button" onClick={() => void toggleWeeklyNotifications()} className={`relative h-7 w-12 shrink-0 rounded-full transition ${weeklyNotificationsEnabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`} aria-label="Toggle weekly summary notifications"><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${weeklyNotificationsEnabled ? 'left-6' : 'left-1'}`} /></button></div></section>

                <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><h3 className="text-lg font-black text-slate-900 dark:text-white">App Information</h3><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">App</span><span className="font-medium text-slate-900 dark:text-white">Gym & Habit Tracker</span></div><div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Version</span><span className="font-medium text-slate-900 dark:text-white">V1</span></div><div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Storage</span><span className="font-medium text-slate-900 dark:text-white">IndexedDB</span></div></div><button type="button" onClick={() => window.location.reload()} className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">↻ Refresh App</button></section>

                <section className="rounded-[28px] border border-red-200 bg-white/80 p-6 shadow-sm dark:border-red-900/60 dark:bg-red-950/20"><h3 className="text-lg font-black text-red-600 dark:text-red-300">Danger Zone</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Delete all Gym and Habit data stored on this device.</p>

                  <button
                    onClick={async () => {
                      const confirmed = window.confirm(
                        'Bạn có chắc muốn XÓA TOÀN BỘ dữ liệu không?\n\n' +
                        'Workout, Exercise, Set, Plan, Habit và lịch sử Habit sẽ bị xóa.\n\n' +
                        'Không thể hoàn tác.'
                      )

                      if (!confirmed) return

                      await db.transaction(
                        'rw',
                        [
                          db.exercises,
                          db.workouts,
                          db.workoutExercises,
                          db.workoutSets,
                          db.workoutPlanSets,
                          db.habits,
                          db.habitCompletions,
                        ],
                        async () => {
                          await db.workouts.clear()
                          await db.workoutExercises.clear()
                          await db.workoutSets.clear()
                          await db.workoutPlanSets.clear()
                          await db.habits.clear()
                          await db.habitCompletions.clear()
                        }
                      )

                      setCurrentWorkoutId(null)
                      setWorkoutExercises([])
                      setWorkoutExerciseNames({})
                      setActualSets({})
                      setPlanSets({})

                      await loadData()

                      alert('Đã xóa toàn bộ dữ liệu.')
                    }}
                    className="mt-4 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete All Data
                  </button>

                </section>

              </div>
            )}

            <footer className="mt-10 border-t border-slate-200/80 pt-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
              Created and Designed by Vũ Vinh Quang
            </footer>
          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/95 lg:hidden">
        <div className="grid grid-cols-7 px-1 pt-1">
          {navItems.map(item => (
            <button
              type="button"
              key={item}
              onClick={() => setPage(item)}
              className={`min-h-12 min-w-0 rounded-xl px-0.5 py-2 text-[10px] font-bold leading-tight transition ${page === item
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
            >
              <span className="block truncate">
                {item}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default App