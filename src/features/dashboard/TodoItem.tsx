import type { Todo } from '../../types'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <span className="text-gray-800">{todo.title}</span>
    </li>
  )
}
