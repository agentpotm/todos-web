interface ConnectionIndicatorProps {
  connected: boolean
}

export function ConnectionIndicator({ connected }: ConnectionIndicatorProps) {
  if (connected) return null
  return (
    <div role="alert" className="bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-sm text-center py-2 px-4">
      Connection lost — changes may not be saved. Reconnecting…
    </div>
  )
}
