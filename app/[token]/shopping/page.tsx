'use client'

import { useAppContext } from '@/lib/context'
import ShoppingListView from '@/components/ShoppingListView'

export default function ShoppingPage() {
  const { weeklyPlan, weekOffset } = useAppContext()

  return <ShoppingListView weeklyPlan={weeklyPlan} weekOffset={weekOffset} />
}
