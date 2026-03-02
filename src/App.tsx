import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      console.log('Running in Electron environment');
    }
  }, []);

  return <RouterProvider router={router} />
}

export default App
