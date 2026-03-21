import { useRef, useState } from 'react'
import type { Todo } from '../../types'

interface TodoItemProps {
  todo: Todo
  onDelete: (id: string) => void
  onUpdate: (id: string, title: string) => void
}

export function TodoItem({ todo, onDelete, onUpdate }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(todo.title)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function save() {
    const trimmed = draft.trim()
    if (trimmed === '') return
    setEditing(false)
    if (trimmed !== todo.title) {
      onUpdate(todo.id, trimmed)
    }
  }

  function cancel() {
    setDraft(todo.title)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') save()
    else if (e.key === 'Escape') cancel()
  }

  return (
    <li className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      {editing ? (
        <input
          ref={inputRef}
          className="flex-1 text-gray-800 border-b border-blue-500 outline-none bg-transparent"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          aria-label="Edit todo"
        />
      ) : (
        <span
          className="flex-1 text-gray-800 cursor-pointer"
          onClick={startEdit}
        >
          {todo.title}
        </span>
      )}
      {!editing && (
        <button
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete ${todo.title}`}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          ×
        </button>
      )}
    </li>
  )
}
