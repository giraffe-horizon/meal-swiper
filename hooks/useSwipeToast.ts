'use client'

import { useState } from 'react'

export function useSwipeToast() {
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('')
  const [reshuffleToast, setReshuffleToast] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiItems] = useState(() =>
    [...Array(50)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 20 + Math.random() * 20,
      emoji: ['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)],
    }))
  )

  return {
    showToast,
    toastText,
    reshuffleToast,
    showSuccess,
    showConfetti,
    confettiItems,
    showAddToast: (text: string) => {
      setToastText(text)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    },
    showReshuffleToast: () => {
      setReshuffleToast(true)
      setTimeout(() => setReshuffleToast(false), 2000)
    },
    triggerSuccess: () => {
      setShowConfetti(true)
      setShowSuccess(true)
    },
    resetSuccess: () => {
      setShowSuccess(false)
      setShowConfetti(false)
    },
  }
}
