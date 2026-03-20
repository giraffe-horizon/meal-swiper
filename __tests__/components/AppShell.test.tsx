import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

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
  tenantToken: 'test-token',
}))

vi.mock('@/lib/context', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAppContext: () => mockUseAppContext(),
}))

// Mock Navigation component
vi.mock('@/components/Navigation', () => ({
  default: ({ activeView, token }: { activeView: string; token?: string }) => (
    <nav data-testid="navigation" data-active={activeView}>
      <a href={`/${token || ''}/settings`.replace('//', '/')} role="link">
        Ustawienia
      </a>
    </nav>
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
      tenantToken: 'test-token',
    })
    mockSetWeekOffset.mockClear()
  })

  it('renders the header with Culinary Alchemist branding', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    )
    // New design has menu_book icon and "Culinary Alchemist" text
    expect(screen.getByText('menu_book')).toBeInTheDocument()
    expect(screen.getByText('Culinary Alchemist')).toBeInTheDocument()
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

  it('renders settings link in navigation', () => {
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    const settingsLink = screen.getByRole('link', { name: /Ustawienia/i })
    expect(settingsLink).toBeInTheDocument()
    expect(settingsLink.getAttribute('href')).toBe('/test-token/settings')
  })

  it('renders notification bell in header', () => {
    render(
      <AppShell>
        <div />
      </AppShell>
    )
    expect(screen.getByText('notifications')).toBeInTheDocument()
  })

  it('shows LoadingSpinner when loading', () => {
    mockUseAppContext.mockReturnValue({
      mealsLoading: true,
      weekOffset: 0,
      setWeekOffset: mockSetWeekOffset,
      tenantToken: 'test-token',
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
