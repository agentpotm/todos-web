import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { AddTodoForm } from './AddTodoForm'
import { TodoList } from './TodoList'
import { TodoItem } from './TodoItem'
import type { Todo } from '../../types'
import type { UseWebSocketOptions } from '../sync/useWebSocket'

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
}))

let capturedWsOptions: UseWebSocketOptions = { token: null }
vi.mock('../sync/useWebSocket', () => ({
  useWebSocket: vi.fn((opts: UseWebSocketOptions) => {
    capturedWsOptions = opts ?? { token: null }
    return { connected: false }
  }),
}))

import { apiFetch } from '../../api/client'

const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

const sampleTodos: Todo[] = [
  { id: '1', title: 'Buy milk', completed: false, createdAt: '2026-01-01T00:00:00Z' },
  { id: '2', title: 'Walk the dog', completed: false, createdAt: '2026-01-02T00:00:00Z' },
]

const noop = () => {}

describe('TodoItem', () => {
  it('renders the todo title', () => {
    render(<TodoItem todo={sampleTodos[0]} onDelete={noop} onUpdate={noop} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('calls onDelete with the todo id when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<TodoItem todo={sampleTodos[0]} onDelete={onDelete} onUpdate={noop} />)
    await userEvent.click(screen.getByRole('button', { name: /delete buy milk/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('enters edit mode on click', async () => {
    render(<TodoItem todo={sampleTodos[0]} onDelete={noop} onUpdate={noop} />)
    await userEvent.click(screen.getByText('Buy milk'))
    expect(screen.getByRole('textbox', { name: /edit todo/i })).toBeInTheDocument()
  })

  it('saves on Enter with new non-empty value', async () => {
    const onUpdate = vi.fn()
    render(<TodoItem todo={sampleTodos[0]} onDelete={noop} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByText('Buy milk'))
    const input = screen.getByRole('textbox', { name: /edit todo/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Buy oat milk')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onUpdate).toHaveBeenCalledWith('1', 'Buy oat milk')
  })

  it('saves on blur with new non-empty value', async () => {
    const onUpdate = vi.fn()
    render(<TodoItem todo={sampleTodos[0]} onDelete={noop} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByText('Buy milk'))
    const input = screen.getByRole('textbox', { name: /edit todo/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Buy oat milk')
    fireEvent.blur(input)
    expect(onUpdate).toHaveBeenCalledWith('1', 'Buy oat milk')
  })

  it('cancels on Escape and restores original text', async () => {
    const onUpdate = vi.fn()
    render(<TodoItem todo={sampleTodos[0]} onDelete={noop} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByText('Buy milk'))
    const input = screen.getByRole('textbox', { name: /edit todo/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'changed')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('does not save when text is empty', async () => {
    const onUpdate = vi.fn()
    render(<TodoItem todo={sampleTodos[0]} onDelete={noop} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByText('Buy milk'))
    const input = screen.getByRole('textbox', { name: /edit todo/i })
    await userEvent.clear(input)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: /edit todo/i })).toBeInTheDocument()
  })

  it('hides delete button while editing', async () => {
    render(<TodoItem todo={sampleTodos[0]} onDelete={noop} onUpdate={noop} />)
    await userEvent.click(screen.getByText('Buy milk'))
    expect(screen.queryByRole('button', { name: /delete buy milk/i })).not.toBeInTheDocument()
  })
})

describe('TodoList', () => {
  it('renders all todos', () => {
    render(<TodoList todos={sampleTodos} onDelete={noop} onUpdate={noop} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('shows empty state when no todos', () => {
    render(<TodoList todos={[]} onDelete={noop} onUpdate={noop} />)
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
  })
})

describe('AddTodoForm', () => {
  it('renders input and submit button', () => {
    render(<AddTodoForm onAdd={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: /new todo title/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('disables submit when input is empty', () => {
    render(<AddTodoForm onAdd={vi.fn()} />)
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled()
  })

  it('enables submit when input has text', async () => {
    const user = userEvent.setup()
    render(<AddTodoForm onAdd={vi.fn()} />)
    await user.type(screen.getByRole('textbox', { name: /new todo title/i }), 'Buy eggs')
    expect(screen.getByRole('button', { name: /add/i })).toBeEnabled()
  })

  it('calls onAdd with trimmed title and clears input', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(<AddTodoForm onAdd={onAdd} />)
    const input = screen.getByRole('textbox', { name: /new todo title/i })
    await user.type(input, 'Buy eggs')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith('Buy eggs')
    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('does not submit whitespace-only input', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddTodoForm onAdd={onAdd} />)
    await user.type(screen.getByRole('textbox', { name: /new todo title/i }), '   ')
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled()
  })
})

describe('DashboardPage', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
  })

  it('shows all todos after loading', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleTodos,
    })

    render(<DashboardPage token="test-token" />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
      expect(screen.getByText('Walk the dog')).toBeInTheDocument()
    })
  })

  it('shows empty state when no todos exist', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<DashboardPage token="test-token" />)

    await waitFor(() => {
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
    })
  })

  it('shows error message on failed fetch', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    })

    render(<DashboardPage token="test-token" />)

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts.some((el) => el.textContent?.includes('Unauthorized'))).toBe(true)
    })
  })

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValueOnce(new Promise(() => {}))

    render(<DashboardPage token="test-token" />)

    expect(screen.getByText(/loading todos/i)).toBeInTheDocument()
  })

  it('removes todo immediately when delete is clicked', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => sampleTodos })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<DashboardPage token="test-token" />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /delete buy milk/i }))

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('always shows add-todo input', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleTodos,
    })

    render(<DashboardPage token="test-token" />)

    expect(screen.getByRole('textbox', { name: /new todo title/i })).toBeInTheDocument()
  })

  it('adds a new todo after submission', async () => {
    const user = userEvent.setup()
    const newTodo: Todo = { id: '3', title: 'Buy eggs', completed: false, createdAt: '2026-01-03T00:00:00Z' }

    mockApiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => sampleTodos })
      .mockResolvedValueOnce({ ok: true, json: async () => newTodo })

    render(<DashboardPage token="test-token" />)

    await waitFor(() => expect(screen.getByText('Buy milk')).toBeInTheDocument())

    const input = screen.getByRole('textbox', { name: /new todo title/i })
    await user.type(input, 'Buy eggs')
    await user.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => expect(screen.getByText('Buy eggs')).toBeInTheDocument())
    expect(input).toHaveValue('')
  })

  it('updates todo title via PATCH on edit', async () => {
    const updatedTodo = { ...sampleTodos[0], title: 'Buy oat milk' }
    mockApiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => sampleTodos })
      .mockResolvedValueOnce({ ok: true, json: async () => updatedTodo })

    render(<DashboardPage token="test-token" />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Buy milk'))
    const input = screen.getByRole('textbox', { name: /edit todo/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Buy oat milk')
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/todos/1',
        expect.objectContaining({ method: 'PATCH' }),
      )
      expect(screen.getByText('Buy oat milk')).toBeInTheDocument()
    })
  })
})

