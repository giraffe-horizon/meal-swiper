import { describe, it, expect } from 'vitest'
import { enrichStepsStructured } from '@/lib/recipe'
import type { Ingredient } from '@/types'

describe('enrichStepsStructured', () => {
  it('zwraca tablicę segmentów dla prostego tekstu bez składników', () => {
    const result = enrichStepsStructured(['Zagotuj wodę.'], [], 2)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual([{ type: 'text', content: 'Zagotuj wodę.' }])
  })

  it('wstawia gramaturę przy nazwie składnika', () => {
    const steps = ['Pokrój cukinię w kostkę']
    const ings: Ingredient[] = [{ name: 'Cukinia', amount: '2 szt' }]
    const result = enrichStepsStructured(steps, ings, 2)
    expect(result[0].some((s) => s.type === 'amount')).toBe(true)
  })

  it('skaluje gramaturę dla 4 osób', () => {
    const steps = ['Dodaj kuskus']
    const ings: Ingredient[] = [{ name: 'Kuskus', amount: '200g' }]
    const result = enrichStepsStructured(steps, ings, 4, 2)
    const amountSeg = result[0].find((s) => s.type === 'amount')
    expect(amountSeg?.amount).toBe('400 g')
  })

  it('nie duplikuje gramatury jeśli już jest w tekście', () => {
    const steps = ['Ugotuj 300g makaronu']
    const ings: Ingredient[] = [{ name: 'Makaron', amount: '300g' }]
    const result = enrichStepsStructured(steps, ings, 2)
    const amounts = result[0].filter((s) => s.type === 'amount')
    expect(amounts.length).toBe(1)
  })

  it('obsługuje polskie odmiany — marchewkę i cebulę', () => {
    const steps = ['Posiekaj marchewkę i cebulę']
    const ings: Ingredient[] = [
      { name: 'Marchewka', amount: '150g' },
      { name: 'Cebula', amount: '1 szt' },
    ]
    const result = enrichStepsStructured(steps, ings, 2)
    const amounts = result[0].filter((s) => s.type === 'amount')
    expect(amounts.length).toBe(2)
  })

  it('skaluje istniejącą gramaturę w tekście', () => {
    const steps = ['Dodaj 200g makaronu']
    const ings: Ingredient[] = [{ name: 'Makaron', amount: '200g' }]
    const result = enrichStepsStructured(steps, ings, 4, 2)
    const amountSeg = result[0].find((s) => s.type === 'amount')
    // 200g * (4/2) = 400g
    expect(amountSeg?.amount).toBe('400 g')
  })

  it('zachowuje tekst między segmentami', () => {
    const steps = ['Pokrój cukinię w kostkę i podgrzej']
    const ings: Ingredient[] = [{ name: 'Cukinia', amount: '1 szt' }]
    const result = enrichStepsStructured(steps, ings, 2)
    const texts = result[0].filter((s) => s.type === 'text').map((s) => s.content)
    // The text segments should reconstruct around the badge
    const fullText = result[0]
      .map((s) => (s.type === 'text' ? s.content : `[${s.amount}]`))
      .join('')
    expect(fullText).toContain('Pokrój cukinię')
    expect(fullText).toContain('w kostkę i podgrzej')
  })

  it('nie matchuje zbyt krótkich stemów — sól nie matchuje "solony"', () => {
    const steps = ['Dodaj solony bulion']
    const ings: Ingredient[] = [{ name: 'Sól', amount: '1 szczypta' }]
    const result = enrichStepsStructured(steps, ings, 2)
    // "sól" ma stem "sół" (3 znaki < 4) — nie powinien matchować
    const amounts = result[0].filter((s) => s.type === 'amount')
    expect(amounts.length).toBe(0)
  })

  it('obsługuje wielowyrazowe nazwy składników', () => {
    const steps = ['Ugotuj makaron udon al dente']
    const ings: Ingredient[] = [{ name: 'Makaron udon', amount: '100g' }]
    const result = enrichStepsStructured(steps, ings, 2)
    const amounts = result[0].filter((s) => s.type === 'amount')
    expect(amounts.length).toBe(1)
  })

  it('obcina nawias z nazwy składnika', () => {
    const steps = ['Podziel brokuł na różyczki']
    const ings: Ingredient[] = [{ name: 'Brokuł (250g)', amount: '250g' }]
    const result = enrichStepsStructured(steps, ings, 2)
    const amounts = result[0].filter((s) => s.type === 'amount')
    expect(amounts.length).toBe(1)
  })

  it('zwraca poprawny originalAmount', () => {
    const steps = ['Ugotuj 200ml bulionu']
    const ings: Ingredient[] = [{ name: 'Bulion', amount: '200ml' }]
    const result = enrichStepsStructured(steps, ings, 2)
    const amountSeg = result[0].find((s) => s.type === 'amount')
    expect(amountSeg?.originalAmount).toBe('200ml')
  })
})
