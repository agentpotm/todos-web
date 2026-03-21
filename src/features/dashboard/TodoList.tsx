import type { Todo } from '../../types'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  onDelete: (id: string) => void
}

export function TodoList({ todos, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">No todos yet. Add one to get started!</p>
    )
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onDelete={onDelete} />
      ))}
    </ul>
  )
}