describe('DashboardPage real-time updates', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
  })

  it('adds a todo received via WebSocket without refetch', async () => {
    const newTodo: Todo = { id: '3', title: 'WS todo', completed: false, createdAt: '2026-01-03T00:00:00Z' }
    mockApiFetch.mockResolvedValueOnce({ ok: true, json: async () => sampleTodos })

    render(<DashboardPage token="test-token" />)
    await waitFor(() => expect(screen.getByText('Buy milk')).toBeInTheDocument())

    act(() => {
      capturedWsOptions.onTodoCreated?.(newTodo)
    })

    expect(screen.getByText('WS todo')).toBeInTheDocument()
  })

  it('updates a todo received via WebSocket', async () => {
    const updatedTodo = { ...sampleTodos[0], title: 'Updated via WS' }
    mockApiFetch.mockResolvedValueOnce({ ok: true, json: async () => sampleTodos })

    render(<DashboardPage token="test-token" />)
    await waitFor(() => expect(screen.getByText('Buy milk')).toBeInTheDocument())

    act(() => {
      capturedWsOptions.onTodoUpdated?.(updatedTodo)
    })

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText('Updated via WS')).toBeInTheDocument()
  })

  it('removes a todo deleted via WebSocket', async () => {
    mockApiFetch.mockResolvedValueOnce({ ok: true, json: async () => sampleTodos })

    render(<DashboardPage token="test-token" />)
    await waitFor(() => expect(screen.getByText('Buy milk')).toBeInTheDocument())

    act(() => {
      capturedWsOptions.onTodoDeleted?.('1')
    })

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })
})
