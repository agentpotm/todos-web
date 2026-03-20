import { render, screen } from '@testing-library/react'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'

describe('auth stubs', () => {
  it('renders LoginPage', () => {
    render(<LoginPage />)
    expect(screen.getByText('LoginPage')).toBeInTheDocument()
  })

  it('renders RegisterPage', () => {
    render(<RegisterPage />)
    expect(screen.getByText('RegisterPage')).toBeInTheDocument()
  })
})
