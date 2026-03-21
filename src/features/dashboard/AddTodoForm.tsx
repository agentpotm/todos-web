import { useState } from 'react'

interface Props {
  onAdd: (title: string) => Promise<void>
}

export function AddTodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await onAdd(trimmed)
      setTitle('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new todo…"
        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="New todo title"
      />
      <button
        type="submit"
        disabled={!title.trim() || submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </form>
  )
}
