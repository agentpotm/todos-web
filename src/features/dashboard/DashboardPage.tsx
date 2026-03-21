import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'
import type { Todo } from '../../types'
import { AddTodoForm } from './AddTodoForm'
import { TodoList } from './TodoList'

type Status = 'loading' | 'success' | 'error'

export function DashboardPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/todos')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as { message?: string }).message ?? 'Failed to load todos.')
        }
        return res.json() as Promise<Todo[]>
      })
      .then((data) => {
        setTodos(data)
        setStatus('success')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load todos.')
        setStatus('error')
      })
  }, [])

  function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    apiFetch(`/todos/${id}`, { method: 'DELETE' })
  }

  async function handleAdd(title: string) {
    const res = await apiFetch('/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { message?: string }).message ?? 'Failed to add todo.')
    }
    const newTodo = (await res.json()) as Todo
    setTodos((prev) => [...prev, newTodo])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <AddTodoForm onAdd={handleAdd} />

        {status === 'loading' && (
          <p className="text-gray-500 text-center py-8">Loading todos…</p>
        )}

        {status === 'error' && (
          <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        {status === 'success' && <TodoList todos={todos} onDelete={handleDelete} />}
      </main>
    </div>
  )
}
