import { useState } from 'react'
import { apiFetch } from '../../api/client'

type Status = 'idle' | 'submitting' | 'success' | 'logging-out'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('submitting')
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.status === 401) {
        setError('Invalid email or password.')
        setStatus('idle')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { message?: string }).message ?? 'Login failed. Please try again.')
        setStatus('idle')
        return
      }

      setStatus('success')
    } catch {
      setError('Network error. Please check your connection and try again.')
      setStatus('idle')
    }
  }

  async function handleLogout() {
    setStatus('logging-out')
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      setStatus('idle')
      setEmail('')
      setPassword('')
    }
  }

  if (status === 'success' || status === 'logging-out') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">You are logged in</h2>
          <p className="text-gray-600 mb-6">Welcome back, {email}!</p>
          <button
            onClick={handleLogout}
            disabled={status === 'logging-out'}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {status === 'logging-out' ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Log in</h1>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'submitting' ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
