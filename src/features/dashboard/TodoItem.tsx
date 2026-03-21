import type { Todo } from '../../types'

interface TodoItemProps {
  todo: Todo
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <span className="flex-1 text-gray-800">{todo.title}</span>
      <button
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete ${todo.title}`}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        ×
      </button>
    </li>
  )
}
