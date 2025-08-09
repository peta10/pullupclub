'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-[#9b9b6f]">Something went wrong!</h1>
        <p className="text-gray-300 max-w-md mx-auto">
          We encountered an unexpected error. This might be a temporary issue.
        </p>
        <div className="space-y-4">
          <button 
            onClick={reset}
            className="bg-[#9b9b6f] hover:bg-[#8a8a5f] text-black font-medium px-6 py-2 rounded"
          >
            Try again
          </button>
          <div>
            <button 
              onClick={() => window.location.href = '/'}
              className="border border-[#9b9b6f] text-[#9b9b6f] hover:bg-[#9b9b6f] hover:text-black px-6 py-2 rounded ml-4"
            >
              Go home
            </button>
          </div>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left bg-gray-900 p-4 rounded-lg">
            <summary className="cursor-pointer text-red-400 font-medium">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-400 overflow-auto">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}