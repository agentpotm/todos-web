import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { TodoList } from './TodoList'
import { TodoItem } from './TodoItem'
import type { Todo } from '../../types'

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '../../api/client'

const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

const sampleTodos: Todo[] = [
  { id: '1', title: 'Buy milk', completed: false, createdAt: '2026-01-01T00:00:00Z' },
  { id: '2', title: 'Walk the dog', completed: false, createdAt: '2026-01-02T00:00:00Z' },
]

describe('TodoItem', () => {
  it('renders the todo title', () => {
    render(<TodoItem todo={sampleTodos[0]} onDelete={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('calls onDelete with the todo id when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<TodoItem todo={sampleTodos[0]} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete buy milk/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})

describe('TodoList', () => {
  it('renders all todos', () => {
    render(<TodoList todos={sampleTodos} onDelete={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('shows empty state when no todos', () => {
    render(<TodoList todos={[]} onDelete={vi.fn()} />)
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
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

    render(<DashboardPage />)

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

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
    })
  })

  it('shows error message on failed fetch', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unauthorized')
    })
  })

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValueOnce(new Promise(() => {}))

    render(<DashboardPage />)

    expect(screen.getByText(/loading todos/i)).toBeInTheDocument()
  })

  it('removes todo immediately when delete is clicked', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => sampleTodos })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /delete buy milk/i }))

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })
})
