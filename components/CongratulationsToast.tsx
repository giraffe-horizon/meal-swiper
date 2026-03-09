'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/lib/context'

export default function CongratulationsToast() {
  const { allDaysFilled, weekKey } = useAppContext()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [show, setShow] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!allDaysFilled) return
    const key = `congratsShown:${weekKey}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    // Defer state updates to avoid synchronous setState in effect
    const t1 = setTimeout(() => {
      setShow(true)
      requestAnimationFrame(() => setVisible(true))
    }, 0)

    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setShow(false), 300)
    }, 4000)

    timersRef.current = [t1, t2]

    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [allDaysFilled, weekKey])

  const handleClick = useCallback(() => {
    setVisible(false)
    setTimeout(() => setShow(false), 300)
    router.push('/shopping')
  }, [router])

  if (!show) return null

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#2D6A4F] text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 font-bold transition-all duration-300 cursor-pointer hover:bg-[#245a42] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <span>🎉 Tydzień zaplanowany! Sprawdź listę zakupów →</span>
    </button>
  )
}
