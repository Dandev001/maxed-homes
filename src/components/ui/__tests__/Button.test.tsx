import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import Button from '../Button'

describe('Button', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should be disabled when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should show loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    const spinner = screen.getByRole('button').querySelector('svg')
    expect(spinner).toBeInTheDocument()
  })

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-gray-600')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-gray-700')
  })

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-3')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-4')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-6')
  })

  it('should apply fullWidth class', () => {
    render(<Button fullWidth>Full Width</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref).toHaveBeenCalled()
  })
})

