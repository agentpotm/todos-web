import { useEffect, useRef, useState } from 'react'
import type { Todo } from '../../types'

// Event schema matches backend: { type: "todo:created", payload: { ... } }
export type WsMessage =
  | { type: 'todo:created'; payload: Todo }
  | { type: 'todo:updated'; payload: Todo }
  | { type: 'todo:deleted'; payload: { id: string } }

export interface UseWebSocketOptions {
  token: string | null
  onTodoCreated?: (todo: Todo) => void
  onTodoUpdated?: (todo: Todo) => void
  onTodoDeleted?: (id: string) => void
  onReconnect?: () => void
}

function getWsUrl(token: string): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  let base: string
  if (apiUrl && /^https?:\/\//.test(apiUrl)) {
    base = apiUrl.replace(/^http/, 'ws') + '/ws'
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    base = `${protocol}://${window.location.host}/api/ws`
  }
  return `${base}?token=${encodeURIComponent(token)}`
}

export function useWebSocket(options: UseWebSocketOptions): { connected: boolean } {
  const [connected, setConnected] = useState(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!options.token) return

    let ws: WebSocket | null = null
    let retryCount = 0
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let destroyed = false

    function connect(isReconnect: boolean) {
      const token = optionsRef.current.token
      if (!token) return
      try {
        ws = new WebSocket(getWsUrl(token))
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
          case 'todo:created':
            optionsRef.current.onTodoCreated?.(msg.payload)
            break
          case 'todo:updated':
            optionsRef.current.onTodoUpdated?.(msg.payload)
            break
          case 'todo:deleted':
            optionsRef.current.onTodoDeleted?.(msg.payload.id)
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
  }, [options.token])

  return { connected }
}
