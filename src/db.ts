import Dexie, { type Table } from 'dexie'

export interface Exercise {
    id?: number
    name: string
    createdAt: Date
}

export interface Workout {
    id?: number
    date: string
    topic: string
    createdAt: Date
}

export interface WorkoutExercise {
    id?: number
    workoutId: number
    exerciseId: number
    order: number
}

export interface WorkoutSet {
    id?: number
    workoutExerciseId: number
    setNumber: number
    kg: number
    reps: number
    rpe?: number
    note?: string
}

export interface WorkoutPlanSet {
    id?: number
    workoutExerciseId: number
    setNumber: number
    kg?: number
    reps?: number
    rpe?: number
    note?: string
}

export interface Habit {
    id?: number
    name: string
    createdAt: Date
    schedule: number[]
}

export interface HabitCompletion {
    id?: number
    habitId: number
    date: string
    completed: boolean
}

class GymHabitDatabase extends Dexie {
    exercises!: Table<Exercise, number>
    workouts!: Table<Workout, number>
    workoutExercises!: Table<WorkoutExercise, number>
    workoutSets!: Table<WorkoutSet, number>
    workoutPlanSets!: Table<WorkoutPlanSet, number>
    habits!: Table<Habit, number>
    habitCompletions!: Table<HabitCompletion, number>

    constructor() {
        super('GymHabitTrackerDatabase')

        this.version(1).stores({
            exercises: '++id, name, createdAt',
        })

        this.version(2).stores({
            exercises: '++id, name, createdAt',
            workouts: '++id, date, createdAt',
            workoutExercises: '++id, workoutId, exerciseId, order',
            workoutSets: '++id, workoutExerciseId, setNumber',
        })

        this.version(3).stores({
            exercises: '++id, name, createdAt',
            workouts: '++id, date, createdAt',
            workoutExercises: '++id, workoutId, exerciseId, order',
            workoutSets: '++id, workoutExerciseId, setNumber',
            workoutPlanSets: '++id, workoutExerciseId, setNumber',
        })

        this.version(4).stores({
            exercises: '++id, name, createdAt',
            workouts: '++id, date, createdAt',
            workoutExercises: '++id, workoutId, exerciseId, order',
            workoutSets: '++id, workoutExerciseId, setNumber',
            workoutPlanSets: '++id, workoutExerciseId, setNumber',
            habits: '++id, name, createdAt',
            habitCompletions: '++id, habitId, date, [habitId+date]',
        })
        this.version(5).stores({
            exercises: '++id, name, createdAt',
            workouts: '++id, date, createdAt',
            workoutExercises: '++id, workoutId, exerciseId, order',
            workoutSets: '++id, workoutExerciseId, setNumber',
            workoutPlanSets: '++id, workoutExerciseId, setNumber',
            habits: '++id, name, createdAt',
            habitCompletions: '++id, habitId, date, [habitId+date]',
        }).upgrade(async tx => {
            await tx
                .table('habits')
                .toCollection()
                .modify(habit => {
                    if (!Array.isArray(habit.schedule)) {
                        habit.schedule = [0, 1, 2, 3, 4, 5, 6]
                    }
                })
        })
    }
}

export const db = new GymHabitDatabase()