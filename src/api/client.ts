const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
  })
}
