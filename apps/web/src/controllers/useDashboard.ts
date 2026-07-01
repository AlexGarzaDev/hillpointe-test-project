import { useEffect, useMemo, useState } from 'react'
import { apiUrl, type ApiStatus, type VersionResponse } from '../models/api'

export function useDashboard(): ApiStatus & { statusLabel: string } {
  const [name, setName] = useState<string>('')
  const [version, setVersion] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const statusLabel = useMemo(() => {
    if (isLoading) return 'Checking API health...'
    if (error) return 'Backend unreachable'
    return 'Backend connected'
  }, [isLoading, error])

  useEffect(() => {
    const abortController = new AbortController()

    const fetchVersion = async (): Promise<void> => {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch(apiUrl('/version'), {
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Version request failed with ${response.status}`)
        }

        const payload = (await response.json()) as VersionResponse

        setName(payload.name ?? 'Unknown API')
        setVersion(payload.version ?? 'N/A')
      } catch (err) {
        if (abortController.signal.aborted) return

        setError(
          err instanceof Error
            ? err.message
            : 'Unexpected error while loading version',
        )
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchVersion()

    return () => {
      abortController.abort()
    }
  }, [])

  return { name, version, isLoading, error, statusLabel }
}
