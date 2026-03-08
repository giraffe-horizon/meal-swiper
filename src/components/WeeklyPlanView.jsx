const WeeklyPlanView = ({ weeklyPlan, onRemoveMeal, onSave }) => {
  const days = [
    { key: 'mon', label: 'Poniedziałek' },
    { key: 'tue', label: 'Wtorek' },
    { key: 'wed', label: 'Środa' },
    { key: 'thu', label: 'Czwartek' },
    { key: 'fri', label: 'Piątek' },
  ]

  const getMealCount = () => {
    return Object.values(weeklyPlan).filter(meal => meal !== null).length
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Plan tygodnia</h1>
      <p className="text-gray-600 text-center mb-8">
        {getMealCount()} z 5 posiłków zaplanowanych
      </p>

      <div className="max-w-2xl mx-auto space-y-4 mb-24">
        {days.map(({ key, label }) => {
          const meal = weeklyPlan[key]
          return (
            <div
              key={key}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{label}</h3>
                {meal ? (
                  <div className="flex gap-4">
                    <img
                      src={meal.photo}
                      alt={meal.name}
                      className="w-24 h-24 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{meal.name}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {meal.description}
                      </p>
                      <div className="flex gap-3 text-xs text-gray-600">
                        <span>⏱️ {meal.prepTime} min</span>
                        <span>🔥 {meal.kcal} kcal</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveMeal(key)}
                      className="self-start text-red-500 hover:text-red-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    Brak zaplanowanego posiłku
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {getMealCount() > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4">
          <button
            onClick={onSave}
            className="w-full max-w-2xl mx-auto block bg-green-accent text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-green-600 transition"
          >
            Generuj listę zakupów 🛒
          </button>
        </div>
      )}
    </div>
  )
}

export default WeeklyPlanView
