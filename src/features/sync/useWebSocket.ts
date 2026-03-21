import { useEffect, useRef, useState } from 'react'
import type { Todo } from '../../types'

export type WsMessage =
  | { type: 'todo.created'; todo: Todo }
  | { type: 'todo.updated'; todo: Todo }
  | { type: 'todo.deleted'; id: string }

export interface UseWebSocketOptions {
  onTodoCreated?: (todo: Todo) => void
  onTodoUpdated?: (todo: Todo) => void
  onTodoDeleted?: (id: string) => void
  onReconnect?: () => void
}

function getWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl && /^https?:\/\//.test(apiUrl)) {
    return apiUrl.replace(/^http/, 'ws') + '/ws'
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/api/ws`
}

export function useWebSocket(options: UseWebSocketOptions = {}): { connected: boolean } {
  const [connected, setConnected] = useState(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    let ws: WebSocket | null = null
    let retryCount = 0
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let destroyed = false

    function connect(isReconnect: boolean) {
      try {
        ws = new WebSocket(getWsUrl())
      } catch {
        return
      }

      ws.onopen = () => {
        setConnected(true)
        retryCount = 0
        if (isReconnect) {
          optionsRef.current.onReconnect?.()
        }
      }

      ws.onmessage = (event: MessageEvent) => {
        let msg: WsMessage
        try {
          msg = JSON.parse(event.data as string) as WsMessage
        } catch {
          return
        }
        switch (msg.type) {
          case 'todo.created':
            optionsRef.current.onTodoCreated?.(msg.todo)
            break
          case 'todo.updated':
            optionsRef.current.onTodoUpdated?.(msg.todo)
            break
          case 'todo.deleted':
            optionsRef.current.onTodoDeleted?.(msg.id)
            break
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!destroyed) {
          const delay = Math.min(1000 * 2 ** retryCount, 30000)
          retryCount++
          retryTimeout = setTimeout(() => connect(true), delay)
        }
      }

      ws.onerror = () => {
        ws?.close()
      }
    }

    connect(false)

    return () => {
      destroyed = true
      if (retryTimeout !== null) {
        clearTimeout(retryTimeout)
        retryTimeout = null
      }
      if (ws) {
        ws.onopen = null
        ws.onmessage = null
        ws.onclose = null
        ws.onerror = null
        ws.close()
        ws = null
      }
    }
  }, [])

  return { connected }
}
