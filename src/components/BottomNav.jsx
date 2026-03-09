const BottomNav = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'plan', icon: 'calendar_month', label: 'Plan' },
    { id: 'swipe', icon: 'view_carousel', label: 'Propozycje' },
    { id: 'shopping', icon: 'list_alt', label: 'Lista' },
  ]

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[400px] md:max-w-[600px] mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 pb-safe pt-2 flex justify-between z-30 pb-4 lg:hidden">
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

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col items-center py-6 gap-4 z-30">
        <div className="mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
        </div>
        {navItems.map(({ id, icon, label }) => {
          const isActive = currentView === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center justify-center gap-2 transition-colors py-3 px-4 rounded-xl relative ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
              )}
              <span
                className="material-symbols-outlined text-2xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className={`text-[9px] tracking-wide text-center ${isActive ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

export default BottomNav
