'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'

interface HouseholdSectionProps {
  tenantToken: string
}

export default function HouseholdSection({ tenantToken }: HouseholdSectionProps) {
  const [tenantName, setTenantName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [tenantCreatedAt, setTenantCreatedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantToken) return
    fetch(`/api/tenant?token=${tenantToken}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setTenantName(data.name || '')
          setTenantCreatedAt(data.created_at || null)
        }
      })
      .catch(() => {})
  }, [tenantToken])

  const [currentTime] = useState(() => Date.now())
  const daysSinceCreation = tenantCreatedAt
    ? Math.floor((currentTime - new Date(tenantCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const saveTenantName = async () => {
    try {
      const response = await fetch('/api/tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tenantToken, name: tenantName }),
      })
      if (response.ok) setIsEditingName(false)
    } catch (error) {
      console.error('Failed to save tenant name:', error)
    }
  }

  const shareHousehold = () => {
    const shareUrl = `${window.location.origin}/${tenantToken}`
    const shareText = `🏠 Dołącz do mojego gospodarstwa domowego!\n\n${shareUrl}\n\nBudujemy wspólnie plan posiłków na całą rodzinę.`
    if (navigator.share) {
      navigator.share({ title: 'Dołącz do mojego gospodarstwa', text: shareText, url: shareUrl })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('✅ Link skopiowany do schowka!')
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(tenantToken)
    alert('✅ Token skopiowany do schowka!')
  }

  return (
    <section className="space-y-4">
      <h3 className="font-headline text-sm text-on-surface-variant uppercase tracking-widest font-bold">
        Twoje gospodarstwo
      </h3>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">home</span>
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  onBlur={saveTenantName}
                  onKeyDown={(e) => e.key === 'Enter' && saveTenantName()}
                  className="font-headline text-base font-bold text-on-surface bg-transparent border-b border-primary focus:outline-none w-full"
                  placeholder="Nazwa gospodarstwa"
                  autoFocus
                />
              ) : (
                <h3
                  onClick={() => setIsEditingName(true)}
                  className="font-headline text-base font-bold text-on-surface cursor-pointer hover:text-primary"
                >
                  {tenantName || 'Mój dom'}
                </h3>
              )}
              {tenantCreatedAt && (
                <p className="text-on-surface-variant text-xs">
                  Utworzono {daysSinceCreation} dni temu
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditingName(!isEditingName)}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-lg overflow-hidden">
            <div className="flex-1 min-w-0">
              <p className="text-on-surface-variant text-xs mb-1">Token gospodarstwa</p>
              <code className="font-mono text-[10px] text-on-surface bg-surface-container-low px-2 py-1 rounded break-all block overflow-hidden">
                {tenantToken}
              </code>
            </div>
            <button
              onClick={copyToken}
              className="ml-4 p-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">content_copy</span>
            </button>
          </div>
          <button
            onClick={shareHousehold}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">share</span>
            Udostępnij gospodarstwo
          </button>
        </div>
      </Card>
    </section>
  )
}
