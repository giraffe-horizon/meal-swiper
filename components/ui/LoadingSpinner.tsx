'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex-1 h-full min-h-[50vh] flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <span className="material-symbols-outlined text-primary text-6xl mb-4 block animate-spin">
          restaurant
        </span>
        <div className="text-xl text-text-primary-light dark:text-text-primary-dark">
          Ładowanie...
        </div>
      </div>
    </div>
  )
}
