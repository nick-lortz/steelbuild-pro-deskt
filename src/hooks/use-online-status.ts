import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export async function checkNetworkConnection(): Promise<boolean> {
  if (!navigator.onLine) {
    return false
  }

  try {
    const response = await fetch('/ping', {
      method: 'HEAD',
      cache: 'no-cache',
    })
    return response.ok
  } catch {
    return false
  }
}
