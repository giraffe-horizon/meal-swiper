const BottomNav = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'plan', icon: 'calendar_month', label: 'Plan' },
    { id: 'swipe', icon: 'view_carousel', label: 'Propozycje' },
    { id: 'shopping', icon: 'list_alt', label: 'Lista' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 pb-safe pt-2 flex justify-between z-30 pb-4">
      {navItems.map(({ id, icon, label }) => {
        const isActive = currentView === id
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors py-1 relative ${
              isActive
                ? 'text-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-primary'
            }`}
          >
            {isActive && (
              <div className="absolute -top-1 w-12 h-1 bg-primary rounded-full"></div>
            )}
            <span
              className="material-symbols-outlined text-2xl"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {icon}
            </span>
            <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
