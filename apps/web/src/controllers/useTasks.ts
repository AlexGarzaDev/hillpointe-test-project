import { useState, useEffect, useCallback } from 'react'
import type { Task, TaskState } from '../models/task'
import { apiUrl } from '../models/api'

export function useTasks() {
  // Task state powers the selected prospect's to-do panel.
  const [tasks, setTasks] = useState<Task[]>([])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/tasks'))
      const json = await res.json() as { data: Task[] }
      setTasks(json.data ?? [])
    } catch (err) {
      console.error('Failed to fetch tasks', err)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTasks()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchTasks])

  const setTaskState = useCallback(async (id: string, state: TaskState) => {
    // Persist a single task update and merge returned canonical task object.
    const res = await fetch(apiUrl(`/tasks/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
    const json = await res.json() as { data: Task }
    setTasks((prev) => prev.map((t) => (t.id === id ? json.data : t)))
  }, [])

  const openTasksFor = useCallback(
    // Derived selector reused by components that only need actionable tasks.
    (prospectId: string) =>
      tasks.filter((t) => t.prospectId === prospectId && t.state === 'open'),
    [tasks],
  )

  return { tasks, setTaskState, openTasksFor, refetch: fetchTasks }
}
