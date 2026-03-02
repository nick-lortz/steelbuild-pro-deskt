import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { ReactNode, useMemo } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

const getGradientConfig = (pathname: string) => {
  if (pathname.includes('/schedule')) {
    return {
      gradients: [
        'radial-gradient(circle at 20% 20%, oklch(0.68 0.18 45 / 0.15), transparent 60%)',
        'radial-gradient(circle at 80% 30%, oklch(0.45 0.12 250 / 0.12), transparent 60%)',
        'radial-gradient(circle at 50% 80%, oklch(0.68 0.18 45 / 0.15), transparent 60%)',
        'radial-gradient(circle at 10% 60%, oklch(0.45 0.12 250 / 0.12), transparent 60%)',
      ],
      duration: 25,
    }
  }

  if (pathname.includes('/financials') || pathname.includes('/budget') || pathname.includes('/sov')) {
    return {
      gradients: [
        'radial-gradient(circle at 30% 10%, oklch(0.65 0.18 150 / 0.12), transparent 60%)',
        'radial-gradient(circle at 70% 40%, oklch(0.68 0.18 45 / 0.15), transparent 60%)',
        'radial-gradient(circle at 40% 90%, oklch(0.65 0.18 150 / 0.12), transparent 60%)',
        'radial-gradient(circle at 90% 70%, oklch(0.45 0.12 250 / 0.10), transparent 60%)',
      ],
      duration: 28,
    }
  }

  if (pathname.includes('/rfis')) {
    return {
      gradients: [
        'radial-gradient(circle at 50% 0%, oklch(0.60 0.24 29 / 0.10), transparent 65%)',
        'radial-gradient(circle at 100% 50%, oklch(0.68 0.18 45 / 0.12), transparent 65%)',
        'radial-gradient(circle at 50% 100%, oklch(0.45 0.12 250 / 0.12), transparent 65%)',
        'radial-gradient(circle at 0% 50%, oklch(0.60 0.24 29 / 0.10), transparent 65%)',
      ],
      duration: 22,
    }
  }

  if (pathname.includes('/drawings')) {
    return {
      gradients: [
        'radial-gradient(circle at 25% 25%, oklch(0.45 0.12 250 / 0.14), transparent 55%)',
        'radial-gradient(circle at 75% 25%, oklch(0.68 0.18 45 / 0.13), transparent 55%)',
        'radial-gradient(circle at 75% 75%, oklch(0.45 0.12 250 / 0.14), transparent 55%)',
        'radial-gradient(circle at 25% 75%, oklch(0.68 0.18 45 / 0.13), transparent 55%)',
      ],
      duration: 30,
    }
  }

  if (pathname.includes('/equipment')) {
    return {
      gradients: [
        'radial-gradient(circle at 40% 20%, oklch(0.75 0.15 80 / 0.12), transparent 60%)',
        'radial-gradient(circle at 60% 50%, oklch(0.45 0.12 250 / 0.11), transparent 60%)',
        'radial-gradient(circle at 30% 80%, oklch(0.75 0.15 80 / 0.12), transparent 60%)',
        'radial-gradient(circle at 80% 80%, oklch(0.68 0.18 45 / 0.10), transparent 60%)',
      ],
      duration: 26,
    }
  }

  return {
    gradients: [
      'radial-gradient(circle at 50% 0%, oklch(0.45 0.12 250 / 0.15), transparent 70%)',
      'radial-gradient(circle at 100% 50%, oklch(0.68 0.18 45 / 0.12), transparent 70%)',
      'radial-gradient(circle at 50% 100%, oklch(0.45 0.12 250 / 0.15), transparent 70%)',
      'radial-gradient(circle at 0% 50%, oklch(0.68 0.18 45 / 0.12), transparent 70%)',
      'radial-gradient(circle at 50% 0%, oklch(0.45 0.12 250 / 0.15), transparent 70%)',
    ],
    duration: 20,
  }
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const config = useMemo(() => getGradientConfig(location.pathname), [location.pathname])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="relative"
      >
        <motion.div
          initial={{ 
            background: config.gradients[0]
          }}
          animate={{ 
            background: config.gradients
          }}
          transition={{
            duration: config.duration,
            ease: 'linear',
            repeat: Infinity,
          }}
          className="absolute inset-0 pointer-events-none -z-10"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, oklch(0.98 0.002 250) 100%)',
          }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
