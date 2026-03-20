import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import * as client from '../../api/client'

describe('LoginPage', () => {
  const apiFetchSpy = vi.spyOn(client, 'apiFetch')

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password fields with a submit button', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows error for invalid credentials (401)', async () => {
    apiFetchSpy.mockResolvedValueOnce(new Response(null, { status: 401 }))
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i)
    })
  })

  it('shows logged-in state with logout button on successful login', async () => {
    apiFetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }))
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/you are logged in/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('calls logout endpoint and returns to login form on log out', async () => {
    apiFetchSpy
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /log out/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    })
    expect(apiFetchSpy).toHaveBeenCalledWith('/auth/logout', { method: 'POST' })
  })

  it('shows generic error on network failure', async () => {
    apiFetchSpy.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
    })
  })
})

describe('RegisterPage', () => {
  const apiFetchSpy = vi.spyOn(client, 'apiFetch')

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password fields with a submit button', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows error when password is shorter than 8 characters', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i)
    expect(apiFetchSpy).not.toHaveBeenCalled()
  })

  it('shows duplicate email error when server returns 409', async () => {
    apiFetchSpy.mockResolvedValueOnce(new Response(null, { status: 409 }))
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i)
    })
  })

  it('shows confirmation message on successful registration', async () => {
    apiFetchSpy.mockResolvedValueOnce(new Response(null, { status: 201 }))
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/email/i), 'new@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
    })
  })

  it('shows generic error on network failure', async () => {
    apiFetchSpy.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
    })
  })
})
