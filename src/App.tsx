import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useEffect } from 'react'
import { ThemeProvider } from '@/components/shared/theme-provider'

function App() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      console.log('Running in Electron environment');
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
