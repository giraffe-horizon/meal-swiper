import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Next.js hooks
const mockPathname = vi.fn(() => '/plan')
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock AppProvider and useAppContext
const mockSetWeekOffset = vi.fn()
const mockUseAppContext = vi.fn(() => ({
  mealsLoading: false,
  weekOffset: 0,
  setWeekOffset: mockSetWeekOffset,
}))

vi.mock('@/lib/context', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAppContext: () => mockUseAppContext(),
}))

// Mock Navigation component
vi.mock('@/components/Navigation', () => ({
  default: ({ activeView }: { activeView: string }) => (
    <nav data-testid="navigation" data-active={activeView} />
  ),
}))

// Mock LoadingSpinner
vi.mock('@/components/ui/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}))

// Import after mocks
const { default: AppShell } = await import('@/components/AppShell')

describe('AppShell', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/plan')
    mockUseAppContext.mockReturnValue({
      mealsLoading: false,
      weekOffset: 0,
      setWeekOffset: mockSetWeekOffset,
    })
    mockSetWeekOffset.mockClear()
  })

  it('renders the header with logo icon', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    )
    // Title was removed — only the restaurant logo icon remains in the header
    expect(screen.queryByRole('heading')).toBeNull()
    const logo = document.querySelector('.material-symbols-outlined')
    expect(logo).toBeTruthy()
  })

  it('renders children when not loading', () => {
    render(
      <AppShell>
        <div data-testid="child">Hello</div>
      </AppShell>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders navigation', () => {
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('navigation has correct active view', () => {
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    const nav = screen.getByTestId('navigation')
    expect(nav.getAttribute('data-active')).toBe('plan')
  })

  it('renders settings link', () => {
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    const settingsLink = screen.getByTitle('Ustawienia')
    expect(settingsLink).toBeInTheDocument()
    expect(settingsLink.getAttribute('href')).toBe('/settings')
  })

  it('clicking prev week button decrements weekOffset', () => {
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    // Find button containing chevron_left
    const buttons = screen.getAllByRole('button')
    const prevBtn = buttons.find((b) => b.textContent?.includes('chevron_left'))
    expect(prevBtn).toBeTruthy()
    fireEvent.click(prevBtn!)
    expect(mockSetWeekOffset).toHaveBeenCalledWith(-1)
  })

  it('clicking next week button increments weekOffset', () => {
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    const buttons = screen.getAllByRole('button')
    const nextBtn = buttons.find((b) => b.textContent?.includes('chevron_right'))
    expect(nextBtn).toBeTruthy()
    fireEvent.click(nextBtn!)
    expect(mockSetWeekOffset).toHaveBeenCalledWith(1)
  })

  it('shows LoadingSpinner when loading', () => {
    mockUseAppContext.mockReturnValue({
      mealsLoading: true,
      weekOffset: 0,
      setWeekOffset: mockSetWeekOffset,
    })
    render(
      <AppShell>
        <div data-testid="child">Content</div>
      </AppShell>
    )
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('shows correct active nav for /swipe path', () => {
    mockPathname.mockReturnValue('/swipe')
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    const nav = screen.getByTestId('navigation')
    expect(nav.getAttribute('data-active')).toBe('swipe')
  })

  it('shows correct active nav for /cooking path', () => {
    mockPathname.mockReturnValue('/cooking')
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    const nav = screen.getByTestId('navigation')
    expect(nav.getAttribute('data-active')).toBe('cooking')
  })

  it('shows correct active nav for /shopping path', () => {
    mockPathname.mockReturnValue('/shopping')
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    const nav = screen.getByTestId('navigation')
    expect(nav.getAttribute('data-active')).toBe('shopping')
  })

  it('shows correct active nav for /settings path', () => {
    mockPathname.mockReturnValue('/settings')
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    const nav = screen.getByTestId('navigation')
    expect(nav.getAttribute('data-active')).toBe('settings')
  })
})
