import { render, screen } from '@testing-library/react'
import { ConnectionIndicator } from './ConnectionIndicator'

describe('sync stubs', () => {
  it('renders ConnectionIndicator', () => {
    render(<ConnectionIndicator />)
    expect(screen.getByText('ConnectionIndicator')).toBeInTheDocument()
  })
})
