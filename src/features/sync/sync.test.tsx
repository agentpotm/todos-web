import { render, renderHook, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConnectionIndicator } from './ConnectionIndicator'
import { useWebSocket } from './useWebSocket'
import type { Todo } from '../../types'

// Mock WebSocket
let mockInstances: MockWebSocket[] = []

class MockWebSocket {
  onopen: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  readyState = 0

  constructor() {
    mockInstances.push(this)
  }

  close() {
    if (this.readyState === 3) return
    this.readyState = 3
    this.onclose?.(new CloseEvent('close'))
  }
}

beforeEach(() => {
  mockInstances = []
  vi.stubGlobal('WebSocket', MockWebSocket)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const sampleTodo: Todo = { id: '1', title: 'Test', completed: false, createdAt: '2026-01-01T00:00:00Z' }

describe('useWebSocket', () => {
  it('starts disconnected', () => {
    const { result } = renderHook(() => useWebSocket({ token: 'test-token' }))
    expect(result.current.connected).toBe(false)
  })

  it('becomes connected on open', () => {
    const { result } = renderHook(() => useWebSocket({ token: 'test-token' }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
    })
    expect(result.current.connected).toBe(true)
  })

  it('calls onTodoCreated when todo:created message received', () => {
    const onTodoCreated = vi.fn()
    renderHook(() => useWebSocket({ token: 'test-token', onTodoCreated }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
      mockInstances[0].onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({ type: 'todo:created', payload: sampleTodo }),
        }),
      )
    })
    expect(onTodoCreated).toHaveBeenCalledWith(sampleTodo)
  })

  it('calls onTodoUpdated when todo:updated message received', () => {
    const onTodoUpdated = vi.fn()
    renderHook(() => useWebSocket({ token: 'test-token', onTodoUpdated }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
      mockInstances[0].onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({ type: 'todo:updated', payload: sampleTodo }),
        }),
      )
    })
    expect(onTodoUpdated).toHaveBeenCalledWith(sampleTodo)
  })

  it('calls onTodoDeleted when todo:deleted message received', () => {
    const onTodoDeleted = vi.fn()
    renderHook(() => useWebSocket({ token: 'test-token', onTodoDeleted }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
      mockInstances[0].onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({ type: 'todo:deleted', payload: { id: '1' } }),
        }),
      )
    })
    expect(onTodoDeleted).toHaveBeenCalledWith('1')
  })

  it('becomes disconnected on close', () => {
    const { result } = renderHook(() => useWebSocket({ token: 'test-token' }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
    })
    expect(result.current.connected).toBe(true)
    act(() => {
      mockInstances[0].close()
    })
    expect(result.current.connected).toBe(false)
  })

  it('reconnects after disconnect with exponential backoff', () => {
    renderHook(() => useWebSocket({ token: 'test-token' }))
    expect(mockInstances).toHaveLength(1)
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
      mockInstances[0].close()
    })
    expect(mockInstances).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockInstances).toHaveLength(2)
  })

  it('calls onReconnect after successful reconnection', () => {
    const onReconnect = vi.fn()
    renderHook(() => useWebSocket({ token: 'test-token', onReconnect }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
      mockInstances[0].close()
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    act(() => {
      mockInstances[1].onopen?.(new Event('open'))
    })
    expect(onReconnect).toHaveBeenCalledTimes(1)
  })

  it('does not call onReconnect on initial connection', () => {
    const onReconnect = vi.fn()
    renderHook(() => useWebSocket({ token: 'test-token', onReconnect }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
    })
    expect(onReconnect).not.toHaveBeenCalled()
  })

  it('does not reconnect after unmount', () => {
    const { unmount } = renderHook(() => useWebSocket({ token: 'test-token' }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(mockInstances).toHaveLength(1)
  })

  it('ignores malformed messages', () => {
    const onTodoCreated = vi.fn()
    renderHook(() => useWebSocket({ token: 'test-token', onTodoCreated }))
    act(() => {
      mockInstances[0].onopen?.(new Event('open'))
      mockInstances[0].onmessage?.(new MessageEvent('message', { data: 'not-json' }))
    })
    expect(onTodoCreated).not.toHaveBeenCalled()
  })
})

describe('ConnectionIndicator', () => {
  it('shows alert when disconnected', () => {
    render(<ConnectionIndicator connected={false} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows nothing when connected', () => {
    render(<ConnectionIndicator connected={true} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
