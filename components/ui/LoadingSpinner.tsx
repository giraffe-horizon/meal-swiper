'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex-1 h-full min-h-[50vh] flex items-center justify-center bg-background">
      <div className="text-center">
        <span className="material-symbols-outlined text-primary text-6xl mb-4 block animate-spin">
          restaurant
        </span>
        <div className="text-xl text-on-surface">Ładowanie...</div>
      </div>
    </div>
  )
}
