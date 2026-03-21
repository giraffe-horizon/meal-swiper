import type { D1Database } from './db'

// In-memory storage for development
const mockData = {
  tenants: [
    {
      id: 'default',
      token: 'dev-token-123',
      name: 'Development User',
      created_at: new Date().toISOString(),
    },
  ],
  meals: [
    {
      id: 'pierogi-ruskie',
      nazwa: 'Pierogi ruskie',
      opis: 'Tradycyjne polskie pierogi z ziemniakami i twarogiem',
      photo_url: 'https://picsum.photos/400/300?random=1',
      prep_time: 45,
      kcal_baza: 280,
      kcal_z_miesem: 280,
      bialko_baza: 12,
      bialko_z_miesem: 12,
      trudnosc: 'średnie',
      kuchnia: 'polska',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([
        { name: 'mąka', amount: '300g', category: 'suche' },
        { name: 'ziemniaki', amount: '500g', category: 'warzywa' },
        { name: 'twaróg', amount: '200g', category: 'nabiał' },
        { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
      ]),
      skladniki_mieso: JSON.stringify([]),
      przepis: JSON.stringify({
        kroki: [
          'Ugotuj ziemniaki, odstaw do ostudzenia',
          'Zrób ciasto z mąki, jajka i wody',
          'Przygotuj farsz z ziemniaków, twarogu i cebuli',
          'Lepiś pierogi i gotuj w osolonej wodzie',
        ],
      }),
      tags: JSON.stringify(['wegetariańskie', 'tradycyjne']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'kotlet-schabowy',
      nazwa: 'Kotlet schabowy',
      opis: 'Klasyczny polski kotlet schabowy z ziemniakami i mizeria',
      photo_url: 'https://picsum.photos/400/300?random=2',
      prep_time: 30,
      kcal_baza: 0,
      kcal_z_miesem: 450,
      bialko_baza: 0,
      bialko_z_miesem: 35,
      trudnosc: 'łatwe',
      kuchnia: 'polska',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([]),
      skladniki_mieso: JSON.stringify([
        { name: 'schab', amount: '4 kotlety', category: 'mięso' },
        { name: 'bułka tarta', amount: '200g', category: 'suche' },
        { name: 'jajka', amount: '2 szt.', category: 'nabiał' },
        { name: 'ziemniaki', amount: '600g', category: 'warzywa' },
      ]),
      przepis: JSON.stringify({
        kroki: [
          'Rozbij kotlety młotkiem',
          'Oprósz mąką, zanurz w jajku, obtocz w bułce',
          'Smaż na złocisty kolor z obu stron',
          'Podawaj z ziemniakami i mizeria',
        ],
      }),
      tags: JSON.stringify(['mięsne', 'klasyczne']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'pasta-carbonara',
      nazwa: 'Pasta Carbonara',
      opis: 'Kremowa pasta z boczkiem, jajkami i parmezanem',
      photo_url: 'https://picsum.photos/400/300?random=3',
      prep_time: 20,
      kcal_baza: 380,
      kcal_z_miesem: 520,
      bialko_baza: 15,
      bialko_z_miesem: 28,
      trudnosc: 'średnie',
      kuchnia: 'włoska',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([
        { name: 'makaron', amount: '400g', category: 'suche' },
        { name: 'jajka', amount: '3 szt.', category: 'nabiał' },
        { name: 'parmezan', amount: '100g', category: 'nabiał' },
      ]),
      skladniki_mieso: JSON.stringify([{ name: 'boczek', amount: '200g', category: 'mięso' }]),
      przepis: JSON.stringify({
        kroki: [
          'Gotuj makaron al dente',
          'Smaż boczek do chrupkości',
          'Ubij jajka z parmezanem',
          'Wymieszaj gorący makaron z jajkami i boczkiem',
        ],
      }),
      tags: JSON.stringify(['włoskie', 'szybkie']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'curry-z-kurczakiem',
      nazwa: 'Curry z kurczakiem',
      opis: 'Aromatyczne curry z kurczakiem i warzywami w mleku kokosowym',
      photo_url: 'https://picsum.photos/400/300?random=4',
      prep_time: 35,
      kcal_baza: 320,
      kcal_z_miesem: 480,
      bialko_baza: 12,
      bialko_z_miesem: 35,
      trudnosc: 'średnie',
      kuchnia: 'azjatycka',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([
        { name: 'mleko kokosowe', amount: '400ml', category: 'inne' },
        { name: 'curry', amount: '2 łyżki', category: 'przyprawy' },
        { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
        { name: 'papryka', amount: '2 szt.', category: 'warzywa' },
      ]),
      skladniki_mieso: JSON.stringify([{ name: 'kurczak', amount: '500g', category: 'mięso' }]),
      przepis: JSON.stringify({
        kroki: [
          'Podsmaż cebulę i czosnek',
          'Dodaj kawałki kurczaka i podsmażaj',
          'Wsyp curry i warzywa',
          'Zalej mlekiem kokosowym i duś 20 min',
        ],
      }),
      tags: JSON.stringify(['azjatyckie', 'pikantne']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'risotto-grzybowe',
      nazwa: 'Risotto grzybowe',
      opis: 'Kremowe risotto z mieszanką grzybów leśnych',
      photo_url: 'https://picsum.photos/400/300?random=5',
      prep_time: 40,
      kcal_baza: 340,
      kcal_z_miesem: 340,
      bialko_baza: 14,
      bialko_z_miesem: 14,
      trudnosc: 'trudne',
      kuchnia: 'włoska',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([
        { name: 'ryż arborio', amount: '300g', category: 'suche' },
        { name: 'grzyby leśne', amount: '300g', category: 'warzywa' },
        { name: 'bulion warzywny', amount: '1l', category: 'inne' },
        { name: 'parmezan', amount: '100g', category: 'nabiał' },
      ]),
      skladniki_mieso: JSON.stringify([]),
      przepis: JSON.stringify({
        kroki: [
          'Podsmaż cebulę na maśle',
          'Dodaj ryż i smaż 2 minuty',
          'Stopniowo dodawaj gorący bulion',
          'Mieszaj przez 20 min, na końcu grzyby i parmezan',
        ],
      }),
      tags: JSON.stringify(['wegetariańskie', 'włoskie']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'tacos-z-warzywami',
      nazwa: 'Tacos z warzywami',
      opis: 'Kolorowe tacos z grillowanymi warzywami i guacamole',
      photo_url: 'https://picsum.photos/400/300?random=6',
      prep_time: 25,
      kcal_baza: 280,
      kcal_z_miesem: 420,
      bialko_baza: 10,
      bialko_z_miesem: 25,
      trudnosc: 'łatwe',
      kuchnia: 'meksykańska',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([
        { name: 'tortille', amount: '6 szt.', category: 'suche' },
        { name: 'papryka', amount: '2 szt.', category: 'warzywa' },
        { name: 'awokado', amount: '2 szt.', category: 'warzywa' },
        { name: 'pomidory', amount: '2 szt.', category: 'warzywa' },
      ]),
      skladniki_mieso: JSON.stringify([{ name: 'kurczak', amount: '300g', category: 'mięso' }]),
      przepis: JSON.stringify({
        kroki: [
          'Grilluj warzywa i kurczaka',
          'Przygotuj guacamole z awokado',
          'Podgrzej tortille',
          'Składaj tacos z warzywami i sosami',
        ],
      }),
      tags: JSON.stringify(['meksykańskie', 'kolorowe']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'zurek-z-kielbasa',
      nazwa: 'Żurek z kiełbasą',
      opis: 'Tradycyjny polski żurek z białą kiełbasą i jajkiem',
      photo_url: 'https://picsum.photos/400/300?random=7',
      prep_time: 50,
      kcal_baza: 250,
      kcal_z_miesem: 420,
      bialko_baza: 8,
      bialko_z_miesem: 22,
      trudnosc: 'średnie',
      kuchnia: 'polska',
      category: 'zupa',
      skladniki_baza: JSON.stringify([
        { name: 'żurek', amount: '500ml', category: 'inne' },
        { name: 'bulion warzywny', amount: '800ml', category: 'inne' },
        { name: 'śmietana', amount: '200ml', category: 'nabiał' },
        { name: 'czosnek', amount: '3 ząbki', category: 'warzywa' },
      ]),
      skladniki_mieso: JSON.stringify([
        { name: 'kiełbasa biała', amount: '300g', category: 'mięso' },
        { name: 'jajka', amount: '4 szt.', category: 'nabiał' },
      ]),
      przepis: JSON.stringify({
        kroki: [
          'Gotuj kiełbasę w bulionie',
          'Dodaj żurek i przyprawy',
          'Zagotuj ze śmietaną',
          'Podawaj z ugotowanym jajkiem',
        ],
      }),
      tags: JSON.stringify(['polskie', 'tradycyjne']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'pad-thai',
      nazwa: 'Pad Thai',
      opis: 'Klasyczny tajski makaron z krewetkami i orzeszkami',
      photo_url: 'https://picsum.photos/400/300?random=8',
      prep_time: 30,
      kcal_baza: 320,
      kcal_z_miesem: 450,
      bialko_baza: 12,
      bialko_z_miesem: 25,
      trudnosc: 'średnie',
      kuchnia: 'azjatycka',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([
        { name: 'makaron ryżowy', amount: '300g', category: 'suche' },
        { name: 'sos sojowy', amount: '3 łyżki', category: 'przyprawy' },
        { name: 'kiełki', amount: '100g', category: 'warzywa' },
        { name: 'orzeszki ziemne', amount: '50g', category: 'inne' },
      ]),
      skladniki_mieso: JSON.stringify([{ name: 'krewetki', amount: '300g', category: 'mięso' }]),
      przepis: JSON.stringify({
        kroki: [
          'Namocz makaron w ciepłej wodzie',
          'Smaż krewetki na gorącym woku',
          'Dodaj makaron i sosy',
          'Wymieszaj z kiełkami i orzeszkami',
        ],
      }),
      tags: JSON.stringify(['azjatyckie', 'owoce morza']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'lazania-wegetarianska',
      nazwa: 'Lazania wegetariańska',
      opis: 'Bogata lazania z warzywami i serem ricotta',
      photo_url: 'https://picsum.photos/400/300?random=9',
      prep_time: 60,
      kcal_baza: 380,
      kcal_z_miesem: 380,
      bialko_baza: 18,
      bialko_z_miesem: 18,
      trudnosc: 'trudne',
      kuchnia: 'włoska',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([
        { name: 'płaty lazanii', amount: '300g', category: 'suche' },
        { name: 'ricotta', amount: '500g', category: 'nabiał' },
        { name: 'szpinak', amount: '400g', category: 'warzywa' },
        { name: 'mozzarella', amount: '200g', category: 'nabiał' },
      ]),
      skladniki_mieso: JSON.stringify([]),
      przepis: JSON.stringify({
        kroki: [
          'Podsmaż szpinak z czosnkiem',
          'Wymieszaj ricottę z jajkiem',
          'Układaj warstwy: płaty, ricotta, szpinak',
          'Zapiekaj 45 min w piekarniku',
        ],
      }),
      tags: JSON.stringify(['wegetariańskie', 'zapiekanka']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'chili-con-carne',
      nazwa: 'Chili con carne',
      opis: 'Pikantne chili z fasolą i mielonym mięsem',
      photo_url: 'https://picsum.photos/400/300?random=10',
      prep_time: 45,
      kcal_baza: 280,
      kcal_z_miesem: 420,
      bialko_baza: 15,
      bialko_z_miesem: 28,
      trudnosc: 'łatwe',
      kuchnia: 'meksykańska',
      category: 'danie główne',
      skladniki_baza: JSON.stringify([
        { name: 'fasola czerwona', amount: '400g', category: 'suche' },
        { name: 'pomidory z puszki', amount: '400g', category: 'warzywa' },
        { name: 'papryczka chili', amount: '2 szt.', category: 'przyprawy' },
        { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
      ]),
      skladniki_mieso: JSON.stringify([
        { name: 'mięso mielone', amount: '400g', category: 'mięso' },
      ]),
      przepis: JSON.stringify({
        kroki: [
          'Podsmaż cebulę i mięso',
          'Dodaj pomidory i przyprawy',
          'Dodaj fasolę i duś 30 min',
          'Podawaj z ryżem lub chlebem',
        ],
      }),
      tags: JSON.stringify(['pikantne', 'meksykańskie']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'ramen-miso',
      nazwa: 'Ramen miso',
      opis: 'Japońska zupa ramen z pastą miso i warzywami',
      photo_url: 'https://picsum.photos/400/300?random=11',
      prep_time: 40,
      kcal_baza: 310,
      kcal_z_miesem: 450,
      bialko_baza: 14,
      bialko_z_miesem: 26,
      trudnosc: 'średnie',
      kuchnia: 'azjatycka',
      category: 'zupa',
      skladniki_baza: JSON.stringify([
        { name: 'makaron ramen', amount: '300g', category: 'suche' },
        { name: 'pasta miso', amount: '3 łyżki', category: 'przyprawy' },
        { name: 'bulion warzywny', amount: '1l', category: 'inne' },
        { name: 'kukurydza', amount: '100g', category: 'warzywa' },
      ]),
      skladniki_mieso: JSON.stringify([{ name: 'kurczak', amount: '200g', category: 'mięso' }]),
      przepis: JSON.stringify({
        kroki: [
          'Gotuj bulion z pastą miso',
          'Ugotuj makaron osobno',
          'Podsmaż kurczaka i warzywa',
          'Podawaj w miseczkach z jajkiem',
        ],
      }),
      tags: JSON.stringify(['japońskie', 'zupa']),
      created_at: new Date().toISOString(),
    },
    {
      id: 'greek-salad',
      nazwa: 'Sałatka grecka',
      opis: 'Świeża sałatka z fetą, oliwkami i pomidorami',
      photo_url: 'https://picsum.photos/400/300?random=12',
      prep_time: 15,
      kcal_baza: 220,
      kcal_z_miesem: 220,
      bialko_baza: 8,
      bialko_z_miesem: 8,
      trudnosc: 'łatwe',
      kuchnia: 'grecka',
      category: 'sałatka',
      skladniki_baza: JSON.stringify([
        { name: 'pomidory', amount: '4 szt.', category: 'warzywa' },
        { name: 'ogórek', amount: '1 szt.', category: 'warzywa' },
        { name: 'feta', amount: '200g', category: 'nabiał' },
        { name: 'oliwki', amount: '100g', category: 'warzywa' },
      ]),
      skladniki_mieso: JSON.stringify([]),
      przepis: JSON.stringify({
        kroki: [
          'Pokrój pomidory i ogórki',
          'Dodaj pokruszoną fetę',
          'Dopraw oliwą i oregano',
          'Wymieszaj i podawaj od razu',
        ],
      }),
      tags: JSON.stringify(['wegetariańskie', 'świeże']),
      created_at: new Date().toISOString(),
    },
  ],
  weekly_plans: [] as any[],
  shopping_checked: [] as any[],
  settings: [] as any[],
  ingredients: [] as any[],
  meal_variants: [] as any[],
  meal_variant_ingredients: [] as any[],
}

class MockPreparedStatement {
  constructor(
    private query: string,
    private bindings: unknown[] = []
  ) {}

  bind(...values: unknown[]): MockPreparedStatement {
    return new MockPreparedStatement(this.query, [...this.bindings, ...values])
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const result = this.executeQuery()
    const firstResult = Array.isArray(result) ? result[0] : result

    if (colName && firstResult && typeof firstResult === 'object' && colName in firstResult) {
      return (firstResult as any)[colName]
    }
    return firstResult || null
  }

  async run<T = unknown>() {
    const result = this.executeQuery()
    return {
      results: [],
      success: true,
      meta: {
        duration: 0,
        changes: Array.isArray(result) ? result.length : result ? 1 : 0,
        last_row_id: 0,
        rows_read: 0,
        rows_written: Array.isArray(result) ? result.length : result ? 1 : 0,
      },
    }
  }

  async all<T = unknown>() {
    const result = this.executeQuery()
    const results = Array.isArray(result) ? result : result ? [result] : []
    return {
      results,
      success: true,
      meta: {
        duration: 0,
        changes: 0,
        last_row_id: 0,
        rows_read: results.length,
        rows_written: 0,
      },
    }
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    const result = this.executeQuery()
    return (Array.isArray(result) ? result : result ? [result] : []) as T[]
  }

  private executeQuery(): any {
    const queryLower = this.query.toLowerCase().trim()

    // Handle SELECT queries
    if (queryLower.includes('select') && queryLower.includes('meals')) {
      return mockData.meals
    }

    if (queryLower.includes('select') && queryLower.includes('tenants')) {
      if (queryLower.includes('where token')) {
        return mockData.tenants.find((t) => t.token === this.bindings[0]) || null
      }
      return mockData.tenants
    }

    if (queryLower.includes('select') && queryLower.includes('weekly_plans')) {
      const tenant_id = this.bindings[0]
      const week_key = this.bindings[1]
      return (
        mockData.weekly_plans.find((p) => p.tenant_id === tenant_id && p.week_key === week_key) ||
        null
      )
    }

    if (queryLower.includes('select') && queryLower.includes('shopping_checked')) {
      const tenant_id = this.bindings[0]
      const week_key = this.bindings[1]
      return (
        mockData.shopping_checked.find(
          (s) => s.tenant_id === tenant_id && s.week_key === week_key
        ) || null
      )
    }

    if (queryLower.includes('select') && queryLower.includes('settings')) {
      const tenant_id = this.bindings[0]
      const key = this.bindings[1]
      return mockData.settings.find((s) => s.tenant_id === tenant_id && s.key === key) || null
    }

    // Handle INSERT/UPDATE queries
    if (
      queryLower.includes('insert') ||
      queryLower.includes('update') ||
      queryLower.includes('replace')
    ) {
      // For INSERT/UPDATE operations, we'll just return success
      // In a real implementation, you'd modify the mockData here
      return { success: true }
    }

    // Default empty result
    return []
  }
}

class MockDatabase implements D1Database {
  prepare(query: string) {
    return new MockPreparedStatement(query)
  }

  async exec(query: string) {
    return {
      count: 0,
      duration: 0,
    }
  }

  async batch(statements: any[]) {
    return statements.map(() => ({
      results: [],
      success: true,
      meta: { duration: 0, changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 },
    }))
  }
}

let _mockDb: MockDatabase | null = null

export function getMockDb(): D1Database {
  if (!_mockDb) {
    console.log('Using mock database for development (Edge Runtime compatible)')
    _mockDb = new MockDatabase()
  }
  return _mockDb
}
