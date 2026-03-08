import { useState, useEffect } from 'react'

const ShoppingListView = ({ weeklyPlan }) => {
  const [checkedItems, setCheckedItems] = useState({})
  const [shoppingList, setShoppingList] = useState({})

  useEffect(() => {
    generateShoppingList()
    loadCheckedItems()
  }, [weeklyPlan])

  const loadCheckedItems = () => {
    const saved = localStorage.getItem('checkedItems')
    if (saved) {
      setCheckedItems(JSON.parse(saved))
    }
  }

  const generateShoppingList = () => {
    const list = {
      mięso: [],
      warzywa: [],
      nabiał: [],
      suche: []
    }

    // Aggregate ingredients from all meals in the weekly plan
    Object.values(weeklyPlan).forEach(meal => {
      if (!meal) return

      // Parse base ingredients
      if (meal.ingredientsBase) {
        const baseIngredients = typeof meal.ingredientsBase === 'string'
          ? JSON.parse(meal.ingredientsBase)
          : meal.ingredientsBase

        baseIngredients.forEach(ing => {
          const category = ing.category || 'suche'
          const existing = list[category].find(item => item.name === ing.name)
          if (existing) {
            // If ingredient already exists, we could sum amounts here
            // For now, just list separately
            list[category].push(ing)
          } else {
            list[category].push(ing)
          }
        })
      }

      // Parse meat ingredients (for Łukasz)
      if (meal.ingredientsMeat) {
        const meatIngredients = typeof meal.ingredientsMeat === 'string'
          ? JSON.parse(meal.ingredientsMeat)
          : meal.ingredientsMeat

        meatIngredients.forEach(ing => {
          const category = ing.category || 'mięso'
          list[category].push(ing)
        })
      }
    })

    setShoppingList(list)
  }

  const toggleItem = (category, index) => {
    const key = `${category}-${index}`
    const newChecked = { ...checkedItems, [key]: !checkedItems[key] }
    setCheckedItems(newChecked)
    localStorage.setItem('checkedItems', JSON.stringify(newChecked))
  }

  const clearCheckedItems = () => {
    setCheckedItems({})
    localStorage.removeItem('checkedItems')
  }

  const categories = [
    { key: 'mięso', label: '🥩 Mięso', emoji: '🥩' },
    { key: 'warzywa', label: '🥬 Warzywa i owoce', emoji: '🥬' },
    { key: 'nabiał', label: '🥛 Nabiał', emoji: '🥛' },
    { key: 'suche', label: '🌾 Produkty suche', emoji: '🌾' }
  ]

  const hasAnyItems = Object.values(shoppingList).some(items => items.length > 0)

  if (!hasAnyItems) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Brak listy zakupów</h2>
        <p className="text-gray-600 text-center">
          Zaplanuj posiłki na tydzień, aby wygenerować listę zakupów.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Lista zakupów</h1>
        <p className="text-gray-600 text-center mb-6">
          Zaznacz produkty podczas robienia zakupów
        </p>

        <div className="mb-4 text-right">
          <button
            onClick={clearCheckedItems}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Wyczyść zaznaczenia
          </button>
        </div>

        <div className="space-y-6">
          {categories.map(({ key, label }) => {
            const items = shoppingList[key] || []
            if (items.length === 0) return null

            return (
              <div key={key} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b border-green-100">
                  <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
                </div>
                <div className="p-4 space-y-2">
                  {items.map((item, index) => {
                    const itemKey = `${key}-${index}`
                    const isChecked = checkedItems[itemKey] || false
                    return (
                      <label
                        key={index}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(key, index)}
                          className="w-5 h-5 text-green-accent rounded border-gray-300 focus:ring-green-accent"
                        />
                        <span className={`flex-1 ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                        <span className={`text-sm ${isChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.amount}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ShoppingListView
