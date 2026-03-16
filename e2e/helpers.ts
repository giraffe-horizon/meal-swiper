export async function createTestTenant(baseURL: string): Promise<string> {
  const token = crypto.randomUUID()
  const res = await fetch(`${baseURL}/api/tenant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      name: 'Test Tenant',
      persons: [{ name: 'Osoba 1', kcal: 2000, protein: 120 }],
    }),
  })
  if (!res.ok) throw new Error(`Failed to create test tenant: ${res.status}`)
  return token
}
