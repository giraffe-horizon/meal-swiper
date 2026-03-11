import type { NextRequest } from 'next/server'

const TICKTICK_API_BASE = 'https://api.ticktick.com/open/v1'

export interface ShoppingExportItem {
  name: string
  amount: string
}

interface TickTickTask {
  title: string
  projectId: string
  sortOrder?: number
}

async function createTickTickProject(token: string, name: string): Promise<string> {
  const res = await fetch(`${TICKTICK_API_BASE}/project`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, color: '#4CAF50', viewMode: 'list', kind: 'TASK' }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`TickTick createProject failed (${res.status}): ${body}`)
  }
  const data = (await res.json()) as { id: string }
  return data.id
}

async function addTasksBatch(
  token: string,
  projectId: string,
  items: ShoppingExportItem[]
): Promise<void> {
  const tasks: TickTickTask[] = items.map((item, index) => ({
    title: `${item.name} — ${item.amount}`,
    projectId,
    sortOrder: index,
  }))

  const res = await fetch(`${TICKTICK_API_BASE}/batch/task`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ add: tasks }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`TickTick addTasks failed (${res.status}): ${body}`)
  }
}

export async function POST(request: NextRequest) {
  const token = process.env.TICKTICK_ACCESS_TOKEN
  if (!token) {
    return Response.json(
      { error: 'TickTick not configured — missing TICKTICK_ACCESS_TOKEN' },
      { status: 503 }
    )
  }

  let body: { items?: ShoppingExportItem[]; weekLabel?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { items, weekLabel } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return Response.json(
      { error: 'items array is required and must not be empty' },
      { status: 400 }
    )
  }

  const projectName = weekLabel ? `🛒 Zakupy ${weekLabel}` : '🛒 Zakupy'

  try {
    const projectId = await createTickTickProject(token, projectName)
    await addTasksBatch(token, projectId, items)
    return Response.json({ ok: true, projectId, projectName })
  } catch (error) {
    console.error('TickTick export error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to export to TickTick' },
      { status: 502 }
    )
  }
}
