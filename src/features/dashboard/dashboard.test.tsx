import { render, screen } from '@testing-library/react'
import { DashboardPage } from './DashboardPage'
import { TodoList } from './TodoList'
import { TodoItem } from './TodoItem'

describe('dashboard stubs', () => {
  it('renders DashboardPage', () => {
    render(<DashboardPage />)
    expect(screen.getByText('DashboardPage')).toBeInTheDocument()
  })

  it('renders TodoList', () => {
    render(<TodoList />)
    expect(screen.getByText('TodoList')).toBeInTheDocument()
  })

  it('renders TodoItem', () => {
    render(<TodoItem />)
    expect(screen.getByText('TodoItem')).toBeInTheDocument()
  })
})
