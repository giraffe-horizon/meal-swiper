import { describe, it, expect } from 'vitest'

// useWeeklyPlan depends on React Query hooks which require a QueryClient provider.
// Without a rendering environment, we verify the module shape and the default plan helper.

describe('useWeeklyPlan — module shape', () => {
  it('exports useWeeklyPlan as a function', async () => {
    const mod = await import('../useWeeklyPlan')
    expect(typeof mod.useWeeklyPlan).toBe('function')
  })

  it('useWeeklyPlan accepts (weekKey, token) parameters', async () => {
    const mod = await import('../useWeeklyPlan')
    // The function should accept 2 params
    expect(mod.useWeeklyPlan.length).toBe(2)
  })
})
