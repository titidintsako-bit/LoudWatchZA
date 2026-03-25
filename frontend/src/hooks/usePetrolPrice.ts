import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import type { PetrolPrice } from '@/types'

export function usePetrolPrice() {
  const setPetrolPrice = useStore((s) => s.setPetrolPrice)

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch('/api/petrol-prices')
        if (!res.ok) return
        const data: PetrolPrice = await res.json()
        setPetrolPrice(data)
      } catch {
        // Silently fail — constants fallback used in components
      }
    }
    fetchPrice()
  }, [setPetrolPrice])
}
