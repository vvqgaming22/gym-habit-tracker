import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

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

  const [savedMessage, setSavedMessage] =
    useState('')

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
    loadData()
  }, [])

  function showSaved() {
    setSavedMessage('Saved ✓')

    window.setTimeout(() => {
      setSavedMessage('')
    }, 1200)
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

  function isHabitCompleted(
    habitId: number,
    date: string
  ) {
    return completions.some(
      item =>
        item.habitId === habitId &&
        item.date === date &&
        item.completed
    )
  }

  function calculateStreak(habitId: number) {
    const habit = habits.find(item => item.id === habitId)

    if (!habit || habit.schedule.length === 0) return 0

    let date = new Date()
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
  }

  function calculateCompletionRate(habitId: number) {
    const habit = habits.find(item => item.id === habitId)

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

    showSaved()
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

    async function loadAnalytics() {
      const workoutExercises =
        await db.workoutExercises.toArray()

      const workoutSets =
        await db.workoutSets.toArray()

      const exerciseMap = new Map(
        exercises.map(exercise => [
          exercise.id!,
          exercise.name,
        ])
      )

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

      for (const workoutExercise of workoutExercises) {
        const exerciseId =
          workoutExercise.exerciseId

        const exerciseName =
          exerciseMap.get(exerciseId) ??
          'Unknown Exercise'

        const sets = workoutSets.filter(
          set =>
            set.workoutExerciseId ===
            workoutExercise.id
        )

        if (!stats.has(exerciseId)) {
          stats.set(exerciseId, {
            exerciseId,
            name: exerciseName,
            volume: 0,
            sets: 0,
            estimated1RM: 0,
          })
        }

        const exerciseStats =
          stats.get(exerciseId)!

        for (const set of sets) {
          const volume =
            (set.kg || 0) *
            (set.reps || 0)

          const estimated1RM =
            (set.kg || 0) *
            (1 + (set.reps || 0) / 30)

          exerciseStats.volume += volume
          exerciseStats.sets += 1

          totalVolume += volume
          totalSets += 1

          if (
            estimated1RM >
            exerciseStats.estimated1RM
          ) {
            exerciseStats.estimated1RM =
              estimated1RM
          }

          if (
            estimated1RM >
            bestEstimated1RM
          ) {
            bestEstimated1RM =
              estimated1RM

            bestEstimated1RMExercise =
              exerciseName
          }
        }
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
        const workoutExercisesForDay =
          workoutExercises.filter(
            we => we.workoutId === workout.id
          )

        for (const workoutExercise of workoutExercisesForDay) {
          const exerciseId =
            workoutExercise.exerciseId

          const sets = workoutSets.filter(
            set =>
              set.workoutExerciseId ===
              workoutExercise.id
          )

          if (sets.length === 0) continue

          const bestSet = sets.reduce(
            (best, set) => {
              const current1RM =
                (set.kg || 0) *
                (1 + (set.reps || 0) / 30)

              const best1RM =
                (best.kg || 0) *
                (1 + (best.reps || 0) / 30)

              return current1RM > best1RM
                ? set
                : best
            },
            sets[0]
          )

          const point = {
            date: workout.date,
            weight: bestSet.kg || 0,
            reps: bestSet.reps || 0,
            estimated1RM:
              (bestSet.kg || 0) *
              (1 + (bestSet.reps || 0) / 30),
          }

          if (!progressionData.has(exerciseId)) {
            progressionData.set(exerciseId, [])
          }

          progressionData
            .get(exerciseId)!
            .push(point)
        }
      }
      const exerciseStats =
        Array.from(stats.values())
          .sort(
            (a, b) =>
              b.volume - a.volume
          )
      // PR statistics
      const prStats = Array.from(stats.values())
        .map(exercise => {
          const exerciseSets = workoutSets.filter(
            set => {
              const workoutExercise =
                workoutExercises.find(
                  we =>
                    we.id ===
                    set.workoutExerciseId
                )

              return (
                workoutExercise?.exerciseId ===
                exercise.exerciseId
              )
            }
          )
          const firstEstimated1RM =
            exerciseSets.length > 0
              ? exerciseSets
                .map(
                  set =>
                    (set.kg || 0) *
                    (1 + (set.reps || 0) / 30)
                )
                .sort((a, b) => a - b)[0]
              : 0

          const progressPercent =
            firstEstimated1RM > 0
              ? ((exercise.estimated1RM - firstEstimated1RM) /
                firstEstimated1RM) *
              100
              : 0
          const bestWeight =
            exerciseSets.length > 0
              ? Math.max(
                ...exerciseSets.map(
                  set => set.kg || 0
                )
              )
              : 0

          const bestReps =
            exerciseSets.length > 0
              ? Math.max(
                ...exerciseSets.map(
                  set => set.reps || 0
                )
              )
              : 0

          const bestEstimated1RM =
            exerciseSets.length > 0
              ? Math.max(
                ...exerciseSets.map(
                  set =>
                    (set.kg || 0) *
                    (1 + (set.reps || 0) / 30)
                )
              )
              : 0

          return {
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            bestWeight,
            bestReps,
            bestEstimated1RM,
            progressPercent,
          }
        })
        .sort(
          (a, b) =>
            b.bestEstimated1RM -
            a.bestEstimated1RM
        )

      setAnalytics(prev => ({
        ...prev,
        totalVolume,
        totalSets,
        bestEstimated1RM,
        bestEstimated1RMExercise,
        exerciseStats,
        prStats,
      }))
      setAnalytics({
        totalVolume,
        totalSets,
        bestEstimated1RM,
        bestEstimated1RMExercise,
        exerciseStats,
        prStats,
        progression: selectedAnalyticsExercise
          ? progressionData.get(selectedAnalyticsExercise) ?? []
          : [],
      })
    }

    loadAnalytics()
  }, [
    page,
    exercises,
    workouts,
    selectedAnalyticsExercise,
  ])
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
    [habits, completions]
  )

  const filteredExercises =
    exercises.filter(exercise =>
      exercise.name
        .toLowerCase()
        .includes(
          librarySearch.toLowerCase()
        )
    )

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
  async function loadReport() {
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
      const workoutItems =
        await db.workoutExercises
          .where('workoutId')
          .equals(workout.id!)
          .sortBy('order')

      for (const workoutItem of workoutItems) {
        if (!workoutItem.id) continue

        const exercise =
          await db.exercises.get(
            workoutItem.exerciseId
          )

        const sets =
          await db.workoutSets
            .where('workoutExerciseId')
            .equals(workoutItem.id)
            .sortBy('setNumber')

        for (const set of sets) {
          rows.push({
            date: workout.date,
            topic: workout.topic,
            exercise:
              exercise?.name ?? 'Unknown Exercise',
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

    setReportRows(rows)
  }

  useEffect(() => {
    if (page !== 'Reports') return

    loadReport()
  }, [
    page,
    reportRange,
    reportStartDate,
    reportEndDate,
    workouts,
  ])

  async function generatePDF() {
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
      const workoutItems =
        await db.workoutExercises
          .where('workoutId')
          .equals(workout.id!)
          .sortBy('order')

      for (const workoutItem of workoutItems) {
        if (!workoutItem.id) continue

        const exercise =
          await db.exercises.get(
            workoutItem.exerciseId
          )

        const sets =
          await db.workoutSets
            .where('workoutExerciseId')
            .equals(workoutItem.id)
            .sortBy('setNumber')

        for (const set of sets) {
          rows.push({
            date: workout.date,
            topic: workout.topic,
            exercise:
              exercise?.name ?? 'Unknown Exercise',
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 md:block">
          <div className="mb-8">
            <div className="text-xl font-bold">
              Gym & Habit
            </div>

            <div className="text-sm text-slate-500">
              Tracker
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(item => (
              <button
                key={item}
                onClick={() =>
                  setPage(item)
                }
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium ${page === item
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1 pb-24 md:pb-6">
          <div className="mx-auto max-w-7xl p-4 md:p-8">

            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {page}
                </h1>

                <p className="text-sm text-slate-500">
                  {formatDate(todayISO())}
                </p>
              </div>

              {savedMessage && (
                <div className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
                  {savedMessage}
                </div>
              )}
            </div>

            {/* DASHBOARD */}
            {page === 'Dashboard' && (
              <div className="space-y-6">

                {/* HEADER */}
                <section>
                  <p className="text-sm font-medium text-slate-500">
                    {new Date().toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    Today
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Theo dõi habit và workout của bạn hôm nay.
                  </p>
                </section>

                {/* QUICK STATS */}
                <section className="grid grid-cols-2 gap-3 md:grid-cols-4">

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Habits
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {todayHabits.filter(h => h.completed).length}
                      <span className="text-base font-normal text-slate-400">
                        /{todayHabits.length}
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      completed today
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Workouts
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {workouts.length}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      total saved
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Exercises
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {exercises.length}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      in library
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Today
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {workouts.some(
                        workout => workout.date === todayISO()
                      )
                        ? '✓'
                        : '—'}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      workout status
                    </p>
                  </div>

                </section>

                {/* TODAY CONTENT */}
                <section className="grid gap-5 lg:grid-cols-2">

                  {/* TODAY'S HABITS */}
                  <div className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">
                          Today's Habits
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {todayHabits.filter(h => h.completed).length}
                          /{todayHabits.length} completed
                        </p>
                      </div>

                      <button
                        onClick={() => setPage('Habits')}
                        className="text-sm font-medium text-blue-600"
                      >
                        View all
                      </button>
                    </div>

                    {todayHabits.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                        <p className="text-sm text-slate-500">
                          Chưa có habit nào.
                        </p>

                        <button
                          onClick={() => setPage('Habits')}
                          className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                        >
                          + Add Habit
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {todayHabits.map(habit => (
                          <button
                            key={habit.id}
                            onClick={() =>
                              toggleHabit(
                                habit.id!,
                                todayISO()
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:bg-slate-50"
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${habit.completed
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-slate-300 bg-white'
                                }`}
                            >
                              {habit.completed ? '✓' : ''}
                            </span>

                            <span
                              className={
                                habit.completed
                                  ? 'text-sm text-slate-400 line-through'
                                  : 'text-sm font-medium'
                              }
                            >
                              {habit.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* TODAY'S WORKOUT */}
                  <div className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">
                          Today's Workout
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Training plan & actual data
                        </p>
                      </div>

                      <button
                        onClick={() => setPage('Gym')}
                        className="text-sm font-medium text-blue-600"
                      >
                        Open Gym
                      </button>
                    </div>

                    {(() => {
                      const todayWorkout = workouts.find(
                        workout => workout.date === todayISO()
                      )

                      if (!todayWorkout) {
                        return (
                          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                            <div className="text-3xl">
                              🏋️
                            </div>

                            <p className="mt-2 text-sm font-medium">
                              Chưa có workout hôm nay
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Tạo workout để bắt đầu tracking.
                            </p>

                            <button
                              onClick={() => setPage('Gym')}
                              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                            >
                              + Create Workout
                            </button>
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-4">

                          <button
                            onClick={() => {
                              setPage('Gym')
                              loadWorkout(todayWorkout.id!)
                            }}
                            className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">

                              <div>
                                <p className="text-lg font-bold">
                                  {todayWorkout.topic}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {formatDate(todayWorkout.date)}
                                </p>
                              </div>

                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                Planned
                              </span>

                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setPage('Gym')
                              loadWorkout(todayWorkout.id!)
                            }}
                            className="w-full rounded-xl border border-slate-200 p-4 text-left"
                          >
                            Open Workout
                          </button>

                        </div>
                      )
                    })()}

                  </div>

                </section>

                {/* RECENT ACTIVITY */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">

                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">
                        Recent Activity
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Những workout gần đây
                      </p>
                    </div>

                    <button
                      onClick={() => setPage('Gym')}
                      className="text-sm font-medium text-blue-600"
                    >
                      View Gym
                    </button>
                  </div>

                  {workouts.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Chưa có workout nào.
                    </p>
                  ) : (
                    <div className="space-y-2">

                      {workouts
                        .slice()
                        .sort((a, b) =>
                          b.date.localeCompare(a.date)
                        )
                        .slice(0, 5)
                        .map(workout => (
                          <button
                            key={workout.id}
                            onClick={() => {
                              setPage('Gym')
                              loadWorkout(workout.id!)
                            }}
                            className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                          >

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {workout.topic}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatDate(workout.date)}
                              </p>
                            </div>

                            <span className="shrink-0 text-slate-400">
                              →
                            </span>

                          </button>
                        ))}

                    </div>
                  )}

                </section>

              </div>
            )}

            {/* HABITS */}
            {page === 'Habits' && (
              <div className="space-y-6">

                {/* ADD HABIT */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold">
                    Add Habit
                  </h2>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newHabitName}
                      onChange={e =>
                        setNewHabitName(
                          e.target.value
                        )
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          addHabit()
                        }
                      }}
                      placeholder="Ví dụ: Uống 2L nước"
                      className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                    />
                    <div className="mt-3">
                      <div className="mb-2 text-sm font-medium">
                        Lịch thực hiện
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          [1, 'T2'],
                          [2, 'T3'],
                          [3, 'T4'],
                          [4, 'T5'],
                          [5, 'T6'],
                          [6, 'T7'],
                          [0, 'CN'],
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
                            className={`rounded-lg border px-3 py-2 text-sm ${habitSchedule.includes(day as number)
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-300 bg-white text-gray-700'
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={addHabit}
                      className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
                    >
                      + Add Habit
                    </button>
                  </div>
                </section>

                {/* DAILY TRACKER */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold">
                        Daily Tracker
                      </h2>

                      <p className="text-sm text-slate-500">
                        Tick habit theo từng ngày.
                      </p>
                    </div>

                    <input
                      type="date"
                      value={selectedHabitDate}
                      onChange={e =>
                        setSelectedHabitDate(
                          e.target.value
                        )
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div className="space-y-3">
                    {selectedDateHabits.length ===
                      0 && (
                        <p className="text-sm text-slate-500">
                          Chưa có habit. Hãy tạo habit đầu tiên.
                        </p>
                      )}

                    {selectedDateHabits.map(
                      habit => (
                        <div
                          key={habit.id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">

                            <button
                              onClick={() =>
                                toggleHabit(
                                  habit.id!,
                                  selectedHabitDate
                                )
                              }
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${habit.completed
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-slate-300'
                                }`}
                            >
                              {habit.completed
                                ? '✓'
                                : ''}
                            </button>

                            <div className="min-w-0">
                              {editingHabitId ===
                                habit.id ? (
                                <div className="flex flex-col gap-3">
                                  <div className="flex gap-2">
                                    <input
                                      value={editingHabitName}
                                      onChange={e =>
                                        setEditingHabitName(e.target.value)
                                      }
                                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
                                    />

                                    <button
                                      onClick={() =>
                                        saveHabitEdit(habit.id!)
                                      }
                                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                                    >
                                      Save
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { label: 'T2', value: 1 },
                                      { label: 'T3', value: 2 },
                                      { label: 'T4', value: 3 },
                                      { label: 'T5', value: 4 },
                                      { label: 'T6', value: 5 },
                                      { label: 'T7', value: 6 },
                                      { label: 'CN', value: 0 },
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
                                        className={`rounded-lg border px-3 py-2 text-sm ${editingHabitSchedule.includes(day.value)
                                          ? 'border-slate-900 bg-slate-900 text-white'
                                          : 'border-slate-300 bg-white'
                                          }`}
                                      >
                                        {day.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="font-semibold">
                                    {habit.name}
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    {habit.completed
                                      ? 'Completed'
                                      : 'Not completed'}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm">
                              🔥{' '}
                              <strong>
                                {calculateStreak(
                                  habit.id!
                                )}
                              </strong>{' '}
                              streak
                            </div>

                            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm">
                              📊{' '}
                              <strong>
                                {calculateCompletionRate(
                                  habit.id!
                                )}
                                %
                              </strong>{' '}
                              / 30 days
                            </div>

                            {editingHabitId !==
                              habit.id && (
                                <button
                                  onClick={() => {
                                    setEditingHabitId(
                                      habit.id!
                                    )

                                    setEditingHabitName(
                                      habit.name
                                    )
                                    setEditingHabitSchedule(
                                      habit.schedule
                                    )
                                  }}
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                  Edit
                                </button>
                              )}

                            <button
                              onClick={() =>
                                deleteHabit(
                                  habit.id!
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* 30 DAY HISTORY */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">

                  <div className="mb-5 flex flex-col gap-1">
                    <h2 className="text-lg font-bold">
                      30-Day History
                    </h2>

                    <p className="text-sm text-slate-500">
                      Ngày cũ → hôm nay. Hôm nay nằm ở ngoài cùng bên phải.
                    </p>
                  </div>

                  {habits.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                      Tạo habit để bắt đầu theo dõi lịch sử.
                    </div>
                  ) : (
                    <div className="overflow-x-auto pb-2">
                      <div className="min-w-[900px]">

                        {/* DATE HEADER */}
                        <div className="mb-3 grid grid-cols-[180px_repeat(31,minmax(38px,1fr))] gap-1">
                          <div className="flex items-end pb-1 text-sm font-semibold text-slate-500">
                            Habit
                          </div>

                          {historyDays.map(date => {

                            const isToday = date === todayISO()

                            const [year, month, day] = date.split('-').map(Number)

                            const d = new Date(year, month - 1, day)

                            const dayOfWeek = d.getDay()

                            const weekdayLabels = [
                              'CN',
                              'T2',
                              'T3',
                              'T4',
                              'T5',
                              'T6',
                              'T7',
                            ]

                            const weekday = weekdayLabels[dayOfWeek]

                            return (
                              <div
                                key={date}
                                title={formatDate(date)}
                                className={`flex flex-col items-center justify-end rounded-md py-1 text-center ${isToday
                                  ? 'bg-blue-50 font-bold text-blue-600 ring-1 ring-blue-300'
                                  : 'text-slate-500'
                                  }`}
                              >
                                <span className="text-[10px] font-semibold">
                                  {weekday}
                                </span>

                                <span className="text-[9px]">
                                  {String(day).padStart(2, '0')}/
                                  {String(month).padStart(2, '0')}
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        {/* HABIT ROWS */}
                        <div className="space-y-2">
                          {habits.map(
                            habit => (
                              <div
                                key={habit.id}
                                className="grid grid-cols-[180px_repeat(31,minmax(24px,1fr))] gap-1"
                              >

                                {/* HABIT NAME */}
                                <div className="flex min-w-0 items-center pr-3">
                                  <span className="truncate text-sm font-medium">
                                    {habit.name}
                                  </span>
                                </div>

                                {/* DAYS */}
                                {historyDays.map(
                                  date => {
                                    const completed =
                                      isHabitCompleted(
                                        habit.id!,
                                        date
                                      )

                                    const isToday =
                                      date ===
                                      todayISO()

                                    const isFuture =
                                      date > todayISO()

                                    return (

                                      <button
                                        key={date}
                                        onClick={() => {
                                          if (!isFuture) {
                                            toggleHabit(habit.id!, date)
                                          }
                                        }}
                                        disabled={isFuture}
                                        title={`${habit.name} — ${formatDate(
                                          date
                                        )}`}
                                        className={`h-9 rounded-md ${isFuture
                                          ? 'cursor-not-allowed bg-slate-50 opacity-40'
                                          : completed
                                            ? 'bg-green-500'
                                            : isToday
                                              ? 'bg-white ring-2 ring-blue-400'
                                              : 'bg-slate-100'
                                          }`}
                                      >
                                        {completed && (
                                          <span className="text-xs font-bold text-white">
                                            ✓
                                          </span>
                                        )}
                                      </button>
                                    )
                                  }
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {/* LEGEND */}
                        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded bg-slate-100" />
                            Not completed
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded bg-green-500" />
                            Completed
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded bg-blue-50 ring-2 ring-blue-400" />
                            Today
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* GYM */}
            {page === 'Gym' && (
              <div className="space-y-6">

                {!currentWorkoutId && (
                  <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h2 className="text-lg font-bold">
                        Create Workout
                      </h2>

                      <p className="text-sm text-slate-500">
                        DATE → WORKOUT TOPIC → EXERCISES → ACTUAL
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        type="date"
                        value={workoutDate}
                        onChange={e =>
                          setWorkoutDate(
                            e.target.value
                          )
                        }
                        className="rounded-xl border border-slate-300 px-4 py-3"
                      />

                      <input
                        value={workoutTopic}
                        onChange={e =>
                          setWorkoutTopic(
                            e.target.value
                          )
                        }
                        placeholder="Chest & Shoulders"
                        className="rounded-xl border border-slate-300 px-4 py-3"
                      />

                      <button
                        onClick={createWorkout}
                        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
                      >
                        + Create Workout
                      </button>
                    </div>
                  </section>
                )}

                {currentWorkoutId && (
                  <section className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h2 className="text-lg font-bold">
                          Workout Detail
                        </h2>

                        <p className="text-sm text-slate-500">
                          Plan và Actual được lưu riêng.
                        </p>
                      </div>

                      <button
                        onClick={
                          startNewWorkout
                        }
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium"
                      >
                        + New Workout
                      </button>
                    </div>

                    <div className="mb-6 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Date
                        </label>

                        <input
                          type="date"
                          value={workoutDate}
                          onChange={e =>
                            setWorkoutDate(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Topic
                        </label>

                        <input
                          value={workoutTopic}
                          onChange={e =>
                            setWorkoutTopic(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                      </div>
                    </div>

                    <div className="mb-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={updateWorkoutInfo}
                        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
                      >
                        Save Workout Info
                      </button>

                      {workouts.find(w => w.id === currentWorkoutId)?.status ===
                        'in_progress' && (
                          <button
                            type="button"
                            onClick={completeWorkout}
                            className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
                          >
                            Complete Workout
                          </button>
                        )}

                      {workouts.find(w => w.id === currentWorkoutId)?.status ===
                        'done' && (
                          <span className="rounded-xl bg-green-100 px-4 py-3 font-semibold text-green-700">
                            ✓ Workout Completed
                          </span>
                        )}
                    </div>

                    <div className="space-y-5">
                      {workoutExercises.length ===
                        0 && (
                          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                            Chưa có exercise. Thêm exercise từ Exercise Library bên dưới.
                          </div>
                        )}

                      {workoutExercises.map(
                        (item, index) => {
                          const itemId =
                            item.id!

                          const actual =
                            actualSets[
                            itemId
                            ] ?? []

                          const plan =
                            planSets[
                            itemId
                            ] ?? []

                          return (
                            <div
                              key={itemId}
                              className="rounded-2xl border border-slate-200 p-4"
                            >

                              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedExercises(prev =>
                                      prev.includes(itemId)
                                        ? prev.filter(id => id !== itemId)
                                        : [...prev, itemId]
                                    )
                                  }}
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                  <span className="shrink-0 text-slate-500">
                                    {expandedExercises.includes(itemId)
                                      ? '⌃'
                                      : '⌄'}
                                  </span>

                                  <div className="min-w-0">
                                    <div className="text-lg font-bold">
                                      {index + 1}.{' '}
                                      {
                                        workoutExerciseNames[
                                        itemId
                                        ]
                                      }
                                    </div>

                                    <div className="text-xs text-slate-500">
                                      Exercise #{item.exerciseId}
                                    </div>
                                  </div>
                                </button>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveExercise(
                                        itemId,
                                        'up'
                                      )
                                    }
                                    className="rounded-lg border px-3 py-2 text-sm"
                                  >
                                    ↑
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveExercise(
                                        itemId,
                                        'down'
                                      )
                                    }
                                    className="rounded-lg border px-3 py-2 text-sm"
                                  >
                                    ↓
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeExerciseFromWorkout(
                                        itemId
                                      )
                                    }
                                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>

                              {expandedExercises.includes(itemId) && (
                                <>
                                  {/* PLAN */}
                                  <div className="mb-6 rounded-xl bg-slate-50 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                      <h4 className="font-bold">
                                        Plan
                                      </h4>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          addPlanSet(
                                            itemId
                                          )
                                        }
                                        className="rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm"
                                      >
                                        + Add Plan Set
                                      </button>
                                    </div>

                                    {plan.length ===
                                      0 ? (
                                      <p className="text-sm text-slate-500">
                                        Chưa có plan.
                                      </p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full min-w-[650px] text-sm">
                                          <thead>
                                            <tr className="border-b text-left text-slate-500">
                                              <th className="p-2">
                                                Set
                                              </th>
                                              <th className="p-2">
                                                KG
                                              </th>
                                              <th className="p-2">
                                                Reps
                                              </th>
                                              <th className="p-2">
                                                RPE
                                              </th>
                                              <th className="p-2">
                                                Note
                                              </th>
                                              <th />
                                            </tr>
                                          </thead>

                                          <tbody>
                                            {plan.map(
                                              set => (
                                                <tr
                                                  key={
                                                    set.id
                                                  }
                                                  className="border-b last:border-0"
                                                >
                                                  <td className="p-2">
                                                    {
                                                      set.setNumber
                                                    }
                                                  </td>

                                                  <td className="p-2">
                                                    <input
                                                      type="number"
                                                      value={
                                                        set.kg ??
                                                        ''
                                                      }
                                                      onChange={e =>
                                                        updatePlanSet(
                                                          set,
                                                          'kg',
                                                          e
                                                            .target
                                                            .value ===
                                                            ''
                                                            ? undefined
                                                            : Number(
                                                              e
                                                                .target
                                                                .value
                                                            )
                                                        )
                                                      }
                                                      className="w-20 rounded-lg border px-2 py-2"
                                                    />
                                                  </td>

                                                  <td className="p-2">
                                                    <input
                                                      type="number"
                                                      value={
                                                        set.reps ??
                                                        ''
                                                      }
                                                      onChange={e =>
                                                        updatePlanSet(
                                                          set,
                                                          'reps',
                                                          e
                                                            .target
                                                            .value ===
                                                            ''
                                                            ? undefined
                                                            : Number(
                                                              e
                                                                .target
                                                                .value
                                                            )
                                                        )
                                                      }
                                                      className="w-20 rounded-lg border px-2 py-2"
                                                    />
                                                  </td>

                                                  <td className="p-2">
                                                    <input
                                                      type="number"
                                                      step="0.5"
                                                      value={
                                                        set.rpe ??
                                                        ''
                                                      }
                                                      onChange={e =>
                                                        updatePlanSet(
                                                          set,
                                                          'rpe',
                                                          e
                                                            .target
                                                            .value ===
                                                            ''
                                                            ? undefined
                                                            : Number(
                                                              e
                                                                .target
                                                                .value
                                                            )
                                                        )
                                                      }
                                                      className="w-20 rounded-lg border px-2 py-2"
                                                    />
                                                  </td>

                                                  <td className="p-2">
                                                    <input
                                                      value={
                                                        set.note ??
                                                        ''
                                                      }
                                                      onChange={e =>
                                                        updatePlanSet(
                                                          set,
                                                          'note',
                                                          e
                                                            .target
                                                            .value
                                                        )
                                                      }
                                                      className="w-full min-w-[160px] rounded-lg border px-2 py-2"
                                                    />
                                                  </td>

                                                  <td className="p-2">
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        deletePlanSet(
                                                          itemId,
                                                          set.id!
                                                        )
                                                      }
                                                      className="text-red-600"
                                                    >
                                                      Delete
                                                    </button>
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>

                                  {/* ACTUAL */}
                                  <div>
                                    <div className="mb-3 flex items-center justify-between">
                                      <h4 className="font-bold">
                                        Actual Training
                                      </h4>

                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            copyPlanToActual(itemId)
                                          }
                                          className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                                        >
                                          Copy Plan → Actual
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            copyPreviousSet(itemId)
                                          }
                                          className="rounded-lg border px-3 py-2 text-sm"
                                        >
                                          Copy Previous
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            addActualSet(itemId)
                                          }
                                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                                        >
                                          + Add Set
                                        </button>
                                      </div>
                                    </div>

                                    {actual.length ===
                                      0 ? (
                                      <p className="text-sm text-slate-500">
                                        Chưa nhập actual.
                                      </p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full min-w-[800px] text-sm">
                                          <thead>
                                            <tr className="border-b text-left text-slate-500">
                                              <th className="p-2">
                                                Set
                                              </th>
                                              <th className="p-2">
                                                KG
                                              </th>
                                              <th className="p-2">
                                                Reps
                                              </th>
                                              <th className="p-2">
                                                RPE
                                              </th>
                                              <th className="p-2">
                                                Note
                                              </th>
                                              <th />
                                            </tr>
                                          </thead>

                                          <tbody>
                                            {actual.map(
                                              set => (
                                                <tr
                                                  key={
                                                    set.id
                                                  }
                                                  className="border-b last:border-0"
                                                >
                                                  <td className="p-2 font-medium">
                                                    {
                                                      set.setNumber
                                                    }
                                                  </td>

                                                  <td className="p-2">
                                                    <input
                                                      type="number"
                                                      value={
                                                        set.kg
                                                      }
                                                      onChange={e =>
                                                        updateActualSet(
                                                          set,
                                                          'kg',
                                                          Number(
                                                            e
                                                              .target
                                                              .value
                                                          )
                                                        )
                                                      }
                                                      className="w-20 rounded-lg border px-2 py-2"
                                                    />
                                                  </td>

                                                  <td className="p-2">
                                                    <input
                                                      type="number"
                                                      value={
                                                        set.reps
                                                      }
                                                      onChange={e =>
                                                        updateActualSet(
                                                          set,
                                                          'reps',
                                                          Number(
                                                            e
                                                              .target
                                                              .value
                                                          )
                                                        )
                                                      }
                                                      className="w-20 rounded-lg border px-2 py-2"
                                                    />
                                                  </td>

                                                  <td className="p-2">
                                                    <input
                                                      type="number"
                                                      step="0.5"
                                                      value={
                                                        set.rpe ??
                                                        ''
                                                      }
                                                      onChange={e =>
                                                        updateActualSet(
                                                          set,
                                                          'rpe',
                                                          e
                                                            .target
                                                            .value ===
                                                            ''
                                                            ? undefined
                                                            : Number(
                                                              e
                                                                .target
                                                                .value
                                                            )
                                                        )
                                                      }
                                                      className="w-20 rounded-lg border px-2 py-2"
                                                    />
                                                  </td>

                                                  <td className="p-2">
                                                    <input
                                                      value={
                                                        set.note ??
                                                        ''
                                                      }
                                                      onChange={e =>
                                                        updateActualSet(
                                                          set,
                                                          'note',
                                                          e
                                                            .target
                                                            .value
                                                        )
                                                      }
                                                      className="w-full min-w-[200px] rounded-lg border px-2 py-2"
                                                    />
                                                  </td>

                                                  <td className="p-2">
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        deleteActualSet(
                                                          itemId,
                                                          set.id!
                                                        )
                                                      }
                                                      className="text-red-600"
                                                    >
                                                      Delete
                                                    </button>
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        }
                      )}
                    </div>
                  </section>
                )}

                {/* EXERCISE LIBRARY */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExerciseLibraryOpen(prev => !prev)
                      }
                      className="flex min-w-0 flex-1 items-center justify-between text-left"
                    >
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold">
                          Exercise Library
                        </h2>

                        <p className="text-sm text-slate-500">
                          Tạo một lần, dùng lại cho mọi workout.
                        </p>
                      </div>

                      <span className="ml-3 shrink-0 text-slate-500">
                        {exerciseLibraryOpen ? '⌃' : '⌄'}
                      </span>
                    </button>
                  </div>
                  {exerciseLibraryOpen && (
                    <div>
                      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                        <input
                          value={newExerciseName}
                          onChange={e =>
                            setNewExerciseName(
                              e.target.value
                            )
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              addExercise()
                            }
                          }}
                          placeholder="Dumbbell Press"
                          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3"
                        />

                        <button
                          onClick={addExercise}
                          className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
                        >
                          + Add Exercise
                        </button>
                      </div>

                      {currentWorkoutId && (
                        <div className="mb-5">
                          <input
                            value={librarySearch}
                            onChange={e =>
                              setLibrarySearch(
                                e.target.value
                              )
                            }
                            placeholder="Search exercise..."
                            className="w-full rounded-xl border border-slate-300 px-4 py-3"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        {filteredExercises.map(
                          exercise => {
                            const added =
                              currentWorkoutId
                                ? workoutExercises.some(
                                  item =>
                                    item.exerciseId ===
                                    exercise.id
                                )
                                : false

                            return (
                              <div
                                key={exercise.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {exercise.name}
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    Created{' '}
                                    {exercise.createdAt
                                      ? formatDate(
                                        exercise.createdAt
                                          .toISOString()
                                          .slice(
                                            0,
                                            10
                                          )
                                      )
                                      : ''}
                                  </div>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                  {currentWorkoutId && (
                                    <button
                                      type="button"
                                      disabled={added}
                                      onClick={() =>
                                        addExerciseToWorkout(
                                          exercise.id!
                                        )
                                      }
                                      className={`rounded-lg px-3 py-2 text-sm ${added
                                        ? 'bg-slate-100 text-slate-400'
                                        : 'bg-slate-900 text-white'
                                        }`}
                                    >
                                      {added ? 'Added' : '+ Add'}
                                    </button>
                                  )}

                                  {exerciseDeletionEnabled && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteExercise(
                                          exercise.id!
                                        )
                                      }
                                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                                    >
                                      🗑
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          }
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* RECENT WORKOUTS */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold">
                      Recent Workouts
                    </h2>

                    <p className="text-sm text-slate-500">
                      Workout đã tạo, bao gồm cả Draft.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {workouts.length === 0 && (
                      <p className="text-sm text-slate-500">
                        Chưa có workout.
                      </p>
                    )}

                    {workouts.map(
                      workout => (
                        <div
                          key={workout.id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-semibold">
                                {workout.topic}
                              </div>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${workout.status === 'draft'
                                  ? 'bg-slate-100 text-slate-600'
                                  : workout.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                  }`}
                              >
                                {workout.status === 'draft'
                                  ? 'Draft'
                                  : workout.status === 'in_progress'
                                    ? 'In Progress'
                                    : 'Done'}
                              </span>
                            </div>

                            <div className="mt-1 text-sm text-slate-500">
                              {formatDate(
                                workout.date
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPage('Gym')
                                loadWorkout(workout.id!)
                              }}
                              className="..."
                            >
                              Open
                            </button>

                            <button
                              onClick={() =>
                                deleteWorkout(
                                  workout.id!
                                )
                              }
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600"
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* CALENDAR */}
            {page === 'Calendar' && (
              <div className="space-y-6">

                {/* CALENDAR */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">

                  {/* Header */}
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <h2 className="text-lg font-bold">
                        Training Calendar
                      </h2>

                      <p className="text-sm text-slate-500">
                        Xem nhanh Habit và Workout theo từng ngày.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">

                      <button
                        onClick={() =>
                          changeCalendarMonth(-1)
                        }
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        ←
                      </button>

                      <button
                        onClick={goToCalendarToday}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        Today
                      </button>

                      <button
                        onClick={() =>
                          changeCalendarMonth(1)
                        }
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        →
                      </button>

                    </div>
                  </div>

                  {/* Month title */}
                  <div className="mb-4 text-center text-xl font-bold">
                    {calendarMonthName}
                  </div>

                  {/* Weekdays */}
                  <div className="mb-2 grid grid-cols-7 gap-1">

                    {[
                      'Sun',
                      'Mon',
                      'Tue',
                      'Wed',
                      'Thu',
                      'Fri',
                      'Sat',
                    ].map(day => (
                      <div
                        key={day}
                        className="py-2 text-center text-xs font-semibold text-slate-400"
                      >
                        {day}
                      </div>
                    ))}

                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">

                    {calendarCells.map(
                      (date, index) => {

                        if (!date) {
                          return (
                            <div
                              key={`empty-${index}`}
                              className="min-h-[82px] rounded-xl bg-slate-50/50"
                            />
                          )
                        }

                        const isToday =
                          date === todayISO()

                        const isSelected =
                          date ===
                          selectedCalendarDate

                        const hasWorkout =
                          hasWorkoutOnDate(date)

                        const hasHabit =
                          hasCompletedHabitOnDate(date)

                        return (
                          <button
                            key={date}
                            onClick={() =>
                              setSelectedCalendarDate(
                                date
                              )
                            }
                            className={`min-h-[82px] rounded-xl border p-2 text-left transition ${isSelected
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : isToday
                                ? 'border-blue-300 bg-blue-50/50'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                          >

                            <div
                              className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-700'
                                }`}
                            >
                              {Number(
                                date.slice(8, 10)
                              )}
                            </div>

                            <div className="space-y-1">

                              {hasWorkout && (
                                <div className="truncate rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                  🏋 Workout
                                </div>
                              )}

                              {hasHabit && (
                                <div className="truncate rounded-md bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                                  ✓ Habit
                                </div>
                              )}

                            </div>

                          </button>
                        )
                      }
                    )}

                  </div>

                  {/* Legend */}
                  <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded bg-slate-900" />
                      Workout
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded bg-green-500" />
                      Habit completed
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded bg-blue-600" />
                      Today
                    </div>

                  </div>

                </section>


                {/* SELECTED DATE */}
                {selectedCalendarDate && (
                  <section className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="mb-5">

                      <h2 className="text-lg font-bold">
                        {formatDate(
                          selectedCalendarDate
                        )}
                      </h2>

                      <p className="text-sm text-slate-500">
                        Chi tiết hoạt động trong ngày.
                      </p>

                    </div>


                    {/* Workout */}
                    <div className="mb-6">
                      <h3 className="mb-3 font-bold">
                        🏋 Workout
                      </h3>

                      {selectedCalendarWorkouts.length > 0 ? (
                        <div className="space-y-3">
                          {selectedCalendarWorkouts.map(workout => (
                            <div
                              key={workout.id}
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="font-bold">
                                    {workout.topic}
                                  </div>

                                  <div className="text-sm text-slate-500">
                                    {formatDate(workout.date)}
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    loadWorkout(workout.id!)
                                  }
                                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                                >
                                  Open Workout
                                </button>
                              </div>

                              <div className="text-sm text-slate-500">
                                Workout đã được tạo cho ngày này.
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                          Không có workout trong ngày này.
                        </div>
                      )}
                    </div>

                    {/* Habits */}
                    <div>

                      <div className="mb-3 flex items-center justify-between">

                        <h3 className="font-bold">
                          ✓ Habits
                        </h3>

                        <button
                          onClick={() => {
                            setSelectedHabitDate(
                              selectedCalendarDate
                            )
                            setPage('Habits')
                          }}
                          className="text-sm font-medium text-blue-600"
                        >
                          Open Habits
                        </button>

                      </div>

                      {selectedCalendarHabits.length ===
                        0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                          Chưa có habit.
                        </div>
                      ) : (
                        <div className="space-y-2">

                          {selectedCalendarHabits.map(
                            habit => (
                              <button
                                key={habit.id}
                                onClick={() =>
                                  toggleHabit(
                                    habit.id!,
                                    selectedCalendarDate
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                              >

                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${habit.completed
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-slate-300'
                                    }`}
                                >
                                  {habit.completed
                                    ? '✓'
                                    : ''}
                                </span>

                                <div className="min-w-0">
                                  <div className="font-medium">
                                    {habit.name}
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    {habit.completed
                                      ? 'Completed'
                                      : 'Not completed'}
                                  </div>
                                </div>

                              </button>
                            )
                          )}

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

                {/* HEADER */}
                <section>
                  <p className="text-sm font-medium text-slate-500">
                    Training Analytics
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight">
                    Analytics
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Tổng hợp dữ liệu Actual từ các workout.
                  </p>
                </section>

                {/* SUMMARY */}
                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Total Volume
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {analytics.totalVolume.toLocaleString()}
                      <span className="ml-1 text-sm font-normal text-slate-400">
                        kg
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Total Sets
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {analytics.totalSets}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Best Estimated 1RM
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {analytics.bestEstimated1RM > 0
                        ? analytics.bestEstimated1RM.toFixed(1)
                        : '—'}
                      {analytics.bestEstimated1RM > 0 && (
                        <span className="ml-1 text-sm font-normal text-slate-400">
                          kg
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Best Exercise
                    </p>

                    <p className="mt-2 truncate text-lg font-bold">
                      {analytics.bestEstimated1RMExercise ||
                        '—'}
                    </p>
                  </div>

                </section>
                {/* PERSONAL RECORDS */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">

                  <div className="mb-5">
                    <h2 className="font-bold">
                      Personal Records
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Thành tích tốt nhất từ Actual data.
                    </p>
                  </div>

                  {analytics.prStats.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Chưa có dữ liệu PR.
                    </p>
                  ) : (
                    <div className="space-y-3">

                      {analytics.prStats.map(pr => (
                        <div
                          key={pr.exerciseId}
                          className="rounded-xl border border-slate-200 p-4"
                        >

                          <p className="font-semibold">
                            {pr.name}
                          </p>

                          <div className="mt-3 grid grid-cols-4 gap-2">

                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">
                                Best Weight
                              </p>

                              <p className="mt-1 font-bold">
                                {pr.bestWeight} kg
                              </p>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">
                                Best Reps
                              </p>

                              <p className="mt-1 font-bold">
                                {pr.bestReps}
                              </p>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">
                                Est. 1RM
                              </p>
                              <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">
                                  Progress
                                </p>

                                <p className="mt-1 font-bold">
                                  {pr.progressPercent >= 0 ? '+' : ''}
                                  {pr.progressPercent.toFixed(1)}%
                                </p>
                              </div>
                              <p className="mt-1 font-bold">
                                {pr.bestEstimated1RM.toFixed(1)} kg
                              </p>
                            </div>

                          </div>

                        </div>
                      ))}

                    </div>
                  )}

                </section>
                {/* PROGRESSION */}
                <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="font-bold">
                      Progression
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Theo dõi Estimated 1RM qua từng buổi tập.
                    </p>
                  </div>

                  <select
                    value={selectedAnalyticsExercise ?? ''}
                    onChange={event =>
                      setSelectedAnalyticsExercise(
                        event.target.value
                          ? Number(event.target.value)
                          : null
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">
                      Chọn bài tập
                    </option>

                    {analytics.exerciseStats.map(exercise => (
                      <option
                        key={exercise.exerciseId}
                        value={exercise.exerciseId}
                      >
                        {exercise.name}
                      </option>
                    ))}
                  </select>

                  {selectedAnalyticsExercise &&
                    analytics.progression.length > 0 ? (
                    <div className="mt-6">

                      <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                          <div className="mb-4">
                            <select
                              value={analyticsMetric}
                              onChange={event =>
                                setAnalyticsMetric(
                                  event.target.value as
                                  | 'estimated1RM'
                                  | 'weight'
                                  | 'reps'
                                )
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            >
                              <option value="estimated1RM">
                                Estimated 1RM
                              </option>
                              <option value="weight">
                                Best Weight
                              </option>
                              <option value="reps">
                                Best Reps
                              </option>
                            </select>
                          </div>
                          <div className="mb-3 flex items-end justify-between">
                            <div>
                              <p className="text-xs text-slate-500">
                                {analyticsMetric === 'estimated1RM'
                                  ? 'Estimated 1RM'
                                  : analyticsMetric === 'weight'
                                    ? 'Best Weight'
                                    : 'Best Reps'}
                              </p>

                              <p className="text-2xl font-bold">
                                {Math.max(
                                  ...analytics.progression.map(point =>
                                    analyticsMetric === 'estimated1RM'
                                      ? point.estimated1RM
                                      : analyticsMetric === 'weight'
                                        ? point.weight
                                        : point.reps
                                  )
                                ).toFixed(1)}
                                {analyticsMetric === 'reps' ? ' reps' : ' kg'}
                              </p>
                            </div>
                          </div>

                          <div className="relative h-64 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="min-w-[600px] h-full">
                              {(() => {
                                const values = analytics.progression.map(point =>
                                  analyticsMetric === 'estimated1RM'
                                    ? point.estimated1RM
                                    : analyticsMetric === 'weight'
                                      ? point.weight
                                      : point.reps
                                )

                                const max = Math.max(...values)
                                const min = Math.min(...values)
                                const range = max - min || 1

                                const width = 600
                                const height = 220
                                const paddingX = 30
                                const paddingY = 20

                                const points = analytics.progression.map(
                                  (point, index) => {
                                    const x =
                                      analytics.progression.length === 1
                                        ? width / 2
                                        : paddingX +
                                        (index /
                                          (analytics.progression.length - 1)) *
                                        (width - paddingX * 2)

                                    const value =
                                      analyticsMetric === 'estimated1RM'
                                        ? point.estimated1RM
                                        : analyticsMetric === 'weight'
                                          ? point.weight
                                          : point.reps

                                    const y =
                                      height -
                                      paddingY -
                                      ((value - min) / range) *
                                      (height - paddingY * 2)

                                    return {
                                      x,
                                      y,
                                      point,
                                    }
                                  }
                                )

                                const polylinePoints = points
                                  .map(point => `${point.x},${point.y}`)
                                  .join(' ')

                                return (
                                  <svg
                                    viewBox={`0 0 ${width} ${height}`}
                                    className="h-full w-full"
                                    preserveAspectRatio="none"
                                  >
                                    {/* Đường nối */}
                                    {points.length > 1 && (
                                      <polyline
                                        points={polylinePoints}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-slate-900"
                                      />
                                    )}

                                    {/* Các điểm */}
                                    {points.map((item, index) => (
                                      <g key={`${item.point.date}-${index}`}>
                                        <circle
                                          cx={item.x}
                                          cy={item.y}
                                          r="6"
                                          className="fill-slate-900 stroke-white"
                                          strokeWidth="3"
                                        />

                                        <text
                                          x={item.x}
                                          y={item.y - 12}
                                          textAnchor="middle"
                                          className="fill-slate-600 text-[10px]"
                                        >
                                          {(
                                            analyticsMetric === 'estimated1RM'
                                              ? item.point.estimated1RM
                                              : analyticsMetric === 'weight'
                                                ? item.point.weight
                                                : item.point.reps
                                          ).toFixed(1)}
                                        </text>
                                      </g>
                                    ))}
                                  </svg>
                                )
                              })()}
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            {analytics.progression.map(
                              (point, index) => (
                                <div
                                  key={`${point.date}-detail-${index}`}
                                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                                >
                                  <span className="text-slate-500">
                                    {point.date}
                                  </span>

                                  <span className="font-medium">
                                    {point.weight} kg × {point.reps}
                                  </span>

                                  <span className="font-bold">
                                    1RM {point.estimated1RM.toFixed(1)} kg
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                      Chọn một bài tập để xem progression.
                    </div>
                  )}
                </section>
                {/* EXERCISE ANALYTICS */}
                <section className="rounded-2xl bg-white p-5 shadow-sm">

                  <div className="mb-5">
                    <h2 className="font-bold">
                      Exercise Performance
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Volume và Estimated 1RM theo từng bài.
                    </p>
                  </div>

                  {analytics.exerciseStats.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                      <p className="text-sm text-slate-500">
                        Chưa có Actual data để phân tích.
                      </p>

                      <button
                        onClick={() => setPage('Gym')}
                        className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Go to Gym
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[650px] text-sm">

                        <thead>
                          <tr className="border-b border-slate-200 text-left text-slate-500">
                            <th className="px-3 py-3 font-medium">
                              Exercise
                            </th>

                            <th className="px-3 py-3 text-right font-medium">
                              Sets
                            </th>

                            <th className="px-3 py-3 text-right font-medium">
                              Volume
                            </th>

                            <th className="px-3 py-3 text-right font-medium">
                              Est. 1RM
                            </th>
                          </tr>
                        </thead>

                        <tbody>

                          {analytics.exerciseStats.map(
                            exercise => (
                              <tr
                                key={exercise.exerciseId}
                                className="border-b border-slate-100 last:border-0"
                              >

                                <td className="px-3 py-3 font-medium">
                                  {exercise.name}
                                </td>

                                <td className="px-3 py-3 text-right text-slate-600">
                                  {exercise.sets}
                                </td>

                                <td className="px-3 py-3 text-right font-medium">
                                  {exercise.volume.toLocaleString()}
                                  {' '}
                                  <span className="text-xs text-slate-400">
                                    kg
                                  </span>
                                </td>

                                <td className="px-3 py-3 text-right font-medium">
                                  {exercise.estimated1RM.toFixed(1)}
                                  {' '}
                                  <span className="text-xs text-slate-400">
                                    kg
                                  </span>
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </section>

              </div>
            )}
            {/* REPORTS */}
            {page === 'Reports' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">
                    Reports
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Review and export your gym training history.
                  </p>
                </div>

                {/* Report Range */}
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">
                    Report Range
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {[
                      ['day', 'Day'],
                      ['week', 'Week'],
                      ['month', 'Month'],
                      ['custom', 'Custom'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() =>
                          setReportRange(
                            value as
                            | 'day'
                            | 'week'
                            | 'month'
                            | 'custom'
                          )
                        }
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${reportRange === value
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date */}
                  {reportRange === 'custom' && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Start Date
                        </label>

                        <input
                          type="date"
                          value={reportStartDate}
                          onChange={e =>
                            setReportStartDate(e.target.value)
                          }
                          className="w-full rounded-xl border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          End Date
                        </label>

                        <input
                          type="date"
                          value={reportEndDate}
                          onChange={e =>
                            setReportEndDate(e.target.value)
                          }
                          className="w-full rounded-xl border px-3 py-2"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={loadReport}
                      className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Load Report
                    </button>

                    <button
                      onClick={generatePDF}
                      className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={exportCSV}
                      className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Report Summary */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      Workouts
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {reportWorkouts.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      Exercises
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {
                        new Set(
                          reportRows.map(row => row.exercise)
                        ).size
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      Total Sets
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {reportRows.length}
                    </p>
                  </div>
                </div>

                {/* Report Table */}
                <div className="rounded-2xl border bg-white shadow-sm">
                  <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">
                      Training Data
                    </h2>
                  </div>

                  {reportRows.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No training data found for this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[900px] w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50 text-left">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Topic</th>
                            <th className="px-4 py-3">Exercise</th>
                            <th className="px-4 py-3">Set</th>
                            <th className="px-4 py-3">KG</th>
                            <th className="px-4 py-3">Reps</th>
                            <th className="px-4 py-3">RPE</th>
                            <th className="px-4 py-3">Note</th>
                          </tr>
                        </thead>

                        <tbody>
                          {reportRows.map((row, index) => (
                            <tr
                              key={`${row.date}-${row.exercise}-${row.setNumber}-${index}`}
                              className="border-b last:border-b-0"
                            >
                              <td className="px-4 py-3">
                                {row.date}
                              </td>

                              <td className="px-4 py-3">
                                {row.topic}
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {row.exercise}
                              </td>

                              <td className="px-4 py-3">
                                {row.setNumber}
                              </td>

                              <td className="px-4 py-3">
                                {row.kg}
                              </td>

                              <td className="px-4 py-3">
                                {row.reps}
                              </td>

                              <td className="px-4 py-3">
                                {row.rpe || '-'}
                              </td>

                              <td className="px-4 py-3">
                                {row.note || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {page === 'Settings' && (
              <div className="space-y-5">

                {/* DATA STORAGE */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold">
                    Settings
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Quản lý dữ liệu và ứng dụng.
                  </p>

                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          Local Database
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Dữ liệu được lưu trên thiết bị bằng IndexedDB.
                        </p>
                      </div>

                      <span className="whitespace-nowrap text-sm font-medium text-green-600">
                        ● Active
                      </span>
                    </div>
                  </div>
                </section>

                {/* BACKUP & RESTORE */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">

                  <h3 className="font-bold">
                    Backup & Restore
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Sao lưu hoặc khôi phục toàn bộ dữ liệu Gym và Habit.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    {/* EXPORT */}
                    <button
                      onClick={exportBackup}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <p className="font-semibold">
                        Export Backup
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Tải toàn bộ dữ liệu thành file JSON.
                      </p>
                    </button>

                    {/* IMPORT */}
                    <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-3 transition hover:bg-slate-50">

                      <p className="font-semibold">
                        Import Backup
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Khôi phục dữ liệu từ file JSON.
                      </p>

                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={importBackupFile}
                      />

                    </label>

                  </div>

                  <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                    <strong>Lưu ý:</strong> Import Backup sẽ thay thế toàn bộ dữ liệu hiện tại.
                  </div>

                </section>
                {/* EXERCISE LIBRARY SETTINGS */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="font-bold">
                    Exercise Library
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Quản lý quyền xóa Exercise khỏi thư viện.
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        Enable Exercise Deletion
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Bật tùy chọn này để hiển thị nút xóa Exercise trong Gym.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextValue = !exerciseDeletionEnabled

                        setExerciseDeletionEnabled(nextValue)

                        localStorage.setItem(
                          'exerciseDeletionEnabled',
                          String(nextValue)
                        )
                      }}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${exerciseDeletionEnabled
                        ? 'bg-green-600'
                        : 'bg-slate-300'
                        }`}
                      aria-label="Enable Exercise Deletion"
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${exerciseDeletionEnabled
                          ? 'left-6'
                          : 'left-1'
                          }`}
                      />
                    </button>
                  </div>

                  {exerciseDeletionEnabled && (
                    <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                      <strong>Cảnh báo:</strong> Khi bật, nút xóa Exercise sẽ
                      xuất hiện trong Exercise Library.
                    </div>
                  )}
                </section>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        Dark Mode
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Sử dụng giao diện tối
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDarkMode(prev => !prev)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${darkMode ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      aria-label="Toggle dark mode"
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${darkMode ? 'left-6' : 'left-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
                {/* APP INFO */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">

                  <h3 className="font-bold">
                    App Information
                  </h3>

                  <div className="mt-4 space-y-3 text-sm">

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        App
                      </span>

                      <span className="font-medium">
                        Gym & Habit Tracker
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Version
                      </span>

                      <span className="font-medium">
                        V1
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Storage
                      </span>

                      <span className="font-medium">
                        IndexedDB
                      </span>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    ↻ Refresh App
                  </button>

                </section>

                {/* DANGER ZONE */}
                <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">

                  <h3 className="font-bold text-red-600">
                    Danger Zone
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Xóa toàn bộ dữ liệu Gym và Habit khỏi thiết bị.
                  </p>

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
                          await db.exercises.clear()
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
          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-7">
          {navItems.map(item => (
            <button
              type="button"
              key={item}
              onClick={() => setPage(item)}
              className={`min-w-0 px-0.5 py-3 text-xs font-medium leading-tight ${page === item
                ? 'text-slate-900'
                : 'text-slate-400'
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